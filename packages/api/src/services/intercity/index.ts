/**
 * Jeeny Intercity Service - Cloud Run
 *
 * Handles intercity routes, trips, and bookings.
 * المسارات والرحلات والحجوزات بين المدن
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json());

const ROUTES_COLLECTION = 'intercity_routes';
const TRIPS_COLLECTION = 'intercity_trips';
const BOOKINGS_COLLECTION = 'intercity_bookings';
const USERS_COLLECTION = 'users';
const CITIES_COLLECTION = 'cities';

type TripStatus = 'SCHEDULED' | 'OPEN_FOR_BOOKING' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';

// ==================== ROUTES ====================

app.get('/routes', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { fromCityId, toCityId, isActive = 'true', limit = '50', cursor } = req.query;
    let query = db.collection(ROUTES_COLLECTION).orderBy('name', 'asc').limit(parseInt(limit as string));
    if (isActive === 'true') query = query.where('isActive', '==', true);
    if (fromCityId) query = query.where('fromCityId', '==', fromCityId);
    if (toCityId) query = query.where('toCityId', '==', toCityId);
    if (cursor) {
      const cursorDoc = await db.collection(ROUTES_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const routes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendPaginated(res, routes, { total: routes.length, page: 1, limit: parseInt(limit as string), hasMore: snapshot.docs.length === parseInt(limit as string), nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id });
  } catch (error) {
    console.error('Get routes error:', error);
    return serverError(res);
  }
});

app.post('/routes', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { fromCityId, toCityId, name, nameAr, nameFr, distance, estimatedDuration, intermediateStops, basePricePerPerson, basePricePrivate, pricePerKg, availableVehicleTypes, hasFixedSchedule, fixedDepartureTimes } = req.body;
    if (!fromCityId || !toCityId || !name || !nameAr || !basePricePerPerson) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const [fromCity, toCity] = await Promise.all([db.collection(CITIES_COLLECTION).doc(fromCityId).get(), db.collection(CITIES_COLLECTION).doc(toCityId).get()]);
    if (!fromCity.exists || !toCity.exists) return notFound(res, 'City not found', 'المدينة غير موجودة');
    const routeId = uuidv4();
    const now = new Date();
    const route = { routeId, fromCityId, toCityId, name, nameAr, nameFr: nameFr || name, distance: distance || 0, estimatedDuration: estimatedDuration || 0, intermediateStops: intermediateStops || [], basePricePerPerson, basePricePrivate: basePricePrivate || basePricePerPerson * 4, pricePerKg: pricePerKg || 0, currency: 'MRU', availableVehicleTypes: availableVehicleTypes || ['ECONOMY', 'COMFORT'], hasFixedSchedule: hasFixedSchedule || false, fixedDepartureTimes: fixedDepartureTimes || [], isActive: true, isPopular: false, totalTrips: 0, averageRating: 0, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(ROUTES_COLLECTION).doc(routeId).set(route);
    return sendSuccess(res, route, 'Route created', 'تم إنشاء المسار', 201);
  } catch (error) {
    console.error('Create route error:', error);
    return serverError(res);
  }
});

app.get('/routes/:routeId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const routeDoc = await db.collection(ROUTES_COLLECTION).doc(req.params.routeId).get();
    if (!routeDoc.exists) return notFound(res, 'Route not found', 'المسار غير موجود');
    const route = routeDoc.data();
    const [fromCity, toCity] = await Promise.all([db.collection(CITIES_COLLECTION).doc(route?.fromCityId).get(), db.collection(CITIES_COLLECTION).doc(route?.toCityId).get()]);
    return sendSuccess(res, { ...route, id: routeDoc.id, fromCity: fromCity.exists ? fromCity.data() : null, toCity: toCity.exists ? toCity.data() : null });
  } catch (error) {
    console.error('Get route error:', error);
    return serverError(res);
  }
});

app.put('/routes/:routeId', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const routeRef = db.collection(ROUTES_COLLECTION).doc(req.params.routeId);
    if (!(await routeRef.get()).exists) return notFound(res, 'Route not found', 'المسار غير موجود');
    const allowedFields = ['name', 'nameAr', 'nameFr', 'distance', 'estimatedDuration', 'intermediateStops', 'basePricePerPerson', 'basePricePrivate', 'pricePerKg', 'availableVehicleTypes', 'hasFixedSchedule', 'fixedDepartureTimes', 'isActive', 'isPopular'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    await routeRef.update(updates);
    return sendSuccess(res, null, 'Route updated', 'تم تحديث المسار');
  } catch (error) {
    console.error('Update route error:', error);
    return serverError(res);
  }
});


app.delete('/routes/:routeId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const routeRef = db.collection(ROUTES_COLLECTION).doc(req.params.routeId);
    if (!(await routeRef.get()).exists) return notFound(res, 'Route not found', 'المسار غير موجود');
    await routeRef.update({ isActive: false, deletedAt: new Date(), deletedBy: req.user!.uid });
    return sendSuccess(res, null, 'Route deleted', 'تم حذف المسار');
  } catch (error) {
    console.error('Delete route error:', error);
    return serverError(res);
  }
});

// ==================== TRIPS ====================

app.get('/trips', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { routeId, driverId, status, date, limit = '20', cursor } = req.query;
    let query = db.collection(TRIPS_COLLECTION).orderBy('departureDate', 'asc').limit(parseInt(limit as string));
    if (routeId) query = query.where('routeId', '==', routeId);
    if (driverId) query = query.where('driverId', '==', driverId);
    if (status) query = query.where('status', '==', status);
    if (date) query = query.where('departureDate', '==', date);
    if (!date && !status) query = query.where('departureDate', '>=', new Date().toISOString().split('T')[0]);
    if (cursor) {
      const cursorDoc = await db.collection(TRIPS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const trips = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendPaginated(res, trips, { total: trips.length, page: 1, limit: parseInt(limit as string), hasMore: snapshot.docs.length === parseInt(limit as string), nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id });
  } catch (error) {
    console.error('Get trips error:', error);
    return serverError(res);
  }
});

app.post('/trips', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { routeId, departureDate, departureTime, totalSeats, pricePerSeat, privatePrice, allowsPackages, maxPackageWeight, notes, notesAr, vehicleId } = req.body;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    const isDriver = req.user!.role === 'driver';
    if (!isAdmin && !isDriver) return unauthorized(res);
    if (!routeId || !departureDate || !departureTime || !totalSeats) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const routeDoc = await db.collection(ROUTES_COLLECTION).doc(routeId).get();
    if (!routeDoc.exists) return notFound(res, 'Route not found', 'المسار غير موجود');
    const route = routeDoc.data();
    const driverId = isDriver ? req.user!.uid : req.body.driverId;
    if (driverId) {
      const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
      if (!driverDoc.exists || driverDoc.data()?.role !== 'driver') return notFound(res, 'Driver not found', 'السائق غير موجود');
    }
    const tripId = uuidv4();
    const now = new Date();
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    const arrivalDateTime = new Date(departureDateTime.getTime() + (route?.estimatedDuration || 120) * 60000);
    const estimatedArrivalTime = `${arrivalDateTime.getHours().toString().padStart(2, '0')}:${arrivalDateTime.getMinutes().toString().padStart(2, '0')}`;
    const trip = { tripId, routeId, driverId: driverId || null, vehicleId: vehicleId || null, departureDate, departureTime, estimatedArrivalTime, actualDepartureTime: null, actualArrivalTime: null, totalSeats, availableSeats: totalSeats, pricePerSeat: pricePerSeat || route?.basePricePerPerson, privatePrice: privatePrice || route?.basePricePrivate, currency: 'MRU', status: 'OPEN_FOR_BOOKING' as TripStatus, allowsPackages: allowsPackages || false, maxPackageWeight: maxPackageWeight || 0, notes, notesAr, createdAt: now, updatedAt: now, createdBy: req.user!.uid };
    await db.collection(TRIPS_COLLECTION).doc(tripId).set(trip);
    return sendSuccess(res, trip, 'Trip created', 'تم إنشاء الرحلة', 201);
  } catch (error) {
    console.error('Create trip error:', error);
    return serverError(res);
  }
});

app.get('/trips/:tripId', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const tripDoc = await db.collection(TRIPS_COLLECTION).doc(req.params.tripId).get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    const [route, driver] = await Promise.all([
      db.collection(ROUTES_COLLECTION).doc(trip?.routeId).get(),
      trip?.driverId ? db.collection(USERS_COLLECTION).doc(trip.driverId).get() : null
    ]);
    const bookingsSnapshot = await db.collection(BOOKINGS_COLLECTION).where('tripId', '==', req.params.tripId).get();
    return sendSuccess(res, { ...trip, id: tripDoc.id, route: route.exists ? route.data() : null, driver: driver?.exists ? driver.data() : null, bookings: bookingsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) });
  } catch (error) {
    console.error('Get trip error:', error);
    return serverError(res);
  }
});


app.put('/trips/:tripId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const tripRef = db.collection(TRIPS_COLLECTION).doc(req.params.tripId);
    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    if (!isAdmin && trip?.driverId !== req.user!.uid) return unauthorized(res);
    const allowedFields = isAdmin ? ['driverId', 'vehicleId', 'departureDate', 'departureTime', 'totalSeats', 'pricePerSeat', 'privatePrice', 'status', 'allowsPackages', 'maxPackageWeight', 'notes', 'notesAr'] : ['departureTime', 'notes', 'notesAr'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const field of allowedFields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    await tripRef.update(updates);
    return sendSuccess(res, null, 'Trip updated', 'تم تحديث الرحلة');
  } catch (error) {
    console.error('Update trip error:', error);
    return serverError(res);
  }
});

app.post('/trips/:tripId/start', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const tripRef = db.collection(TRIPS_COLLECTION).doc(req.params.tripId);
    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    if (trip?.driverId !== req.user!.uid && req.user!.role !== 'admin') return unauthorized(res);
    if (trip?.status !== 'OPEN_FOR_BOOKING' && trip?.status !== 'FULL') return badRequest(res, 'Trip cannot be started', 'لا يمكن بدء الرحلة');
    await tripRef.update({ status: 'IN_PROGRESS', actualDepartureTime: new Date().toISOString(), updatedAt: new Date() });
    const bookingsSnapshot = await db.collection(BOOKINGS_COLLECTION).where('tripId', '==', req.params.tripId).where('status', '==', 'CONFIRMED').get();
    for (const doc of bookingsSnapshot.docs) {
      await publishMessage(TOPICS.NOTIFICATIONS, { type: 'push', userId: doc.data().clientId, title: 'الرحلة بدأت', titleEn: 'Trip Started', body: 'رحلتك بين المدن بدأت الآن', data: { type: 'intercity_trip_started', tripId: req.params.tripId } });
    }
    return sendSuccess(res, null, 'Trip started', 'بدأت الرحلة');
  } catch (error) {
    console.error('Start trip error:', error);
    return serverError(res);
  }
});

app.post('/trips/:tripId/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const tripRef = db.collection(TRIPS_COLLECTION).doc(req.params.tripId);
    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    if (trip?.driverId !== req.user!.uid && req.user!.role !== 'admin') return unauthorized(res);
    if (trip?.status !== 'IN_PROGRESS') return badRequest(res, 'Trip is not in progress', 'الرحلة ليست قيد التنفيذ');
    await tripRef.update({ status: 'COMPLETED', actualArrivalTime: new Date().toISOString(), updatedAt: new Date() });
    const bookingsSnapshot = await db.collection(BOOKINGS_COLLECTION).where('tripId', '==', req.params.tripId).where('status', '==', 'CONFIRMED').get();
    const batch = db.batch();
    for (const doc of bookingsSnapshot.docs) {
      batch.update(doc.ref, { status: 'COMPLETED', updatedAt: new Date() });
      await publishMessage(TOPICS.NOTIFICATIONS, { type: 'push', userId: doc.data().clientId, title: 'الرحلة اكتملت', titleEn: 'Trip Completed', body: 'وصلت رحلتك بين المدن', data: { type: 'intercity_trip_completed', tripId: req.params.tripId } });
    }
    await batch.commit();
    await db.collection(ROUTES_COLLECTION).doc(trip?.routeId).update({ totalTrips: (trip?.totalTrips || 0) + 1 });
    return sendSuccess(res, null, 'Trip completed', 'اكتملت الرحلة');
  } catch (error) {
    console.error('Complete trip error:', error);
    return serverError(res);
  }
});

app.post('/trips/:tripId/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { reason } = req.body;
    const tripRef = db.collection(TRIPS_COLLECTION).doc(req.params.tripId);
    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    if (trip?.driverId !== req.user!.uid && req.user!.role !== 'admin') return unauthorized(res);
    if (['COMPLETED', 'CANCELLED'].includes(trip?.status)) return badRequest(res, 'Trip cannot be cancelled', 'لا يمكن إلغاء الرحلة');
    await tripRef.update({ status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date(), cancelledBy: req.user!.uid, updatedAt: new Date() });
    const bookingsSnapshot = await db.collection(BOOKINGS_COLLECTION).where('tripId', '==', req.params.tripId).where('status', 'in', ['PENDING', 'CONFIRMED']).get();
    const batch = db.batch();
    for (const doc of bookingsSnapshot.docs) {
      batch.update(doc.ref, { status: 'CANCELLED', cancellationReason: 'Trip cancelled by driver', updatedAt: new Date() });
      await publishMessage(TOPICS.NOTIFICATIONS, { type: 'push', userId: doc.data().clientId, title: 'تم إلغاء الرحلة', titleEn: 'Trip Cancelled', body: 'تم إلغاء رحلتك بين المدن', data: { type: 'intercity_trip_cancelled', tripId: req.params.tripId } });
    }
    await batch.commit();
    return sendSuccess(res, null, 'Trip cancelled', 'تم إلغاء الرحلة');
  } catch (error) {
    console.error('Cancel trip error:', error);
    return serverError(res);
  }
});


// ==================== BOOKINGS ====================

app.get('/bookings', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { tripId, status, limit = '20', cursor } = req.query;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    let query = db.collection(BOOKINGS_COLLECTION).orderBy('createdAt', 'desc').limit(parseInt(limit as string));
    if (!isAdmin) query = query.where('clientId', '==', req.user!.uid);
    if (tripId) query = query.where('tripId', '==', tripId);
    if (status) query = query.where('status', '==', status);
    if (cursor) {
      const cursorDoc = await db.collection(BOOKINGS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return sendPaginated(res, bookings, { total: bookings.length, page: 1, limit: parseInt(limit as string), hasMore: snapshot.docs.length === parseInt(limit as string), nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id });
  } catch (error) {
    console.error('Get bookings error:', error);
    return serverError(res);
  }
});

app.post('/bookings', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { tripId, seatsBooked, pickupStopId, dropoffStopId, passengers, paymentMethod, contactPhone, hasPackage, packageInfo, notes } = req.body;
    if (!tripId || !seatsBooked || !passengers || passengers.length === 0) return badRequest(res, 'Missing required fields', 'الحقول المطلوبة ناقصة');
    const tripDoc = await db.collection(TRIPS_COLLECTION).doc(tripId).get();
    if (!tripDoc.exists) return notFound(res, 'Trip not found', 'الرحلة غير موجودة');
    const trip = tripDoc.data();
    if (trip?.status !== 'OPEN_FOR_BOOKING') return badRequest(res, 'Trip is not available for booking', 'الرحلة غير متاحة للحجز');
    if (trip?.availableSeats < seatsBooked) return badRequest(res, 'Not enough seats available', 'لا توجد مقاعد كافية');
    const bookingId = uuidv4();
    const now = new Date();
    let totalPrice = trip?.pricePerSeat * seatsBooked;
    if (hasPackage && packageInfo?.weight && trip?.allowsPackages) {
      const routeDoc = await db.collection(ROUTES_COLLECTION).doc(trip.routeId).get();
      const route = routeDoc.data();
      totalPrice += (route?.pricePerKg || 0) * packageInfo.weight;
    }
    const booking = { bookingId, tripId, clientId: req.user!.uid, seatsBooked, pickupStopId: pickupStopId || null, dropoffStopId: dropoffStopId || null, passengers, totalPrice, currency: 'MRU', discount: 0, promotionId: null, paymentMethod: paymentMethod || 'CASH', paymentStatus: 'PENDING', transactionId: null, status: 'PENDING' as BookingStatus, hasPackage: hasPackage || false, packageInfo: hasPackage ? packageInfo : null, contactPhone: contactPhone || req.user!.phoneNumber, notes, createdAt: now, updatedAt: now };
    await db.collection(BOOKINGS_COLLECTION).doc(bookingId).set(booking);
    const newAvailableSeats = trip?.availableSeats - seatsBooked;
    await db.collection(TRIPS_COLLECTION).doc(tripId).update({ availableSeats: newAvailableSeats, status: newAvailableSeats === 0 ? 'FULL' : 'OPEN_FOR_BOOKING', updatedAt: now });
    if (trip?.driverId) {
      await publishMessage(TOPICS.NOTIFICATIONS, { type: 'push', userId: trip.driverId, title: 'حجز جديد', titleEn: 'New Booking', body: `حجز جديد لـ ${seatsBooked} مقاعد`, data: { type: 'intercity_booking', tripId, bookingId } });
    }
    return sendSuccess(res, booking, 'Booking created', 'تم إنشاء الحجز', 201);
  } catch (error) {
    console.error('Create booking error:', error);
    return serverError(res);
  }
});

app.get('/bookings/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const bookingDoc = await db.collection(BOOKINGS_COLLECTION).doc(req.params.bookingId).get();
    if (!bookingDoc.exists) return notFound(res, 'Booking not found', 'الحجز غير موجود');
    const booking = bookingDoc.data();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    if (!isAdmin && booking?.clientId !== req.user!.uid) return unauthorized(res);
    const tripDoc = await db.collection(TRIPS_COLLECTION).doc(booking?.tripId).get();
    const trip = tripDoc.exists ? tripDoc.data() : null;
    let route = null;
    if (trip?.routeId) {
      const routeDoc = await db.collection(ROUTES_COLLECTION).doc(trip.routeId).get();
      route = routeDoc.exists ? routeDoc.data() : null;
    }
    return sendSuccess(res, { ...booking, id: bookingDoc.id, trip, route });
  } catch (error) {
    console.error('Get booking error:', error);
    return serverError(res);
  }
});

app.post('/bookings/:bookingId/confirm', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(req.params.bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return notFound(res, 'Booking not found', 'الحجز غير موجود');
    const booking = bookingDoc.data();
    const tripDoc = await db.collection(TRIPS_COLLECTION).doc(booking?.tripId).get();
    const trip = tripDoc.data();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    const isDriver = trip?.driverId === req.user!.uid;
    if (!isAdmin && !isDriver) return unauthorized(res);
    if (booking?.status !== 'PENDING') return badRequest(res, 'Booking cannot be confirmed', 'لا يمكن تأكيد الحجز');
    await bookingRef.update({ status: 'CONFIRMED', confirmedAt: new Date(), confirmedBy: req.user!.uid, updatedAt: new Date() });
    await publishMessage(TOPICS.NOTIFICATIONS, { type: 'push', userId: booking?.clientId, title: 'تم تأكيد حجزك', titleEn: 'Booking Confirmed', body: 'تم تأكيد حجزك للرحلة بين المدن', data: { type: 'intercity_booking_confirmed', bookingId: req.params.bookingId } });
    return sendSuccess(res, null, 'Booking confirmed', 'تم تأكيد الحجز');
  } catch (error) {
    console.error('Confirm booking error:', error);
    return serverError(res);
  }
});

app.post('/bookings/:bookingId/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { reason } = req.body;
    const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(req.params.bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return notFound(res, 'Booking not found', 'الحجز غير موجود');
    const booking = bookingDoc.data();
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    if (!isAdmin && booking?.clientId !== req.user!.uid) return unauthorized(res);
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking?.status)) return badRequest(res, 'Booking cannot be cancelled', 'لا يمكن إلغاء الحجز');
    await bookingRef.update({ status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date(), cancelledBy: req.user!.uid, updatedAt: new Date() });
    const tripRef = db.collection(TRIPS_COLLECTION).doc(booking?.tripId);
    const tripDoc = await tripRef.get();
    if (tripDoc.exists) {
      const trip = tripDoc.data();
      const newAvailableSeats = (trip?.availableSeats || 0) + booking?.seatsBooked;
      await tripRef.update({ availableSeats: newAvailableSeats, status: trip?.status === 'FULL' ? 'OPEN_FOR_BOOKING' : trip?.status, updatedAt: new Date() });
    }
    return sendSuccess(res, null, 'Booking cancelled', 'تم إلغاء الحجز');
  } catch (error) {
    console.error('Cancel booking error:', error);
    return serverError(res);
  }
});

// ==================== SEARCH ====================

app.get('/search', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { fromCityId, toCityId, date, passengers = '1' } = req.query;
    if (!fromCityId || !toCityId || !date) return badRequest(res, 'From city, to city, and date are required', 'مدينة المغادرة والوصول والتاريخ مطلوبة');
    const routesSnapshot = await db.collection(ROUTES_COLLECTION).where('fromCityId', '==', fromCityId).where('toCityId', '==', toCityId).where('isActive', '==', true).get();
    if (routesSnapshot.empty) return sendSuccess(res, [], 'No routes found', 'لا توجد مسارات');
    const routeIds = routesSnapshot.docs.map(d => d.id);
    const tripsSnapshot = await db.collection(TRIPS_COLLECTION).where('routeId', 'in', routeIds).where('departureDate', '==', date).where('status', 'in', ['OPEN_FOR_BOOKING', 'SCHEDULED']).get();
    const trips = tripsSnapshot.docs.filter(d => d.data().availableSeats >= parseInt(passengers as string)).map(doc => {
      const trip = doc.data();
      const route = routesSnapshot.docs.find(r => r.id === trip.routeId)?.data();
      return { ...trip, id: doc.id, route };
    });
    return sendSuccess(res, trips);
  } catch (error) {
    console.error('Search trips error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok', service: 'intercity' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Intercity service listening on port ${PORT}`));

export default app;
