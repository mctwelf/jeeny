/**
 * Jeeny Notification Sender Cloud Function
 *
 * Handles notification events from Pub/Sub.
 * Sends push notifications via FCM and SMS via external provider.
 */

import { CloudEvent } from '@google-cloud/functions-framework';
import { initializeFirebase, getFirestoreDb, admin } from '../../lib/firebase';

// Initialize Firebase
initializeFirebase();

interface NotificationEvent {
  type: 'push' | 'sms' | 'email';
  userId?: string;
  userIds?: string[];
  title?: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  data?: Record<string, any>;
  phoneNumber?: string;
  email?: string;
  [key: string]: any;
}

interface PubSubMessage {
  data: string;
  attributes?: Record<string, string>;
}

/**
 * Process notification events
 */
export const sendNotification = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();

  try {
    const message = cloudEvent.data;
    if (!message?.data) {
      console.error('No data in message');
      return;
    }

    const eventData: NotificationEvent = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    console.log('Processing notification:', eventData.type);

    switch (eventData.type) {
      case 'push':
        await sendPushNotification(db, eventData);
        break;

      case 'sms':
        await sendSmsNotification(eventData);
        break;

      case 'email':
        await sendEmailNotification(eventData);
        break;

      default:
        console.log('Unknown notification type:', eventData.type);
    }
  } catch (error) {
    console.error('Error processing notification:', error);
    throw error;
  }
};

/**
 * Send push notification via FCM
 */
async function sendPushNotification(db: FirebaseFirestore.Firestore, event: NotificationEvent) {
  const { userId, userIds, title, titleEn, body, bodyEn, data } = event;

  const targetUserIds = userIds || (userId ? [userId] : []);

  if (targetUserIds.length === 0) {
    console.error('No target users for push notification');
    return;
  }

  for (const uid of targetUserIds) {
    try {
      // Get user's device tokens
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data();

      if (!userData?.deviceTokens || userData.deviceTokens.length === 0) {
        console.log(`No device tokens for user ${uid}`);
        continue;
      }

      // Check notification settings
      const settings = userData.notificationSettings;
      if (settings && !settings.pushEnabled) {
        console.log(`Push notifications disabled for user ${uid}`);
        continue;
      }

      const tokens = userData.deviceTokens.map((t: any) => t.token);

      // Determine language preference (default to Arabic)
      const language = userData.language || 'ar';
      const notificationTitle = language === 'ar' ? (title || titleEn) : (titleEn || title);
      const notificationBody = language === 'ar' ? body : (bodyEn || body);

      // Send FCM message
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'jeeny_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      console.log(`Push sent to user ${uid}: ${response.successCount} success, ${response.failureCount} failed`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          const updatedTokens = userData.deviceTokens.filter(
            (t: any) => !invalidTokens.includes(t.token)
          );
          await db.collection('users').doc(uid).update({
            deviceTokens: updatedTokens,
          });
          console.log(`Removed ${invalidTokens.length} invalid tokens for user ${uid}`);
        }
      }

      // Store notification in database
      await db.collection('notifications').add({
        notificationId: `notif-${uid}-${Date.now()}`,
        userId: uid,
        type: data?.type || 'system',
        title: notificationTitle,
        titleAr: title,
        body: notificationBody,
        bodyAr: body,
        data,
        isRead: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(`Error sending push to user ${uid}:`, error);
    }
  }
}

/**
 * Send SMS notification
 */
async function sendSmsNotification(event: NotificationEvent) {
  const { phoneNumber, body, userId } = event;

  let targetPhone = phoneNumber;

  // If no phone number provided, get from user
  if (!targetPhone && userId) {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(userId).get();
    targetPhone = userDoc.data()?.phoneNumber;
  }

  if (!targetPhone) {
    console.error('No phone number for SMS notification');
    return;
  }

  // Check notification settings
  if (userId) {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const settings = userDoc.data()?.notificationSettings;
    if (settings && !settings.smsEnabled) {
      console.log(`SMS notifications disabled for user ${userId}`);
      return;
    }
  }

  // TODO: Integrate with SMS provider (e.g., Twilio, local provider)
  // For Mauritania, consider local SMS gateways

  console.log(`SMS to ${targetPhone}: ${body}`);

  // Placeholder for actual SMS sending
  // await smsProvider.send({
  //   to: targetPhone,
  //   message: body,
  // });
}

/**
 * Send email notification
 */
async function sendEmailNotification(event: NotificationEvent) {
  const { email, title, body, userId } = event;

  let targetEmail = email;

  // If no email provided, get from user
  if (!targetEmail && userId) {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(userId).get();
    targetEmail = userDoc.data()?.email;
  }

  if (!targetEmail) {
    console.error('No email for notification');
    return;
  }

  // Check notification settings
  if (userId) {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const settings = userDoc.data()?.notificationSettings;
    if (settings && !settings.emailEnabled) {
      console.log(`Email notifications disabled for user ${userId}`);
      return;
    }
  }

  // TODO: Integrate with email provider (e.g., SendGrid, Mailgun)

  console.log(`Email to ${targetEmail}: ${title} - ${body}`);

  // Placeholder for actual email sending
  // await emailProvider.send({
  //   to: targetEmail,
  //   subject: title,
  //   html: body,
  // });
}

/**
 * Send bulk notification to all users or specific segment
 */
export const sendBulkNotification = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();

  try {
    const message = cloudEvent.data;
    if (!message?.data) {
      console.error('No data in message');
      return;
    }

    const eventData = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    const { title, titleEn, body, bodyEn, data, segment, topic } = eventData;

    if (topic) {
      // Send to FCM topic
      await admin.messaging().send({
        topic,
        notification: {
          title: title || titleEn,
          body,
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ) : undefined,
      });

      console.log(`Bulk notification sent to topic: ${topic}`);
    } else if (segment) {
      // Query users by segment
      let query = db.collection('users').where('notificationSettings.pushEnabled', '!=', false);

      if (segment === 'clients') {
        query = query.where('role', '==', 'client');
      } else if (segment === 'drivers') {
        query = query.where('role', '==', 'driver');
      }

      const snapshot = await query.get();
      const userIds = snapshot.docs.map(doc => doc.id);

      console.log(`Sending bulk notification to ${userIds.length} users in segment: ${segment}`);

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await sendPushNotification(db, {
          type: 'push',
          userIds: batch,
          title,
          titleEn,
          body,
          bodyEn,
          data,
        });
      }
    }
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    throw error;
  }
};
