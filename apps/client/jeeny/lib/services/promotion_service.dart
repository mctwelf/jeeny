import '../core/api_client.dart';

/// Promotion model
class Promotion {
  final String id;
  final String code;
  final String title;
  final String description;
  final String type; // percentage, fixed
  final double value;
  final double? minOrderAmount;
  final double? maxDiscount;
  final DateTime? expiresAt;
  final int? usageLimit;
  final int usedCount;
  final bool isActive;

  Promotion({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    required this.type,
    required this.value,
    this.minOrderAmount,
    this.maxDiscount,
    this.expiresAt,
    this.usageLimit,
    this.usedCount = 0,
    this.isActive = true,
  });

  factory Promotion.fromJson(Map<String, dynamic> json) {
    return Promotion(
      id: json['id'],
      code: json['code'],
      title: json['title'],
      description: json['description'],
      type: json['type'],
      value: (json['value'] as num).toDouble(),
      minOrderAmount: json['minOrderAmount']?.toDouble(),
      maxDiscount: json['maxDiscount']?.toDouble(),
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      usageLimit: json['usageLimit'],
      usedCount: json['usedCount'] ?? 0,
      isActive: json['isActive'] ?? true,
    );
  }

  String get discountText {
    if (type == 'percentage') return '$value%';
    return '${value.toStringAsFixed(0)} MRU';
  }
}


/// Service for promotion operations
class PromotionService {
  final ApiClient _apiClient;

  PromotionService(this._apiClient);

  /// Get available promotions
  Future<List<Promotion>> getPromotions() async {
    final response = await _apiClient.get('/promotions');
    final List<dynamic> data = response.data['promotions'] ?? [];
    return data.map((json) => Promotion.fromJson(json)).toList();
  }

  /// Validate promo code
  Future<Map<String, dynamic>> validatePromoCode(String code, {double? orderAmount}) async {
    final response = await _apiClient.post('/promotions/validate', data: {
      'code': code,
      if (orderAmount != null) 'orderAmount': orderAmount,
    });
    return response.data;
  }

  /// Apply promo code to ride
  Future<void> applyPromoCode(String rideId, String code) async {
    await _apiClient.post('/rides/$rideId/promo', data: {'code': code});
  }

  /// Get user's promo history
  Future<List<Map<String, dynamic>>> getPromoHistory() async {
    final response = await _apiClient.get('/promotions/history');
    return List<Map<String, dynamic>>.from(response.data['history'] ?? []);
  }
}
