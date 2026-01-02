import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/user_service.dart';

/// User state and preferences provider
class UserProvider extends ChangeNotifier {
  final UserService _userService = UserService();
  
  Locale _locale = const Locale('ar'); // Arabic as default
  bool _isLoading = false;
  Client? _user;
  String? _errorMessage;
  
  Locale get locale => _locale;
  bool get isLoading => _isLoading;
  bool get isRtl => _locale.languageCode == 'ar';
  Client? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get hasProfile => _user != null;
  
  UserProvider() {
    _loadLocale();
  }
  
  /// Load saved locale preference
  Future<void> _loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final languageCode = prefs.getString('language') ?? 'ar';
    _locale = Locale(languageCode);
    notifyListeners();
  }
  
  /// Change app language
  Future<void> setLocale(Locale locale) async {
    if (_locale == locale) return;
    
    _locale = locale;
    notifyListeners();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', locale.languageCode);
  }
  
  /// Set loading state
  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
  
  /// Load user profile
  Future<void> loadProfile() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      _user = await _userService.getProfile();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Create new user profile
  Future<void> createProfile({
    required String name,
    String? email,
    required String phoneNumber,
    String? profileImageUrl,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      _user = await _userService.createProfile(
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        profileImageUrl: profileImageUrl,
      );
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  /// Update user profile
  Future<void> updateProfile({
    String? name,
    String? email,
    String? profileImageUrl,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      _user = await _userService.updateProfile(
        name: name,
        email: email,
        profileImageUrl: profileImageUrl,
      );
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  /// Add saved address
  Future<void> addSavedAddress(SavedAddress address) async {
    if (_user == null) return;
    
    try {
      await _userService.addSavedAddress(address);
      await loadProfile(); // Reload to get updated addresses
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }
  
  /// Remove saved address
  Future<void> removeSavedAddress(String addressId) async {
    if (_user == null) return;
    
    try {
      await _userService.removeSavedAddress(addressId);
      await loadProfile(); // Reload to get updated addresses
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }
  
  /// Clear user data (on logout)
  void clearUser() {
    _user = null;
    _errorMessage = null;
    notifyListeners();
  }
  
  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
