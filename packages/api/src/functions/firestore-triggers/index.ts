import * as functions from '@google-cloud/functions-framework';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface UserCreatedEvent {
  value: {
    fields: {
      phoneNumber?: { stringValue: string };
      email?: { stringValue: string };
      displayName?: { stringValue: string };
      role?: { stringValue: string };
    };
  };
}

// User Created Trigger
functions.cloudEvent('onUserCreated', async (cloudEvent: any) => {
  console.log('User created event received:', JSON.stringify(cloudEvent));
  
  try {
    const data = cloudEvent.data as UserCreatedEvent;
    const documentPath = cloudEvent.subject?.replace('documents/', '') || '';
    const userId = documentPath.split('/').pop();
    
    if (!userId) {
      console.error('Could not extract userId from document path');
      return;
    }
    
    console.log(`Processing new user: ${userId}`);
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      console.error('User document not found');
      return;
    }
    
    // Create user profile with default settings
    await db.collection('userProfiles').doc(userId).set({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        language: 'ar',
        currency: 'MRU',
        notifications: {
          push: true,
          sms: true,
          email: false,
        },
      },
      stats: {
        totalRides: 0,
        totalSpent: 0,
        rating: 0,
        ratingCount: 0,
      },
    });
    
    // Send welcome notification
    if (userData.fcmToken) {
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: 'مرحباً بك في جيني!',
          body: 'شكراً لانضمامك إلينا. استمتع برحلاتك!',
        },
        data: {
          type: 'welcome',
          userId,
        },
      });
    }
    
    // Log analytics event
    await db.collection('analytics').doc('users').collection('signups').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: userData.signupSource || 'organic',
      platform: userData.platform || 'unknown',
    });
    
    console.log(`Successfully processed new user: ${userId}`);
  } catch (error) {
    console.error('Error processing user created event:', error);
    throw error;
  }
});
