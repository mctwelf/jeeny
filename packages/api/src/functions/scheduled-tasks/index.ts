/**
 * Jeeny Scheduled Tasks Cloud Functions
 *
 * Handles scheduled/cron tasks using Cloud Scheduler.
 */

import { CloudEvent } from '@google-cloud/functions-framework';
import { initializeFirebase, getFirestoreDb, admin } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';

// Initialize Firebase
initializeFirebase();

interface ScheduledEvent {
  taskType: string;
  [key: string]: any;
}

interface PubSubMessage {
  data: string;
  attributes?: Record<string, string>;
}

/**
 * Daily cleanup task - runs at midnight
 */
export const dailyCleanup = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();
  const now = new Date();

  console.log('Running daily cleanup task');

  try {
    // Clean up expired ride requests (older than 24 hours)
    const expiredRidesSnapshot = await db.collection('rides')
      .where('status', '==', 'pending')
      .where('createdAt', '<', new Date(now.getTime() - 24 * 60 * 60 * 1000))
      .get();

    const batch = db.batch();
    expiredRidesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: now,
      });
    });
    await batch.commit();

    console.log(`Expired ${expiredRidesSnapshot.size} old ride requests`);

    // Clean up old notifications (older than 30 days)
    const oldNotificationsSnapshot = await db.collection('notifications')
      .where('createdAt', '<', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      .limit(500)
      .get();

    const notifBatch = db.batch();
    oldNotificationsSnapshot.docs.forEach(doc => {
      notifBatch.delete(doc.ref);
    });
    await notifBatch.commit();

    console.log(`Deleted ${oldNotificationsSnapshot.size} old notifications`);

  } catch (error) {
    console.error('Error in daily cleanup:', error);
    throw error;
  }
};

/**
 * Hourly stats aggregation
 */
export const hourlyStatsAggregation = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  console.log('Running hourly stats aggregation');

  try {
    // Count completed rides in the last hour
    const ridesSnapshot = await db.collection('rides')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', hourAgo)
      .get();

    // Calculate total revenue
    let totalRevenue = 0;
    ridesSnapshot.docs.forEach(doc => {
      totalRevenue += doc.data().actualFare || 0;
    });

    // Store hourly stats
    await db.collection('stats').doc(`hourly-${now.toISOString().slice(0, 13)}`).set({
      type: 'hourly',
      timestamp: now,
      completedRides: ridesSnapshot.size,
      totalRevenue,
      createdAt: now,
    });

    console.log(`Hourly stats: ${ridesSnapshot.size} rides, ${totalRevenue} MRU revenue`);

  } catch (error) {
    console.error('Error in hourly stats aggregation:', error);
    throw error;
  }
};

/**
 * Driver payout processing - runs weekly
 */
export const weeklyDriverPayouts = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();
  const now = new Date();

  console.log('Running weekly driver payouts');

  try {
    // Get all drivers with pending earnings
    const driversSnapshot = await db.collection('users')
      .where('role', '==', 'driver')
      .where('walletBalance', '>', 0)
      .get();

    for (const driverDoc of driversSnapshot.docs) {
      const driver = driverDoc.data();
      const balance = driver.walletBalance || 0;

      // Only process if balance is above minimum payout threshold
      if (balance >= 1000) { // 1000 MRU minimum
        // Create payout record
        await db.collection('payouts').add({
          driverId: driverDoc.id,
          amount: balance,
          status: 'pending',
          createdAt: now,
        });

        console.log(`Created payout for driver ${driverDoc.id}: ${balance} MRU`);
      }
    }

  } catch (error) {
    console.error('Error in weekly driver payouts:', error);
    throw error;
  }
};

/**
 * Inactive driver reminder - runs daily
 */
export const inactiveDriverReminder = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log('Running inactive driver reminder');

  try {
    // Find drivers who haven't been online in a week
    const inactiveDriversSnapshot = await db.collection('users')
      .where('role', '==', 'driver')
      .where('verificationStatus', '==', 'approved')
      .where('lastOnlineAt', '<', weekAgo)
      .limit(100)
      .get();

    for (const driverDoc of inactiveDriversSnapshot.docs) {
      await publishMessage(TOPICS.NOTIFICATIONS, {
        type: 'push',
        userId: driverDoc.id,
        title: 'نفتقدك!',
        titleEn: 'We miss you!',
        body: 'لم تكن متصلاً منذ فترة. عد للعمل واكسب المزيد!',
        bodyEn: 'You haven\'t been online for a while. Come back and earn more!',
        data: { type: 'inactive_reminder' },
      });
    }

    console.log(`Sent reminders to ${inactiveDriversSnapshot.size} inactive drivers`);

  } catch (error) {
    console.error('Error in inactive driver reminder:', error);
    throw error;
  }
};
