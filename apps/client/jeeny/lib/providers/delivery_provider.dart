import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/delivery.dart';
import '../models/base_models.dart';
import '../models/enums.dart';
import '../services/delivery_service.dart';

/// Delivery state provider
class DeliveryProvider extends ChangeNotifier {
  final DeliveryService _service = DeliveryService();

  // Form state
  Address? _pickup;
  Address? _dropoff;
  String _senderName = '';
  String _senderPhone = '';
  String _recipientName = '';
  String _recipientPhone = '';
  String? _packageDescription;
  PackageSize _packageSize = PackageSize.medium;
  double? _weight;
  bool _fragile = false;
  PaymentProvider _paymentMethod = PaymentProvider.cash;

  // Estimate
  Money? _fareEstimate;

  // Current delivery
  PackageDeliveryInfo? _currentDelivery;
  List<PackageDeliveryInfo> _myDeliveries = [];
  StreamSubscription? _trackingSubscription;

  // UI state
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  Address? get pickup => _pickup;
  Address? get dropoff => _dropoff;
  String get senderName => _senderName;
  String get senderPhone => _senderPhone;
  String get recipientName => _recipientName;
  String get recipientPhone => _recipientPhone;
  String? get packageDescription => _packageDescription;
  PackageSize get packageSize => _packageSize;
  double? get weight => _weight;
  bool get fragile => _fragile;
  PaymentProvider get paymentMethod => _paymentMethod;
  Money? get fareEstimate => _fareEstimate;
  PackageDeliveryInfo? get currentDelivery => _currentDelivery;
  List<PackageDeliveryInfo> get myDeliveries => _myDeliveries;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  bool get canEstimate => _pickup != null && _dropoff != null;
  bool get canSubmit =>
      canEstimate &&
      _senderName.isNotEmpty &&
      _senderPhone.isNotEmpty &&
      _recipientName.isNotEmpty &&
      _recipientPhone.isNotEmpty;

  /// Set pickup address
  void setPickup(Address address) {
    _pickup = address;
    _fareEstimate = null;
    notifyListeners();
  }

  /// Set dropoff address
  void setDropoff(Address address) {
    _dropoff = address;
    _fareEstimate = null;
    notifyListeners();
  }

  /// Set sender info
  void setSenderInfo({required String name, required String phone}) {
    _senderName = name;
    _senderPhone = phone;
    notifyListeners();
  }

  /// Set recipient info
  void setRecipientInfo({required String name, required String phone}) {
    _recipientName = name;
    _recipientPhone = phone;
    notifyListeners();
  }

  /// Set package description
  void setPackageDescription(String? description) {
    _packageDescription = description;
    notifyListeners();
  }

  /// Set package size
  void setPackageSize(PackageSize size) {
    _packageSize = size;
    _fareEstimate = null;
    notifyListeners();
  }

  /// Set weight
  void setWeight(double? weight) {
    _weight = weight;
    _fareEstimate = null;
    notifyListeners();
  }

  /// Set fragile flag
  void setFragile(bool fragile) {
    _fragile = fragile;
    notifyListeners();
  }

  /// Set payment method
  void setPaymentMethod(PaymentProvider method) {
    _paymentMethod = method;
    notifyListeners();
  }

  /// Get fare estimate
  Future<void> getFareEstimate() async {
    if (!canEstimate) {
      _errorMessage = 'يرجى تحديد عنوان الاستلام والتسليم';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _fareEstimate = await _service.getFareEstimate(
        pickup: _pickup!,
        dropoff: _dropoff!,
        packageSize: _packageSize,
        weight: _weight,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Create delivery request
  Future<bool> createDelivery() async {
    if (!canSubmit) {
      _errorMessage = 'يرجى ملء جميع الحقول المطلوبة';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentDelivery = await _service.createDelivery(
        pickup: _pickup!,
        dropoff: _dropoff!,
        senderName: _senderName,
        senderPhone: _senderPhone,
        recipientName: _recipientName,
        recipientPhone: _recipientPhone,
        packageDescription: _packageDescription,
        packageSize: _packageSize,
        weight: _weight,
        fragile: _fragile,
        paymentMethod: _paymentMethod,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Load user's deliveries
  Future<void> loadMyDeliveries({DeliveryStatus? status}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myDeliveries = await _service.getMyDeliveries(status: status);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Get delivery details
  Future<void> getDeliveryDetails(String deliveryId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentDelivery = await _service.getDelivery(deliveryId);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Start tracking delivery
  void startTracking(String deliveryId) {
    _trackingSubscription?.cancel();
    _trackingSubscription = _service.trackDelivery(deliveryId).listen(
      (delivery) {
        _currentDelivery = delivery;
        notifyListeners();
      },
      onError: (e) {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        notifyListeners();
      },
    );
  }

  /// Stop tracking
  void stopTracking() {
    _trackingSubscription?.cancel();
    _trackingSubscription = null;
  }

  /// Cancel delivery
  Future<bool> cancelDelivery(String deliveryId, {String? reason}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _service.cancelDelivery(deliveryId, reason: reason);
      if (success) {
        await loadMyDeliveries();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Rate delivery
  Future<bool> rateDelivery(
    String deliveryId, {
    required int rating,
    String? comment,
  }) async {
    try {
      return await _service.rateDelivery(
        deliveryId,
        rating: rating,
        comment: comment,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Reset form
  void resetForm() {
    _pickup = null;
    _dropoff = null;
    _senderName = '';
    _senderPhone = '';
    _recipientName = '';
    _recipientPhone = '';
    _packageDescription = null;
    _packageSize = PackageSize.medium;
    _weight = null;
    _fragile = false;
    _paymentMethod = PaymentProvider.cash;
    _fareEstimate = null;
    _currentDelivery = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }
}
