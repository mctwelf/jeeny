/**
 * Jeeny Pricing Service - Cloud Run
 *
 * Handles pricing rules, surge pricing, commissions, and fare calculations.
 * قواعد التسعير والتسعير الديناميكي والعمولات وحساب الأجرة
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { sendSuccess, badRequest, notFound, serverError } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json());

const PRICING_RULES_COLLECTION = 'pricing_rules';
const SURGE_PRICING_COLLECTION = 'surge_pricing';
const COMMISSIONS_COLLECTION = 'commissions';
const INTERCITY_PRICING_COLLECTION = 'intercity_pricing';
const HOURLY_PRICING_COLLECTION = 'hourly_pricing';
const DELIVERY_PRICING_COLLECTION = 'delivery_pricing';

// ==================== PRICING RULES ====================

app.get('/rules', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, vehicleType, rideType, isActive = 'true' } = req.query;
    let query = db.collection(PRICING_RULES_COLLECTION).orderBy('createdAt', 'desc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    if (vehicleCategory) query = query.where('vehicleCategory', '==', vehicleCategory);
    if (vehicleType) query = query.where('vehicleType', '==', vehicleType);
    if (rideType) query = query.where('rideType', '==', rideType);
    const snapshot = await query.get();
    const rules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, rules);
  } catch (error) {
    console.error('Get pricing rules error:', error);
    return serverError(res);
  }
});

app.post('/rules', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, vehicleType, rideType, baseFare, minimumFare, perKmRate, perMinuteRate, waitingPerMinuteRate, cancellationFee, bookingFee, peakHoursMultiplier, peakHoursStart, peakHoursEnd, nightMultiplier, nightStart, nightEnd } = req.body;
    if (!cityId || !vehicleCategory || !vehicleType || !rideType || baseFare === undefined || perKmRate === undefined) {
      return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    }
    const ruleId = uuidv4();
    const now = new Date();
    const rule = { ruleId, cityId, vehicleCategory, vehicleType, rideType, baseFare, minimumFare: minimumFare || baseFare, perKmRate, perMinuteRate: perMinuteRate || 0, waitingPerMinuteRate: waitingPerMinuteRate || 0, cancellationFee: cancellationFee || 0, bookingFee: bookingFee || 0, currency: 'MRU', peakHoursMultiplier: peakHoursMultiplier || 1.0, peakHoursStart: peakHoursStart || null, peakHoursEnd: peakHoursEnd || null, nightMultiplier: nightMultiplier || 1.0, nightStart: nightStart || null, nightEnd: nightEnd || null, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(PRICING_RULES_COLLECTION).doc(ruleId).set(rule);
    return sendSuccess(res, rule, 'Pricing rule created', 'تم إنشاء قاعدة التسعير', 201);
  } catch (error) {
    console.error('Create pricing rule error:', error);
    return serverError(res);
  }
});

app.put('/rules/:ruleId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const ruleRef = db.collection(PRICING_RULES_COLLECTION).doc(req.params.ruleId);
    if (!(await ruleRef.get()).exists) return notFound(res, 'Pricing rule not found', 'قاعدة التسعير غير موجودة');
    const allowedFields = ['baseFare', 'minimumFare', 'perKmRate', 'perMinuteRate', 'waitingPerMinuteRate', 'cancellationFee', 'bookingFee', 'peakHoursMultiplier', 'peakHoursStart', 'peakHoursEnd', 'nightMultiplier', 'nightStart', 'nightEnd', 'isActive'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    await ruleRef.update(updates);
    return sendSuccess(res, null, 'Pricing rule updated', 'تم تحديث قاعدة التسعير');
  } catch (error) {
    console.error('Update pricing rule error:', error);
    return serverError(res);
  }
});

// ==================== SURGE PRICING ====================

app.get('/surge', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, neighborhoodId, isActive = 'true' } = req.query;
    const now = new Date().toISOString();
    let query = db.collection(SURGE_PRICING_COLLECTION).orderBy('startTime', 'desc');
    if (isActive === 'true') {
      query = query.where('isActive', '==', true).where('endTime', '>=', now);
    }
    if (cityId) query = query.where('cityId', '==', cityId);
    if (neighborhoodId) query = query.where('neighborhoodId', '==', neighborhoodId);
    const snapshot = await query.get();
    const surges = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, surges);
  } catch (error) {
    console.error('Get surge pricing error:', error);
    return serverError(res);
  }
});

app.post('/surge', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, neighborhoodId, multiplier, reason, startTime, endTime } = req.body;
    if (!cityId || !multiplier || !startTime || !endTime) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    if (multiplier < 1 || multiplier > 5) return badRequest(res, 'Multiplier must be between 1 and 5', 'المضاعف يجب أن يكون بين 1 و 5');
    const surgeId = uuidv4();
    const now = new Date();
    const surge = { surgeId, cityId, neighborhoodId: neighborhoodId || null, multiplier, reason: reason || 'High demand', startTime, endTime, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(SURGE_PRICING_COLLECTION).doc(surgeId).set(surge);
    return sendSuccess(res, surge, 'Surge pricing created', 'تم إنشاء التسعير الديناميكي', 201);
  } catch (error) {
    console.error('Create surge pricing error:', error);
    return serverError(res);
  }
});

app.delete('/surge/:surgeId', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const surgeRef = db.collection(SURGE_PRICING_COLLECTION).doc(req.params.surgeId);
    if (!(await surgeRef.get()).exists) return notFound(res, 'Surge pricing not found', 'التسعير الديناميكي غير موجود');
    await surgeRef.update({ isActive: false, updatedAt: new Date() });
    return sendSuccess(res, null, 'Surge pricing deactivated', 'تم إلغاء التسعير الديناميكي');
  } catch (error) {
    console.error('Delete surge pricing error:', error);
    return serverError(res);
  }
});


// ==================== COMMISSIONS ====================

app.get('/commissions', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId, cityId, vehicleType, isActive = 'true' } = req.query;
    let query = db.collection(COMMISSIONS_COLLECTION).orderBy('effectiveFrom', 'desc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (driverId) query = query.where('driverId', '==', driverId);
    if (cityId) query = query.where('cityId', '==', cityId);
    if (vehicleType) query = query.where('vehicleType', '==', vehicleType);
    const snapshot = await query.get();
    const commissions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, commissions);
  } catch (error) {
    console.error('Get commissions error:', error);
    return serverError(res);
  }
});

app.post('/commissions', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId, cityId, vehicleType, percentage, effectiveFrom, effectiveTo } = req.body;
    if (percentage === undefined || !effectiveFrom) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    if (percentage < 0 || percentage > 100) return badRequest(res, 'Percentage must be between 0 and 100', 'النسبة يجب أن تكون بين 0 و 100');
    const commissionId = uuidv4();
    const now = new Date();
    const commission = { commissionId, driverId: driverId || null, cityId: cityId || null, vehicleType: vehicleType || null, percentage, effectiveFrom, effectiveTo: effectiveTo || null, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(COMMISSIONS_COLLECTION).doc(commissionId).set(commission);
    return sendSuccess(res, commission, 'Commission created', 'تم إنشاء العمولة', 201);
  } catch (error) {
    console.error('Create commission error:', error);
    return serverError(res);
  }
});

// ==================== FARE CALCULATION ====================

app.post('/calculate', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, vehicleType, rideType, distanceMeters, durationSeconds, pickupLocation, scheduledAt } = req.body;
    if (!cityId || !vehicleCategory || !vehicleType || !distanceMeters) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');

    // Get pricing rule
    const rulesSnapshot = await db.collection(PRICING_RULES_COLLECTION)
      .where('cityId', '==', cityId)
      .where('vehicleCategory', '==', vehicleCategory)
      .where('vehicleType', '==', vehicleType)
      .where('rideType', '==', rideType || 'STANDARD')
      .where('isActive', '==', true)
      .limit(1).get();

    if (rulesSnapshot.empty) return notFound(res, 'No pricing rule found', 'لا توجد قاعدة تسعير');
    const rule = rulesSnapshot.docs[0].data();

    // Calculate base fare
    const distanceKm = distanceMeters / 1000;
    const durationMin = (durationSeconds || 0) / 60;
    let fare = rule.baseFare + (distanceKm * rule.perKmRate) + (durationMin * rule.perMinuteRate);

    // Check for surge pricing
    let surgeMultiplier = 1.0;
    const now = new Date().toISOString();
    const surgeSnapshot = await db.collection(SURGE_PRICING_COLLECTION)
      .where('cityId', '==', cityId)
      .where('isActive', '==', true)
      .where('startTime', '<=', now)
      .where('endTime', '>=', now)
      .limit(1).get();

    if (!surgeSnapshot.empty) {
      surgeMultiplier = surgeSnapshot.docs[0].data().multiplier;
      fare *= surgeMultiplier;
    }

    // Check for time-based multipliers
    const currentHour = new Date().getHours();
    if (rule.peakHoursStart && rule.peakHoursEnd) {
      const peakStart = parseInt(rule.peakHoursStart.split(':')[0]);
      const peakEnd = parseInt(rule.peakHoursEnd.split(':')[0]);
      if (currentHour >= peakStart && currentHour < peakEnd) {
        fare *= rule.peakHoursMultiplier || 1.0;
      }
    }
    if (rule.nightStart && rule.nightEnd) {
      const nightStart = parseInt(rule.nightStart.split(':')[0]);
      const nightEnd = parseInt(rule.nightEnd.split(':')[0]);
      if (currentHour >= nightStart || currentHour < nightEnd) {
        fare *= rule.nightMultiplier || 1.0;
      }
    }

    // Apply minimum fare
    fare = Math.max(fare, rule.minimumFare);

    // Add booking fee
    fare += rule.bookingFee || 0;

    return sendSuccess(res, {
      baseFare: rule.baseFare,
      distanceFare: Math.round(distanceKm * rule.perKmRate),
      timeFare: Math.round(durationMin * rule.perMinuteRate),
      bookingFee: rule.bookingFee || 0,
      surgeMultiplier,
      estimatedFare: Math.round(fare),
      minimumFare: rule.minimumFare,
      currency: 'MRU',
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes: Math.round(durationMin),
    });
  } catch (error) {
    console.error('Calculate fare error:', error);
    return serverError(res);
  }
});

// ==================== INTERCITY PRICING ====================

app.get('/intercity', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { routeId, vehicleCategory, isActive = 'true' } = req.query;
    let query = db.collection(INTERCITY_PRICING_COLLECTION).orderBy('createdAt', 'desc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (routeId) query = query.where('routeId', '==', routeId);
    if (vehicleCategory) query = query.where('vehicleCategory', '==', vehicleCategory);
    const snapshot = await query.get();
    const pricing = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, pricing);
  } catch (error) {
    console.error('Get intercity pricing error:', error);
    return serverError(res);
  }
});

app.post('/intercity', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { routeId, vehicleCategory, vehicleType, pricePerSeat, privateVehiclePrice, packagePricePerKg } = req.body;
    if (!routeId || !vehicleCategory || !vehicleType || !pricePerSeat) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const pricingId = uuidv4();
    const now = new Date();
    const pricing = { pricingId, routeId, vehicleCategory, vehicleType, pricePerSeat, privateVehiclePrice: privateVehiclePrice || pricePerSeat * 4, packagePricePerKg: packagePricePerKg || 0, currency: 'MRU', isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(INTERCITY_PRICING_COLLECTION).doc(pricingId).set(pricing);
    return sendSuccess(res, pricing, 'Intercity pricing created', 'تم إنشاء تسعير بين المدن', 201);
  } catch (error) {
    console.error('Create intercity pricing error:', error);
    return serverError(res);
  }
});

// ==================== HOURLY PRICING ====================

app.get('/hourly', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, isActive = 'true' } = req.query;
    let query = db.collection(HOURLY_PRICING_COLLECTION).orderBy('createdAt', 'desc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    if (vehicleCategory) query = query.where('vehicleCategory', '==', vehicleCategory);
    const snapshot = await query.get();
    const pricing = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, pricing);
  } catch (error) {
    console.error('Get hourly pricing error:', error);
    return serverError(res);
  }
});

app.post('/hourly', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, vehicleType, hourlyRate, minimumHours, extraKmRate, includedKmPerHour } = req.body;
    if (!cityId || !vehicleCategory || !vehicleType || !hourlyRate) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const pricingId = uuidv4();
    const now = new Date();
    const pricing = { pricingId, cityId, vehicleCategory, vehicleType, hourlyRate, minimumHours: minimumHours || 1, extraKmRate: extraKmRate || 0, includedKmPerHour: includedKmPerHour || 20, currency: 'MRU', isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(HOURLY_PRICING_COLLECTION).doc(pricingId).set(pricing);
    return sendSuccess(res, pricing, 'Hourly pricing created', 'تم إنشاء تسعير بالساعة', 201);
  } catch (error) {
    console.error('Create hourly pricing error:', error);
    return serverError(res);
  }
});

// ==================== DELIVERY PRICING ====================

app.get('/delivery', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, packageSize, isActive = 'true' } = req.query;
    let query = db.collection(DELIVERY_PRICING_COLLECTION).orderBy('createdAt', 'desc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    if (vehicleCategory) query = query.where('vehicleCategory', '==', vehicleCategory);
    if (packageSize) query = query.where('packageSize', '==', packageSize);
    const snapshot = await query.get();
    const pricing = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, pricing);
  } catch (error) {
    console.error('Get delivery pricing error:', error);
    return serverError(res);
  }
});

app.post('/delivery', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, vehicleCategory, packageSize, baseFare, perKmRate, weightSurchargePerKg, fragileItemSurcharge, cashOnDeliverySurcharge } = req.body;
    if (!cityId || !vehicleCategory || !packageSize || !baseFare) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const pricingId = uuidv4();
    const now = new Date();
    const pricing = { pricingId, cityId, vehicleCategory, packageSize, baseFare, perKmRate: perKmRate || 0, weightSurchargePerKg: weightSurchargePerKg || 0, fragileItemSurcharge: fragileItemSurcharge || 0, cashOnDeliverySurcharge: cashOnDeliverySurcharge || 0, currency: 'MRU', isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(DELIVERY_PRICING_COLLECTION).doc(pricingId).set(pricing);
    return sendSuccess(res, pricing, 'Delivery pricing created', 'تم إنشاء تسعير التوصيل', 201);
  } catch (error) {
    console.error('Create delivery pricing error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok', service: 'pricing' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Pricing service listening on port ${PORT}`));

export default app;
