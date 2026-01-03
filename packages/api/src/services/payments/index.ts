/**
 * Jeeny Payments Service - Cloud Run
 *
 * Handles payment operations using Firestore.
 * Replaces AWS Lambda payments handler.
 * Integrates with local payment providers (Bankily, Sedad, Masrvi).
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';

// Types
interface PaymentMethod {
  methodId: string;
  userId: string;
  type: 'wallet' | 'bankily' | 'sedad' | 'masrvi' | 'cash';
  name: string;
  details: {
    phoneNumber?: string;
    accountNumber?: string;
    lastFour?: string;
  };
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  transactionId: string;
  userId: string;
  type: 'payment' | 'topup' | 'withdrawal' | 'refund' | 'earning' | 'tip' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  provider?: string;
  providerTransactionId?: string;
  rideId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Routes

/**
 * GET /methods
 * Get user's payment methods
 */
app.get('/methods', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;

    const snapshot = await db.collection(PAYMENT_METHODS_COLLECTION)
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const methods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // Add default wallet and cash methods
    const defaultMethods: PaymentMethod[] = [
      {
        methodId: 'wallet',
        userId,
        type: 'wallet',
        name: 'Jeeny Wallet',
        details: {},
        isDefault: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        methodId: 'cash',
        userId,
        type: 'cash',
        name: 'Cash',
        details: {},
        isDefault: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return sendSuccess(res, [...defaultMethods, ...methods]);
  } catch (error) {
    console.error('Get payment methods error:', error);
    return serverError(res, 'Failed to get payment methods', 'فشل الحصول على طرق الدفع');
  }
});

/**
 * POST /methods
 * Add a new payment method
 */
app.post('/methods', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { type, name, details, isDefault = false } = req.body;

    if (!type || !['bankily', 'sedad', 'masrvi'].includes(type)) {
      return badRequest(res, 'Invalid payment method type', 'نوع طريقة الدفع غير صالح');
    }

    if (!details?.phoneNumber && !details?.accountNumber) {
      return badRequest(res, 'Phone number or account number is required', 'رقم الهاتف أو رقم الحساب مطلوب');
    }

    const methodId = uuidv4();
    const now = new Date();

    const paymentMethod: PaymentMethod = {
      methodId,
      userId,
      type,
      name: name || type.charAt(0).toUpperCase() + type.slice(1),
      details: {
        phoneNumber: details.phoneNumber,
        accountNumber: details.accountNumber,
        lastFour: details.phoneNumber?.slice(-4) || details.accountNumber?.slice(-4),
      },
      isDefault,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(PAYMENT_METHODS_COLLECTION).doc(methodId).set(paymentMethod);

    return sendSuccess(res, paymentMethod, 'Payment method added successfully', 'تمت إضافة طريقة الدفع بنجاح', 201);
  } catch (error) {
    console.error('Add payment method error:', error);
    return serverError(res, 'Failed to add payment method', 'فشل إضافة طريقة الدفع');
  }
});

/**
 * DELETE /methods/:methodId
 * Remove a payment method
 */
app.delete('/methods/:methodId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { methodId } = req.params;
    const userId = req.user!.uid;

    const methodDoc = await db.collection(PAYMENT_METHODS_COLLECTION).doc(methodId).get();

    if (!methodDoc.exists || methodDoc.data()?.userId !== userId) {
      return notFound(res, 'Payment method not found', 'طريقة الدفع غير موجودة');
    }

    await db.collection(PAYMENT_METHODS_COLLECTION).doc(methodId).update({
      status: 'inactive',
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Payment method removed', 'تمت إزالة طريقة الدفع');
  } catch (error) {
    console.error('Remove payment method error:', error);
    return serverError(res);
  }
});

/**
 * GET /wallet
 * Get wallet balance
 */
app.get('/wallet', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;

    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    const user = userDoc.data();

    return sendSuccess(res, {
      userId,
      balance: user?.walletBalance || 0,
      currency: 'MRU',
      lastUpdated: user?.updatedAt || new Date(),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return serverError(res, 'Failed to get wallet', 'فشل الحصول على المحفظة');
  }
});

/**
 * POST /wallet/topup
 * Top up wallet
 */
app.post('/wallet/topup', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { amount, paymentMethod, providerDetails } = req.body;

    if (!amount || amount <= 0) {
      return badRequest(res, 'Valid amount is required', 'مبلغ صالح مطلوب');
    }

    if (!paymentMethod || !['bankily', 'sedad', 'masrvi'].includes(paymentMethod)) {
      return badRequest(res, 'Valid payment method is required', 'طريقة دفع صالحة مطلوبة');
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'topup',
      amount,
      currency: 'MRU',
      status: 'pending',
      paymentMethod,
      provider: paymentMethod,
      description: `Wallet top-up via ${paymentMethod}`,
      metadata: providerDetails,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).set(transaction);

    // TODO: Integrate with actual payment provider
    // For now, simulate immediate success
    const simulatedSuccess = true;

    if (simulatedSuccess) {
      // Update wallet balance
      await db.collection(USERS_COLLECTION).doc(userId).update({
        walletBalance: FieldValue.increment(amount),
        updatedAt: now,
      });

      // Update transaction status
      await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).update({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      });

      transaction.status = 'completed';
      transaction.completedAt = now;
    }

    return sendSuccess(res, transaction, 'Wallet topped up successfully', 'تم شحن المحفظة بنجاح');
  } catch (error) {
    console.error('Top up wallet error:', error);
    return serverError(res, 'Failed to top up wallet', 'فشل شحن المحفظة');
  }
});

/**
 * POST /wallet/withdraw
 * Withdraw from wallet
 */
app.post('/wallet/withdraw', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { amount, paymentMethod, withdrawalDetails } = req.body;

    if (!amount || amount <= 0) {
      return badRequest(res, 'Valid amount is required', 'مبلغ صالح مطلوب');
    }

    // Check wallet balance
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) {
      return notFound(res, 'User not found', 'المستخدم غير موجود');
    }

    const currentBalance = userDoc.data()?.walletBalance || 0;
    if (currentBalance < amount) {
      return badRequest(res, 'Insufficient wallet balance', 'رصيد المحفظة غير كافٍ');
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'withdrawal',
      amount: -amount,
      currency: 'MRU',
      status: 'pending',
      paymentMethod: paymentMethod || 'bank_transfer',
      description: 'Wallet withdrawal',
      metadata: withdrawalDetails,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).set(transaction);

    // Deduct from wallet
    await db.collection(USERS_COLLECTION).doc(userId).update({
      walletBalance: FieldValue.increment(-amount),
      updatedAt: now,
    });

    return sendSuccess(res, transaction, 'Withdrawal request submitted. Processing may take 1-3 business days.', 'تم تقديم طلب السحب. قد تستغرق المعالجة 1-3 أيام عمل.');
  } catch (error) {
    console.error('Withdraw from wallet error:', error);
    return serverError(res, 'Failed to process withdrawal', 'فشل معالجة السحب');
  }
});

/**
 * GET /history
 * Get transaction history
 */
app.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { type, status, limit = '20', cursor } = req.query;

    let query = db.collection(TRANSACTIONS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (type) {
      query = query.where('type', '==', type);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    if (cursor) {
      const cursorDoc = await db.collection(TRANSACTIONS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, transactions, {
      total: transactions.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    return serverError(res, 'Failed to get transaction history', 'فشل الحصول على سجل المعاملات');
  }
});

/**
 * GET /:paymentId
 * Get transaction by ID
 */
app.get('/:paymentId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { paymentId } = req.params;
    const userId = req.user!.uid;

    const transactionDoc = await db.collection(TRANSACTIONS_COLLECTION).doc(paymentId).get();

    if (!transactionDoc.exists) {
      return notFound(res, 'Transaction not found', 'المعاملة غير موجودة');
    }

    const transaction = transactionDoc.data();
    if (transaction?.userId !== userId && req.user!.role !== 'admin') {
      return unauthorized(res);
    }

    return sendSuccess(res, { ...transaction, id: transactionDoc.id });
  } catch (error) {
    console.error('Get transaction error:', error);
    return serverError(res);
  }
});

/**
 * POST /providers/bankily
 * Process Bankily payment
 */
app.post('/providers/bankily', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { amount, phoneNumber, rideId } = req.body;

    if (!amount || !phoneNumber) {
      return badRequest(res, 'Amount and phone number are required', 'المبلغ ورقم الهاتف مطلوبان');
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'bankily',
      provider: 'bankily',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Bankily payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).set(transaction);

    // Publish payment event
    await publishMessage(TOPICS.PAYMENTS, {
      type: 'payment_initiated',
      transactionId,
      provider: 'bankily',
      amount,
      userId,
    });

    return sendSuccess(res, {
      transactionId,
      status: 'processing',
      message: 'Please confirm the payment on your Bankily app',
      messageAr: 'يرجى تأكيد الدفع على تطبيق بنكيلي',
      checkStatusUrl: `/payments/${transactionId}`,
    });
  } catch (error) {
    console.error('Bankily payment error:', error);
    return serverError(res, 'Failed to process payment', 'فشل معالجة الدفع');
  }
});

/**
 * POST /providers/sedad
 * Process Sedad payment
 */
app.post('/providers/sedad', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { amount, phoneNumber, rideId } = req.body;

    if (!amount || !phoneNumber) {
      return badRequest(res, 'Amount and phone number are required', 'المبلغ ورقم الهاتف مطلوبان');
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'sedad',
      provider: 'sedad',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Sedad payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).set(transaction);

    await publishMessage(TOPICS.PAYMENTS, {
      type: 'payment_initiated',
      transactionId,
      provider: 'sedad',
      amount,
      userId,
    });

    return sendSuccess(res, {
      transactionId,
      status: 'processing',
      message: 'Please confirm the payment on your Sedad app',
      messageAr: 'يرجى تأكيد الدفع على تطبيق سداد',
      checkStatusUrl: `/payments/${transactionId}`,
    });
  } catch (error) {
    console.error('Sedad payment error:', error);
    return serverError(res, 'Failed to process payment', 'فشل معالجة الدفع');
  }
});

/**
 * POST /providers/masrvi
 * Process Masrvi payment
 */
app.post('/providers/masrvi', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { amount, phoneNumber, rideId } = req.body;

    if (!amount || !phoneNumber) {
      return badRequest(res, 'Amount and phone number are required', 'المبلغ ورقم الهاتف مطلوبان');
    }

    const transactionId = uuidv4();
    const now = new Date();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'masrvi',
      provider: 'masrvi',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Masrvi payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(TRANSACTIONS_COLLECTION).doc(transactionId).set(transaction);

    await publishMessage(TOPICS.PAYMENTS, {
      type: 'payment_initiated',
      transactionId,
      provider: 'masrvi',
      amount,
      userId,
    });

    return sendSuccess(res, {
      transactionId,
      status: 'processing',
      message: 'Please confirm the payment on your Masrvi app',
      messageAr: 'يرجى تأكيد الدفع على تطبيق مصرفي',
      checkStatusUrl: `/payments/${transactionId}`,
    });
  } catch (error) {
    console.error('Masrvi payment error:', error);
    return serverError(res, 'Failed to process payment', 'فشل معالجة الدفع');
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'payments' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Payments service listening on port ${PORT}`);
});

export default app;
