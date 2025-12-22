/**
 * Jeeny Rides Lambda Handler
 *
 * Handles all ride-related operations including:
 * - Creating ride requests
 * - Matching with drivers
 * - Ride lifecycle management (accept, start, complete, cancel)
 * - Fare estimation
 * - Rating and tips
 * - Route tracking
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  LocationClient,
  CalculateRouteCommand,
} from '@aws-sdk/client-location';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const locationClient = new LocationClient({});

// Environment variables
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'jeeny-locations';
const ROUTE_CALCULATOR_NAME = process.env.ROUTE_CALCULATOR_NAME || 'jeeny-route-calculator';

// Types
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Location {
  coordinates: Coordinate;
  address: string;
  name?: string;
  placeId?: string;
}

interface RideEstimate {
  vehicleType: string;
  estimatedFare: number;
  currency: string;
  estimatedDuration: number; // in seconds
  estimatedDistance: number; // in meters
  surgeMultiplier: number;
}

interface Ride {
  rideId: string;
  clientId: string;
  driverId?: string;
  status: RideStatus;
  vehicleType: string;
  pickup: Location;
  dropoff: Location;
  stops?: Location[];
  estimatedFare: number;
  actualFare?: number;
  currency: string;
  estimatedDuration: number;
  estimatedDistance: number;
  actualDuration?: number;
  actualDistance?: number;
  surgeMultiplier: number;
  paymentMethod: string;
  promoCode?: string;
  discount?: number;
  tip?: number;
  rating?: number;
  review?: string;
  driverRating?: number;
  driverReview?: string;
  cancelReason?: string;
  cancelledBy?: string;
  route?: Coordinate[];
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt: string;
}

type RideStatus =
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Pricing configuration (should come from settings in production)
const PRICING_CONFIG: Record<string, { baseFare: number; perKm: number; perMin: number; minFare: number }> = {
  economy: { baseFare: 50, perKm: 15, perMin: 2, minFare: 100 },
  comfort: { baseFare: 75, perKm: 20, perMin: 3, minFare: 150 },
  premium: { baseFare: 100, perKm: 30, perMin: 5, minFare: 200 },
  xl: { baseFare: 80, perKm: 25, perMin: 4, minFare: 180 },
};

// Helper functions
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(body),
});

const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
};

const calculateFare = (
  distance: number, // in meters
  duration: number, // in seconds
  vehicleType: string,
  surgeMultiplier: number = 1
): number => {
  const pricing = PRICING_CONFIG[vehicleType] || PRICING_CONFIG.economy;
  const distanceKm = distance / 1000;
  const durationMin = duration / 60;

  let fare = pricing.baseFare + (distanceKm * pricing.perKm) + (durationMin * pricing.perMin);
  fare = fare * surgeMultiplier;
  fare = Math.max(fare, pricing.minFare);

  return Math.round(fare);
};

const calculateRoute = async (
  pickup: Coordinate,
  dropoff: Coordinate,
  stops?: Coordinate[]
): Promise<{ distance: number; duration: number; route: Coordinate[] }> => {
  try {
    const waypoints: number[][] = [[pickup.longitude, pickup.latitude]];

    if (stops) {
      stops.forEach(stop => {
        waypoints.push([stop.longitude, stop.latitude]);
      });
    }

    waypoints.push([dropoff.longitude, dropoff.latitude]);

    const command = new CalculateRouteCommand({
      CalculatorName: ROUTE_CALCULATOR_NAME,
      DeparturePosition: [pickup.longitude, pickup.latitude],
      DestinationPosition: [dropoff.longitude, dropoff.latitude],
      WaypointPositions: stops?.map(s => [s.longitude, s.latitude]),
      TravelMode: 'Car',
      IncludeLegGeometry: true,
    });

    const result = await locationClient.send(command);

    const route: Coordinate[] = [];
    result.Legs?.forEach(leg => {
      leg.Geometry?.LineString?.forEach(point => {
        route.push({ longitude: point[0], latitude: point[1] });
      });
    });

    return {
      distance: (result.Summary?.Distance || 0) * 1000, // Convert km to meters
      duration: result.Summary?.DurationSeconds || 0,
      route,
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    // Fallback: Calculate straight-line distance
    const R = 6371000; // Earth's radius in meters
    const dLat = (dropoff.latitude - pickup.latitude) * Math.PI / 180;
    const dLon = (dropoff.longitude - pickup.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickup.latitude * Math.PI / 180) * Math.cos(dropoff.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1.3; // Add 30% for road distance approximation
    const duration = distance / 8.33; // Assume 30 km/h average speed

    return {
      distance,
      duration,
      route: [pickup, dropoff],
    };
  }
};

// Handlers
const estimateRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { pickup, dropoff, stops, vehicleTypes } = body;

    if (!pickup || !dropoff) {
      return response(400, { error: 'Pickup and dropoff locations are required' });
    }

    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates,
      stops?.map((s: Location) => s.coordinates)
    );

    // Calculate surge (simplified - should use real-time demand/supply)
    const surgeMultiplier = 1.0; // TODO: Implement dynamic surge pricing

    const estimates: RideEstimate[] = (vehicleTypes || Object.keys(PRICING_CONFIG)).map((type: string) => ({
      vehicleType: type,
      estimatedFare: calculateFare(routeInfo.distance, routeInfo.duration, type, surgeMultiplier),
      currency: 'MRU',
      estimatedDuration: Math.round(routeInfo.duration),
      estimatedDistance: Math.round(routeInfo.distance),
      surgeMultiplier,
    }));

    return response(200, {
      estimates,
      route: routeInfo.route,
    });
  } catch (error) {
    console.error('Estimate ride error:', error);
    return response(500, { error: 'Failed to estimate ride' });
  }
};

const createRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { pickup, dropoff, stops, vehicleType, paymentMethod, promoCode } = body;

    if (!pickup || !dropoff || !vehicleType || !paymentMethod) {
      return response(400, { error: 'Missing required fields' });
    }

    // Calculate route and fare
    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates,
      stops?.map((s: Location) => s.coordinates)
    );

    const surgeMultiplier = 1.0; // TODO: Implement dynamic surge
    const estimatedFare = calculateFare(routeInfo.distance, routeInfo.duration, vehicleType, surgeMultiplier);

    // TODO: Apply promo code discount

    const rideId = uuidv4();
    const now = new Date().toISOString();

    const ride: Ride = {
      rideId,
      clientId: userId,
      status: 'pending',
      vehicleType,
      pickup,
      dropoff,
      stops,
      estimatedFare,
      currency: 'MRU',
      estimatedDuration: Math.round(routeInfo.duration),
      estimatedDistance: Math.round(routeInfo.distance),
      surgeMultiplier,
      paymentMethod,
      promoCode,
      route: routeInfo.route,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: RIDES_TABLE,
      Item: ride,
    }));

    // TODO: Trigger driver matching process

    return response(201, ride);
  } catch (error) {
    console.error('Create ride error:', error);
    return response(500, { error: 'Failed to create ride' });
  }
};

const getRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!result.Item) {
      return response(404, { error: 'Ride not found' });
    }

    // Verify the user is the client or driver of this ride
    const ride = result.Item as Ride;
    if (ride.clientId !== userId && ride.driverId !== userId) {
      return response(403, { error: 'Access denied' });
    }

    return response(200, ride);
  } catch (error) {
    console.error('Get ride error:', error);
    return response(500, { error: 'Failed to get ride' });
  }
};

const getRides = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { status, limit = '20', lastKey } = event.queryStringParameters || {};

    // Query rides by client ID
    const params: any = {
      TableName: RIDES_TABLE,
      IndexName: 'clientId-createdAt-index',
      KeyConditionExpression: 'clientId = :clientId',
      ExpressionAttributeValues: {
        ':clientId': userId,
      },
      ScanIndexForward: false,
      Limit: parseInt(limit),
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    return response(200, {
      rides: result.Items,
      lastKey: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : null,
    });
  } catch (error) {
    console.error('Get rides error:', error);
    return response(500, { error: 'Failed to get rides' });
  }
};

const getCurrentRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    // Query for active rides
    const result = await docClient.send(new QueryCommand({
      TableName: RIDES_TABLE,
      IndexName: 'clientId-status-index',
      KeyConditionExpression: 'clientId = :clientId',
      FilterExpression: '#status IN (:s1, :s2, :s3, :s4, :s5, :s6)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':clientId': userId,
        ':s1': 'pending',
        ':s2': 'searching',
        ':s3': 'accepted',
        ':s4': 'arriving',
        ':s5': 'arrived',
        ':s6': 'in_progress',
      },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(404, { error: 'No active ride found' });
    }

    return response(200, result.Items[0]);
  } catch (error) {
    console.error('Get current ride error:', error);
    return response(500, { error: 'Failed to get current ride' });
  }
};

const acceptRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    // Get the ride
    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.status !== 'pending' && ride.status !== 'searching') {
      return response(400, { error: 'Ride cannot be accepted in current status' });
    }

    const now = new Date().toISOString();

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: 'SET #status = :status, driverId = :driverId, acceptedAt = :acceptedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'accepted',
        ':driverId': userId,
        ':acceptedAt': now,
        ':updatedAt': now,
      },
      ConditionExpression: '#status IN (:pending, :searching)',
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Send notification to client

    return response(200, updateResult.Attributes);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(409, { error: 'Ride has already been accepted' });
    }
    console.error('Accept ride error:', error);
    return response(500, { error: 'Failed to accept ride' });
  }
};

const startRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.driverId !== userId) {
      return response(403, { error: 'Only the assigned driver can start the ride' });
    }

    if (ride.status !== 'arrived') {
      return response(400, { error: 'Driver must arrive at pickup before starting ride' });
    }

    const now = new Date().toISOString();

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: 'SET #status = :status, startedAt = :startedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'in_progress',
        ':startedAt': now,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Send notification to client

    return response(200, updateResult.Attributes);
  } catch (error) {
    console.error('Start ride error:', error);
    return response(500, { error: 'Failed to start ride' });
  }
};

const completeRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { actualDistance, actualDuration } = body;

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.driverId !== userId) {
      return response(403, { error: 'Only the assigned driver can complete the ride' });
    }

    if (ride.status !== 'in_progress') {
      return response(400, { error: 'Ride must be in progress to complete' });
    }

    const now = new Date().toISOString();

    // Calculate actual fare based on actual distance/duration if provided
    let actualFare = ride.estimatedFare;
    if (actualDistance && actualDuration) {
      actualFare = calculateFare(actualDistance, actualDuration, ride.vehicleType, ride.surgeMultiplier);
    }

    // Apply discount if promo was used
    if (ride.discount) {
      actualFare = Math.max(0, actualFare - ride.discount);
    }

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: `
        SET #status = :status,
        completedAt = :completedAt,
        actualFare = :actualFare,
        actualDistance = :actualDistance,
        actualDuration = :actualDuration,
        updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':completedAt': now,
        ':actualFare': actualFare,
        ':actualDistance': actualDistance || ride.estimatedDistance,
        ':actualDuration': actualDuration || ride.estimatedDuration,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Process payment
    // TODO: Send receipt to client
    // TODO: Update driver earnings

    return response(200, updateResult.Attributes);
  } catch (error) {
    console.error('Complete ride error:', error);
    return response(500, { error: 'Failed to complete ride' });
  }
};

const cancelRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;

    // Verify user is either client or driver
    if (ride.clientId !== userId && ride.driverId !== userId) {
      return response(403, { error: 'Access denied' });
    }

    // Check if ride can be cancelled
    const cancellableStatuses: RideStatus[] = ['pending', 'searching', 'accepted', 'arriving', 'arrived'];
    if (!cancellableStatuses.includes(ride.status)) {
      return response(400, { error: 'Ride cannot be cancelled in current status' });
    }

    const now = new Date().toISOString();
    const cancelledBy = ride.clientId === userId ? 'client' : 'driver';

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: `
        SET #status = :status,
        cancelledAt = :cancelledAt,
        cancelReason = :cancelReason,
        cancelledBy = :cancelledBy,
        updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':cancelledAt': now,
        ':cancelReason': reason || 'No reason provided',
        ':cancelledBy': cancelledBy,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Apply cancellation fee if applicable
    // TODO: Notify the other party

    return response(200, updateResult.Attributes);
  } catch (error) {
    console.error('Cancel ride error:', error);
    return response(500, { error: 'Failed to cancel ride' });
  }
};

const rateRide = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return response(400, { error: 'Rating must be between 1 and 5' });
    }

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.status !== 'completed') {
      return response(400, { error: 'Can only rate completed rides' });
    }

    const isClient = ride.clientId === userId;
    const isDriver = ride.driverId === userId;

    if (!isClient && !isDriver) {
      return response(403, { error: 'Access denied' });
    }

    const now = new Date().toISOString();
    let updateExpression: string;
    let expressionAttributeValues: any;

    if (isClient) {
      // Client rating driver
      updateExpression = 'SET rating = :rating, review = :review, updatedAt = :updatedAt';
      expressionAttributeValues = {
        ':rating': rating,
        ':review': review || '',
        ':updatedAt': now,
      };
    } else {
      // Driver rating client
      updateExpression = 'SET driverRating = :rating, driverReview = :review, updatedAt = :updatedAt';
      expressionAttributeValues = {
        ':rating': rating,
        ':review': review || '',
        ':updatedAt': now,
      };
    }

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Update user's average rating

    return response(200, updateResult.Attributes);
  } catch (error) {
    console.error('Rate ride error:', error);
    return response(500, { error: 'Failed to rate ride' });
  }
};

const addTip = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount } = body;

    if (!amount || amount <= 0) {
      return response(400, { error: 'Valid tip amount is required' });
    }

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.clientId !== userId) {
      return response(403, { error: 'Only the client can add a tip' });
    }

    if (ride.status !== 'completed') {
      return response(400, { error: 'Can only tip after ride is completed' });
    }

    const now = new Date().toISOString();

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
      UpdateExpression: 'SET tip = :tip, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':tip': amount,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // TODO: Process tip payment
    // TODO: Update driver earnings

    return response(200, updateResult.Attributes);
  } catch (error) {
    console.error('Add tip error:', error);
    return response(500, { error: 'Failed to add tip' });
  }
};

const getRoute = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const rideId = event.pathParameters?.rideId;
    if (!rideId) {
      return response(400, { error: 'Ride ID is required' });
    }

    const rideResult = await docClient.send(new GetCommand({
      TableName: RIDES_TABLE,
      Key: { rideId },
    }));

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item as Ride;
    if (ride.clientId !== userId && ride.driverId !== userId) {
      return response(403, { error: 'Access denied' });
    }

    return response(200, {
      route: ride.route,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      stops: ride.stops,
    });
  } catch (error) {
    console.error('Get route error:', error);
    return response(500, { error: 'Failed to get route' });
  }
};

const getReceipt = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
