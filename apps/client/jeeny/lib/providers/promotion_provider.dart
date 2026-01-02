import 'package:flutter/foundation.dart';
import '../services/promotion_service.dart';

/// Provider for promotions state management
class PromotionProvider extends ChangeNotifier {
  final PromotionService _promotionService;

  List<Promotion> _promotions = [];
  Promotion? _appliedPromotion;
  bool _isLoading = false;
  String? _error;
  String? _validationError;

  PromotionProvider(this._promotionService);

  List<Promotion> get promotions => _promotions;
  Promotion? get appliedPromotion => _appliedPromotion;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get validationError => _validationError;

  /// Load available promotions
  Future<void> loadPromotions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _promotions = await _promotionService.getPromotions();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Validate promo code
  Future<bool> validatePromoCode(String code, {double? orderAmount}) async {
    _isLoading = true;
    _validationError = null;
    notifyListeners();

    try {
      final result = await _promotionService.validatePromoCode(code, orderAmount: orderAmount);
      if (result['valid'] == true) {
        _appliedPromotion = Promotion.fromJson(result['promotion']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _validationError = result['message'] ?? 'كود غير صالح';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _validationError = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }


  /// Apply promo code to ride
  Future<bool> applyPromoCode(String rideId, String code) async {
    try {
      await _promotionService.applyPromoCode(rideId, code);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Clear applied promotion
  void clearPromotion() {
    _appliedPromotion = null;
    _validationError = null;
    notifyListeners();
  }

  /// Calculate discount amount
  double calculateDiscount(double amount) {
    if (_appliedPromotion == null) return 0;

    double discount;
    if (_appliedPromotion!.type == 'percentage') {
      discount = amount * (_appliedPromotion!.value / 100);
    } else {
      discount = _appliedPromotion!.value;
    }

    if (_appliedPromotion!.maxDiscount != null) {
      discount = discount.clamp(0, _appliedPromotion!.maxDiscount!);
    }

    return discount;
  }
}
