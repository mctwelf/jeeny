const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Driver Location Updated Function
functions.cloudEvent('onDriverLocationUpdated', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Driver location updated:', JSON.stringify(data));
  
  try {
    const { driverId, location, timestamp, heading, speed } = data;
    
    // Update driver's current location
    await db.collection('drivers').doc(driverId).update({
      currentLocation: new admin.firestore.GeoPoint(location.latitude, location.longitude),
      lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp(),
      heading: heading || null,
      speed: speed || null,
    });
    
    // Check if driver is on an active ride
    const activeRideQuery = await db.collection('rides')
      .where('driverId', '==', driverId)
      .where('status', 'in', ['accepted', 'arrived', 'in_progress'])
      .limit(1)
      .get();
    
    if (!activeRideQuery.empty) {
      const rideDoc = activeRideQuery.docs[0];
      await rideDoc.ref.update({
        driverLocation: new admin.firestore.GeoPoint(location.latitude, location.longitude),
        driverLocationUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log(`Updated location for driver ${driverId}`);
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
});

// Driver Status Changed Function
functions.cloudEvent('onDriverStatusChanged', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Driver status changed:', JSON.stringify(data));
  
  try {
    const { driverId, status, previousStatus } = data;
    
    // Update driver status
    await db.collection('drivers').doc(driverId).update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // If driver went offline, cancel pending requests
    if (status === 'offline' && previousStatus === 'online') {
      const pendingRequests = await db.collection('rideRequests')
        .where('driverId', '==', driverId)
        .where('status', '==', 'pending')
        .get();
      
      const batch = db.batch();
      pendingRequests.docs.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'cancelled',
          cancelReason: 'driver_went_offline',
        });
      });
      await batch.commit();
    }
    
    console.log(`Driver ${driverId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw error;
  }
});
