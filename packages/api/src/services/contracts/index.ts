/**
 * Jeeny Contracts Service - Cloud Run
 *
 * Handles monthly contracts, school contracts, and corporate contracts.
 * العقود الشهرية وعقود المدارس وعقود الشركات
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized, forbidden } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const CONTRACTS_COLLECTION = 'contracts';
const USERS_COLLECTION = 'users';
const RIDES_COLLECTION = 'rides';

// Types
type ContractType = 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'SCHOOL' | 'CORPORATE' | 'MEDICAL';
type ContractStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

interface ContractScheduleTrip {
  id: string;
  pickupTime: string;
  pickupAddress: string;
  pickupCoordinates: { latitude: number; longitude: number };
  dropoffAddress: string;
  dropoffCoordinates: { latitude: number; longitude: number };
  returnTrip: boolean;
  returnTime?: string;
  passengerName?: string;
  passengerPhone?: string;
  notes?: string;
}

interface ContractScheduleDay {
  dayOfWeek: number; // 0-6
  isActive: boolean;
  trips: ContractScheduleTrip[];
}

// Routes

/**
 * GET /
 * List contracts (admin sees all, users see their own)
 */
app.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { type, status, clientId, driverId, limit = '20', cursor } = req.query;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    let query = db.collection(CONTRACTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    // Non-admins can only see their own contracts
    if (!isAdmin) {
      query = query.where('clientId', '==', req.user!.uid);
    } else {
      if (clientId) query = query.where('clientId', '==', clientId);
      if (driverId) query = query.where('driverId', '==', driverId);
    }

    if (type) query = query.where('contractType', '==', type);
    if (status) query = query.where('status', '==', status);

    if (cursor) {
      const cursorDoc = await db.collection(CONTRACTS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const contracts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, contracts, {
      total: contracts.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    return serverError(res);
  }
});

/**
 * POST /
 * Create a new contract
 */
app.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const {
      contractType,
      clientId,
      driverId,
      startDate,
      endDate,
      monthlyRate,
      includedKilometers,
      includedHours,
      extraKmRate,
      extraHourRate,
      schedule,
      pickupLocations,
      dropoffLocations,
      vehicleCategory,
      vehicleType,
      specialRequirements,
      specialRequirementsAr,
      paymentMethod,
      autoRenew,
      // School contract specific
      schoolName,
      schoolNameAr,
      schoolAddress,
      students,
      academicYear,
      semester,
      // Corporate specific
      corporateAccountId,
      notes,
      notesAr,
    } = req.body;

    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    // Validate required fields
    if (!contractType || !startDate || !endDate || !monthlyRate) {
      return badRequest(res, 'Contract type, dates, and rate are required', 'نوع العقد والتواريخ والسعر مطلوبة');
    }

    // Only admins can create contracts for others
    const targetClientId = isAdmin && clientId ? clientId : req.user!.uid;

    // Verify client exists
    const clientDoc = await db.collection(USERS_COLLECTION).doc(targetClientId).get();
    if (!clientDoc.exists) {
      return notFound(res, 'Client not found', 'العميل غير موجود');
    }

    // Verify driver if specified
    if (driverId) {
      const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
      if (!driverDoc.exists || driverDoc.data()?.role !== 'driver') {
        return notFound(res, 'Driver not found', 'السائق غير موجود');
      }
    }

    const contractId = uuidv4();
    const contractNumber = `JNY-${contractType.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    const contract: any = {
      contractId,
      contractNumber,
      contractType,
      status: isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL',
      clientId: targetClientId,
      driverId: driverId || null,
      startDate,
      endDate,
      autoRenew: autoRenew || false,
      monthlyRate,
      currency: 'MRU',
      includedKilometers: includedKilometers || 0,
      includedHours: includedHours || 0,
      extraKmRate: extraKmRate || 0,
      extraHourRate: extraHourRate || 0,
      usedKilometers: 0,
      usedHours: 0,
      totalTrips: 0,
      schedule: schedule || [],
      pickupLocations: pickupLocations || [],
      dropoffLocations: dropoffLocations || [],
      vehicleCategory: vehicleCategory || 'CAR',
      vehicleType: vehicleType || 'ECONOMY',
      specialRequirements,
      specialRequirementsAr,
      paymentMethod: paymentMethod || 'CASH',
      notes,
      notesAr,
      createdAt: now,
      updatedAt: now,
      createdBy: req.user!.uid,
    };

    // Add school-specific fields
    if (contractType === 'SCHOOL') {
      contract.schoolName = schoolName;
      contract.schoolNameAr = schoolNameAr;
      contract.schoolAddress = schoolAddress;
      contract.students = students || [];
      contract.academicYear = academicYear;
      contract.semester = semester;
    }

    // Add corporate-specific fields
    if (contractType === 'CORPORATE' || corporateAccountId) {
      contract.corporateAccountId = corporateAccountId;
      contract.isCorporateContract = true;
    }

    await db.collection(CONTRACTS_COLLECTION).doc(contractId).set(contract);

    // Notify relevant parties
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'push',
      userId: targetClientId,
      title: 'تم إنشاء عقد جديد',
      titleEn: 'New Contract Created',
      body: `رقم العقد: ${contractNumber}`,
      bodyEn: `Contract Number: ${contractNumber}`,
      data: { type: 'contract_created', contractId },
    });

    if (driverId) {
      await publishMessage(TOPICS.NOTIFICATIONS, {
        type: 'push',
        userId: driverId,
        title: 'عقد جديد مخصص لك',
        titleEn: 'New Contract Assigned',
        body: `رقم العقد: ${contractNumber}`,
        bodyEn: `Contract Number: ${contractNumber}`,
        data: { type: 'contract_assigned', contractId },
      });
    }

    return sendSuccess(res, contract, 'Contract created successfully', 'تم إنشاء العقد بنجاح', 201);
  } catch (error) {
    console.error('Create contract error:', error);
    return serverError(res);
  }
});

/**
 * GET /:contractId
 * Get contract by ID
 */
app.get('/:contractId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    const contractDoc = await db.collection(CONTRACTS_COLLECTION).doc(contractId).get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    // Check access
    if (!isAdmin && contract?.clientId !== req.user!.uid && contract?.driverId !== req.user!.uid) {
      return unauthorized(res);
    }

    return sendSuccess(res, { ...contract, id: contractDoc.id });
  } catch (error) {
    console.error('Get contract error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:contractId
 * Update contract
 */
app.put('/:contractId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    // Only admins or contract owner can update
    if (!isAdmin && contract?.clientId !== req.user!.uid) {
      return unauthorized(res);
    }

    // Build updates
    const allowedFields = isAdmin
      ? ['status', 'driverId', 'endDate', 'monthlyRate', 'includedKilometers', 'includedHours', 
         'extraKmRate', 'extraHourRate', 'schedule', 'pickupLocations', 'dropoffLocations',
         'vehicleCategory', 'vehicleType', 'specialRequirements', 'specialRequirementsAr',
         'paymentMethod', 'autoRenew', 'notes', 'notesAr', 'students', 'schoolAddress']
      : ['schedule', 'notes', 'notesAr', 'autoRenew'];

    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await contractRef.update(updates);

    return sendSuccess(res, null, 'Contract updated successfully', 'تم تحديث العقد بنجاح');
  } catch (error) {
    console.error('Update contract error:', error);
    return serverError(res);
  }
});

/**
 * POST /:contractId/approve
 * Approve a pending contract (admin only)
 */
app.post('/:contractId/approve', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const { driverId } = req.body;

    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    if (contract?.status !== 'PENDING_APPROVAL') {
      return badRequest(res, 'Contract is not pending approval', 'العقد ليس في انتظار الموافقة');
    }

    const updates: Record<string, any> = {
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy: req.user!.uid,
      updatedAt: new Date(),
    };

    if (driverId) {
      updates.driverId = driverId;
    }

    await contractRef.update(updates);

    // Notify client
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'push',
      userId: contract?.clientId,
      title: 'تمت الموافقة على عقدك',
      titleEn: 'Contract Approved',
      body: `رقم العقد: ${contract?.contractNumber}`,
      data: { type: 'contract_approved', contractId },
    });

    return sendSuccess(res, null, 'Contract approved', 'تمت الموافقة على العقد');
  } catch (error) {
    console.error('Approve contract error:', error);
    return serverError(res);
  }
});

/**
 * POST /:contractId/pause
 * Pause an active contract
 */
app.post('/:contractId/pause', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const { reason } = req.body;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    if (!isAdmin && contract?.clientId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (contract?.status !== 'ACTIVE') {
      return badRequest(res, 'Only active contracts can be paused', 'يمكن إيقاف العقود النشطة فقط');
    }

    await contractRef.update({
      status: 'PAUSED',
      pausedAt: new Date(),
      pausedBy: req.user!.uid,
      pauseReason: reason,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Contract paused', 'تم إيقاف العقد مؤقتاً');
  } catch (error) {
    console.error('Pause contract error:', error);
    return serverError(res);
  }
});

/**
 * POST /:contractId/resume
 * Resume a paused contract
 */
app.post('/:contractId/resume', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    if (!isAdmin && contract?.clientId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (contract?.status !== 'PAUSED') {
      return badRequest(res, 'Only paused contracts can be resumed', 'يمكن استئناف العقود المتوقفة فقط');
    }

    await contractRef.update({
      status: 'ACTIVE',
      resumedAt: new Date(),
      pausedAt: null,
      pauseReason: null,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Contract resumed', 'تم استئناف العقد');
  } catch (error) {
    console.error('Resume contract error:', error);
    return serverError(res);
  }
});

/**
 * POST /:contractId/cancel
 * Cancel a contract
 */
app.post('/:contractId/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const { reason } = req.body;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';

    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    if (!isAdmin && contract?.clientId !== req.user!.uid) {
      return unauthorized(res);
    }

    if (['COMPLETED', 'CANCELLED'].includes(contract?.status)) {
      return badRequest(res, 'Contract cannot be cancelled', 'لا يمكن إلغاء العقد');
    }

    await contractRef.update({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: req.user!.uid,
      cancellationReason: reason,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Contract cancelled', 'تم إلغاء العقد');
  } catch (error) {
    console.error('Cancel contract error:', error);
    return serverError(res);
  }
});

/**
 * GET /:contractId/trips
 * Get trips for a contract
 */
app.get('/:contractId/trips', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const { limit = '20', cursor } = req.query;

    const contractDoc = await db.collection(CONTRACTS_COLLECTION).doc(contractId).get();
    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    let query = db.collection(RIDES_COLLECTION)
      .where('contractId', '==', contractId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (cursor) {
      const cursorDoc = await db.collection(RIDES_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const trips = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, trips, {
      total: trips.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get contract trips error:', error);
    return serverError(res);
  }
});

/**
 * POST /:contractId/trips
 * Create a trip from contract schedule
 */
app.post('/:contractId/trips', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;
    const { scheduleItemId, scheduledTripId, overridePickup, overrideDropoff, notes } = req.body;

    const contractDoc = await db.collection(CONTRACTS_COLLECTION).doc(contractId).get();
    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    if (contract?.status !== 'ACTIVE') {
      return badRequest(res, 'Contract is not active', 'العقد غير نشط');
    }

    // Find the scheduled trip
    let scheduledTrip: ContractScheduleTrip | null = null;
    if (scheduleItemId && scheduledTripId) {
      const scheduleDay = contract?.schedule?.find((s: ContractScheduleDay) => s.dayOfWeek === parseInt(scheduleItemId));
      scheduledTrip = scheduleDay?.trips?.find((t: ContractScheduleTrip) => t.id === scheduledTripId);
    }

    const rideId = uuidv4();
    const now = new Date();

    const ride = {
      rideId,
      clientId: contract?.clientId,
      driverId: contract?.driverId || null,
      contractId,
      contractNumber: contract?.contractNumber,
      status: contract?.driverId ? 'accepted' : 'searching',
      rideType: 'MONTHLY_CONTRACT',
      vehicleCategory: contract?.vehicleCategory || 'CAR',
      vehicleType: contract?.vehicleType || 'ECONOMY',
      pickup: overridePickup || (scheduledTrip ? {
        address: scheduledTrip.pickupAddress,
        coordinates: scheduledTrip.pickupCoordinates,
      } : contract?.pickupLocations?.[0]),
      dropoff: overrideDropoff || (scheduledTrip ? {
        address: scheduledTrip.dropoffAddress,
        coordinates: scheduledTrip.dropoffCoordinates,
      } : contract?.dropoffLocations?.[0]),
      estimatedFare: 0, // Contract rides don't have per-ride fare
      currency: 'MRU',
      paymentMethod: contract?.paymentMethod || 'CASH',
      isContractRide: true,
      notes: notes || scheduledTrip?.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(RIDES_COLLECTION).doc(rideId).set(ride);

    // Update contract usage
    await db.collection(CONTRACTS_COLLECTION).doc(contractId).update({
      totalTrips: (contract?.totalTrips || 0) + 1,
      updatedAt: now,
    });

    // Publish ride event
    if (!contract?.driverId) {
      await publishMessage(TOPICS.RIDE_REQUESTS, {
        type: 'contract_ride_requested',
        rideId,
        contractId,
        clientId: contract?.clientId,
        pickup: ride.pickup?.coordinates,
        vehicleType: ride.vehicleType,
      });
    }

    return sendSuccess(res, ride, 'Trip created from contract', 'تم إنشاء الرحلة من العقد', 201);
  } catch (error) {
    console.error('Create contract trip error:', error);
    return serverError(res);
  }
});

/**
 * GET /:contractId/usage
 * Get contract usage statistics
 */
app.get('/:contractId/usage', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { contractId } = req.params;

    const contractDoc = await db.collection(CONTRACTS_COLLECTION).doc(contractId).get();
    if (!contractDoc.exists) {
      return notFound(res, 'Contract not found', 'العقد غير موجود');
    }

    const contract = contractDoc.data();

    // Calculate usage from rides
    const ridesSnapshot = await db.collection(RIDES_COLLECTION)
      .where('contractId', '==', contractId)
      .where('status', '==', 'completed')
      .get();

    let totalDistance = 0;
    let totalDuration = 0;
    let totalTrips = ridesSnapshot.docs.length;

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      totalDistance += ride.actualDistance || ride.estimatedDistance || 0;
      totalDuration += ride.actualDuration || ride.estimatedDuration || 0;
    });

    const usedKilometers = totalDistance / 1000;
    const usedHours = totalDuration / 3600;

    const remainingKilometers = Math.max(0, (contract?.includedKilometers || 0) - usedKilometers);
    const remainingHours = Math.max(0, (contract?.includedHours || 0) - usedHours);

    const extraKilometers = Math.max(0, usedKilometers - (contract?.includedKilometers || 0));
    const extraHours = Math.max(0, usedHours - (contract?.includedHours || 0));

    const extraCharges = (extraKilometers * (contract?.extraKmRate || 0)) + 
                         (extraHours * (contract?.extraHourRate || 0));

    return sendSuccess(res, {
      contractId,
      totalTrips,
      usedKilometers: Math.round(usedKilometers * 10) / 10,
      usedHours: Math.round(usedHours * 10) / 10,
      includedKilometers: contract?.includedKilometers || 0,
      includedHours: contract?.includedHours || 0,
      remainingKilometers: Math.round(remainingKilometers * 10) / 10,
      remainingHours: Math.round(remainingHours * 10) / 10,
      extraKilometers: Math.round(extraKilometers * 10) / 10,
      extraHours: Math.round(extraHours * 10) / 10,
      extraCharges: Math.round(extraCharges),
      monthlyRate: contract?.monthlyRate || 0,
      totalDue: (contract?.monthlyRate || 0) + Math.round(extraCharges),
      currency: 'MRU',
    });
  } catch (error) {
    console.error('Get contract usage error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'contracts' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Contracts service listening on port ${PORT}`);
});

export default app;
