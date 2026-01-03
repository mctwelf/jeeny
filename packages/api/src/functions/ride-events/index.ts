/**
 * Jeeny Ride Events Cloud Function
 *
 * Handles ride-related events from Pub/Sub.
 * Triggered by messages on jeeny-ride-events topic.
 */

import { CloudEvent } from '@google-cloud/functions-framework';
import { initializeFirebase, getFirestoreDb, admin } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';

// Initialize Firebase
initializeFirebase();

interface RideEvent {
  type: string;
  rideId: string;
  clientId?: string;
  driverId?: string;
  [key: string]: any;
}

interface PubSubMessage {
  data: string;
  attributes?: Record<string, string>;
}

/**
 * Process ride events
 */
export const processRideEvent = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();

  try {
    const message = cloudEvent.data;
    if (!message?.data) {
      console.error('No data in message');
      return;
    }

    const eventData: RideEvent = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    console.log('Processing ride event:', eventData.type, eventData.rideId);

    switch (eventData.type) {
      case 'ride_requested':
        await handleRideRequested(db, eventData);
        break;

      case 'ride_accepted':
        await handleRideAccepted(db, eventData);
        break;

      case 'driver_arriving':
        await handleDriverArriving(db, eventData);
        break;

      case 'driver_arrived':
        await handleDriverArrived(db, eventData);
        break;

      case 'ride_started':
        await handleRideStarted(db, eventData);
        break;

      case 'ride_completed':
        await handleRideCompleted(db, eventData);
        break;

      case 'ride_cancelled':
        await handleRideCancelled(db, eventData);
        break;

      default:
        console.log('Unknown event type:', eventData.type);
    }
  } catch (error) {
    console.error('Error processing ride event:', error);
    throw error;
  }
};

/**
 * Handle ride requested - notify nearby drivers
 */
async function handleRideRequested(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, pickup, vehicleType } = event;

  // Find nearby online drivers
  const driversSnapshot = await db.collection('users')
    .where('role', '==', 'driver')
    .where('driverStatus', '==', 'online')
    .where('verificationStatus', '==', 'approved')
    .get();

  // Filter by vehicle type and proximity (simplified)
  const nearbyDrivers = driversSnapshot.docs.filter(doc => {
    const driver = doc.data();
    // TODO: Implement proper geospatial filtering
    return driver.vehicleId; // Has a vehicle
  });

  // Send push notifications to nearby drivers
  for (const driverDoc of nearbyDrivers.slice(0, 10)) {
    const driver = driverDoc.data();
    const tokens = driver.deviceTokens?.map((t: any) => t.token) || [];

    if (tokens.length > 0) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'طلب رحلة جديد',
            body: 'لديك طلب رحلة جديد قريب منك',
          },
          data: {
            type: 'ride_request',
            rideId,
          },
        });
      } catch (fcmError) {
        console.error('FCM error for driver:', driverDoc.id, fcmError);
      }
    }
  }

  console.log(`Notified ${nearbyDrivers.length} drivers about ride ${rideId}`);
}

/**
 * Handle ride accepted - notify client
 */
async function handleRideAccepted(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId } = event;

  // Get driver info
  const driverDoc = await db.collection('users').doc(driverId!).get();
  const driver = driverDoc.data();

  // Get vehicle info
  let vehicle = null;
  if (driver?.vehicleId) {
    const vehicleDoc = await db.collection('vehicles').doc(driver.vehicleId).get();
    vehicle = vehicleDoc.data();
  }

  // Send notification to client
  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: clientId,
    title: 'تم قبول رحلتك',
    titleEn: 'Ride Accepted',
    body: `السائق ${driver?.firstName || ''} في طريقه إليك`,
    bodyEn: `Driver ${driver?.firstName || ''} is on the way`,
    data: {
      type: 'ride_accepted',
      rideId,
      driverId,
      driverName: `${driver?.firstName || ''} ${driver?.lastName || ''}`,
      driverPhone: driver?.phoneNumber,
      driverRating: driver?.rating,
      vehicleMake: vehicle?.make,
      vehicleModel: vehicle?.model,
      vehicleColor: vehicle?.color,
      vehiclePlate: vehicle?.plateNumber,
    },
  });

  // Create in-app notification
  await db.collection('notifications').add({
    notificationId: `ride-accepted-${rideId}`,
    userId: clientId,
    type: 'ride',
    title: 'تم قبول رحلتك',
    titleAr: 'تم قبول رحلتك',
    body: `السائق ${driver?.firstName || ''} في طريقه إليك`,
    bodyAr: `السائق ${driver?.firstName || ''} في طريقه إليك`,
    data: { rideId, driverId },
    isRead: false,
    createdAt: new Date(),
  });
}

/**
 * Handle driver arriving
 */
async function handleDriverArriving(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId } = event;

  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: clientId,
    title: 'السائق في الطريق',
    titleEn: 'Driver Approaching',
    body: 'السائق يقترب من موقعك',
    bodyEn: 'Driver is approaching your location',
    data: { type: 'driver_arriving', rideId },
  });
}

/**
 * Handle driver arrived
 */
async function handleDriverArrived(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId } = event;

  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: clientId,
    title: 'السائق وصل',
    titleEn: 'Driver Arrived',
    body: 'السائق في انتظارك',
    bodyEn: 'Driver is waiting for you',
    data: { type: 'driver_arrived', rideId },
  });
}

/**
 * Handle ride started
 */
async function handleRideStarted(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId } = event;

  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: clientId,
    title: 'بدأت الرحلة',
    titleEn: 'Ride Started',
    body: 'استمتع برحلتك!',
    bodyEn: 'Enjoy your ride!',
    data: { type: 'ride_started', rideId },
  });
}

/**
 * Handle ride completed
 */
async function handleRideCompleted(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId, actualFare } = event;

  // Update driver stats
  await db.collection('users').doc(driverId!).update({
    totalRides: admin.firestore.FieldValue.increment(1),
    totalEarnings: admin.firestore.FieldValue.increment(actualFare * 0.8), // 80% to driver
    updatedAt: new Date(),
  });

  // Notify client
  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: clientId,
    title: 'اكتملت الرحلة',
    titleEn: 'Ride Completed',
    body: `المبلغ: ${actualFare} أوقية`,
    bodyEn: `Amount: ${actualFare} MRU`,
    data: { type: 'ride_completed', rideId, fare: actualFare },
  });

  // Create in-app notification
  await db.collection('notifications').add({
    notificationId: `ride-completed-${rideId}`,
    userId: clientId,
    type: 'ride',
    title: 'اكتملت الرحلة',
    body: `المبلغ: ${actualFare} أوقية. شكراً لاستخدامك جيني!`,
    data: { rideId, fare: actualFare },
    isRead: false,
    createdAt: new Date(),
  });
}

/**
 * Handle ride cancelled
 */
async function handleRideCancelled(db: FirebaseFirestore.Firestore, event: RideEvent) {
  const { rideId, clientId, driverId, cancelledBy, reason } = event;

  // Notify the other party
  const notifyUserId = cancelledBy === 'client' ? driverId : clientId;

  if (notifyUserId) {
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'push',
      userId: notifyUserId,
      title: 'تم إلغاء الرحلة',
      titleEn: 'Ride Cancelled',
      body: cancelledBy === 'client' ? 'قام العميل بإلغاء الرحلة' : 'قام السائق بإلغاء الرحلة',
      bodyEn: cancelledBy === 'client' ? 'Client cancelled the ride' : 'Driver cancelled the ride',
      data: { type: 'ride_cancelled', rideId, reason },
    });
  }
}
