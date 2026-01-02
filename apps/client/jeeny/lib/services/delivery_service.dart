import '../core/api_client.dart';
import '../models/delivery.dart';
import '../models/base_models.dart';
import '../models/enums.dart';

/// Service for package delivery operations
class DeliveryService {
  final ApiClient _api = ApiClient();

  /// Get fare estimate for delivery
  Future<Money> getFareEstimate({
    required Address pickup,
    required Address dropoff,
    required PackageSize packageSize,
    double? weight,
  }) async {
    try {
      final response = await _api.post('/delivery/estimate', data: {
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'packageSize': packageSize.name,
        if (weight != null) 'weight': weight,
      });

      if (response.success && response.data != null) {
        return Money.fromJson(response.data['fare']);
      }
      throw Exception(response.message ?? 'فشل في حساب التكلفة');
    } catch (e) {
      throw Exception('فشل في حساب التكلفة: $e');
    }
  }

  /// Create a new delivery request
  Future<PackageDeliveryInfo> createDelivery({
    required Address pickup,
    required Address dropoff,
    required String senderName,
    required String senderPhone,
    required String recipientName,
    required String recipientPhone,
    String? packageDescription,
    required PackageSize packageSize,
    double? weight,
    bool fragile = false,
    required PaymentProvider paymentMethod,
  }) async {
    try {
      final response = await _api.post('/delivery', data: {
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'senderName': senderName,
        'senderPhone': senderPhone,
        'recipientName': recipientName,
        'recipientPhone': recipientPhone,
        if (packageDescription != null) 'packageDescription': packageDescription,
        'packageSize': packageSize.name,
        if (weight != null) 'weight': weight,
        'fragile': fragile,
        'paymentMethod': paymentMethod.name,
      });

      if (response.success && response.data != null) {
        return PackageDeliveryInfo.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل في إنشاء طلب التوصيل');
    } catch (e) {
      throw Exception('فشل في إنشاء طلب التوصيل: $e');
    }
  }

  /// Get delivery by ID
  Future<PackageDeliveryInfo> getDelivery(String deliveryId) async {
    try {
      final response = await _api.get('/delivery/$deliveryId');

      if (response.success && response.data != null) {
        return PackageDeliveryInfo.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل في جلب بيانات التوصيل');
    } catch (e) {
      throw Exception('فشل في جلب بيانات التوصيل: $e');
    }
  }

  /// Get user's deliveries
  Future<List<PackageDeliveryInfo>> getMyDeliveries({
    DeliveryStatus? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) {
        queryParams['status'] = status.name;
      }

      final response = await _api.get('/delivery/my', queryParameters: queryParams);

      if (response.success && response.data != null) {
        final list = response.data['deliveries'] as List? ?? [];
        return list
            .map((e) => PackageDeliveryInfo.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      throw Exception(response.message ?? 'فشل في جلب قائمة التوصيلات');
    } catch (e) {
      throw Exception('فشل في جلب قائمة التوصيلات: $e');
    }
  }

  /// Cancel delivery
  Future<bool> cancelDelivery(String deliveryId, {String? reason}) async {
    try {
      final response = await _api.post('/delivery/$deliveryId/cancel', data: {
        if (reason != null) 'reason': reason,
      });

      return response.success;
    } catch (e) {
      throw Exception('فشل في إلغاء التوصيل: $e');
    }
  }

  /// Track delivery in real-time
  Stream<PackageDeliveryInfo> trackDelivery(String deliveryId) {
    // This would typically use Firestore or WebSocket for real-time updates
    // For now, we'll poll the API
    return Stream.periodic(const Duration(seconds: 10)).asyncMap((_) async {
      return await getDelivery(deliveryId);
    });
  }

  /// Rate delivery
  Future<bool> rateDelivery(
    String deliveryId, {
    required int rating,
    String? comment,
  }) async {
    try {
      final response = await _api.post('/delivery/$deliveryId/rate', data: {
        'rating': rating,
        if (comment != null) 'comment': comment,
      });

      return response.success;
    } catch (e) {
      throw Exception('فشل في تقييم التوصيل: $e');
    }
  }
}
