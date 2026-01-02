/**
 * Jeeny Rides Service - Cloud Run
 *
 * Handles ride operations using Firestore and Google Maps.
 * Replaces AWS Lambda rides handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { calculateRoute, Coordinate } from '../../lib/maps';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized, conflict } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const RIDES_COLLECTION = 'rides';
const USERS_COLLECTION = 'users';

// Types
interface Location {
  coordinates: Coordinate;
  address: string;
  name?: string;
  placeId?: string;
}

type RideStatus = 'pending' | 'searching' | 'accepted' | 'arriving' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

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
  polyline?: string;
  createdAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

// Pricing configuration
const PRICING_CONFIG: Record<string, { baseFare: number; perKm: number; perMin: number; minFare: number }> = {
  economy: { baseFare: 50, perKm: 15, perMin: 2, minFare: 100 },
  comfort: { baseFare: 75, perKm: 20, perMin: 3, minFare: 150 },
  premium: { baseFare: 100, perKm: 30, perMin: 5, minFare: 200 },
  xl: { baseFare: 80, perKm: 25, perMin: 4, minFare: 180 },
};

// Helper functions
const calculateFare = (
  distance: number,
  duration: number,
  vehicleType: string,
  surgeMultiplier = 1
): number => {
  const pricing = PRICING_CONFIG[vehicleType] || PRICING_CONFIG.economy;
  const distanceKm = distance / 1000;
  const durationMin = duration / 60;

  let fare = pricing.baseFare + (distanceKm * pricing.perKm) + (durationMin * pricing.perMin);
  fare = fare * surgeMultiplier;
  fare = Math.max(fare, pricing.minFare);

  return Math.round(fare);
};

// Routes

/**
 * POST /estimate
 * Get ride fare estimates
 */
app.post('/estimate', authenticate, async (req: Request, res: Response) => {
  try {
    const { pickup, dropoff, stops, vehicleTypes } = req.body;

    if (!pickup || !dropoff) {
      return badRequest(res, 'Pickup and dropoff locations are required', 'مواقع الانطلاق والوصول مطلوبة');
    }

    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates,
      stops?.map((s: Location) => s.coordinates)
    );

    const surgeMultiplier = 1.0; // TODO: Implement dynamic surge pricing

    const types = vehicleTypes || Object.keys(PRICING_CONFIG);
    const estimates = types.map((type: string) => ({
      vehicleType: type,
      estimatedFare: calculateFare(routeInfo.distance, routeInfo.duration, type, surgeMultiplier),
      currency: 'MRU',
      estimatedDuration: Math.round(routeInfo.duration),
      estimatedDistance: Math.round(routeInfo.distance),
      surgeMultiplier,
    }));

    return sendSuccess(res, {
      estimates,
      route: routeInfo.route,
      polyline: routeInfo.polyline,
    });
  } catch (error) {
    console.error('Estimate ride error:', error);
    return serverError(res, 'Failed to estimate ride', 'فشل تقدير الرحلة');
  }
});

/**
 * POST /
 * Create a new ride request
 */
app.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { pickup, dropoff, stops, vehicleType, paymentMethod, promoCode } = req.body;

    if (!pickup || !dropoff || !vehicleType || !paymentMethod) {
      return badRequest(res, 'Missing required fields', 'الحقول المطلوبة مفقودة');
    }

    // Calculate route and fare
    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates,
      stops?.map((s: Location) => s.coordinates)
    );

    const surgeMultiplier = 1.0;
    const estimatedFare = calculateFare(routeInfo.distance, routeInfo.duration, vehicleType, surgeMultiplier);

    const rideId = uuidv4();
    const now = new Date();

    const ride: Ride = {
      rideId,
      clientId: req.user!.uid,
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
      polyline: routeInfo.polyline,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(RIDES_COLLECTION).doc(rideId).set(ride);

    // Publish ride request event for driver matching
    await publishMessage(TOPICS.RIDE_REQUESTS, {
      type: 'ride_requested',
      rideId,
      clientId: req.user!.uid,
      pickup: pickup.coordinates,
      vehicleType,
      estimatedFare,
    });

    // Update ride status to searching
    await db.collection(RIDES_COLLECTION).doc(rideId).update({
      status: 'searching',
      updatedAt: new Date(),
    });

    return sendSuccess(res, { ...ride, status: 'searching' }, 'Ride created successfully', 'تم إنشاء الرحلة بنجاح', 201);
  } catch (error) {
    console.error('Create ride error:', error);
    return serverError(res, 'Failed to create ride', 'فشل إنشاء الرحلة');
  }
});

/**
 * POST /on-behalf
 * Create a ride on behalf of a customer (Admin/Employee only)
 * إنشاء رحلة نيابة عن العميل
 */
app.post('/on-behalf', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { 
      clientId,           // Required: The customer's ID
      clientPhone,        // Alternative: Find customer by phone
      pickup, 
      dropoff, 
      stops, 
      vehicleType, 
      vehicleCategory,
      rideType,
      paymentMethod, 
      promoCode,
      scheduledAt,
      notes,
      notesAr,
      // Special requests
      needsFemaleDriver,
      needsChildSeat,
      needsWheelchairAccess,
      numberOfPassengers,
      // For package delivery
      packageDelivery,
      // For intercity
      intercityRouteId,
      returnTrip,
      returnTripDate,
      // For hourly booking
      bookedHours,
      // For corporate
      corporateAccountId,
      corporateReference,
      // Assign specific driver
      assignDriverId,
    } = req.body;

    // Check if user is admin or employee
    const userRole = req.user!.role;
    if (userRole !== 'admin' && userRole !== 'employee') {
      return unauthorized(res, 'Only admins and employees can create rides on behalf of customers', 'فقط المسؤولون والموظفون يمكنهم إنشاء رحلات نيابة عن العملاء');
    }

    // Validate required fields
    if (!pickup || !dropoff || !vehicleType || !paymentMethod) {
      return badRequest(res, 'Missing required fields', 'الحقول المطلوبة مفقودة');
    }

    // Find or validate client
    let targetClientId = clientId;
    
    if (!targetClientId && clientPhone) {
      // Find client by phone number
      const clientSnapshot = await db.collection(USERS_COLLECTION)
        .where('phoneNumber', '==', clientPhone)
        .where('role', '==', 'CLIENT')
        .limit(1)
        .get();
      
      if (clientSnapshot.empty) {
        return notFound(res, 'Client not found with this phone number', 'لم يتم العثور على عميل بهذا الرقم');
      }
      
      targetClientId = clientSnapshot.docs[0].id;
    }

    if (!targetClientId) {
      return badRequest(res, 'Client ID or phone number is required', 'معرف العميل أو رقم الهاتف مطلوب');
    }

    // Verify client exists
    const clientDoc = await db.collection(USERS_COLLECTION).doc(targetClientId).get();
    if (!clientDoc.exists) {
      return notFound(res, 'Client not found', 'العميل غير موجود');
    }

    const clientData = clientDoc.data();
    if (clientData?.role !== 'CLIENT') {
      return badRequest(res, 'User is not a client', 'المستخدم ليس عميلاً');
    }

    // Calculate route and fare
    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates,
      stops?.map((s: Location) => s.coordinates)
    );

    const surgeMultiplier = 1.0;
    const estimatedFare = calculateFare(routeInfo.distance, routeInfo.duration, vehicleType, surgeMultiplier);

    const rideId = uuidv4();
    const now = new Date();

    // Build ride object with all new fields
    const ride: any = {
      rideId,
      clientId: targetClientId,
      status: assignDriverId ? 'accepted' : 'pending',
      vehicleType,
      vehicleCategory: vehicleCategory || 'CAR',
      rideType: rideType || 'STANDARD',
      pickup,
      dropoff,
      stops: stops || [],
      estimatedFare,
      currency: 'MRU',
      estimatedDuration: Math.round(routeInfo.duration),
      estimatedDistance: Math.round(routeInfo.distance),
      surgeMultiplier,
      paymentMethod,
      promoCode,
      route: routeInfo.route,
      polyline: routeInfo.polyline,
      createdAt: now,
      updatedAt: now,
      
      // Created on behalf tracking
      createdOnBehalf: true,
      createdByUserId: req.user!.uid,
      createdByUserRole: userRole,
      
      // Notes
      notes: notes || '',
      notesAr: notesAr || '',
      
      // Special requests
      specialRequests: {
        needsFemaleDriver: needsFemaleDriver || false,
        needsChildSeat: needsChildSeat || false,
        needsWheelchairAccess: needsWheelchairAccess || false,
        needsExtraLuggage: false,
        needsQuietRide: false,
        needsAirConditioning: true,
        allowsPets: false,
        numberOfPassengers: numberOfPassengers || 1,
        numberOfLuggage: 0,
      },
      
      // Scheduling
      isScheduled: !!scheduledAt,
      scheduledAt: scheduledAt || null,
      
      // Intercity
      isIntercity: rideType === 'INTERCITY',
      intercityRouteId: intercityRouteId || null,
      returnTrip: returnTrip || false,
      returnTripDate: returnTripDate || null,
      
      // Hourly booking
      isHourlyBooking: rideType === 'HOURLY',
      bookedHours: bookedHours || null,
      
      // Package delivery
      packageDelivery: packageDelivery || null,
      
      // Corporate
      isCorporateRide: !!corporateAccountId,
      corporateAccountId: corporateAccountId || null,
      corporateReference: corporateReference || null,
    };

    // If driver is assigned directly
    if (assignDriverId) {
      // Verify driver exists and is available
      const driverDoc = await db.collection(USERS_COLLECTION).doc(assignDriverId).get();
      if (!driverDoc.exists) {
        return notFound(res, 'Driver not found', 'السائق غير موجود');
      }
      
      const driverData = driverDoc.data();
      if (driverData?.role !== 'DRIVER') {
        return badRequest(res, 'User is not a driver', 'المستخدم ليس سائقاً');
      }
      
      ride.driverId = assignDriverId;
      ride.acceptedAt = now;
      ride.assignedByAdmin = true;
    }

    await db.collection(RIDES_COLLECTION).doc(rideId).set(ride);

    // If no driver assigned, publish for driver matching
    if (!assignDriverId) {
      await publishMessage(TOPICS.RIDE_REQUESTS, {
        type: 'ride_requested',
        rideId,
        clientId: targetClientId,
        pickup: pickup.coordinates,
        vehicleType,
        vehicleCategory: vehicleCategory || 'CAR',
        rideType: rideType || 'STANDARD',
        estimatedFare,
        createdOnBehalf: true,
        specialRequests: ride.specialRequests,
      });

      // Update ride status to searching
      await db.collection(RIDES_COLLECTION).doc(rideId).update({
        status: 'searching',
        updatedAt: new Date(),
      });
      
      ride.status = 'searching';
    } else {
      // Notify the assigned driver
      await publishMessage(TOPICS.RIDE_EVENTS, {
        type: 'ride_assigned',
        rideId,
        driverId: assignDriverId,
        clientId: targetClientId,
        assignedBy: req.user!.uid,
      });
    }

    // Notify the client
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'ride_created_for_you',
      userId: targetClientId,
      rideId,
      createdBy: userRole,
      pickup: pickup.address,
      dropoff: dropoff.address,
    });

    // Log the action for audit
    await db.collection('auditLogs').add({
      action: 'CREATE_RIDE_ON_BEHALF',
      performedBy: req.user!.uid,
      performedByRole: userRole,
      targetUserId: targetClientId,
      rideId,
      details: {
        pickup: pickup.address,
        dropoff: dropoff.address,
        vehicleType,
        estimatedFare,
        assignedDriver: assignDriverId || null,
      },
      createdAt: now,
    });

    return sendSuccess(
      res, 
      ride, 
      'Ride created on behalf of customer successfully', 
      'تم إنشاء الرحلة نيابة عن العميل بنجاح', 
      201
    );
  } catch (error) {
    console.error('Create ride on behalf error:', error);
    return serverError(res, 'Failed to create ride on behalf of customer', 'فشل إنشاء الرحلة نيابة عن العميل');
  }
});

/**
 * POST /on-behalf/quick
 * Quick ride creation with just phone and addresses (Admin/Employee only)
 * إنشاء رحلة سريعة برقم الهاتف والعناوين فقط
 */
app.post('/on-behalf/quick', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { 
      clientPhone,
      clientName,           // For new/guest clients
      pickupAddress,
      pickupCoordinates,
      dropoffAddress,
      dropoffCoordinates,
      vehicleType = 'economy',
      paymentMethod = 'CASH',
      notes,
    } = req.body;

    // Check if user is admin or employee
    const userRole = req.user!.role;
    if (userRole !== 'admin' && userRole !== 'employee') {
      return unauthorized(res, 'Only admins and employees can create rides on behalf of customers', 'فقط المسؤولون والموظفون يمكنهم إنشاء رحلات نيابة عن العملاء');
    }

    if (!clientPhone || !pickupAddress || !dropoffAddress) {
      return badRequest(res, 'Phone, pickup and dropoff addresses are required', 'رقم الهاتف وعناوين الانطلاق والوصول مطلوبة');
    }

    if (!pickupCoordinates || !dropoffCoordinates) {
      return badRequest(res, 'Pickup and dropoff coordinates are required', 'إحداثيات الانطلاق والوصول مطلوبة');
    }

    // Find or create client
    let targetClientId: string;
    let isNewClient = false;
    
    const clientSnapshot = await db.collection(USERS_COLLECTION)
      .where('phoneNumber', '==', clientPhone)
      .limit(1)
      .get();
    
    if (clientSnapshot.empty) {
      // Create a guest/temporary client record
      const newClientId = uuidv4();
      const now = new Date();
      
      await db.collection(USERS_COLLECTION).doc(newClientId).set({
        id: newClientId,
        phoneNumber: clientPhone,
        phoneCountryCode: '+222',
        firstName: clientName || 'Guest',
        lastName: '',
        fullName: clientName || 'Guest',
        role: 'CLIENT',
        status: 'PENDING_VERIFICATION',
        language: 'ar',
        deviceTokens: [],
        savedAddresses: [],
        favoriteLocations: [],
        totalRides: 0,
        averageRating: 0,
        totalRatings: 0,
        walletBalance: 0,
        preferFemaleDriver: false,
        requiresWheelchairAccess: false,
        requiresChildSeat: false,
        isCorporateUser: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        createdByAdmin: true,
        createdByUserId: req.user!.uid,
      });
      
      targetClientId = newClientId;
      isNewClient = true;
    } else {
      targetClientId = clientSnapshot.docs[0].id;
    }

    // Build locations
    const pickup: Location = {
      coordinates: pickupCoordinates,
      address: pickupAddress,
    };
    
    const dropoff: Location = {
      coordinates: dropoffCoordinates,
      address: dropoffAddress,
    };

    // Calculate route and fare
    const routeInfo = await calculateRoute(
      pickup.coordinates,
      dropoff.coordinates
    );

    const estimatedFare = calculateFare(routeInfo.distance, routeInfo.duration, vehicleType, 1.0);

    const rideId = uuidv4();
    const now = new Date();

    const ride: any = {
      rideId,
      clientId: targetClientId,
      status: 'searching',
      vehicleType,
      vehicleCategory: 'CAR',
      rideType: 'STANDARD',
      pickup,
      dropoff,
      stops: [],
      estimatedFare,
      currency: 'MRU',
      estimatedDuration: Math.round(routeInfo.duration),
      estimatedDistance: Math.round(routeInfo.distance),
      surgeMultiplier: 1.0,
      paymentMethod,
      route: routeInfo.route,
      polyline: routeInfo.polyline,
      createdAt: now,
      updatedAt: now,
      createdOnBehalf: true,
      createdByUserId: req.user!.uid,
      createdByUserRole: userRole,
      isQuickRide: true,
      notes: notes || '',
      specialRequests: {
        needsFemaleDriver: false,
        needsChildSeat: false,
        needsWheelchairAccess: false,
        needsExtraLuggage: false,
        needsQuietRide: false,
        needsAirConditioning: true,
        allowsPets: false,
        numberOfPassengers: 1,
        numberOfLuggage: 0,
      },
      isScheduled: false,
      isIntercity: false,
      isHourlyBooking: false,
      isCorporateRide: false,
    };

    await db.collection(RIDES_COLLECTION).doc(rideId).set(ride);

    // Publish for driver matching
    await publishMessage(TOPICS.RIDE_REQUESTS, {
      type: 'ride_requested',
      rideId,
      clientId: targetClientId,
      pickup: pickup.coordinates,
      vehicleType,
      estimatedFare,
      createdOnBehalf: true,
      isQuickRide: true,
    });

    return sendSuccess(
      res, 
      { 
        ...ride, 
        isNewClient,
        clientPhone,
      }, 
      'Quick ride created successfully', 
      'تم إنشاء الرحلة السريعة بنجاح', 
      201
    );
  } catch (error) {
    console.error('Quick ride creation error:', error);
    return serverError(res, 'Failed to create quick ride', 'فشل إنشاء الرحلة السريعة');
  }
});

/**
 * GET /
 * List user's rides
 */
app.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { status, limit = '20', cursor } = req.query;

    let query = db.collection(RIDES_COLLECTION)
      .where('clientId', '==', req.user!.uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', '==', status);
    }

    if (cursor) {
      const cursorDoc = await db.collection(RIDES_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const rides = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, rides, {
      total: rides.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get rides error:', error);
    return serverError(res);
  }
});

/**
 * GET /current
 * Get current active ride
 */
app.get('/current', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const activeStatuses: RideStatus[] = ['pending', 'searching', 'accepted', 'arriving', 'arrived', 'in_progress'];

    const snapshot = await db.collection(RIDES_COLLECTION)
      .where('clientId', '==', req.user!.uid)
      .where('status', 'in', activeStatuses)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return notFound(res, 'No active ride found', 'لا توجد رحلة نشطة');
    }

    const ride = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };

    return sendSuccess(res, ride);
  } catch (error) {
    console.error('Get current ride error:', error);
    return serverError(res);
  }
});

/**
 * GET /:rideId
 * Get ride by ID
 */
app.get('/:rideId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideDoc = await db.collection(RIDES_COLLECTION).doc(rideId).get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    // Verify user is client or driver
    if (ride.clientId !== req.user!.uid && ride.driverId !== req.user!.uid && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    return sendSuccess(res, { ...ride, id: rideDoc.id });
  } catch (error) {
    console.error('Get ride error:', error);
    return serverError(res);
  }
});


/**
 * POST /:rideId/accept
 * Driver accepts a ride
 */
app.post('/:rideId/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.status !== 'pending' && ride.status !== 'searching') {
      return badRequest(res, 'Ride cannot be accepted in current status', 'لا يمكن قبول الرحلة في الحالة الحالية');
    }

    const now = new Date();

    // Use transaction to prevent race conditions
    await db.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(rideRef);
      const freshRide = freshDoc.data() as Ride;

      if (freshRide.status !== 'pending' && freshRide.status !== 'searching') {
        throw new Error('Ride already accepted');
      }

      transaction.update(rideRef, {
        status: 'accepted',
        driverId: req.user!.uid,
        acceptedAt: now,
        updatedAt: now,
      });
    });

    // Publish ride accepted event
    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'ride_accepted',
      rideId,
      driverId: req.user!.uid,
      clientId: ride.clientId,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Ride accepted', 'تم قبول الرحلة');
  } catch (error: any) {
    if (error.message === 'Ride already accepted') {
      return conflict(res, 'Ride has already been accepted', 'تم قبول الرحلة بالفعل');
    }
    console.error('Accept ride error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/arriving
 * Driver is arriving at pickup
 */
app.post('/:rideId/arriving', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (ride.status !== 'accepted') {
      return badRequest(res, 'Invalid ride status', 'حالة الرحلة غير صالحة');
    }

    await rideRef.update({
      status: 'arriving',
      updatedAt: new Date(),
    });

    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'driver_arriving',
      rideId,
      driverId: req.user!.uid,
      clientId: ride.clientId,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id });
  } catch (error) {
    console.error('Arriving error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/arrived
 * Driver arrived at pickup
 */
app.post('/:rideId/arrived', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (ride.status !== 'arriving') {
      return badRequest(res, 'Invalid ride status', 'حالة الرحلة غير صالحة');
    }

    await rideRef.update({
      status: 'arrived',
      updatedAt: new Date(),
    });

    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'driver_arrived',
      rideId,
      driverId: req.user!.uid,
      clientId: ride.clientId,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id });
  } catch (error) {
    console.error('Arrived error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/start
 * Start the ride
 */
app.post('/:rideId/start', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (ride.status !== 'arrived') {
      return badRequest(res, 'Driver must arrive at pickup before starting ride', 'يجب أن يصل السائق إلى نقطة الانطلاق قبل بدء الرحلة');
    }

    const now = new Date();

    await rideRef.update({
      status: 'in_progress',
      startedAt: now,
      updatedAt: now,
    });

    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'ride_started',
      rideId,
      driverId: req.user!.uid,
      clientId: ride.clientId,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Ride started', 'بدأت الرحلة');
  } catch (error) {
    console.error('Start ride error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/complete
 * Complete the ride
 */
app.post('/:rideId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;
    const { actualDistance, actualDuration } = req.body;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (ride.status !== 'in_progress') {
      return badRequest(res, 'Ride must be in progress to complete', 'يجب أن تكون الرحلة قيد التنفيذ لإكمالها');
    }

    const now = new Date();

    // Calculate actual fare
    let actualFare = ride.estimatedFare;
    if (actualDistance && actualDuration) {
      actualFare = calculateFare(actualDistance, actualDuration, ride.vehicleType, ride.surgeMultiplier);
    }

    if (ride.discount) {
      actualFare = Math.max(0, actualFare - ride.discount);
    }

    await rideRef.update({
      status: 'completed',
      completedAt: now,
      actualFare,
      actualDistance: actualDistance || ride.estimatedDistance,
      actualDuration: actualDuration || ride.estimatedDuration,
      updatedAt: now,
    });

    // Update user stats
    await db.collection(USERS_COLLECTION).doc(ride.clientId).update({
      totalRides: FieldValue.increment(1),
      updatedAt: now,
    });

    // Publish ride completed event
    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'ride_completed',
      rideId,
      driverId: req.user!.uid,
      clientId: ride.clientId,
      actualFare,
    });

    // Trigger payment processing
    await publishMessage(TOPICS.PAYMENTS, {
      type: 'process_payment',
      rideId,
      clientId: ride.clientId,
      driverId: req.user!.uid,
      amount: actualFare,
      paymentMethod: ride.paymentMethod,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Ride completed', 'اكتملت الرحلة');
  } catch (error) {
    console.error('Complete ride error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/cancel
 * Cancel the ride
 */
app.post('/:rideId/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;
    const { reason } = req.body;

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    // Verify user is client or driver
    if (ride.clientId !== req.user!.uid && ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    const cancellableStatuses: RideStatus[] = ['pending', 'searching', 'accepted', 'arriving', 'arrived'];
    if (!cancellableStatuses.includes(ride.status)) {
      return badRequest(res, 'Ride cannot be cancelled in current status', 'لا يمكن إلغاء الرحلة في الحالة الحالية');
    }

    const now = new Date();
    const cancelledBy = ride.clientId === req.user!.uid ? 'client' : 'driver';

    await rideRef.update({
      status: 'cancelled',
      cancelledAt: now,
      cancelReason: reason || 'No reason provided',
      cancelledBy,
      updatedAt: now,
    });

    await publishMessage(TOPICS.RIDE_EVENTS, {
      type: 'ride_cancelled',
      rideId,
      cancelledBy,
      clientId: ride.clientId,
      driverId: ride.driverId,
      reason,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Ride cancelled', 'تم إلغاء الرحلة');
  } catch (error) {
    console.error('Cancel ride error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/rate
 * Rate the ride
 */
app.post('/:rideId/rate', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return badRequest(res, 'Rating must be between 1 and 5', 'يجب أن يكون التقييم بين 1 و 5');
    }

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.status !== 'completed') {
      return badRequest(res, 'Can only rate completed rides', 'يمكن تقييم الرحلات المكتملة فقط');
    }

    const isClient = ride.clientId === req.user!.uid;
    const isDriver = ride.driverId === req.user!.uid;

    if (!isClient && !isDriver) {
      return unauthorized(res);
    }

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (isClient) {
      updates.rating = rating;
      updates.review = review || '';
    } else {
      updates.driverRating = rating;
      updates.driverReview = review || '';
    }

    await rideRef.update(updates);

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Rating submitted', 'تم إرسال التقييم');
  } catch (error) {
    console.error('Rate ride error:', error);
    return serverError(res);
  }
});

/**
 * POST /:rideId/tip
 * Add tip to ride
 */
app.post('/:rideId/tip', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return badRequest(res, 'Valid tip amount is required', 'مبلغ البقشيش صالح مطلوب');
    }

    const rideRef = db.collection(RIDES_COLLECTION).doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.clientId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (ride.status !== 'completed') {
      return badRequest(res, 'Can only tip after ride is completed', 'يمكن إضافة البقشيش بعد اكتمال الرحلة فقط');
    }

    await rideRef.update({
      tip: amount,
      updatedAt: new Date(),
    });

    // Process tip payment
    await publishMessage(TOPICS.PAYMENTS, {
      type: 'process_tip',
      rideId,
      driverId: ride.driverId,
      amount,
    });

    const updatedDoc = await rideRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'Tip added', 'تمت إضافة البقشيش');
  } catch (error) {
    console.error('Add tip error:', error);
    return serverError(res);
  }
});

/**
 * GET /:rideId/route
 * Get ride route
 */
app.get('/:rideId/route', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { rideId } = req.params;

    const rideDoc = await db.collection(RIDES_COLLECTION).doc(rideId).get();

    if (!rideDoc.exists) {
      return notFound(res, 'Ride not found', 'الرحلة غير موجودة');
    }

    const ride = rideDoc.data() as Ride;

    if (ride.clientId !== req.user!.uid && ride.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    return sendSuccess(res, {
      route: ride.route,
      polyline: ride.polyline,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      stops: ride.stops,
    });
  } catch (error) {
    console.error('Get route error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'rides' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Rides service listening on port ${PORT}`);
});

export default app;
