import '../core/api_client.dart';
import '../models/food.dart';
import '../models/base_models.dart';
import '../models/enums.dart';

/// Service for food delivery operations
class FoodService {
  final ApiClient _api = ApiClient();

  /// Get restaurants list
  Future<List<Restaurant>> getRestaurants({
    String? category,
    String? search,
    GeoLocation? nearLocation,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (category != null) queryParams['category'] = category;
      if (search != null) queryParams['search'] = search;
      if (nearLocation != null) {
        queryParams['lat'] = nearLocation.latitude;
        queryParams['lng'] = nearLocation.longitude;
      }

      final response = await _api.get('/food/restaurants', queryParameters: queryParams);

      if (response.success && response.data != null) {
        final list = response.data['restaurants'] as List? ?? [];
        return list
            .map((e) => Restaurant.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      throw Exception(response.message ?? 'فشل في جلب المطاعم');
    } catch (e) {
      throw Exception('فشل في جلب المطاعم: $e');
    }
  }

  /// Get restaurant by ID
  Future<Restaurant> getRestaurant(String restaurantId) async {
    try {
      final response = await _api.get('/food/restaurants/$restaurantId');

      if (response.success && response.data != null) {
        return Restaurant.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل في جلب بيانات المطعم');
    } catch (e) {
      throw Exception('فشل في جلب بيانات المطعم: $e');
    }
  }

  /// Get restaurant menu
  Future<List<MenuItem>> getMenu(String restaurantId, {String? category}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (category != null) queryParams['category'] = category;

      final response = await _api.get(
        '/food/restaurants/$restaurantId/menu',
        queryParameters: queryParams,
      );

      if (response.success && response.data != null) {
        final list = response.data['items'] as List? ?? [];
        return list
            .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      throw Exception(response.message ?? 'فشل في جلب قائمة الطعام');
    } catch (e) {
      throw Exception('فشل في جلب قائمة الطعام: $e');
    }
  }

  /// Get menu categories
  Future<List<String>> getMenuCategories(String restaurantId) async {
    try {
      final response = await _api.get('/food/restaurants/$restaurantId/categories');

      if (response.success && response.data != null) {
        return List<String>.from(response.data['categories'] as List? ?? []);
      }
      throw Exception(response.message ?? 'فشل في جلب التصنيفات');
    } catch (e) {
      throw Exception('فشل في جلب التصنيفات: $e');
    }
  }

  /// Create food order
  Future<FoodOrder> createOrder({
    required String restaurantId,
    required List<CartItem> items,
    required Address deliveryAddress,
    required PaymentProvider paymentMethod,
    String? notes,
  }) async {
    try {
      final response = await _api.post('/food/orders', data: {
        'restaurantId': restaurantId,
        'items': items.map((e) => e.toJson()).toList(),
        'deliveryAddress': deliveryAddress.toJson(),
        'paymentMethod': paymentMethod.name,
        if (notes != null) 'notes': notes,
      });

      if (response.success && response.data != null) {
        return FoodOrder.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل في إنشاء الطلب');
    } catch (e) {
      throw Exception('فشل في إنشاء الطلب: $e');
    }
  }

  /// Get order by ID
  Future<FoodOrder> getOrder(String orderId) async {
    try {
      final response = await _api.get('/food/orders/$orderId');

      if (response.success && response.data != null) {
        return FoodOrder.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل في جلب بيانات الطلب');
    } catch (e) {
      throw Exception('فشل في جلب بيانات الطلب: $e');
    }
  }

  /// Get user's orders
  Future<List<FoodOrder>> getMyOrders({
    FoodOrderStatus? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) queryParams['status'] = status.name;

      final response = await _api.get('/food/orders/my', queryParameters: queryParams);

      if (response.success && response.data != null) {
        final list = response.data['orders'] as List? ?? [];
        return list
            .map((e) => FoodOrder.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      throw Exception(response.message ?? 'فشل في جلب الطلبات');
    } catch (e) {
      throw Exception('فشل في جلب الطلبات: $e');
    }
  }

  /// Cancel order
  Future<bool> cancelOrder(String orderId, {String? reason}) async {
    try {
      final response = await _api.post('/food/orders/$orderId/cancel', data: {
        if (reason != null) 'reason': reason,
      });

      return response.success;
    } catch (e) {
      throw Exception('فشل في إلغاء الطلب: $e');
    }
  }

  /// Rate order
  Future<bool> rateOrder(
    String orderId, {
    required int rating,
    String? comment,
  }) async {
    try {
      final response = await _api.post('/food/orders/$orderId/rate', data: {
        'rating': rating,
        if (comment != null) 'comment': comment,
      });

      return response.success;
    } catch (e) {
      throw Exception('فشل في تقييم الطلب: $e');
    }
  }

  /// Track order in real-time
  Stream<FoodOrder> trackOrder(String orderId) {
    return Stream.periodic(const Duration(seconds: 10)).asyncMap((_) async {
      return await getOrder(orderId);
    });
  }
}

/// Cart item for creating orders
class CartItem {
  final String menuItemId;
  final String name;
  final int quantity;
  final double unitPrice;
  final List<String>? selectedOptions;
  final String? specialInstructions;

  CartItem({
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    this.selectedOptions,
    this.specialInstructions,
  });

  double get totalPrice => unitPrice * quantity;

  Map<String, dynamic> toJson() => {
        'menuItemId': menuItemId,
        'name': name,
        'quantity': quantity,
        'unitPrice': unitPrice,
        if (selectedOptions != null) 'selectedOptions': selectedOptions,
        if (specialInstructions != null) 'specialInstructions': specialInstructions,
      };
}
