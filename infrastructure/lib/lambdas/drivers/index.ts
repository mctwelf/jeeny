/**
 * Jeeny Drivers Lambda Handler
 *
 * Handles all driver-related operations including:
 * - Driver CRUD operations
 * - Driver status management (online/offline)
 * - Location updates
 * - Earnings and statistics
 * - Document management
 * - Vehicle management
 * - Finding nearby drivers
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  LocationClient,
  BatchUpdateDevicePositionCommand,
  GetDevicePositionCommand,
  ListDevicePositionsCommand,
  SearchPlaceIndexForPositionCommand,
} from '@aws-sdk/client-location';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION_NAME || 'eu-north-1' });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION_NAME || 'eu-north-1' });
const location = new LocationClient({ region: process.env.AWS_REGION_NAME || 'eu-north-1' });

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const VEHICLES_TABLE = process.env.VEHICLES_TABLE || 'jeeny-vehicles';
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'jeeny-locations';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'jeeny-transactions';
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const TRACKER_NAME = process.env.TRACKER_NAME || 'jeeny-tracker';
const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME || 'jeeny-place-index';

// Types
interface Driver {
  userId: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  role: 'driver';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  driverStatus: 'online' | 'offline' | 'busy';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  vehicleId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    timestamp: string;
  };
  rating: number;
  totalRides: number;
  totalEarnings: number;
  cityId?: string;
  documents?: DriverDocument[];
  createdAt: string;
  updatedAt: string;
}

interface DriverDocument {
  documentId: string;
  type: 'license' | 'registration' | 'insurance' | 'national_id' | 'vehicle_photo' | 'profile_photo';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  expiryDate?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface Vehicle {
  vehicleId: string;
  driverId: string;
  type: 'economy' | 'comfort' | 'premium' | 'xl' | 'motorcycle';
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  capacity: number;
  status: 'active' | 'inactive' | 'pending_verification';
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DriverEarnings {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalRides: number;
  todayRides: number;
  weekRides: number;
  monthRides: number;
  averageRating: number;
  pendingPayout: number;
}

// Response helper
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(body),
});

// Extract user ID from JWT
const extractUserId = (event: APIGatewayProxyEvent): string | null => {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
};

// Parse request body
const parseBody = <T>(event: APIGatewayProxyEvent): T | null => {
  try {
    return event.body ? JSON.parse(event.body) : null;
  } catch {
    return null;
  }
};

// =====================================================
// DRIVER HANDLERS
// =====================================================

/**
 * Get all drivers (with pagination and filters)
 */
const getDrivers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { status, verificationStatus, driverStatus, cityId, limit = '20', lastKey } = event.queryStringParameters || {};

    let filterExpression = '#role = :role';
    const expressionAttributeNames: Record<string, string> = { '#role': 'role' };
    const expressionAttributeValues: Record<string, any> = { ':role': { S: 'driver' } };

    if (status) {
      filterExpression += ' AND #status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = { S: status };
    }

    if (verificationStatus) {
      filterExpression += ' AND verificationStatus = :verificationStatus';
      expressionAttributeValues[':verificationStatus'] = { S: verificationStatus };
    }

    if (driverStatus) {
      filterExpression += ' AND driverStatus = :driverStatus';
      expressionAttributeValues[':driverStatus'] = { S: driverStatus };
    }

    if (cityId) {
      filterExpression += ' AND cityId = :cityId';
      expressionAttributeValues[':cityId'] = { S: cityId };
    }

    const params: any = {
      TableName: USERS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: parseInt(limit),
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await dynamoDb.send(new ScanCommand(params));

    const drivers = result.Items?.map((item) => unmarshall(item)) || [];

    return response(200, {
      success: true,
      data: {
        drivers,
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
        count: drivers.length,
      },
    });
  } catch (error) {
    console.error('Error getting drivers:', error);
    return response(500, {
      success: false,
      error: 'Failed to get drivers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get driver by ID
 */
const getDriverById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
      })
    );

    if (!result.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(result.Item);

    if (driver.role !== 'driver') {
      return response(404, { success: false, error: 'Driver not found' });
    }

    // Get vehicle info if exists
    let vehicle = null;
    if (driver.vehicleId) {
      const vehicleResult = await dynamoDb.send(
        new GetItemCommand({
          TableName: VEHICLES_TABLE,
          Key: marshall({ vehicleId: driver.vehicleId }),
        })
      );
      if (vehicleResult.Item) {
        vehicle = unmarshall(vehicleResult.Item);
      }
    }

    return response(200, {
      success: true,
      data: { ...driver, vehicle },
    });
  } catch (error) {
    console.error('Error getting driver:', error);
    return response(500, {
      success: false,
      error: 'Failed to get driver',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create/register a new driver
 */
const createDriver = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = parseBody<Partial<Driver> & { vehicle?: Partial<Vehicle> }>(event);

    if (!body) {
      return response(400, { success: false, error: 'Invalid request body' });
    }

    const { phoneNumber, firstName, lastName, email, cityId, vehicle } = body;

    if (!phoneNumber) {
      return response(400, { success: false, error: 'Phone number is required' });
    }

    const now = new Date().toISOString();
    const driverId = uuidv4();

    // Create driver record
    const driver: Driver = {
      userId: driverId,
      phoneNumber,
      firstName,
      lastName,
      email,
      role: 'driver',
      status: 'pending_verification',
      driverStatus: 'offline',
      verificationStatus: 'pending',
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      cityId,
      documents: [],
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall(driver, { removeUndefinedValues: true }),
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    // Create vehicle if provided
    let createdVehicle = null;
    if (vehicle) {
      const vehicleId = uuidv4();
      createdVehicle = {
        vehicleId,
        driverId,
        type: vehicle.type || 'economy',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        plateNumber: vehicle.plateNumber || '',
        capacity: vehicle.capacity || 4,
        status: 'pending_verification',
        createdAt: now,
        updatedAt: now,
      };

      await dynamoDb.send(
        new PutItemCommand({
          TableName: VEHICLES_TABLE,
          Item: marshall(createdVehicle, { removeUndefinedValues: true }),
        })
      );

      // Update driver with vehicle ID
      await dynamoDb.send(
        new UpdateItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({ userId: driverId }),
          UpdateExpression: 'SET vehicleId = :vehicleId, updatedAt = :updatedAt',
          ExpressionAttributeValues: marshall({
            ':vehicleId': vehicleId,
            ':updatedAt': now,
          }),
        })
      );

      driver.vehicleId = vehicleId;
    }

    return response(201, {
      success: true,
      data: { ...driver, vehicle: createdVehicle },
      message: 'Driver registered successfully. Pending verification.',
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    return response(500, {
      success: false,
      error: 'Failed to create driver',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update driver profile
 */
const updateDriver = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const body = parseBody<Partial<Driver>>(event);

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    if (!body) {
      return response(400, { success: false, error: 'Invalid request body' });
    }

    // Check if driver exists
    const existingResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
      })
    );

    if (!existingResult.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const existing = unmarshall(existingResult.Item);
    if (existing.role !== 'driver') {
      return response(404, { success: false, error: 'Driver not found' });
    }

    // Build update expression
    const allowedFields = ['firstName', 'lastName', 'email', 'profilePicture', 'cityId'];
    const updates: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field as keyof Driver] !== undefined) {
        updates.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field as keyof Driver];
      }
    }

    if (updates.length === 0) {
      return response(400, { success: false, error: 'No valid fields to update' });
    }

    updates.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await dynamoDb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW',
      })
    );

    return response(200, {
      success: true,
      message: 'Driver updated successfully',
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    return response(500, {
      success: false,
      error: 'Failed to update driver',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get driver status
 */
const getDriverStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        ProjectionExpression: 'driverStatus, verificationStatus, #status, currentLocation',
        ExpressionAttributeNames: { '#status': 'status' },
      })
    );

    if (!result.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(result.Item);

    return response(200, {
      success: true,
      data: {
        driverStatus: driver.driverStatus,
        verificationStatus: driver.verificationStatus,
        accountStatus: driver.status,
        currentLocation: driver.currentLocation,
      },
    });
  } catch (error) {
    console.error('Error getting driver status:', error);
    return response(500, {
      success: false,
      error: 'Failed to get driver status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update driver status (online/offline/busy)
 */
const updateDriverStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const body = parseBody<{ driverStatus: 'online' | 'offline' | 'busy' }>(event);

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    if (!body?.driverStatus || !['online', 'offline', 'busy'].includes(body.driverStatus)) {
      return response(400, { success: false, error: 'Valid driver status is required (online/offline/busy)' });
    }

    // Check if driver exists and is verified
    const existingResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
      })
    );

    if (!existingResult.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(existingResult.Item);

    if (driver.verificationStatus !== 'approved') {
      return response(403, { success: false, error: 'Driver must be verified to go online' });
    }

    if (driver.status !== 'active') {
      return response(403, { success: false, error: 'Driver account is not active' });
    }

    const now = new Date().toISOString();

    await dynamoDb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        UpdateExpression: 'SET driverStatus = :driverStatus, updatedAt = :updatedAt',
        ExpressionAttributeValues: marshall({
          ':driverStatus': body.driverStatus,
          ':updatedAt': now,
        }),
      })
    );

    return response(200, {
      success: true,
      data: { driverStatus: body.driverStatus },
      message: `Driver is now ${body.driverStatus}`,
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    return response(500, {
      success: false,
      error: 'Failed to update driver status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get driver location
 */
const getDriverLocation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    // Try to get from Location Service tracker
    try {
      const locationResult = await location.send(
        new GetDevicePositionCommand({
          TrackerName: TRACKER_NAME,
          DeviceId: driverId,
        })
      );

      if (locationResult.Position) {
        return response(200, {
          success: true,
          data: {
            latitude: locationResult.Position[1],
            longitude: locationResult.Position[0],
            timestamp: locationResult.SampleTime?.toISOString(),
            accuracy: locationResult.Accuracy?.Horizontal,
          },
        });
      }
    } catch (locationError) {
      console.log('Location not found in tracker, falling back to database');
    }

    // Fallback to database
    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        ProjectionExpression: 'currentLocation',
      })
    );

    if (!result.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(result.Item);

    if (!driver.currentLocation) {
      return response(404, { success: false, error: 'Driver location not available' });
    }

    return response(200, {
      success: true,
      data: driver.currentLocation,
    });
  } catch (error) {
    console.error('Error getting driver location:', error);
    return response(500, {
      success: false,
      error: 'Failed to get driver location',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update driver location
 */
const updateDriverLocation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const body = parseBody<{
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    }>(event);

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    if (!body?.latitude || !body?.longitude) {
      return response(400, { success: false, error: 'Latitude and longitude are required' });
    }

    const now = new Date().toISOString();

    const currentLocation = {
      latitude: body.latitude,
      longitude: body.longitude,
      heading: body.heading,
      speed: body.speed,
      accuracy: body.accuracy,
      timestamp: now,
    };

    // Update in DynamoDB
    await dynamoDb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        UpdateExpression: 'SET currentLocation = :location, updatedAt = :updatedAt',
        ExpressionAttributeValues: marshall({
          ':location': currentLocation,
          ':updatedAt': now,
        }, { removeUndefinedValues: true }),
      })
    );

    // Update in Location Service tracker
    try {
      await location.send(
        new BatchUpdateDevicePositionCommand({
          TrackerName: TRACKER_NAME,
          Updates: [
            {
              DeviceId: driverId,
              Position: [body.longitude, body.latitude],
              SampleTime: new Date(),
              Accuracy: body.accuracy ? { Horizontal: body.accuracy } : undefined,
            },
          ],
        })
      );
    } catch (trackerError) {
      console.error('Error updating tracker:', trackerError);
      // Continue even if tracker update fails
    }

    return response(200, {
      success: true,
      data: currentLocation,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return response(500, {
      success: false,
      error: 'Failed to update driver location',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get driver earnings
 */
const getDriverEarnings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const { period = 'all' } = event.queryStringParameters || {};

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    // Get driver info for total earnings
    const driverResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        ProjectionExpression: 'totalEarnings, totalRides, rating',
      })
    );

    if (!driverResult.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(driverResult.Item);

    // Calculate time ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Query completed rides for the driver
    const ridesResult = await dynamoDb.send(
      new QueryCommand({
        TableName: RIDES_TABLE,
        IndexName: 'driver-index',
        KeyConditionExpression: 'driverId = :driverId',
        FilterExpression: '#status = :completed',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: marshall({
          ':driverId': driverId,
          ':completed': 'completed',
        }),
      })
    );

    const rides = ridesResult.Items?.map((item) => unmarshall(item)) || [];

    // Calculate earnings by period
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let todayRides = 0;
    let weekRides = 0;
    let monthRides = 0;

    for (const ride of rides) {
      const rideDate = ride.completedAt || ride.updatedAt;
      const driverEarning = ride.driverEarning || 0;

      if (rideDate >= startOfToday) {
        todayEarnings += driverEarning;
        todayRides++;
      }
      if (rideDate >= startOfWeek) {
        weekEarnings += driverEarning;
        weekRides++;
      }
      if (rideDate >= startOfMonth) {
        monthEarnings += driverEarning;
        monthRides++;
      }
    }

    const earnings: DriverEarnings = {
      totalEarnings: driver.totalEarnings || 0,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalRides: driver.totalRides || 0,
      todayRides,
      weekRides,
      monthRides,
      averageRating: driver.rating || 5.0,
      pendingPayout: 0, // TODO: Calculate from transactions
    };

    return response(200, {
      success: true,
      data: earnings,
    });
  } catch (error) {
    console.error('Error getting driver earnings:', error);
    return response(500, {
      success: false,
      error: 'Failed to get driver earnings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get driver vehicle
 */
const getDriverVehicle = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    // Get driver to find vehicle ID
    const driverResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        ProjectionExpression: 'vehicleId',
      })
    );

    if (!driverResult.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(driverResult.Item);

    if (!driver.vehicleId) {
      return response(404, { success: false, error: 'No vehicle registered for this driver' });
    }

    // Get vehicle
    const vehicleResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: VEHICLES_TABLE,
        Key: marshall({ vehicleId: driver.vehicleId }),
      })
    );

    if (!vehicleResult.Item) {
      return response(404, { success: false, error: 'Vehicle not found' });
    }

    const vehicle = unmarshall(vehicleResult.Item);

    return response(200, {
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error getting driver vehicle:', error);
    return response(500, {
      success: false,
      error: 'Failed to get driver vehicle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update driver vehicle
 */
const updateDriverVehicle = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const body = parseBody<Partial<Vehicle>>(event);

    if (!driverId) {
      return response(400, { success: false, error: 'Driver ID is required' });
    }

    if (!body) {
      return response(400, { success: false, error: 'Invalid request body' });
    }

    // Get driver to find vehicle ID
    const driverResult = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId: driverId }),
        ProjectionExpression: 'vehicleId',
      })
    );

    if (!driverResult.Item) {
      return response(404, { success: false, error: 'Driver not found' });
    }

    const driver = unmarshall(driverResult.Item);
    const now = new Date().toISOString();

    if (!driver.vehicleId) {
      // Create new vehicle
      const vehicleId = uuidv4();
      const newVehicle: Vehicle = {
        vehicleId,
        driverId,
        type: body.type || 'economy',
        make: body.make || '',
        model: body.model || '',
        year: body.year || new Date().getFullYear(),
        color: body.color || '',
        plateNumber: body.plateNumber || '',
        capacity: body.capacity || 4,
        status: 'pending_verification',
        photos: body.photos || [],
        createdAt: now,
        updatedAt: now,
      };

      await dynamoDb.send(
        new PutItemCommand({
          TableName: VEHICLES_TABLE,
