const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Send Push Notification Function
functions.cloudEvent('sendNotification', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Send notification event:', JSON.stringify(data));
  
  try {
    const { userId, title, body, data: notificationData } = data;
    
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user || !user.fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }
    
    // Send push notification
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: notificationData || {},
    });
    
    // Store notification in database
    await db.collection('users').doc(userId).collection('notifications').add({
      title,
      body,
      data: notificationData,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
});

// Send SMS Function
functions.cloudEvent('sendSms', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Send SMS event:', JSON.stringify(data));
  
  try {
    const { phoneNumber, message, userId } = data;
    
    // TODO: Integrate with SMS provider (Twilio, etc.)
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // Log SMS for tracking
    await db.collection('smsLogs').add({
      phoneNumber,
      message,
      userId,
      status: 'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`SMS logged for ${phoneNumber}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
});
