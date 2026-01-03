import * as functions from '@google-cloud/functions-framework';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface DriverLocationEvent {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  heading?: number;
  speed?: number;
}

interface DriverStatusEvent {
  driverId: string;
  status: 'online' | 'offline' | 'busy' | 'on_ride';
  previousStatus?: string;
  timestamp: string;
}

// Driver Location Updated Function
functions.cloudEvent('onDriverLocationUpdated', async (cloudEvent: any) => {
  const data = cloudEvent.data as DriverLocationEvent;
  
  console.log('Driver location updated:', JSON.stringify(data));
  
  try {
    const { driverId, location, timestamp, heading, speed } = data;
    
    // Update driver's current location in Firestore
    await db.collection('drivers').doc(driverId).update({
      currentLocation: new admin.firestore.GeoPoint(location.latitude, location.longitude),
      lastLocationUpdate: admin.firestore.FieldValue.serverTimestamp(),
      heading: heading || null,
      speed: speed || null,
    });
    
    // Store location history for analytics
    await db.collection('drivers').doc(driverId)
      .collection('locationHistory')
      .add({
        location: new admin.firestore.GeoPoint(location.latitude, location.longitude),
        timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
        heading,
        speed,
      });
    
    // Check if driver is on an active ride and update ride location
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
    
    console.log(`Successfully updated location for driver ${driverId}`);
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
});

// Driver Status Changed Function
functions.cloudEvent('onDriverStatusChanged', async (cloudEvent: any) => {
  const data = cloudEvent.data as DriverStatusEvent;
  
  console.log('Driver status changed:', JSON.stringify(data));
  
  try {
    const { driverId, status, previousStatus, timestamp } = data;
    
    // Update driver status in Firestore
    await db.collection('drivers').doc(driverId).update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Log status change for analytics
    await db.collection('drivers').doc(driverId)
      .collection('statusHistory')
      .add({
        status,
        previousStatus,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
      });
    
    // If driver went offline, cancel any pending ride requests
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
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
    
    console.log(`Successfully updated status for driver ${driverId} to ${status}`);
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw error;
  }
});
