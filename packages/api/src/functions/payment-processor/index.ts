/**
 * Jeeny Payment Processor Cloud Function
 *
 * Handles payment-related events from Pub/Sub.
 * Triggered by messages on jeeny-payments topic.
 */

import { CloudEvent } from '@google-cloud/functions-framework';
import { initializeFirebase, getFirestoreDb, admin } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';

// Initialize Firebase
initializeFirebase();

interface PaymentEvent {
  type: string;
  transactionId?: string;
  rideId?: string;
  clientId?: string;
  driverId?: string;
  amount: number;
  paymentMethod?: string;
  provider?: string;
  [key: string]: any;
}

interface PubSubMessage {
  data: string;
  attributes?: Record<string, string>;
}

/**
 * Process payment events
 */
export const processPaymentEvent = async (cloudEvent: CloudEvent<PubSubMessage>) => {
  const db = getFirestoreDb();

  try {
    const message = cloudEvent.data;
    if (!message?.data) {
      console.error('No data in message');
      return;
    }

    const eventData: PaymentEvent = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    console.log('Processing payment event:', eventData.type);

    switch (eventData.type) {
      case 'process_payment':
        await handleProcessPayment(db, eventData);
        break;

      case 'process_tip':
        await handleProcessTip(db, eventData);
        break;

      case 'payment_initiated':
        await handlePaymentInitiated(db, eventData);
        break;

      case 'payment_completed':
        await handlePaymentCompleted(db, eventData);
        break;

      case 'payment_failed':
        await handlePaymentFailed(db, eventData);
        break;

      case 'refund_requested':
        await handleRefundRequested(db, eventData);
        break;

      default:
        console.log('Unknown payment event type:', eventData.type);
    }
  } catch (error) {
    console.error('Error processing payment event:', error);
    throw error;
  }
};

/**
 * Process ride payment
 */
async function handleProcessPayment(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { rideId, clientId, driverId, amount, paymentMethod } = event;

  console.log(`Processing payment for ride ${rideId}: ${amount} MRU via ${paymentMethod}`);

  const now = new Date();
  const transactionId = `txn-${rideId}-${Date.now()}`;

  // Create transaction record
  const transaction = {
    transactionId,
    userId: clientId,
    type: 'payment',
    amount,
    currency: 'MRU',
    status: 'pending',
    paymentMethod,
    rideId,
    description: `Payment for ride ${rideId}`,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('transactions').doc(transactionId).set(transaction);

  if (paymentMethod === 'wallet') {
    // Process wallet payment
    const userDoc = await db.collection('users').doc(clientId!).get();
    const walletBalance = userDoc.data()?.walletBalance || 0;

    if (walletBalance >= amount) {
      // Deduct from wallet
      await db.collection('users').doc(clientId!).update({
        walletBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: now,
      });

      // Update transaction status
      await db.collection('transactions').doc(transactionId).update({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      });

      // Credit driver earnings
      const driverEarning = amount * 0.8; // 80% to driver
      await db.collection('users').doc(driverId!).update({
        walletBalance: admin.firestore.FieldValue.increment(driverEarning),
        totalEarnings: admin.firestore.FieldValue.increment(driverEarning),
        updatedAt: now,
      });

      // Create driver earning transaction
      await db.collection('transactions').add({
        transactionId: `earn-${rideId}-${Date.now()}`,
        userId: driverId,
        type: 'earning',
        amount: driverEarning,
        currency: 'MRU',
        status: 'completed',
        rideId,
        description: `Earning from ride ${rideId}`,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      });

      console.log(`Wallet payment completed for ride ${rideId}`);
    } else {
      // Insufficient balance
      await db.collection('transactions').doc(transactionId).update({
        status: 'failed',
        failureReason: 'Insufficient wallet balance',
        updatedAt: now,
      });

      // Notify client
      await publishMessage(TOPICS.NOTIFICATIONS, {
        type: 'push',
        userId: clientId,
        title: 'فشل الدفع',
        titleEn: 'Payment Failed',
        body: 'رصيد المحفظة غير كافٍ',
        bodyEn: 'Insufficient wallet balance',
        data: { type: 'payment_failed', rideId },
      });
    }
  } else if (paymentMethod === 'cash') {
    // Cash payment - mark as completed (driver collects)
    await db.collection('transactions').doc(transactionId).update({
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });

    // Credit driver earnings (minus commission)
    const driverEarning = amount * 0.8;
    await db.collection('users').doc(driverId!).update({
      totalEarnings: admin.firestore.FieldValue.increment(driverEarning),
      updatedAt: now,
    });

    console.log(`Cash payment recorded for ride ${rideId}`);
  } else {
    // Mobile money payment (Bankily, Sedad, Masrvi)
    // Mark as processing - will be updated by webhook
    await db.collection('transactions').doc(transactionId).update({
      status: 'processing',
      updatedAt: now,
    });

    console.log(`Mobile money payment initiated for ride ${rideId}`);
  }
}

/**
 * Process tip payment
 */
async function handleProcessTip(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { rideId, driverId, amount } = event;

  console.log(`Processing tip for ride ${rideId}: ${amount} MRU`);

  const now = new Date();

  // Credit tip to driver
  await db.collection('users').doc(driverId!).update({
    walletBalance: admin.firestore.FieldValue.increment(amount),
    totalEarnings: admin.firestore.FieldValue.increment(amount),
    updatedAt: now,
  });

  // Create tip transaction
  await db.collection('transactions').add({
    transactionId: `tip-${rideId}-${Date.now()}`,
    userId: driverId,
    type: 'tip',
    amount,
    currency: 'MRU',
    status: 'completed',
    rideId,
    description: `Tip from ride ${rideId}`,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  });

  // Notify driver
  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: driverId,
    title: 'بقشيش جديد!',
    titleEn: 'New Tip!',
    body: `حصلت على بقشيش ${amount} أوقية`,
    bodyEn: `You received a ${amount} MRU tip`,
    data: { type: 'tip_received', rideId, amount },
  });
}

/**
 * Handle payment initiated (mobile money)
 */
async function handlePaymentInitiated(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { transactionId, provider, amount, userId } = event;

  console.log(`Payment initiated: ${transactionId} via ${provider}`);

  // TODO: Call actual payment provider API
  // For now, simulate webhook callback after delay
}

/**
 * Handle payment completed (webhook callback)
 */
async function handlePaymentCompleted(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { transactionId, providerTransactionId } = event;

  console.log(`Payment completed: ${transactionId}`);

  const now = new Date();

  // Update transaction
  const transactionDoc = await db.collection('transactions').doc(transactionId!).get();
  if (!transactionDoc.exists) {
    console.error('Transaction not found:', transactionId);
    return;
  }

  const transaction = transactionDoc.data();

  await db.collection('transactions').doc(transactionId!).update({
    status: 'completed',
    providerTransactionId,
    completedAt: now,
    updatedAt: now,
  });

  // If it's a top-up, credit wallet
  if (transaction?.type === 'topup') {
    await db.collection('users').doc(transaction.userId).update({
      walletBalance: admin.firestore.FieldValue.increment(transaction.amount),
      updatedAt: now,
    });

    // Notify user
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'push',
      userId: transaction.userId,
      title: 'تم شحن المحفظة',
      titleEn: 'Wallet Topped Up',
      body: `تم إضافة ${transaction.amount} أوقية إلى محفظتك`,
      bodyEn: `${transaction.amount} MRU added to your wallet`,
      data: { type: 'topup_completed', amount: transaction.amount },
    });
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { transactionId, reason } = event;

  console.log(`Payment failed: ${transactionId}, reason: ${reason}`);

  const now = new Date();

  const transactionDoc = await db.collection('transactions').doc(transactionId!).get();
  if (!transactionDoc.exists) {
    console.error('Transaction not found:', transactionId);
    return;
  }

  const transaction = transactionDoc.data();

  await db.collection('transactions').doc(transactionId!).update({
    status: 'failed',
    failureReason: reason,
    updatedAt: now,
  });

  // Notify user
  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId: transaction?.userId,
    title: 'فشل الدفع',
    titleEn: 'Payment Failed',
    body: reason || 'حدث خطأ أثناء معالجة الدفع',
    bodyEn: reason || 'An error occurred while processing payment',
    data: { type: 'payment_failed', transactionId },
  });
}

/**
 * Handle refund request
 */
async function handleRefundRequested(db: FirebaseFirestore.Firestore, event: PaymentEvent) {
  const { transactionId, rideId, amount, userId, reason } = event;

  console.log(`Refund requested: ${amount} MRU for ride ${rideId}`);

  const now = new Date();
  const refundId = `refund-${rideId}-${Date.now()}`;

  // Create refund transaction
  await db.collection('transactions').doc(refundId).set({
    transactionId: refundId,
    userId,
    type: 'refund',
    amount,
    currency: 'MRU',
    status: 'pending',
    rideId,
    originalTransactionId: transactionId,
    description: `Refund for ride ${rideId}: ${reason}`,
    createdAt: now,
    updatedAt: now,
  });

  // Credit wallet
  await db.collection('users').doc(userId!).update({
    walletBalance: admin.firestore.FieldValue.increment(amount),
    updatedAt: now,
  });

  // Update refund status
  await db.collection('transactions').doc(refundId).update({
    status: 'completed',
    completedAt: now,
    updatedAt: now,
  });

  // Notify user
  await publishMessage(TOPICS.NOTIFICATIONS, {
    type: 'push',
    userId,
    title: 'تم استرداد المبلغ',
    titleEn: 'Refund Processed',
    body: `تم إضافة ${amount} أوقية إلى محفظتك`,
    bodyEn: `${amount} MRU has been added to your wallet`,
    data: { type: 'refund_completed', amount, rideId },
  });
}
