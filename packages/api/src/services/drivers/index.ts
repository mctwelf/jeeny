/**
 * Jeeny Drivers Service - Cloud Run
 *
 * Handles driver operations using Firestore and Google Maps.
 * Replaces AWS Lambda drivers handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized, forbidden } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const USERS_COLLECTION = 'users';
const VEHICLES_COLLECTION = 'vehicles';
const RIDES_COLLECTION = 'rides';

// Types
interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: Date;
}

interface DriverDocument {
  documentId: string;
  type: 'license' | 'registration' | 'insurance' | 'national_id' | 'vehicle_photo' | 'profile_photo';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  expiryDate?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// Routes

/**
 * GET /
 * List all drivers (admin only)
 */
app.get('/', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { status, verificationStatus, driverStatus, cityId, limit = '20', cursor } = req.query;

    let query = db.collection(USERS_COLLECTION)
      .where('role', '==', 'driver')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', '==', status);
    }
    if (verificationStatus) {
      query = query.where('verificationStatus', '==', verificationStatus);
    }
    if (driverStatus) {
      query = query.where('driverStatus', '==', driverStatus);
    }
    if (cityId) {
      query = query.where('cityId', '==', cityId);
    }

    if (cursor) {
      const cursorDoc = await db.collection(USERS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const drivers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, drivers, {
      total: drivers.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return serverError(res);
  }
});

/**
 * POST /
 * Register as a driver
 */
app.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { firstName, lastName, email, cityId, vehicle } = req.body;

    const now = new Date();
    const driverId = req.user!.uid;

    // Check if already a driver
    const existingDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    if (existingDoc.exists && existingDoc.data()?.role === 'driver') {
      return badRequest(res, 'Already registered as driver', 'مسجل بالفعل كسائق');
    }

    // Create/update driver record
    const driverData = {
      userId: driverId,
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

    await db.collection(USERS_COLLECTION).doc(driverId).set(driverData, { merge: true });

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

      await db.collection(VEHICLES_COLLECTION).doc(vehicleId).set(createdVehicle);
      await db.collection(USERS_COLLECTION).doc(driverId).update({ vehicleId, updatedAt: now });
    }

    return sendSuccess(res, { ...driverData, vehicle: createdVehicle }, 'Driver registered successfully. Pending verification.', 'تم تسجيل السائق بنجاح. في انتظار التحقق.', 201);
  } catch (error) {
    console.error('Create driver error:', error);
    return serverError(res);
  }
});

/**
 * GET /me
 * Get current driver profile
 */
app.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const driverDoc = await db.collection(USERS_COLLECTION).doc(req.user!.uid).get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();
    if (driver?.role !== 'driver') {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    // Get vehicle info
    let vehicle = null;
    if (driver.vehicleId) {
      const vehicleDoc = await db.collection(VEHICLES_COLLECTION).doc(driver.vehicleId).get();
      if (vehicleDoc.exists) {
        vehicle = vehicleDoc.data();
      }
    }

    return sendSuccess(res, { ...driver, id: driverDoc.id, vehicle });
  } catch (error) {
    console.error('Get driver profile error:', error);
    return serverError(res);
  }
});

/**
 * GET /:driverId
 * Get driver by ID
 */
app.get('/:driverId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();
    if (driver?.role !== 'driver') {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    // Get vehicle info
    let vehicle = null;
    if (driver.vehicleId) {
      const vehicleDoc = await db.collection(VEHICLES_COLLECTION).doc(driver.vehicleId).get();
      if (vehicleDoc.exists) {
        vehicle = vehicleDoc.data();
      }
    }

    return sendSuccess(res, { ...driver, id: driverDoc.id, vehicle });
  } catch (error) {
    console.error('Get driver error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:driverId
 * Update driver profile
 */
app.put('/:driverId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    // Only allow self-update or admin
    if (driverId !== req.user!.uid && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    const { firstName, lastName, email, profilePicture, cityId } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (cityId) updates.cityId = cityId;

    await db.collection(USERS_COLLECTION).doc(driverId).update(updates);

    return sendSuccess(res, null, 'Driver updated successfully', 'تم تحديث السائق بنجاح');
  } catch (error) {
    console.error('Update driver error:', error);
    return serverError(res);
  }
});

/**
 * GET /:driverId/status
 * Get driver status
 */
app.get('/:driverId/status', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();

    return sendSuccess(res, {
      driverStatus: driver?.driverStatus,
      verificationStatus: driver?.verificationStatus,
      accountStatus: driver?.status,
      currentLocation: driver?.currentLocation,
    });
  } catch (error) {
    console.error('Get driver status error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:driverId/status
 * Update driver status (online/offline/busy)
 */
app.put('/:driverId/status', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;
    const { driverStatus } = req.body;

    if (driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (!driverStatus || !['online', 'offline', 'busy'].includes(driverStatus)) {
      return badRequest(res, 'Valid driver status is required (online/offline/busy)', 'حالة السائق صالحة مطلوبة');
    }

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();

    if (driver?.verificationStatus !== 'approved') {
      return forbidden(res, 'Driver must be verified to go online', 'يجب التحقق من السائق للاتصال');
    }

    if (driver?.status !== 'active') {
      return forbidden(res, 'Driver account is not active', 'حساب السائق غير نشط');
    }

    await db.collection(USERS_COLLECTION).doc(driverId).update({
      driverStatus,
      updatedAt: new Date(),
    });

    // Publish driver status event
    await publishMessage(TOPICS.DRIVER_EVENTS, {
      type: 'driver_status_changed',
      driverId,
      status: driverStatus,
    });

    return sendSuccess(res, { driverStatus }, `Driver is now ${driverStatus}`, `السائق الآن ${driverStatus}`);
  } catch (error) {
    console.error('Update driver status error:', error);
    return serverError(res);
  }
});

/**
 * GET /:driverId/location
 * Get driver location
 */
app.get('/:driverId/location', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();

    if (!driver?.currentLocation) {
      return notFound(res, 'Driver location not available', 'موقع السائق غير متاح');
    }

    return sendSuccess(res, driver.currentLocation);
  } catch (error) {
    console.error('Get driver location error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:driverId/location
 * Update driver location
 */
app.put('/:driverId/location', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;
    const { latitude, longitude, heading, speed, accuracy } = req.body;

    if (driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (!latitude || !longitude) {
      return badRequest(res, 'Latitude and longitude are required', 'خط العرض وخط الطول مطلوبان');
    }

    const now = new Date();
    const currentLocation: DriverLocation = {
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
      timestamp: now,
    };

    await db.collection(USERS_COLLECTION).doc(driverId).update({
      currentLocation,
      updatedAt: now,
    });

    // Publish location update event
    await publishMessage(TOPICS.DRIVER_EVENTS, {
      type: 'driver_location_updated',
      driverId,
      location: currentLocation,
    });

    return sendSuccess(res, currentLocation, 'Location updated successfully', 'تم تحديث الموقع بنجاح');
  } catch (error) {
    console.error('Update driver location error:', error);
    return serverError(res);
  }
});

/**
 * GET /:driverId/earnings
 * Get driver earnings
 */
app.get('/:driverId/earnings', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    if (driverId !== req.user!.uid && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();

    // Calculate time ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Query completed rides
    const ridesSnapshot = await db.collection(RIDES_COLLECTION)
      .where('driverId', '==', driverId)
      .where('status', '==', 'completed')
      .get();

    let todayEarnings = 0, weekEarnings = 0, monthEarnings = 0;
    let todayRides = 0, weekRides = 0, monthRides = 0;

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      const rideDate = ride.completedAt?.toDate() || ride.updatedAt?.toDate();
      const driverEarning = ride.driverEarning || ride.actualFare * 0.8 || 0;

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
    });

    return sendSuccess(res, {
      totalEarnings: driver?.totalEarnings || 0,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalRides: driver?.totalRides || 0,
      todayRides,
      weekRides,
      monthRides,
      averageRating: driver?.rating || 5.0,
      pendingPayout: 0,
    });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    return serverError(res);
  }
});

/**
 * GET /:driverId/vehicle
 * Get driver vehicle
 */
app.get('/:driverId/vehicle', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();
    if (!driver?.vehicleId) {
      return notFound(res, 'No vehicle registered', 'لا توجد مركبة مسجلة');
    }

    const vehicleDoc = await db.collection(VEHICLES_COLLECTION).doc(driver.vehicleId).get();
    if (!vehicleDoc.exists) {
      return notFound(res, 'Vehicle not found', 'المركبة غير موجودة');
    }

    return sendSuccess(res, { ...vehicleDoc.data(), id: vehicleDoc.id });
  } catch (error) {
    console.error('Get driver vehicle error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:driverId/vehicle
 * Update driver vehicle
 */
app.put('/:driverId/vehicle', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    if (driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    const { type, make, model, year, color, plateNumber, capacity, photos } = req.body;
    const now = new Date();

    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    const driver = driverDoc.data();

    if (driver?.vehicleId) {
      // Update existing vehicle
      const updates: Record<string, any> = { updatedAt: now };
      if (type) updates.type = type;
      if (make) updates.make = make;
      if (model) updates.model = model;
      if (year) updates.year = year;
      if (color) updates.color = color;
      if (plateNumber) updates.plateNumber = plateNumber;
      if (capacity) updates.capacity = capacity;
      if (photos) updates.photos = photos;

      await db.collection(VEHICLES_COLLECTION).doc(driver.vehicleId).update(updates);

      return sendSuccess(res, null, 'Vehicle updated successfully', 'تم تحديث المركبة بنجاح');
    } else {
      // Create new vehicle
      const vehicleId = uuidv4();
      const newVehicle: Vehicle = {
        vehicleId,
        driverId,
        type: type || 'economy',
        make: make || '',
        model: model || '',
        year: year || new Date().getFullYear(),
        color: color || '',
        plateNumber: plateNumber || '',
        capacity: capacity || 4,
        status: 'pending_verification',
        photos,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(VEHICLES_COLLECTION).doc(vehicleId).set(newVehicle);
      await db.collection(USERS_COLLECTION).doc(driverId).update({ vehicleId, updatedAt: now });

      return sendSuccess(res, newVehicle, 'Vehicle created successfully', 'تم إنشاء المركبة بنجاح', 201);
    }
  } catch (error) {
    console.error('Update driver vehicle error:', error);
    return serverError(res);
  }
});

/**
 * POST /:driverId/documents
 * Upload driver document
 */
app.post('/:driverId/documents', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;

    if (driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    const { type, url, expiryDate } = req.body;

    if (!type || !url) {
      return badRequest(res, 'Document type and URL are required', 'نوع المستند والرابط مطلوبان');
    }

    const now = new Date();
    const document: DriverDocument = {
      documentId: uuidv4(),
      type,
      url,
      status: 'pending',
      expiryDate,
      uploadedAt: now,
    };

    await db.collection(USERS_COLLECTION).doc(driverId).update({
      documents: FieldValue.arrayUnion(document),
      updatedAt: now,
    });

    return sendSuccess(res, document, 'Document uploaded successfully', 'تم رفع المستند بنجاح', 201);
  } catch (error) {
    console.error('Upload document error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'drivers' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Drivers service listening on port ${PORT}`);
});

export default app;
