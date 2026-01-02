const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// User Created Trigger
functions.cloudEvent('onUserCreated', async (cloudEvent) => {
  console.log('User created event:', JSON.stringify(cloudEvent));
  
  try {
    const documentPath = cloudEvent.subject?.replace('documents/', '') || '';
    const userId = documentPath.split('/').pop();
    
    if (!userId) {
      console.error('Could not extract userId');
      return;
    }
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      console.error('User not found:', userId);
      return;
    }
    
    // Create user profile
    await db.collection('userProfiles').doc(userId).set({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        language: 'ar',
        currency: 'MRU',
        notifications: { push: true, sms: true, email: false },
      },
      stats: { totalRides: 0, totalSpent: 0, rating: 0, ratingCount: 0 },
    });
    
    // Send welcome notification
    if (userData.fcmToken) {
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: 'مرحباً بك في جيني!',
          body: 'شكراً لانضمامك إلينا. استمتع برحلاتك!',
        },
        data: { type: 'welcome', userId },
      });
    }
    
    // Log signup
    await db.collection('analytics').doc('users').collection('signups').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: userData.signupSource || 'organic',
    });
    
    console.log(`Processed new user: ${userId}`);
  } catch (error) {
    console.error('Error processing user created:', error);
    throw error;
  }
});
