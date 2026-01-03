const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const pubsub = new PubSub();

// Process Payment Function
functions.cloudEvent('processPayment', async (cloudEvent) => {
  const data = cloudEvent.data;
  console.log('Process payment event:', JSON.stringify(data));
  
  try {
    const { rideId, userId, amount, paymentMethod, currency } = data;
    
    // Create payment record
    const paymentRef = await db.collection('payments').add({
      rideId,
      userId,
      amount,
      currency: currency || 'MRU',
      paymentMethod,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Process based on payment method
    let paymentResult;
    
    switch (paymentMethod) {
      case 'cash':
        paymentResult = { success: true, status: 'completed' };
        break;
      case 'bankily':
      case 'masrvi':
      case 'sedad':
        // TODO: Integrate with mobile money providers
        paymentResult = { success: true, status: 'completed' };
        break;
      case 'card':
        // TODO: Integrate with card payment provider
        paymentResult = { success: true, status: 'completed' };
        break;
      default:
        paymentResult = { success: false, status: 'failed', error: 'Unknown payment method' };
    }
    
    // Update payment status
    await paymentRef.update({
      status: paymentResult.status,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: paymentResult.error || null,
    });
    
    // Update ride payment status
    await db.collection('rides').doc(rideId).update({
      paymentStatus: paymentResult.status,
      paymentId: paymentRef.id,
    });
    
    // Send notification
    await pubsub.topic('notifications').publishMessage({
      json: {
        userId,
        title: paymentResult.success ? 'تم الدفع بنجاح' : 'فشل الدفع',
        body: paymentResult.success 
          ? `تم خصم ${amount} ${currency || 'MRU'} بنجاح`
          : 'حدث خطأ أثناء معالجة الدفع',
        data: { rideId, paymentId: paymentRef.id },
      },
    });
    
    console.log(`Payment ${paymentRef.id} processed: ${paymentResult.status}`);
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
});
