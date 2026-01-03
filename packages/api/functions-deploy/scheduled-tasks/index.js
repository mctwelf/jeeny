const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Scheduled Tasks Function (HTTP triggered by Cloud Scheduler)
functions.http('scheduledTasks', async (req, res) => {
  const taskType = req.query.task || req.body.task;
  console.log('Scheduled task triggered:', taskType);
  
  try {
    switch (taskType) {
      case 'cleanup_expired_rides':
        await cleanupExpiredRides();
        break;
      case 'daily_analytics':
        await generateDailyAnalytics();
        break;
      case 'driver_rating_update':
        await updateDriverRatings();
        break;
      default:
        console.log('Unknown task type:', taskType);
    }
    
    res.status(200).send({ success: true, task: taskType });
  } catch (error) {
    console.error('Error running scheduled task:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

async function cleanupExpiredRides() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const expiredRides = await db.collection('rides')
    .where('status', '==', 'pending')
    .where('createdAt', '<', thirtyMinutesAgo)
    .get();
  
  const batch = db.batch();
  expiredRides.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      expiredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  
  await batch.commit();
  console.log(`Cleaned up ${expiredRides.size} expired rides`);
}

async function generateDailyAnalytics() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Count rides
  const ridesQuery = await db.collection('rides')
    .where('createdAt', '>=', yesterday)
    .where('createdAt', '<', today)
    .get();
  
  const completedRides = ridesQuery.docs.filter(d => d.data().status === 'completed');
  const cancelledRides = ridesQuery.docs.filter(d => d.data().status === 'cancelled');
  
  // Calculate revenue
  const totalRevenue = completedRides.reduce((sum, doc) => sum + (doc.data().fare || 0), 0);
  
  // Store analytics
  await db.collection('analytics').doc('daily').collection('reports').add({
    date: yesterday,
    totalRides: ridesQuery.size,
    completedRides: completedRides.length,
    cancelledRides: cancelledRides.length,
    totalRevenue,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`Generated analytics for ${yesterday.toISOString().split('T')[0]}`);
}

async function updateDriverRatings() {
  const driversQuery = await db.collection('drivers').get();
  
  for (const driverDoc of driversQuery.docs) {
    const ratingsQuery = await db.collection('rides')
      .where('driverId', '==', driverDoc.id)
      .where('driverRating', '>', 0)
      .orderBy('driverRating')
      .orderBy('completedAt', 'desc')
      .limit(100)
      .get();
    
    if (ratingsQuery.size > 0) {
      const ratings = ratingsQuery.docs.map(d => d.data().driverRating);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      
      await driverDoc.ref.update({
        rating: Math.round(avgRating * 10) / 10,
        totalRatings: ratingsQuery.size,
      });
    }
  }
  
  console.log(`Updated ratings for ${driversQuery.size} drivers`);
}
