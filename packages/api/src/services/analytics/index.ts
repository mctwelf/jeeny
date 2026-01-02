/**
 * Jeeny Analytics Service - Cloud Run
 *
 * Handles analytics, reports, and dashboard statistics.
 * التحليلات والتقارير وإحصائيات لوحة التحكم
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { sendSuccess, badRequest, serverError } from '../../lib/response';
import { authenticate, requireRole } from '../../middleware/auth';

initializeFirebase();

const app = express();
app.use(cors());
app.use(express.json());

const RIDES_COLLECTION = 'rides';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const CONTRACTS_COLLECTION = 'contracts';
const INTERCITY_TRIPS_COLLECTION = 'intercity_trips';

// ==================== DASHBOARD STATS ====================

app.get('/dashboard', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { period = '7d', cityId } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '24h': startDate.setHours(now.getHours() - 24); break;
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      default: startDate.setDate(now.getDate() - 7);
    }

    // Get rides stats
    let ridesQuery = db.collection(RIDES_COLLECTION).where('createdAt', '>=', startDate);
    if (cityId) ridesQuery = ridesQuery.where('cityId', '==', cityId);
    const ridesSnapshot = await ridesQuery.get();

    let totalRides = 0, completedRides = 0, cancelledRides = 0, totalRevenue = 0;
    let totalDistance = 0, totalDuration = 0;

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      totalRides++;
      if (ride.status === 'COMPLETED') {
        completedRides++;
        totalRevenue += ride.actualFare || ride.estimatedFare || 0;
        totalDistance += ride.actualDistance || ride.estimatedDistance || 0;
        totalDuration += ride.actualDuration || ride.estimatedDuration || 0;
      } else if (ride.status === 'CANCELLED') {
        cancelledRides++;
      }
    });

    // Get active drivers
    const driversSnapshot = await db.collection(USERS_COLLECTION)
      .where('role', '==', 'driver')
      .where('driverStatus', '==', 'ONLINE')
      .get();

    // Get active clients (users who had rides in period)
    const clientIds = new Set(ridesSnapshot.docs.map(d => d.data().clientId));

    // Get total users
    const totalUsersSnapshot = await db.collection(USERS_COLLECTION).where('role', '==', 'CLIENT').get();
    const totalDriversSnapshot = await db.collection(USERS_COLLECTION).where('role', '==', 'driver').get();

    return sendSuccess(res, {
      period,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      rides: { total: totalRides, completed: completedRides, cancelled: cancelledRides, completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0, cancellationRate: totalRides > 0 ? Math.round((cancelledRides / totalRides) * 100) : 0 },
      revenue: { total: Math.round(totalRevenue), currency: 'MRU', averagePerRide: completedRides > 0 ? Math.round(totalRevenue / completedRides) : 0 },
      distance: { totalKm: Math.round(totalDistance / 1000), averageKm: completedRides > 0 ? Math.round(totalDistance / completedRides / 1000 * 10) / 10 : 0 },
      duration: { totalMinutes: Math.round(totalDuration / 60), averageMinutes: completedRides > 0 ? Math.round(totalDuration / completedRides / 60) : 0 },
      users: { totalClients: totalUsersSnapshot.size, totalDrivers: totalDriversSnapshot.size, activeClients: clientIds.size, onlineDrivers: driversSnapshot.size },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return serverError(res);
  }
});

// ==================== DRIVER STATS ====================

app.get('/drivers/:driverId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { driverId } = req.params;
    const { period = '30d' } = req.query;

    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'employee';
    if (!isAdmin && req.user!.uid !== driverId) {
      return badRequest(res, 'Unauthorized', 'غير مصرح');
    }

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    const ridesSnapshot = await db.collection(RIDES_COLLECTION)
      .where('driverId', '==', driverId)
      .where('createdAt', '>=', startDate)
      .get();

    let totalTrips = 0, completedTrips = 0, cancelledTrips = 0;
    let totalEarnings = 0, totalDistance = 0, totalDuration = 0;
    const ratings: number[] = [];

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      totalTrips++;
      if (ride.status === 'COMPLETED') {
        completedTrips++;
        totalEarnings += ride.actualFare || ride.estimatedFare || 0;
        totalDistance += ride.actualDistance || ride.estimatedDistance || 0;
        totalDuration += ride.actualDuration || ride.estimatedDuration || 0;
        if (ride.driverRating) ratings.push(ride.driverRating);
      } else if (ride.status === 'CANCELLED' && ride.cancelledBy === 'DRIVER') {
        cancelledTrips++;
      }
    });

    // Get commission rate
    const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
    const commissionRate = driverDoc.data()?.commissionRate || 15;
    const totalCommission = Math.round(totalEarnings * commissionRate / 100);

    return sendSuccess(res, {
      driverId,
      period,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      trips: { total: totalTrips, completed: completedTrips, cancelled: cancelledTrips, completionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0 },
      earnings: { gross: Math.round(totalEarnings), commission: totalCommission, net: Math.round(totalEarnings - totalCommission), commissionRate, currency: 'MRU' },
      distance: { totalKm: Math.round(totalDistance / 1000) },
      duration: { totalHours: Math.round(totalDuration / 3600 * 10) / 10 },
      rating: { average: ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0, count: ratings.length },
    });
  } catch (error) {
    console.error('Get driver stats error:', error);
    return serverError(res);
  }
});


// ==================== REVENUE REPORTS ====================

app.get('/revenue', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { period = '30d', groupBy = 'day', cityId } = req.query;

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '365d': startDate.setDate(now.getDate() - 365); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    let ridesQuery = db.collection(RIDES_COLLECTION)
      .where('status', '==', 'COMPLETED')
      .where('createdAt', '>=', startDate);
    if (cityId) ridesQuery = ridesQuery.where('cityId', '==', cityId);
    const ridesSnapshot = await ridesQuery.get();

    const revenueByPeriod: Record<string, { revenue: number; rides: number; commission: number }> = {};
    let totalRevenue = 0, totalCommission = 0;

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      const date = ride.createdAt.toDate ? ride.createdAt.toDate() : new Date(ride.createdAt);
      let key: string;
      if (groupBy === 'day') key = date.toISOString().split('T')[0];
      else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const fare = ride.actualFare || ride.estimatedFare || 0;
      const commission = Math.round(fare * 0.15); // 15% default commission

      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, rides: 0, commission: 0 };
      revenueByPeriod[key].revenue += fare;
      revenueByPeriod[key].rides++;
      revenueByPeriod[key].commission += commission;
      totalRevenue += fare;
      totalCommission += commission;
    });

    const data = Object.entries(revenueByPeriod)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return sendSuccess(res, {
      period,
      groupBy,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      summary: { totalRevenue: Math.round(totalRevenue), totalCommission: Math.round(totalCommission), totalRides: ridesSnapshot.size, currency: 'MRU' },
      data,
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    return serverError(res);
  }
});

// ==================== RIDES REPORTS ====================

app.get('/rides', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { period = '7d', cityId, vehicleType, rideType } = req.query;

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '24h': startDate.setHours(now.getHours() - 24); break;
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      default: startDate.setDate(now.getDate() - 7);
    }

    let ridesQuery = db.collection(RIDES_COLLECTION).where('createdAt', '>=', startDate);
    if (cityId) ridesQuery = ridesQuery.where('cityId', '==', cityId);
    if (vehicleType) ridesQuery = ridesQuery.where('vehicleType', '==', vehicleType);
    if (rideType) ridesQuery = ridesQuery.where('rideType', '==', rideType);
    const ridesSnapshot = await ridesQuery.get();

    const byStatus: Record<string, number> = {};
    const byVehicleType: Record<string, number> = {};
    const byRideType: Record<string, number> = {};
    const byHour: Record<number, number> = {};
    const byPaymentMethod: Record<string, number> = {};

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      byStatus[ride.status] = (byStatus[ride.status] || 0) + 1;
      byVehicleType[ride.vehicleType] = (byVehicleType[ride.vehicleType] || 0) + 1;
      byRideType[ride.rideType || 'STANDARD'] = (byRideType[ride.rideType || 'STANDARD'] || 0) + 1;
      byPaymentMethod[ride.paymentMethod] = (byPaymentMethod[ride.paymentMethod] || 0) + 1;
      const hour = (ride.createdAt.toDate ? ride.createdAt.toDate() : new Date(ride.createdAt)).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    return sendSuccess(res, {
      period,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      total: ridesSnapshot.size,
      byStatus,
      byVehicleType,
      byRideType,
      byPaymentMethod,
      byHour: Object.entries(byHour).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour),
    });
  } catch (error) {
    console.error('Get rides report error:', error);
    return serverError(res);
  }
});

// ==================== TOP DRIVERS ====================

app.get('/top-drivers', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { period = '30d', limit = '10', sortBy = 'earnings' } = req.query;

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    const ridesSnapshot = await db.collection(RIDES_COLLECTION)
      .where('status', '==', 'COMPLETED')
      .where('createdAt', '>=', startDate)
      .get();

    const driverStats: Record<string, { trips: number; earnings: number; ratings: number[]; }> = {};

    ridesSnapshot.docs.forEach(doc => {
      const ride = doc.data();
      if (!ride.driverId) return;
      if (!driverStats[ride.driverId]) driverStats[ride.driverId] = { trips: 0, earnings: 0, ratings: [] };
      driverStats[ride.driverId].trips++;
      driverStats[ride.driverId].earnings += ride.actualFare || ride.estimatedFare || 0;
      if (ride.driverRating) driverStats[ride.driverId].ratings.push(ride.driverRating);
    });

    const drivers = await Promise.all(
      Object.entries(driverStats).map(async ([driverId, stats]) => {
        const driverDoc = await db.collection(USERS_COLLECTION).doc(driverId).get();
        const driver = driverDoc.data();
        return {
          driverId,
          name: driver?.fullName || 'Unknown',
          phone: driver?.phoneNumber,
          trips: stats.trips,
          earnings: Math.round(stats.earnings),
          averageRating: stats.ratings.length > 0 ? Math.round(stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length * 10) / 10 : 0,
        };
      })
    );

    const sorted = drivers.sort((a, b) => {
      if (sortBy === 'trips') return b.trips - a.trips;
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      return b.earnings - a.earnings;
    }).slice(0, parseInt(limit as string));

    return sendSuccess(res, { period, sortBy, drivers: sorted });
  } catch (error) {
    console.error('Get top drivers error:', error);
    return serverError(res);
  }
});

// ==================== CONTRACTS STATS ====================

app.get('/contracts', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const contractsSnapshot = await db.collection(CONTRACTS_COLLECTION).get();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalMonthlyRevenue = 0;

    contractsSnapshot.docs.forEach(doc => {
      const contract = doc.data();
      byStatus[contract.status] = (byStatus[contract.status] || 0) + 1;
      byType[contract.contractType] = (byType[contract.contractType] || 0) + 1;
      if (contract.status === 'ACTIVE') totalMonthlyRevenue += contract.monthlyRate || 0;
    });

    return sendSuccess(res, {
      total: contractsSnapshot.size,
      byStatus,
      byType,
      activeContracts: byStatus['ACTIVE'] || 0,
      totalMonthlyRevenue: Math.round(totalMonthlyRevenue),
      currency: 'MRU',
    });
  } catch (error) {
    console.error('Get contracts stats error:', error);
    return serverError(res);
  }
});

// ==================== INTERCITY STATS ====================

app.get('/intercity', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    const tripsSnapshot = await db.collection(INTERCITY_TRIPS_COLLECTION)
      .where('createdAt', '>=', startDate)
      .get();

    const byStatus: Record<string, number> = {};
    let totalSeatsBooked = 0, totalRevenue = 0;

    tripsSnapshot.docs.forEach(doc => {
      const trip = doc.data();
      byStatus[trip.status] = (byStatus[trip.status] || 0) + 1;
      const bookedSeats = trip.totalSeats - trip.availableSeats;
      totalSeatsBooked += bookedSeats;
      if (trip.status === 'COMPLETED') totalRevenue += bookedSeats * trip.pricePerSeat;
    });

    return sendSuccess(res, {
      period,
      totalTrips: tripsSnapshot.size,
      byStatus,
      totalSeatsBooked,
      totalRevenue: Math.round(totalRevenue),
      currency: 'MRU',
    });
  } catch (error) {
    console.error('Get intercity stats error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok', service: 'analytics' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Analytics service listening on port ${PORT}`));

export default app;
