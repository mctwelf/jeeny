/**
 * Jeeny Cities Service - Cloud Run
 *
 * Handles cities, neighborhoods, zones, and service areas.
 * المدن والأحياء والمناطق ومناطق الخدمة
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json());

const CITIES_COLLECTION = 'cities';
const NEIGHBORHOODS_COLLECTION = 'neighborhoods';
const ZONES_COLLECTION = 'zones';
const AIRPORTS_COLLECTION = 'airports';

// ==================== CITIES ====================

app.get('/cities', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { isActive = 'true', country, limit = '100' } = req.query;
    let query = db.collection(CITIES_COLLECTION).orderBy('name', 'asc').limit(parseInt(limit as string));
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (country) query = query.where('countryCode', '==', country);
    const snapshot = await query.get();
    const cities = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, cities);
  } catch (error) {
    console.error('Get cities error:', error);
    return serverError(res);
  }
});

app.post('/cities', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { name, nameAr, nameFr, code, country, countryCode, timezone, currency, bounds, center } = req.body;
    if (!name || !nameAr || !code || !countryCode) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const cityId = uuidv4();
    const now = new Date();
    const city = { cityId, name, nameAr, nameFr: nameFr || name, code: code.toUpperCase(), country: country || 'Mauritania', countryCode: countryCode.toUpperCase(), timezone: timezone || 'Africa/Nouakchott', currency: currency || 'MRU', bounds: bounds || null, center: center || null, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(CITIES_COLLECTION).doc(cityId).set(city);
    return sendSuccess(res, city, 'City created', 'تم إنشاء المدينة', 201);
  } catch (error) {
    console.error('Create city error:', error);
    return serverError(res);
  }
});

app.get('/cities/:cityId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const cityDoc = await db.collection(CITIES_COLLECTION).doc(req.params.cityId).get();
    if (!cityDoc.exists) return notFound(res, 'City not found', 'المدينة غير موجودة');
    const neighborhoodsSnapshot = await db.collection(NEIGHBORHOODS_COLLECTION).where('cityId', '==', req.params.cityId).where('isActive', '==', true).get();
    return sendSuccess(res, { ...cityDoc.data(), id: cityDoc.id, neighborhoods: neighborhoodsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
  } catch (error) {
    console.error('Get city error:', error);
    return serverError(res);
  }
});

app.put('/cities/:cityId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const cityRef = db.collection(CITIES_COLLECTION).doc(req.params.cityId);
    if (!(await cityRef.get()).exists) return notFound(res, 'City not found', 'المدينة غير موجودة');
    const allowedFields = ['name', 'nameAr', 'nameFr', 'timezone', 'currency', 'bounds', 'center', 'isActive'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    await cityRef.update(updates);
    return sendSuccess(res, null, 'City updated', 'تم تحديث المدينة');
  } catch (error) {
    console.error('Update city error:', error);
    return serverError(res);
  }
});


// ==================== NEIGHBORHOODS ====================

app.get('/neighborhoods', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, isActive = 'true', limit = '200' } = req.query;
    let query = db.collection(NEIGHBORHOODS_COLLECTION).orderBy('name', 'asc').limit(parseInt(limit as string));
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    const snapshot = await query.get();
    const neighborhoods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, neighborhoods);
  } catch (error) {
    console.error('Get neighborhoods error:', error);
    return serverError(res);
  }
});

app.post('/neighborhoods', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, name, nameAr, nameFr, bounds, center } = req.body;
    if (!cityId || !name || !nameAr) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const cityDoc = await db.collection(CITIES_COLLECTION).doc(cityId).get();
    if (!cityDoc.exists) return notFound(res, 'City not found', 'المدينة غير موجودة');
    const neighborhoodId = uuidv4();
    const now = new Date();
    const neighborhood = { neighborhoodId, cityId, name, nameAr, nameFr: nameFr || name, bounds: bounds || null, center: center || null, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(NEIGHBORHOODS_COLLECTION).doc(neighborhoodId).set(neighborhood);
    return sendSuccess(res, neighborhood, 'Neighborhood created', 'تم إنشاء الحي', 201);
  } catch (error) {
    console.error('Create neighborhood error:', error);
    return serverError(res);
  }
});

app.put('/neighborhoods/:neighborhoodId', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const neighborhoodRef = db.collection(NEIGHBORHOODS_COLLECTION).doc(req.params.neighborhoodId);
    if (!(await neighborhoodRef.get()).exists) return notFound(res, 'Neighborhood not found', 'الحي غير موجود');
    const allowedFields = ['name', 'nameAr', 'nameFr', 'bounds', 'center', 'isActive'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    await neighborhoodRef.update(updates);
    return sendSuccess(res, null, 'Neighborhood updated', 'تم تحديث الحي');
  } catch (error) {
    console.error('Update neighborhood error:', error);
    return serverError(res);
  }
});

// ==================== ZONES (Service Areas) ====================

app.get('/zones', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, type, isActive = 'true' } = req.query;
    let query = db.collection(ZONES_COLLECTION).orderBy('name', 'asc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    if (type) query = query.where('type', '==', type);
    const snapshot = await query.get();
    const zones = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, zones);
  } catch (error) {
    console.error('Get zones error:', error);
    return serverError(res);
  }
});

app.post('/zones', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, name, nameAr, type, polygon, surgeMultiplier, isServiceArea, notes } = req.body;
    if (!cityId || !name || !nameAr || !type) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const zoneId = uuidv4();
    const now = new Date();
    const zone = { zoneId, cityId, name, nameAr, type, polygon: polygon || [], surgeMultiplier: surgeMultiplier || 1.0, isServiceArea: isServiceArea !== false, notes, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(ZONES_COLLECTION).doc(zoneId).set(zone);
    return sendSuccess(res, zone, 'Zone created', 'تم إنشاء المنطقة', 201);
  } catch (error) {
    console.error('Create zone error:', error);
    return serverError(res);
  }
});

// ==================== AIRPORTS ====================

app.get('/airports', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { cityId, isActive = 'true' } = req.query;
    let query = db.collection(AIRPORTS_COLLECTION).orderBy('name', 'asc');
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (cityId) query = query.where('cityId', '==', cityId);
    const snapshot = await query.get();
    const airports = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendSuccess(res, airports);
  } catch (error) {
    console.error('Get airports error:', error);
    return serverError(res);
  }
});

app.post('/airports', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { name, nameAr, nameFr, code, cityId, location, address, terminals, meetingPoints, pickupSurcharge, dropoffSurcharge, waitingFeePerMinute, parkingInfo, parkingInfoAr } = req.body;
    if (!name || !nameAr || !code || !cityId || !location) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const airportId = uuidv4();
    const now = new Date();
    const airport = { airportId, name, nameAr, nameFr: nameFr || name, code: code.toUpperCase(), cityId, location, address: address || '', terminals: terminals || [], meetingPoints: meetingPoints || [], pickupSurcharge: pickupSurcharge || 0, dropoffSurcharge: dropoffSurcharge || 0, waitingFeePerMinute: waitingFeePerMinute || 0, parkingInfo, parkingInfoAr, isActive: true, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(AIRPORTS_COLLECTION).doc(airportId).set(airport);
    return sendSuccess(res, airport, 'Airport created', 'تم إنشاء المطار', 201);
  } catch (error) {
    console.error('Create airport error:', error);
    return serverError(res);
  }
});

app.get('/airports/:airportId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const airportDoc = await db.collection(AIRPORTS_COLLECTION).doc(req.params.airportId).get();
    if (!airportDoc.exists) return notFound(res, 'Airport not found', 'المطار غير موجود');
    return sendSuccess(res, { ...airportDoc.data(), id: airportDoc.id });
  } catch (error) {
    console.error('Get airport error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok', service: 'cities' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Cities service listening on port ${PORT}`));

export default app;
