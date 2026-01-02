/**
 * Firebase Authentication Middleware
 *
 * Verifies Firebase ID tokens and extracts user information.
 * Replaces AWS Cognito authorizer.
 */

import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../lib/firebase';
import { unauthorized } from '../lib/response';

export interface AuthenticatedUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  status?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware to verify Firebase ID token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      unauthorized(res, 'Missing or invalid authorization header', 'رأس التفويض مفقود أو غير صالح');
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      unauthorized(res, 'Missing token', 'الرمز مفقود');
      return;
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // Extract user info from token claims
    req.user = {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
      email: decodedToken.email,
      role: decodedToken.role as string | undefined,
      status: decodedToken.status as string | undefined,
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);

    if (error.code === 'auth/id-token-expired') {
      unauthorized(res, 'Token expired', 'انتهت صلاحية الرمز');
      return;
    }

    if (error.code === 'auth/id-token-revoked') {
      unauthorized(res, 'Token revoked', 'تم إلغاء الرمز');
      return;
    }

    unauthorized(res, 'Invalid token', 'رمز غير صالح');
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      next();
      return;
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
      email: decodedToken.email,
      role: decodedToken.role as string | undefined,
      status: decodedToken.status as string | undefined,
    };

    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

/**
 * Middleware to check user role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        messageAr: 'صلاحيات غير كافية',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check user status
 */
export const requireActiveStatus = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    unauthorized(res);
    return;
  }

  if (req.user.status === 'suspended') {
    res.status(403).json({
      success: false,
      error: 'Account suspended',
      messageAr: 'الحساب معلق',
    });
    return;
  }

  if (req.user.status === 'pending') {
    res.status(403).json({
      success: false,
      error: 'Account pending verification',
      messageAr: 'الحساب في انتظار التحقق',
    });
    return;
  }

  next();
};
