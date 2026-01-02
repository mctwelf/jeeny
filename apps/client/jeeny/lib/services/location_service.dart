import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../models/base_models.dart';

/// Location service for GPS and geocoding
class LocationService {
  StreamSubscription<Position>? _positionSubscription;
  
  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }
  
  /// Check and request location permission
  Future<LocationPermission> checkPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    
    return permission;
  }
  
  /// Get current location
  Future<GeoLocation?> getCurrentLocation() async {
    try {
      final permission = await checkPermission();
      
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }
      
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      return GeoLocation(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    } catch (e) {
      return null;
    }
  }
  
  /// Get last known location (faster but may be outdated)
  Future<GeoLocation?> getLastKnownLocation() async {
    try {
      final position = await Geolocator.getLastKnownPosition();
      
      if (position == null) return null;
      
      return GeoLocation(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    } catch (e) {
      return null;
    }
  }
  
  /// Watch location changes
  Stream<GeoLocation> watchLocation({
    int distanceFilter = 10,
    LocationAccuracy accuracy = LocationAccuracy.high,
  }) {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: accuracy,
        distanceFilter: distanceFilter,
      ),
    ).map((position) => GeoLocation(
          latitude: position.latitude,
          longitude: position.longitude,
        ));
  }
  
  /// Calculate distance between two points in meters
  double calculateDistance(GeoLocation from, GeoLocation to) {
    return Geolocator.distanceBetween(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude,
    );
  }
  
  /// Calculate bearing between two points
  double calculateBearing(GeoLocation from, GeoLocation to) {
    return Geolocator.bearingBetween(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude,
    );
  }
  
  /// Open location settings
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }
  
  /// Open app settings (for permission)
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }
  
  /// Stop watching location
  void stopWatching() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }
  
  /// Dispose resources
  void dispose() {
    stopWatching();
  }
}
