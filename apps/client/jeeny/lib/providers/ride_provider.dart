import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/ride.dart';
import '../models/base_models.dart';
import '../models/enums.dart';
import '../services/ride_service.dart';
import '../services/firestore_service.dart';

enum RideState {
  idle,
  selectingLocations,
  loadingEstimates,
  selectingVehicle,
  searching,
  driverAccepted,
  driverArriving,
  driverArrived,
  inProgress,
  completed,
  cancelled,
  error,
}

/// Ride booking state provider
class RideProvider extends ChangeNotifier {
  final RideService _rideService = RideService();
  final FirestoreService _firestoreService = FirestoreService();

  RideState _state = RideState.idle;
  Ride? _currentRide;
  List<FareEstimate> _fareEstimates = [];
  Address? _pickup;
  Address? _dropoff;
  VehicleType? _selectedVehicleType;
  PaymentProvider _paymentMethod = PaymentProvider.cash;
  String? _promoCode;
  GeoLocation? _driverLocation;
  int? _driverEta;
  String? _errorMessage;
  bool _isLoading = false;

  StreamSubscription? _rideStatusSubscription;
  StreamSubscription? _driverLocationSubscription;

  RideState get state => _state;
  Ride? get currentRide => _currentRide;
  List<FareEstimate> get fareEstimates => _fareEstimates;
  Address? get pickup => _pickup;
  Address? get dropoff => _dropoff;
  VehicleType? get selectedVehicleType => _selectedVehicleType;
  PaymentProvider get paymentMethod => _paymentMethod;
  String? get promoCode => _promoCode;
  GeoLocation? get driverLocation => _driverLocation;
  int? get driverEta => _driverEta;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get hasActiveRide => _currentRide != null;

  /// Set pickup location
  void setPickup(Address address) {
    _pickup = address;
    _state = RideState.selectingLocations;
    notifyListeners();
  }

  /// Set dropoff location
  void setDropoff(Address address) {
    _dropoff = address;
    notifyListeners();
  }

  /// Get fare estimates
  Future<void> getFareEstimates() async {
    if (_pickup?.location == null || _dropoff?.location == null) {
      _errorMessage = 'يرجى تحديد نقطة الانطلاق والوصول';
      notifyListeners();
      return;
    }

    _state = RideState.loadingEstimates;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _fareEstimates = await _rideService.getFareEstimates(
        pickup: _pickup!.location!,
        dropoff: _dropoff!.location!,
      );
      _state = RideState.selectingVehicle;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _state = RideState.error;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Select vehicle type
  void selectVehicleType(VehicleType type) {
    _selectedVehicleType = type;
    notifyListeners();
  }

  /// Set payment method
  void setPaymentMethod(PaymentProvider method) {
    _paymentMethod = method;
    notifyListeners();
  }

  /// Apply promo code
  void setPromoCode(String? code) {
    _promoCode = code;
    notifyListeners();
  }

  /// Book a ride
  Future<void> bookRide() async {
    if (_pickup == null || _dropoff == null || _selectedVehicleType == null) {
      _errorMessage = 'يرجى إكمال جميع البيانات';
      notifyListeners();
      return;
    }

    _state = RideState.searching;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentRide = await _rideService.createRide(
        pickup: _pickup!,
        dropoff: _dropoff!,
        vehicleType: _selectedVehicleType!,
        paymentMethod: _paymentMethod,
        promoCode: _promoCode,
      );

      // Start listening to ride updates
      _startRideListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _state = RideState.error;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Start listening to ride updates
  void _startRideListeners() {
    if (_currentRide == null) return;

    // Listen to ride status
    _rideStatusSubscription?.cancel();
    _rideStatusSubscription = _firestoreService
        .watchRideStatus(_currentRide!.id)
        .listen(_onRideStatusChanged);

    // Listen to driver location
    _driverLocationSubscription?.cancel();
    _driverLocationSubscription = _firestoreService
        .watchDriverLocation(_currentRide!.id)
        .listen((location) {
      _driverLocation = location;
      notifyListeners();
    });
  }

  /// Handle ride status changes
  void _onRideStatusChanged(RideStatus? status) {
    if (status == null) return;

    switch (status) {
      case RideStatus.accepted:
        _state = RideState.driverAccepted;
        break;
      case RideStatus.driverArriving:
        _state = RideState.driverArriving;
        break;
      case RideStatus.driverArrived:
        _state = RideState.driverArrived;
        break;
      case RideStatus.inProgress:
        _state = RideState.inProgress;
        break;
      case RideStatus.completed:
        _state = RideState.completed;
        _stopRideListeners();
        break;
      case RideStatus.cancelled:
        _state = RideState.cancelled;
        _stopRideListeners();
        break;
      default:
        break;
    }

    notifyListeners();
  }

  /// Stop listening to ride updates
  void _stopRideListeners() {
    _rideStatusSubscription?.cancel();
    _driverLocationSubscription?.cancel();
    _rideStatusSubscription = null;
    _driverLocationSubscription = null;
  }

  /// Cancel current ride
  Future<void> cancelRide({String? reason}) async {
    if (_currentRide == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      await _rideService.cancelRide(_currentRide!.id, reason: reason);
      _state = RideState.cancelled;
      _stopRideListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Rate completed ride
  Future<void> rateRide({
    required int rating,
    String? comment,
    double? tipAmount,
  }) async {
    if (_currentRide == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      await _rideService.rateRide(
        rideId: _currentRide!.id,
        rating: rating,
        comment: comment,
        tipAmount: tipAmount,
      );
      reset();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Check for active ride on app start
  Future<void> checkActiveRide() async {
    try {
      _currentRide = await _rideService.getActiveRide();
      if (_currentRide != null) {
        _pickup = _currentRide!.pickup;
        _dropoff = _currentRide!.dropoff;
        _selectedVehicleType = _currentRide!.vehicleType;
        _paymentMethod = _currentRide!.paymentMethod;
        _onRideStatusChanged(_currentRide!.status);
        _startRideListeners();
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /// Reset state
  void reset() {
    _stopRideListeners();
    _state = RideState.idle;
    _currentRide = null;
    _fareEstimates = [];
    _pickup = null;
    _dropoff = null;
    _selectedVehicleType = null;
    _paymentMethod = PaymentProvider.cash;
    _promoCode = null;
    _driverLocation = null;
    _driverEta = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    if (_state == RideState.error) {
      _state = RideState.idle;
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _stopRideListeners();
    super.dispose();
  }
}
