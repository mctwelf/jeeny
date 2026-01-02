/**
 * Jeeny Notifications Service - Cloud Run
 *
 * Handles notification operations using Firestore and Firebase Cloud Messaging.
 * Replaces AWS Lambda notifications handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb, admin } from '../../lib/firebase';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// Types
interface Notification {
  notificationId: string;
  userId: string;
  type: 'ride' | 'payment' | 'promo' | 'system' | 'chat';
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  rideUpdates: boolean;
  promotions: boolean;
  news: boolean;
}

// Routes

/**
 * GET /
 * Get user notifications
 */
app.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { unreadOnly, limit = '20', cursor } = req.query;

    let query = db.collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (unreadOnly === 'true') {
      query = query.where('isRead', '==', false);
    }

    if (cursor) {
      const cursorDoc = await db.collection(NOTIFICATIONS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Count unread
    const unreadSnapshot = await db.collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .count()
      .get();

    return sendSuccess(res, {
      notifications,
      unreadCount: unreadSnapshot.data().count,
      lastKey: lastDoc?.id || null,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return serverError(res, 'Failed to get notifications', 'فشل الحصول على الإشعارات');
  }
});

/**
 * GET /:notificationId
 * Get notification by ID
 */
app.get('/:notificationId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { notificationId } = req.params;
    const userId = req.user!.uid;

    const notificationDoc = await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).get();

    if (!notificationDoc.exists) {
      return notFound(res, 'Notification not found', 'الإشعار غير موجود');
    }

    const notification = notificationDoc.data();
    if (notification?.userId !== userId) {
      return unauthorized(res);
    }

    return sendSuccess(res, { ...notification, id: notificationDoc.id });
  } catch (error) {
    console.error('Get notification error:', error);
    return serverError(res);
  }
});

/**
 * PUT /:notificationId/read
 * Mark notification as read
 */
app.put('/:notificationId/read', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { notificationId } = req.params;
    const userId = req.user!.uid;

    const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return notFound(res, 'Notification not found', 'الإشعار غير موجود');
    }

    if (notificationDoc.data()?.userId !== userId) {
      return unauthorized(res);
    }

    await notificationRef.update({
      isRead: true,
      readAt: new Date(),
    });

    return sendSuccess(res, null, 'Notification marked as read', 'تم تحديد الإشعار كمقروء');
  } catch (error) {
    console.error('Mark as read error:', error);
    return serverError(res);
  }
});

/**
 * PUT /read-all
 * Mark all notifications as read
 */
app.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;

    const snapshot = await db.collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    const now = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true, readAt: now });
    });

    await batch.commit();

    return sendSuccess(res, null, `Marked ${snapshot.docs.length} notifications as read`, `تم تحديد ${snapshot.docs.length} إشعارات كمقروءة`);
  } catch (error) {
    console.error('Mark all as read error:', error);
    return serverError(res);
  }
});

/**
 * DELETE /:notificationId
 * Delete notification
 */
app.delete('/:notificationId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { notificationId } = req.params;
    const userId = req.user!.uid;

    const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return notFound(res, 'Notification not found', 'الإشعار غير موجود');
    }

    if (notificationDoc.data()?.userId !== userId) {
      return unauthorized(res);
    }

    await notificationRef.delete();

    return sendSuccess(res, null, 'Notification deleted', 'تم حذف الإشعار');
  } catch (error) {
    console.error('Delete notification error:', error);
    return serverError(res);
  }
});

/**
 * GET /settings
 * Get notification settings
 */
app.get('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    const defaultSettings: NotificationSettings = {
      userId,
      pushEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      rideUpdates: true,
      promotions: true,
      news: true,
    };

    return sendSuccess(res, userDoc.data()?.notificationSettings || defaultSettings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    return serverError(res);
  }
});

/**
 * PUT /settings
 * Update notification settings
 */
app.put('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { pushEnabled, smsEnabled, emailEnabled, rideUpdates, promotions, news } = req.body;

    const settings: NotificationSettings = {
      userId,
      pushEnabled: pushEnabled ?? true,
      smsEnabled: smsEnabled ?? true,
      emailEnabled: emailEnabled ?? true,
      rideUpdates: rideUpdates ?? true,
      promotions: promotions ?? true,
      news: news ?? true,
    };

    await db.collection(USERS_COLLECTION).doc(userId).update({
      notificationSettings: settings,
      updatedAt: new Date(),
    });

    return sendSuccess(res, settings, 'Notification settings updated', 'تم تحديث إعدادات الإشعارات');
  } catch (error) {
    console.error('Update notification settings error:', error);
    return serverError(res);
  }
});

/**
 * POST /device-token
 * Register device token for push notifications
 */
app.post('/device-token', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { token, platform, deviceId } = req.body;

    if (!token || !platform) {
      return badRequest(res, 'Token and platform are required', 'الرمز والمنصة مطلوبان');
    }

    const now = new Date();
    const deviceToken = {
      token,
      platform,
      deviceId,
      registeredAt: now,
    };

    // Get current tokens and add new one (avoiding duplicates)
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const currentTokens = userDoc.data()?.deviceTokens || [];
    const filteredTokens = currentTokens.filter((t: any) => t.token !== token);

    await db.collection(USERS_COLLECTION).doc(userId).update({
      deviceTokens: [...filteredTokens, deviceToken],
      updatedAt: now,
    });

    return sendSuccess(res, null, 'Device token registered', 'تم تسجيل رمز الجهاز');
  } catch (error) {
    console.error('Register device token error:', error);
    return serverError(res);
  }
});

/**
 * DELETE /device-token
 * Remove device token
 */
app.delete('/device-token', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { token } = req.body;

    if (!token) {
      return badRequest(res, 'Token is required', 'الرمز مطلوب');
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const currentTokens = userDoc.data()?.deviceTokens || [];
    const filteredTokens = currentTokens.filter((t: any) => t.token !== token);

    await db.collection(USERS_COLLECTION).doc(userId).update({
      deviceTokens: filteredTokens,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Device token removed', 'تم إزالة رمز الجهاز');
  } catch (error) {
    console.error('Remove device token error:', error);
    return serverError(res);
  }
});

/**
 * POST /send (internal/admin)
 * Send notification to user
 */
app.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    // Only allow admin or internal services
    if (req.user!.role !== 'admin' && req.user!.role !== 'service') {
      return unauthorized(res);
    }

    const db = getFirestoreDb();
    const { userId, type, title, titleAr, body, bodyAr, data } = req.body;

    if (!userId || !title || !body) {
      return badRequest(res, 'userId, title, and body are required', 'معرف المستخدم والعنوان والنص مطلوبة');
    }

    const notificationId = uuidv4();
    const now = new Date();

    const notification: Notification = {
      notificationId,
      userId,
      type: type || 'system',
      title,
      titleAr,
      body,
      bodyAr,
      data,
      isRead: false,
      createdAt: now,
    };

    await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).set(notification);

    // Send push notification via FCM
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const deviceTokens = userDoc.data()?.deviceTokens || [];

    if (deviceTokens.length > 0) {
      const tokens = deviceTokens.map((t: any) => t.token);

      try {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title,
            body,
          },
          data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
        });
      } catch (fcmError) {
        console.error('FCM send error:', fcmError);
        // Continue even if FCM fails
      }
    }

    return sendSuccess(res, notification, 'Notification sent', 'تم إرسال الإشعار', 201);
  } catch (error) {
    console.error('Send notification error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'notifications' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Notifications service listening on port ${PORT}`);
});

export default app;
