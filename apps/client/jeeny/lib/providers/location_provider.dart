import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/base_models.dart';
import '../services/location_service.dart';

enum LocationStatus {
  initial,
  loading,
  granted,
  denied,
  deniedForever,
  serviceDisabled,
  error,
}

/// Location state provider
class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = LocationService();
  
  LocationStatus _status = LocationStatus.initial;
  GeoLocation? _currentLocation;
  String? _errorMessage;
  StreamSubscription<GeoLocation>? _locationSubscription;
  
  LocationStatus get status => _status;
  GeoLocation? get currentLocation => _currentLocation;
  String? get errorMessage => _errorMessage;
  bool get hasLocation => _currentLocation != null;
  
  /// Initialize and check permissions
  Future<void> initialize() async {
    _status = LocationStatus.loading;
    notifyListeners();
    
    // Check if location service is enabled
    final serviceEnabled = await _locationService.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _status = LocationStatus.serviceDisabled;
      _errorMessage = 'خدمة الموقع غير مفعلة';
      notifyListeners();
      return;
    }
    
    // Check permission
    final permission = await _locationService.checkPermission();
    
    switch (permission) {
      case LocationPermission.denied:
        _status = LocationStatus.denied;
        _errorMessage = 'تم رفض إذن الموقع';
        break;
      case LocationPermission.deniedForever:
        _status = LocationStatus.deniedForever;
        _errorMessage = 'تم رفض إذن الموقع بشكل دائم';
        break;
      case LocationPermission.whileInUse:
      case LocationPermission.always:
        _status = LocationStatus.granted;
        await _getCurrentLocation();
        break;
      default:
        _status = LocationStatus.error;
        _errorMessage = 'خطأ في التحقق من الإذن';
    }
    
    notifyListeners();
  }
  
  /// Get current location
  Future<void> _getCurrentLocation() async {
    try {
      _currentLocation = await _locationService.getCurrentLocation();
      if (_currentLocation == null) {
        // Try last known location
        _currentLocation = await _locationService.getLastKnownLocation();
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
  }
  
  /// Refresh current location
  Future<void> refreshLocation() async {
    if (_status != LocationStatus.granted) {
      await initialize();
      return;
    }
    
    _status = LocationStatus.loading;
    notifyListeners();
    
    await _getCurrentLocation();
    
    _status = LocationStatus.granted;
    notifyListeners();
  }
  
  /// Start watching location
  void startWatching({int distanceFilter = 10}) {
    if (_status != LocationStatus.granted) return;
    
    _locationSubscription?.cancel();
    _locationSubscription = _locationService
        .watchLocation(distanceFilter: distanceFilter)
        .listen(
      (location) {
        _currentLocation = location;
        notifyListeners();
      },
      onError: (error) {
        _errorMessage = error.toString();
        notifyListeners();
      },
    );
  }
  
  /// Stop watching location
  void stopWatching() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
  }
  
  /// Calculate distance to a location
  double? distanceTo(GeoLocation destination) {
    if (_currentLocation == null) return null;
    return _locationService.calculateDistance(_currentLocation!, destination);
  }
  
  /// Open location settings
  Future<void> openSettings() async {
    if (_status == LocationStatus.serviceDisabled) {
      await _locationService.openLocationSettings();
    } else if (_status == LocationStatus.deniedForever) {
      await _locationService.openAppSettings();
    }
  }
  
  /// Request permission again
  Future<void> requestPermission() async {
    await initialize();
  }
  
  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
  
  @override
  void dispose() {
    _locationSubscription?.cancel();
    _locationService.dispose();
    super.dispose();
  }
}
