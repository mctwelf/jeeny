/**
 * Jeeny Users Service - Cloud Run
 *
 * Handles user CRUD operations using Firestore.
 * Replaces AWS Lambda users handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb, getFirebaseAuth } from '../../lib/firebase';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
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
const SAVED_PLACES_COLLECTION = 'savedPlaces';
const RIDES_COLLECTION = 'rides';

// Types
interface User {
  userId: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  gender?: string;
  birthdate?: string;
  userType: 'client' | 'driver' | 'employee' | 'admin';
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  preferredLanguage: string;
  cityId?: string;
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  rating: number;
  totalRides: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SavedPlace {
  placeId: string;
  userId: string;
  name: string;
  label: 'home' | 'work' | 'other';
  address: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

// Helper
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'JNY';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Routes

/**
 * GET /users
 * List all users (admin only)
 */
app.get('/', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { role, status, limit = '20', cursor } = req.query;

    let query = db.collection(USERS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (role) {
      query = query.where('userType', '==', role);
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
    console.error('List users error:', error);
    return serverError(res);
  }
});

/**
 * POST /users
 * Create a new user (admin only)
 */
app.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    const { phoneNumber, email, firstName, lastName, userType = 'client', preferredLanguage = 'ar' } = req.body;

    if (!phoneNumber) {
      return badRequest(res, 'Phone number is required', 'رقم الهاتف مطلوب');
    }

    const userId = uuidv4();
    const now = new Date();

    // Create in Firebase Auth
    await auth.createUser({
      uid: userId,
      phoneNumber,
      email,
      displayName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
    });

    await auth.setCustomUserClaims(userId, {
      role: userType,
      status: 'active',
    });

    // Create in Firestore
    const user: User = {
      userId,
      phoneNumber,
      email,
      firstName,
      lastName,
      userType,
      status: 'active',
      preferredLanguage,
      referralCode: generateReferralCode(),
      walletBalance: 0,
      rating: 0,
      totalRides: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(USERS_COLLECTION).doc(userId).set(user);

    return sendSuccess(res, user, 'User created successfully', 'تم إنشاء المستخدم بنجاح', 201);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'auth/phone-number-already-exists') {
      return badRequest(res, 'Phone number already exists', 'رقم الهاتف موجود بالفعل');
    }
    return serverError(res);
  }
});

/**
 * GET /me
 * Get current user
 */
app.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.user!.uid).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    return sendSuccess(res, { ...userDoc.data(), id: userDoc.id });
  } catch (error) {
    console.error('Get current user error:', error);
    return serverError(res);
  }
});

/**
 * PUT /me
 * Update current user
 */
app.put('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const allowedFields = ['email', 'firstName', 'lastName', 'profilePicture', 'gender', 'birthdate', 'preferredLanguage', 'cityId'];

    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await db.collection(USERS_COLLECTION).doc(req.user!.uid).update(updates);

    const updatedDoc = await db.collection(USERS_COLLECTION).doc(req.user!.uid).get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'User updated successfully', 'تم تحديث المستخدم بنجاح');
  } catch (error) {
    console.error('Update current user error:', error);
    return serverError(res);
  }
});

/**
 * GET /users/:userId
 * Get user by ID
 */
app.get('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    // Users can only view their own profile unless admin
    if (req.user!.uid !== userId && req.user!.role !== 'admin' && req.user!.role !== 'employee') {
      return unauthorized(res);
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    const userData = userDoc.data();
    
    // Remove sensitive fields for non-admin
    if (req.user!.role !== 'admin') {
      delete userData?.referredBy;
    }

    return sendSuccess(res, { ...userData, id: userDoc.id });
  } catch (error) {
    console.error('Get user error:', error);
    return serverError(res);
  }
});

/**
 * PUT /users/:userId
 * Update user
 */
app.put('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    // Users can only update their own profile unless admin
    if (req.user!.uid !== userId && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    const allowedFields = req.user!.role === 'admin'
      ? ['email', 'firstName', 'lastName', 'profilePicture', 'gender', 'birthdate', 'preferredLanguage', 'cityId', 'status', 'userType']
      : ['email', 'firstName', 'lastName', 'profilePicture', 'gender', 'birthdate', 'preferredLanguage', 'cityId'];

    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    await userRef.update(updates);

    // Update Firebase Auth custom claims if status changed
    if (updates.status || updates.userType) {
      const auth = getFirebaseAuth();
      await auth.setCustomUserClaims(userId, {
        role: updates.userType || userDoc.data()?.userType,
        status: updates.status || userDoc.data()?.status,
      });
    }

    const updatedDoc = await userRef.get();

    return sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id }, 'User updated successfully', 'تم تحديث المستخدم بنجاح');
  } catch (error) {
    console.error('Update user error:', error);
    return serverError(res);
  }
});

/**
 * DELETE /users/:userId
 * Soft delete user
 */
app.delete('/:userId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const auth = getFirebaseAuth();
    const { userId } = req.params;

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    // Soft delete
    await userRef.update({
      status: 'deleted',
      updatedAt: new Date(),
    });

    // Disable in Firebase Auth
    await auth.updateUser(userId, { disabled: true });

    return sendSuccess(res, null, 'User deleted successfully', 'تم حذف المستخدم بنجاح');
  } catch (error) {
    console.error('Delete user error:', error);
    return serverError(res);
  }
});


/**
 * GET /users/:userId/wallet
 * Get user wallet balance
 */
app.get('/:userId/wallet', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    if (req.user!.uid !== userId && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    const userData = userDoc.data();

    return sendSuccess(res, {
      userId,
      balance: userData?.walletBalance || 0,
      currency: 'MRU',
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return serverError(res);
  }
});

/**
 * GET /users/:userId/saved-places
 * Get user's saved places
 */
app.get('/:userId/saved-places', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    if (req.user!.uid !== userId && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    const snapshot = await db.collection(SAVED_PLACES_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const places = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return sendSuccess(res, places);
  } catch (error) {
    console.error('Get saved places error:', error);
    return serverError(res);
  }
});

/**
 * POST /users/:userId/saved-places
 * Add a saved place
 */
app.post('/:userId/saved-places', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;

    if (req.user!.uid !== userId) {
      return unauthorized(res);
    }

    const { name, label, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return badRequest(res, 'Name, address, latitude, and longitude are required', 'الاسم والعنوان وخط العرض وخط الطول مطلوبة');
    }

    const placeId = uuidv4();
    const now = new Date();

    const place: SavedPlace = {
      placeId,
      userId,
      name,
      label: label || 'other',
      address,
      latitude,
      longitude,
      createdAt: now,
    };

    await db.collection(SAVED_PLACES_COLLECTION).doc(placeId).set(place);

    return sendSuccess(res, place, 'Place saved successfully', 'تم حفظ المكان بنجاح', 201);
  } catch (error) {
    console.error('Add saved place error:', error);
    return serverError(res);
  }
});

/**
 * DELETE /users/:userId/saved-places/:placeId
 * Delete a saved place
 */
app.delete('/:userId/saved-places/:placeId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId, placeId } = req.params;

    if (req.user!.uid !== userId) {
      return unauthorized(res);
    }

    const placeRef = db.collection(SAVED_PLACES_COLLECTION).doc(placeId);
    const placeDoc = await placeRef.get();

    if (!placeDoc.exists) {
      return notFound(res, 'Place not found', 'المكان غير موجود');
    }

    if (placeDoc.data()?.userId !== userId) {
      return unauthorized(res);
    }

    await placeRef.delete();

    return sendSuccess(res, null, 'Place deleted successfully', 'تم حذف المكان بنجاح');
  } catch (error) {
    console.error('Delete saved place error:', error);
    return serverError(res);
  }
});

/**
 * GET /users/:userId/ride-history
 * Get user's ride history
 */
app.get('/:userId/ride-history', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { userId } = req.params;
    const { status, limit = '20', cursor } = req.query;

    if (req.user!.uid !== userId && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    let query = db.collection(RIDES_COLLECTION)
      .where('clientId', '==', userId)
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
    console.error('Get ride history error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'users' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Users service listening on port ${PORT}`);
});

export default app;
