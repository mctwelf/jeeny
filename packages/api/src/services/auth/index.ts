/**
 * Jeeny Auth Service - Cloud Run
 *
 * Handles authentication operations using Firebase Auth.
 * Replaces AWS Lambda auth handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirebaseAuth, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendError, badRequest, notFound, conflict, serverError } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface RegisterRequest {
  phoneNumber: string;
  userType: 'client' | 'driver' | 'employee';
  preferredLanguage?: string;
  referralCode?: string;
}

interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
  sessionInfo: string;
}

// Helper functions
const formatPhoneNumber = (phone: string): string => {
  if (!phone.startsWith('+')) {
    if (phone.startsWith('00')) {
      return '+' + phone.slice(2);
    }
    return '+222' + phone; // Mauritania country code
  }
  return phone;
};

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
 * POST /register
 * Register a new user with phone number
 */
app.post('/register', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, userType, preferredLanguage = 'ar', referralCode } = req.body as RegisterRequest;

    if (!phoneNumber || !userType) {
      return badRequest(res, 'Phone number and user type are required', 'رقم الهاتف ونوع المستخدم مطلوبان');
    }

    if (!['client', 'driver', 'employee'].includes(userType)) {
      return badRequest(res, 'Invalid user type', 'نوع المستخدم غير صالح');
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    // Check if user already exists
    try {
      await auth.getUserByPhoneNumber(formattedPhone);
      return conflict(res, 'Phone number already registered', 'رقم الهاتف مسجل بالفعل');
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user in Firebase Auth
    const userId = uuidv4();
    const userReferralCode = generateReferralCode();

    const userRecord = await auth.createUser({
      uid: userId,
      phoneNumber: formattedPhone,
      disabled: false,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userId, {
      role: userType,
      status: 'pending',
      preferredLanguage,
    });

    // Create user document in Firestore
    const now = new Date();
    const userDoc = {
      userId,
      phoneNumber: formattedPhone,
      userType,
      status: 'pending',
      preferredLanguage,
      referralCode: userReferralCode,
      referredBy: referralCode || null,
      walletBalance: 0,
      rating: 0,
      totalRides: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').doc(userId).set(userDoc);

    // Publish user created event
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'user_registered',
      userId,
      phoneNumber: formattedPhone,
      userType,
    });

    return sendSuccess(
      res,
      {
        userId,
        phoneNumber: formattedPhone,
        referralCode: userReferralCode,
      },
      'Registration successful. Please verify your phone number.',
      'تم التسجيل بنجاح. يرجى التحقق من رقم هاتفك.',
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return serverError(res, 'Registration failed', 'فشل التسجيل');
  }
});

/**
 * POST /send-otp
 * Send OTP to phone number for verification
 * Note: In production, this would use Firebase Phone Auth on the client side
 */
app.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return badRequest(res, 'Phone number is required', 'رقم الهاتف مطلوب');
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // In production, OTP is sent via Firebase Phone Auth on client
    // This endpoint is for server-side OTP if needed (e.g., for testing)
    
    // Publish SMS event
    await publishMessage(TOPICS.SMS, {
      type: 'otp',
      phoneNumber: formattedPhone,
      // OTP would be generated and stored securely
    });

    return sendSuccess(
      res,
      { phoneNumber: formattedPhone },
      'OTP sent successfully',
      'تم إرسال رمز التحقق بنجاح'
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return serverError(res, 'Failed to send OTP', 'فشل إرسال رمز التحقق');
  }
});

/**
 * POST /verify-otp
 * Verify OTP and activate user account
 */
app.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, idToken } = req.body;

    if (!phoneNumber || !idToken) {
      return badRequest(res, 'Phone number and ID token are required', 'رقم الهاتف ورمز التعريف مطلوبان');
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    // Verify the ID token from client-side phone auth
    const decodedToken = await auth.verifyIdToken(idToken);

    if (decodedToken.phone_number !== formattedPhone) {
      return badRequest(res, 'Phone number mismatch', 'رقم الهاتف غير متطابق');
    }

    // Update user status to active
    await auth.setCustomUserClaims(decodedToken.uid, {
      ...decodedToken,
      status: 'active',
    });

    // Update Firestore
    await db.collection('users').doc(decodedToken.uid).update({
      status: 'active',
      phoneVerifiedAt: new Date(),
      updatedAt: new Date(),
    });

    return sendSuccess(
      res,
      { verified: true, userId: decodedToken.uid },
      'Phone number verified successfully',
      'تم التحقق من رقم الهاتف بنجاح'
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);

    if (error.code === 'auth/id-token-expired') {
      return badRequest(res, 'Token expired', 'انتهت صلاحية الرمز');
    }

    return serverError(res, 'Verification failed', 'فشل التحقق');
  }
});

/**
 * POST /refresh-token
 * Refresh Firebase ID token
 * Note: Token refresh is typically handled client-side with Firebase SDK
 */
app.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    // Firebase handles token refresh client-side
    // This endpoint can be used for custom token generation if needed
    return sendSuccess(
      res,
      { message: 'Use Firebase SDK for token refresh' },
      'Token refresh should be done client-side',
      'يجب تحديث الرمز من جانب العميل'
    );
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return serverError(res, 'Token refresh failed', 'فشل تحديث الرمز');
  }
});

/**
 * POST /logout
 * Revoke user's refresh tokens
 */
app.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const auth = getFirebaseAuth();
    
    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(req.user!.uid);

    return sendSuccess(
      res,
      null,
      'Logged out successfully',
      'تم تسجيل الخروج بنجاح'
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return serverError(res, 'Logout failed', 'فشل تسجيل الخروج');
  }
});

/**
 * POST /create-custom-token
 * Create a custom token for admin users (email/password auth)
 */
app.post('/create-custom-token', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return badRequest(res, 'Email and password are required', 'البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    // Get user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return notFound(res, 'User not found', 'المستخدم غير موجود');
      }
      throw error;
    }

    // Verify this is an admin/employee user
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'employee'].includes(userData.userType)) {
      return sendError(res, 'Email login only available for admin users', 403, 'تسجيل الدخول بالبريد الإلكتروني متاح فقط للمسؤولين');
    }

    // Create custom token
    const customToken = await auth.createCustomToken(userRecord.uid, {
      role: userData.userType,
      status: userData.status,
    });

    return sendSuccess(
      res,
      { customToken },
      'Custom token created',
      'تم إنشاء الرمز المخصص'
    );
  } catch (error: any) {
    console.error('Create custom token error:', error);
    return serverError(res, 'Failed to create token', 'فشل إنشاء الرمز');
  }
});

/**
 * GET /me
 * Get current user info from token
 */
app.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(req.user!.uid).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    return sendSuccess(res, userDoc.data());
  } catch (error: any) {
    console.error('Get me error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});

export default app;
