import '../core/api/api_client.dart';
import '../models/ride.dart';
import '../models/base_models.dart';
import '../models/enums.dart';

/// Ride booking service
class RideService {
  final ApiClient _apiClient = ApiClient();

  /// Get fare estimates for a ride
  Future<List<FareEstimate>> getFareEstimates({
    required GeoLocation pickup,
    required GeoLocation dropoff,
  }) async {
    try {
      final response = await _apiClient.post('/rides/estimate', data: {
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
      });

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => FareEstimate.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل حساب التكلفة');
    }
  }

  /// Create a new ride request
  Future<Ride> createRide({
    required Address pickup,
    required Address dropoff,
    required VehicleType vehicleType,
    PaymentProvider? paymentMethod,
    String? promoCode,
    RideSpecialRequests? specialRequests,
    DateTime? scheduledTime,
  }) async {
    try {
      final response = await _apiClient.post('/rides', data: {
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'vehicleType': vehicleType.name,
        if (paymentMethod != null) 'paymentMethod': paymentMethod.name,
        if (promoCode != null) 'promoCode': promoCode,
        if (specialRequests != null) 'specialRequests': specialRequests.toJson(),
        if (scheduledTime != null) 'scheduledTime': scheduledTime.toIso8601String(),
      });

      if (response.isSuccess && response.data != null) {
        return Ride.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل إنشاء الرحلة');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل إنشاء الرحلة');
    }
  }

  /// Get ride by ID
  Future<Ride?> getRide(String rideId) async {
    try {
      final response = await _apiClient.get('/rides/$rideId');

      if (response.isSuccess && response.data != null) {
        return Ride.fromJson(response.data);
      }
      return null;
    } catch (e) {
      throw Exception('فشل تحميل الرحلة');
    }
  }

  /// Get active ride (if any)
  Future<Ride?> getActiveRide() async {
    try {
      final response = await _apiClient.get('/rides/active');

      if (response.isSuccess && response.data != null) {
        return Ride.fromJson(response.data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Cancel a ride
  Future<bool> cancelRide(String rideId, {String? reason}) async {
    try {
      final response = await _apiClient.post('/rides/$rideId/cancel', data: {
        if (reason != null) 'reason': reason,
      });

      return response.isSuccess;
    } catch (e) {
      throw Exception('فشل إلغاء الرحلة');
    }
  }

  /// Rate a ride
  Future<bool> rateRide({
    required String rideId,
    required int rating,
    String? comment,
    double? tipAmount,
  }) async {
    try {
      final response = await _apiClient.post('/rides/$rideId/rate', data: {
        'rating': rating,
        if (comment != null) 'comment': comment,
        if (tipAmount != null) 'tipAmount': tipAmount,
      });

      return response.isSuccess;
    } catch (e) {
      throw Exception('فشل تقييم الرحلة');
    }
  }

  /// Get ride history
  Future<List<Ride>> getRideHistory({
    int page = 1,
    int limit = 20,
    RideStatus? status,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (status != null) 'status': status.name,
      };

      final response = await _apiClient.get(
        '/rides/history',
        queryParameters: queryParams,
      );

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data['rides'] ?? response.data;
        return list.map((e) => Ride.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل تحميل سجل الرحلات');
    }
  }

  /// Get scheduled rides
  Future<List<Ride>> getScheduledRides() async {
    try {
      final response = await _apiClient.get('/rides/scheduled');

      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => Ride.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل تحميل الرحلات المجدولة');
    }
  }

  /// Cancel scheduled ride
  Future<bool> cancelScheduledRide(String rideId) async {
    try {
      final response = await _apiClient.delete('/rides/scheduled/$rideId');
      return response.isSuccess;
    } catch (e) {
      throw Exception('فشل إلغاء الرحلة المجدولة');
    }
  }
}
