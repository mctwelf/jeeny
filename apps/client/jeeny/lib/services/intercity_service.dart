import '../core/api/api_client.dart';
import '../models/intercity.dart';

/// Intercity travel service
class IntercityService {
  final ApiClient _apiClient = ApiClient();

  /// Get available intercity routes
  Future<List<IntercityRoute>> getRoutes() async {
    try {
      final response = await _apiClient.get('/intercity/routes');

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => IntercityRoute.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل تحميل المسارات');
    }
  }

  /// Search for available trips
  Future<List<IntercityTrip>> searchTrips({
    required String originCityId,
    required String destinationCityId,
    required DateTime date,
    int passengers = 1,
  }) async {
    try {
      final response = await _apiClient.get('/intercity/trips', queryParameters: {
        'origin': originCityId,
        'destination': destinationCityId,
        'date': date.toIso8601String().split('T')[0],
        'passengers': passengers.toString(),
      });

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => IntercityTrip.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل البحث عن الرحلات');
    }
  }

  /// Get trip details
  Future<IntercityTrip?> getTrip(String tripId) async {
    try {
      final response = await _apiClient.get('/intercity/trips/$tripId');

      if (response.isSuccess && response.data != null) {
        return IntercityTrip.fromJson(response.data);
      }
      return null;
    } catch (e) {
      throw Exception('فشل تحميل تفاصيل الرحلة');
    }
  }

  /// Create a booking
  Future<IntercityBooking> createBooking({
    required String tripId,
    required List<PassengerInfo> passengers,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.post('/intercity/bookings', data: {
        'tripId': tripId,
        'passengers': passengers.map((p) => p.toJson()).toList(),
        if (notes != null) 'notes': notes,
      });

      if (response.isSuccess && response.data != null) {
        return IntercityBooking.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل إنشاء الحجز');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل إنشاء الحجز');
    }
  }

  /// Get user's bookings
  Future<List<IntercityBooking>> getMyBookings({
    bool upcoming = true,
  }) async {
    try {
      final response = await _apiClient.get('/intercity/bookings', queryParameters: {
        'upcoming': upcoming.toString(),
      });

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => IntercityBooking.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل تحميل الحجوزات');
    }
  }

  /// Get booking details
  Future<IntercityBooking?> getBooking(String bookingId) async {
    try {
      final response = await _apiClient.get('/intercity/bookings/$bookingId');

      if (response.isSuccess && response.data != null) {
        return IntercityBooking.fromJson(response.data);
      }
      return null;
    } catch (e) {
      throw Exception('فشل تحميل تفاصيل الحجز');
    }
  }

  /// Cancel a booking
  Future<bool> cancelBooking(String bookingId, {String? reason}) async {
    try {
      final response = await _apiClient.post('/intercity/bookings/$bookingId/cancel', data: {
        if (reason != null) 'reason': reason,
      });

      return response.isSuccess;
    } catch (e) {
      throw Exception('فشل إلغاء الحجز');
    }
  }
}
