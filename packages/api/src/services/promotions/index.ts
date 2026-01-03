/**
 * Jeeny Promotions Service - Cloud Run
 *
 * Handles promotion operations using Firestore.
 * Replaces AWS Lambda promotions handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { sendSuccess, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const PROMOTIONS_COLLECTION = 'promotions';
const USERS_COLLECTION = 'users';

// Types
interface Promotion {
  promotionId: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: 'percentage' | 'fixed' | 'free_ride';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  status: 'active' | 'inactive' | 'expired';
  applicableVehicleTypes?: string[];
  applicableCities?: string[];
  isFirstRideOnly?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Routes

/**
 * GET /
 * Get all active promotions
 */
app.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const now = new Date();

    const snapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('status', '==', 'active')
      .where('validFrom', '<=', now)
      .where('validUntil', '>=', now)
      .get();

    const promotions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return sendSuccess(res, promotions);
  } catch (error) {
    console.error('Get promotions error:', error);
    return serverError(res, 'Failed to get promotions', 'فشل الحصول على العروض');
  }
});

/**
 * GET /:promotionId
 * Get promotion by ID
 */
app.get('/:promotionId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { promotionId } = req.params;

    const promotionDoc = await db.collection(PROMOTIONS_COLLECTION).doc(promotionId).get();

    if (!promotionDoc.exists) {
      return notFound(res, 'Promotion not found', 'العرض غير موجود');
    }

    return sendSuccess(res, { ...promotionDoc.data(), id: promotionDoc.id });
  } catch (error) {
    console.error('Get promotion error:', error);
    return serverError(res);
  }
});

/**
 * POST /validate
 * Validate a promo code
 */
app.post('/validate', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { code, orderAmount, vehicleType, cityId } = req.body;

    if (!code) {
      return badRequest(res, 'Promo code is required', 'رمز الترويج مطلوب');
    }

    // Find promotion by code
    const snapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return notFound(res, 'Invalid promo code', 'رمز الترويج غير صالح');
    }

    const promotionDoc = snapshot.docs[0];
    const promotion = promotionDoc.data() as Promotion;
    const now = new Date();

    // Check if promotion is active
    if (promotion.status !== 'active') {
      return badRequest(res, 'This promotion is no longer active', 'هذا العرض لم يعد نشطاً');
    }

    // Check validity period
    const validFrom = promotion.validFrom instanceof Date ? promotion.validFrom : (promotion.validFrom as any).toDate();
    const validUntil = promotion.validUntil instanceof Date ? promotion.validUntil : (promotion.validUntil as any).toDate();

    if (now < validFrom || now > validUntil) {
      return badRequest(res, 'This promotion has expired', 'انتهت صلاحية هذا العرض');
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return badRequest(res, 'This promotion has reached its usage limit', 'وصل هذا العرض إلى حد الاستخدام');
    }

    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount && orderAmount < promotion.minOrderAmount) {
      return badRequest(res, `Minimum order amount is ${promotion.minOrderAmount} MRU`, `الحد الأدنى للطلب هو ${promotion.minOrderAmount} أوقية`);
    }

    // Check vehicle type applicability
    if (promotion.applicableVehicleTypes && promotion.applicableVehicleTypes.length > 0) {
      if (vehicleType && !promotion.applicableVehicleTypes.includes(vehicleType)) {
        return badRequest(res, 'This promotion is not valid for the selected vehicle type', 'هذا العرض غير صالح لنوع السيارة المحدد');
      }
    }

    // Check city applicability
    if (promotion.applicableCities && promotion.applicableCities.length > 0) {
      if (cityId && !promotion.applicableCities.includes(cityId)) {
        return badRequest(res, 'This promotion is not valid in your city', 'هذا العرض غير صالح في مدينتك');
      }
    }

    // Check first ride only
    if (promotion.isFirstRideOnly) {
      const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
      const totalRides = userDoc.data()?.totalRides || 0;
      if (totalRides > 0) {
        return badRequest(res, 'This promotion is only valid for first ride', 'هذا العرض صالح للرحلة الأولى فقط');
      }
    }

    // Calculate discount
    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = orderAmount ? (orderAmount * promotion.value) / 100 : 0;
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else if (promotion.type === 'fixed') {
      discount = promotion.value;
    }

    return sendSuccess(res, {
      valid: true,
      promotionId: promotion.promotionId,
      code: promotion.code,
      name: promotion.name,
      nameAr: promotion.nameAr,
      type: promotion.type,
      value: promotion.value,
      discount: Math.round(discount),
      maxDiscount: promotion.maxDiscount,
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    return serverError(res, 'Failed to validate promo code', 'فشل التحقق من رمز الترويج');
  }
});

/**
 * POST /apply
 * Apply a promo code to a ride
 */
app.post('/apply', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { code, rideId, orderAmount } = req.body;

    if (!code || !rideId) {
      return badRequest(res, 'Promo code and ride ID are required', 'رمز الترويج ومعرف الرحلة مطلوبان');
    }

    // Validate the promo code first
    const snapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return notFound(res, 'Invalid promo code', 'رمز الترويج غير صالح');
    }

    const promotionDoc = snapshot.docs[0];
    const promotion = promotionDoc.data() as Promotion;

    // Calculate discount
    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = orderAmount ? (orderAmount * promotion.value) / 100 : 0;
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else if (promotion.type === 'fixed') {
      discount = promotion.value;
    }

    // Increment usage count
    await promotionDoc.ref.update({
      usageCount: FieldValue.increment(1),
      updatedAt: new Date(),
    });

    return sendSuccess(res, {
      applied: true,
      promotionId: promotion.promotionId,
      discount: Math.round(discount),
    }, 'Promo code applied successfully', 'تم تطبيق رمز الترويج بنجاح');
  } catch (error) {
    console.error('Apply promo code error:', error);
    return serverError(res, 'Failed to apply promo code', 'فشل تطبيق رمز الترويج');
  }
});

/**
 * POST / (admin only)
 * Create a new promotion
 */
app.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const {
      code,
      name,
      nameAr,
      description,
      descriptionAr,
      type,
      value,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableVehicleTypes,
      applicableCities,
      isFirstRideOnly,
    } = req.body;

    if (!code || !name || !type || !value || !validFrom || !validUntil) {
      return badRequest(res, 'Missing required fields', 'الحقول المطلوبة مفقودة');
    }

    // Check if code already exists
    const existingSnapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return badRequest(res, 'Promo code already exists', 'رمز الترويج موجود بالفعل');
    }

    const promotionId = uuidv4();
    const now = new Date();

    const promotion: Promotion = {
      promotionId,
      code: code.toUpperCase(),
      name,
      nameAr: nameAr || name,
      description: description || '',
      descriptionAr: descriptionAr || description || '',
      type,
      value,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      usageCount: 0,
      userUsageLimit,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      status: 'active',
      applicableVehicleTypes,
      applicableCities,
      isFirstRideOnly,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(PROMOTIONS_COLLECTION).doc(promotionId).set(promotion);

    return sendSuccess(res, promotion, 'Promotion created successfully', 'تم إنشاء العرض بنجاح', 201);
  } catch (error) {
    console.error('Create promotion error:', error);
    return serverError(res, 'Failed to create promotion', 'فشل إنشاء العرض');
  }
});

/**
 * PUT /:promotionId (admin only)
 * Update a promotion
 */
app.put('/:promotionId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { promotionId } = req.params;
    const updates = req.body;

    const promotionRef = db.collection(PROMOTIONS_COLLECTION).doc(promotionId);
    const promotionDoc = await promotionRef.get();

    if (!promotionDoc.exists) {
      return notFound(res, 'Promotion not found', 'العرض غير موجود');
    }

    // Don't allow updating certain fields
    delete updates.promotionId;
    delete updates.usageCount;
    delete updates.createdAt;

    if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
    if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
    updates.updatedAt = new Date();

    await promotionRef.update(updates);

    return sendSuccess(res, null, 'Promotion updated successfully', 'تم تحديث العرض بنجاح');
  } catch (error) {
    console.error('Update promotion error:', error);
    return serverError(res);
  }
});

/**
 * DELETE /:promotionId (admin only)
 * Deactivate a promotion
 */
app.delete('/:promotionId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { promotionId } = req.params;

    const promotionRef = db.collection(PROMOTIONS_COLLECTION).doc(promotionId);
    const promotionDoc = await promotionRef.get();

    if (!promotionDoc.exists) {
      return notFound(res, 'Promotion not found', 'العرض غير موجود');
    }

    await promotionRef.update({
      status: 'inactive',
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Promotion deactivated', 'تم إلغاء تنشيط العرض');
  } catch (error) {
    console.error('Delete promotion error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'promotions' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Promotions service listening on port ${PORT}`);
});

export default app;
