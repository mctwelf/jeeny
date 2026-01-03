const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const pubsub = new PubSub();

// Ride Created Function
functions.cloudEvent('onRideCreated', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Ride created event received:', JSON.stringify(data));
  
  try {
    const rideId = data.rideId;
    const rideDoc = await db.collection('rides').doc(rideId).get();
    const ride = rideDoc.data();
    
    if (!ride) {
      console.error('Ride not found:', rideId);
      return;
    }
    
    // Find nearby available drivers
    const driversQuery = await db.collection('drivers')
      .where('status', '==', 'online')
      .where('isAvailable', '==', true)
      .limit(10)
      .get();
    
    // Send ride request to drivers
    for (const driverDoc of driversQuery.docs) {
      await pubsub.topic('ride-requests').publishMessage({
        json: {
          rideId,
          driverId: driverDoc.id,
          pickup: ride.pickup,
          dropoff: ride.dropoff,
          vehicleType: ride.vehicleType,
        },
      });
    }
    
    console.log(`Sent ride request to ${driversQuery.size} drivers`);
  } catch (error) {
    console.error('Error processing ride created:', error);
    throw error;
  }
});

// Ride Status Changed Function
functions.cloudEvent('onRideStatusChanged', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Ride status changed:', JSON.stringify(data));
  
  try {
    const { rideId, status, previousStatus } = data;
    
    // Update ride document
    await db.collection('rides').doc(rideId).update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Send notification to user
    const rideDoc = await db.collection('rides').doc(rideId).get();
    const ride = rideDoc.data();
    
    if (ride && ride.userId) {
      const userDoc = await db.collection('users').doc(ride.userId).get();
      const user = userDoc.data();
      
      if (user && user.fcmToken) {
        const messages = {
          accepted: { title: 'تم قبول طلبك', body: 'السائق في الطريق إليك' },
          arrived: { title: 'وصل السائق', body: 'السائق في انتظارك' },
          in_progress: { title: 'بدأت الرحلة', body: 'استمتع برحلتك' },
          completed: { title: 'انتهت الرحلة', body: 'شكراً لاستخدامك جيني' },
          cancelled: { title: 'تم إلغاء الرحلة', body: 'تم إلغاء طلبك' },
        };
        
        const msg = messages[status];
        if (msg) {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: msg,
            data: { rideId, status },
          });
        }
      }
    }
    
    console.log(`Ride ${rideId} status updated to ${status}`);
  } catch (error) {
    console.error('Error processing ride status change:', error);
    throw error;
  }
});
