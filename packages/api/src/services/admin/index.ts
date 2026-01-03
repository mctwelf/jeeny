/**
 * Jeeny Admin Service - Cloud Run
 *
 * Handles admin dashboard operations using Firestore.
 * Replaces AWS Lambda admin handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb, getFirebaseAuth } from '../../lib/firebase';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(authenticate);
app.use(requireRole('admin', 'employee'));

// Collections
const USERS_COLLECTION = 'users';
const RIDES_COLLECTION = 'rides';
const TRANSACTIONS_COLLECTION = 'transactions';
const SETTINGS_COLLECTION = 'settings';
const PROMOTIONS_COLLECTION = 'promotions';
const SUPPORT_TICKETS_COLLECTION = 'supportTickets';

// Routes

/**
 * GET /dashboard
 * Get dashboard statistics
 */
app.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();

    // Get user counts
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    const clients = users.filter(u => u.role === 'client').length;
    const drivers = users.filter(u => u.role === 'driver').length;
    const employees = users.filter(u => u.role === 'employee').length;

    // Get driver status counts
    const onlineDrivers = users.filter(u => u.role === 'driver' && u.driverStatus === 'online').length;
    const offlineDrivers = users.filter(u => u.role === 'driver' && u.driverStatus === 'offline').length;
    const busyDrivers = users.filter(u => u.role === 'driver' && u.driverStatus === 'busy').length;
    const pendingVerification = users.filter(u => u.role === 'driver' && u.verificationStatus === 'pending').length;

    // Get ride counts
    const ridesSnapshot = await db.collection(RIDES_COLLECTION).get();
    const rides = ridesSnapshot.docs.map(doc => doc.data());

    const completedRides = rides.filter(r => r.status === 'completed').length;
    const cancelledRides = rides.filter(r => r.status === 'cancelled').length;
    const activeRides = rides.filter(r => ['pending', 'searching', 'accepted', 'arriving', 'arrived', 'in_progress'].includes(r.status)).length;

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRides = rides.filter(r => {
      const createdAt = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return createdAt >= today && r.status === 'completed';
    });

    const todayRevenue = todayRides.reduce((sum, r) => sum + (r.actualFare || r.estimatedFare || 0), 0);

    // Calculate total revenue
    const totalRevenue = rides
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.actualFare || r.estimatedFare || 0), 0);

    // New users today
    const newUsersToday = users.filter(u => {
      const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return createdAt >= today;
    }).length;

    // New users this week
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = users.filter(u => {
      const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return createdAt >= weekAgo;
    }).length;

    const stats = {
      users: {
        total: users.length,
        clients,
        drivers,
        employees,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
      },
      rides: {
        total: rides.length,
        completed: completedRides,
        cancelled: cancelledRides,
        active: activeRides,
        todayCompleted: todayRides.length,
        todayRevenue,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisWeek: 0, // TODO: Calculate
        thisMonth: 0, // TODO: Calculate
      },
      drivers: {
        online: onlineDrivers,
        offline: offlineDrivers,
        busy: busyDrivers,
        pendingVerification,
      },
    };

    return sendSuccess(res, stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    return serverError(res, 'Failed to get dashboard stats', 'فشل الحصول على إحصائيات لوحة التحكم');
  }
});

/**
 * GET /stats
 * Get admin statistics (alias for dashboard)
 */
app.get('/stats', async (req: Request, res: Response) => {
  // Redirect to dashboard
  req.url = '/dashboard';
  return app._router.handle(req, res, () => {});
});

/**
 * GET /users
 * List all users with filters
 */
app.get('/users', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { role, status, limit = '20', cursor } = req.query;

    let query = db.collection(USERS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (role) {
      query = query.where('role', '==', role);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    if (cursor) {
      const cursorDoc = await db.collection(USERS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, users, {
      total: users.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return serverError(res, 'Failed to get users', 'فشل الحصول على المستخدمين');
  }
});

/**
 * GET /users/:userId
 * Get user by ID
 */
app.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    return sendSuccess(res, { ...userDoc.data(), id: userDoc.id });
  } catch (error) {
    console.error('Get user error:', error);
    return serverError(res);
  }
});

/**
 * PUT /users/:userId
 * Update user
 */
app.put('/users/:userId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;
    const updates = req.body;

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    // Don't allow updating certain fields
    delete updates.userId;
    delete updates.createdAt;
    updates.updatedAt = new Date();

    await userRef.update(updates);

    return sendSuccess(res, null, 'User updated successfully', 'تم تحديث المستخدم بنجاح');
  } catch (error) {
    console.error('Update user error:', error);
    return serverError(res);
  }
});

/**
 * POST /users/:userId/suspend
 * Suspend user
 */
app.post('/users/:userId/suspend', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    const { userId } = req.params;
    const { reason } = req.body;

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    await userRef.update({
      status: 'suspended',
      suspendReason: reason,
      suspendedAt: new Date(),
      updatedAt: new Date(),
    });

    // Disable Firebase Auth account
    try {
      await auth.updateUser(userId, { disabled: true });
    } catch (authError) {
      console.error('Failed to disable auth account:', authError);
    }

    return sendSuccess(res, null, 'User suspended successfully', 'تم تعليق المستخدم بنجاح');
  } catch (error) {
    console.error('Suspend user error:', error);
    return serverError(res);
  }
});

/**
 * POST /users/:userId/activate
 * Activate user
 */
app.post('/users/:userId/activate', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    const { userId } = req.params;

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    await userRef.update({
      status: 'active',
      suspendReason: null,
      suspendedAt: null,
      updatedAt: new Date(),
    });

    // Enable Firebase Auth account
    try {
      await auth.updateUser(userId, { disabled: false });
    } catch (authError) {
      console.error('Failed to enable auth account:', authError);
    }

    return sendSuccess(res, null, 'User activated successfully', 'تم تنشيط المستخدم بنجاح');
  } catch (error) {
    console.error('Activate user error:', error);
    return serverError(res);
  }
});

/**
 * GET /drivers
 * List drivers with filters
 */
app.get('/drivers', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { verificationStatus, driverStatus, limit = '20', cursor } = req.query;

    let query = db.collection(USERS_COLLECTION)
      .where('role', '==', 'driver')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (verificationStatus) {
      query = query.where('verificationStatus', '==', verificationStatus);
    }
    if (driverStatus) {
      query = query.where('driverStatus', '==', driverStatus);
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
 * POST /drivers/:driverId/verify
 * Verify driver
 */
app.post('/drivers/:driverId/verify', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    const { driverId } = req.params;

    const driverRef = db.collection(USERS_COLLECTION).doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    await driverRef.update({
      verificationStatus: 'approved',
      status: 'active',
      verifiedAt: new Date(),
      verifiedBy: req.user!.uid,
      updatedAt: new Date(),
    });

    // Update custom claims
    try {
      await auth.setCustomUserClaims(driverId, {
        role: 'driver',
        status: 'active',
      });
    } catch (authError) {
      console.error('Failed to update custom claims:', authError);
    }

    return sendSuccess(res, null, 'Driver verified successfully', 'تم التحقق من السائق بنجاح');
  } catch (error) {
    console.error('Verify driver error:', error);
    return serverError(res);
  }
});

/**
 * POST /drivers/:driverId/reject
 * Reject driver verification
 */
app.post('/drivers/:driverId/reject', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;
    const { reason } = req.body;

    const driverRef = db.collection(USERS_COLLECTION).doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return notFound(res, 'Driver not found', 'السائق غير موجود');
    }

    await driverRef.update({
      verificationStatus: 'rejected',
      rejectionReason: reason || 'Documents not approved',
      rejectedAt: new Date(),
      rejectedBy: req.user!.uid,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Driver verification rejected', 'تم رفض التحقق من السائق');
  } catch (error) {
    console.error('Reject driver error:', error);
    return serverError(res);
  }
});

/**
 * GET /rides
 * List rides with filters
 */
app.get('/rides', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { status, limit = '20', cursor } = req.query;

    let query = db.collection(RIDES_COLLECTION)
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
 * GET /settings
 * Get global settings
 */
app.get('/settings', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();

    const settingsDoc = await db.collection(SETTINGS_COLLECTION).doc('global').get();

    return sendSuccess(res, settingsDoc.exists ? settingsDoc.data() : {});
  } catch (error) {
    console.error('Get settings error:', error);
    return serverError(res);
  }
});

/**
 * PUT /settings
 * Update global settings
 */
app.put('/settings', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const settings = req.body;

    await db.collection(SETTINGS_COLLECTION).doc('global').set({
      ...settings,
      updatedAt: new Date(),
      updatedBy: req.user!.uid,
    }, { merge: true });

    return sendSuccess(res, null, 'Settings updated successfully', 'تم تحديث الإعدادات بنجاح');
  } catch (error) {
    console.error('Update settings error:', error);
    return serverError(res);
  }
});

/**
 * GET /support-tickets
 * List support tickets
 */
app.get('/support-tickets', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { status, priority, limit = '20', cursor } = req.query;

    let query = db.collection(SUPPORT_TICKETS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', '==', status);
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }

    if (cursor) {
      const cursorDoc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, tickets, {
      total: tickets.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    return serverError(res);
  }
});

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'admin' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Admin service listening on port ${PORT}`);
});

export default app;
