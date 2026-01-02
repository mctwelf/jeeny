import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static const _expirationSuffix = '_expiration';
  
  SharedPreferences? _prefs;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  /// Save data with optional expiration
  Future<bool> set<T>(
    String key,
    T value, {
    Duration? expiration,
  }) async {
    final prefs = await _preferences;
    
    bool result;
    if (value is String) {
      result = await prefs.setString(key, value);
    } else if (value is int) {
      result = await prefs.setInt(key, value);
    } else if (value is double) {
      result = await prefs.setDouble(key, value);
    } else if (value is bool) {
      result = await prefs.setBool(key, value);
    } else if (value is List<String>) {
      result = await prefs.setStringList(key, value);
    } else {
      // For complex objects, serialize to JSON
      result = await prefs.setString(key, jsonEncode(value));
    }
    
    // Save expiration time if provided
    if (expiration != null && result) {
      final expirationTime = DateTime.now().add(expiration).millisecondsSinceEpoch;
      await prefs.setInt('$key$_expirationSuffix', expirationTime);
    }
    
    return result;
  }

  /// Get cached data
  Future<T?> get<T>(String key) async {
    final prefs = await _preferences;
    
    // Check if expired
    if (await _isExpired(key)) {
      await remove(key);
      return null;
    }
    
    final value = prefs.get(key);
    if (value == null) return null;
    
    if (T == String || T == int || T == double || T == bool) {
      return value as T?;
    }
    
    // For complex objects, try to decode JSON
    if (value is String) {
      try {
        return jsonDecode(value) as T?;
      } catch (_) {
        return value as T?;
      }
    }
    
    return value as T?;
  }

  /// Get cached JSON object
  Future<Map<String, dynamic>?> getJson(String key) async {
    final prefs = await _preferences;
    
    if (await _isExpired(key)) {
      await remove(key);
      return null;
    }
    
    final value = prefs.getString(key);
    if (value == null) return null;
    
    try {
      return jsonDecode(value) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Save JSON object
  Future<bool> setJson(
    String key,
    Map<String, dynamic> value, {
    Duration? expiration,
  }) async {
    return set(key, jsonEncode(value), expiration: expiration);
  }

  /// Check if key exists and is not expired
  Future<bool> has(String key) async {
    final prefs = await _preferences;
    
    if (!prefs.containsKey(key)) return false;
    if (await _isExpired(key)) {
      await remove(key);
      return false;
    }
    
    return true;
  }

  /// Remove cached data
  Future<bool> remove(String key) async {
    final prefs = await _preferences;
    await prefs.remove('$key$_expirationSuffix');
    return prefs.remove(key);
  }

  /// Clear all cached data
  Future<bool> clear() async {
    final prefs = await _preferences;
    return prefs.clear();
  }

  /// Check if cached data is expired
  Future<bool> _isExpired(String key) async {
    final prefs = await _preferences;
    final expirationTime = prefs.getInt('$key$_expirationSuffix');
    
    if (expirationTime == null) return false;
    
    return DateTime.now().millisecondsSinceEpoch > expirationTime;
  }

  /// Get remaining time until expiration
  Future<Duration?> getTimeToExpiration(String key) async {
    final prefs = await _preferences;
    final expirationTime = prefs.getInt('$key$_expirationSuffix');
    
    if (expirationTime == null) return null;
    
    final remaining = expirationTime - DateTime.now().millisecondsSinceEpoch;
    if (remaining <= 0) return Duration.zero;
    
    return Duration(milliseconds: remaining);
  }
}
