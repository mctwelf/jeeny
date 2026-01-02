import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

/// Authentication state provider
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  AuthStatus _status = AuthStatus.initial;
  User? _firebaseUser;
  String? _errorMessage;
  bool _needsProfileSetup = false;
  
  AuthStatus get status => _status;
  User? get firebaseUser => _firebaseUser;
  String? get userId => _firebaseUser?.uid;
  String? get phoneNumber => _firebaseUser?.phoneNumber;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get needsProfileSetup => _needsProfileSetup;
  
  AuthProvider() {
    // Listen to auth state changes
    _authService.authStateChanges.listen(_onAuthStateChanged);
  }
  
  void _onAuthStateChanged(User? user) {
    _firebaseUser = user;
    if (user != null) {
      _status = AuthStatus.authenticated;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }
  
  /// Check if user is already logged in
  Future<void> checkAuthStatus() async {
    _status = AuthStatus.loading;
    notifyListeners();
    
    final user = _authService.currentUser;
    if (user != null) {
      _firebaseUser = user;
      _status = AuthStatus.authenticated;
      // TODO: Check if profile exists in backend
      _needsProfileSetup = false;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }
  
  /// Send OTP to phone number
  Future<String?> sendOtp(String phoneNumber) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();
    
    String? verificationId;
    
    await _authService.sendOtp(
      phoneNumber: phoneNumber,
      onCodeSent: (vId, resendToken) {
        verificationId = vId;
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      },
      onError: (error) {
        _errorMessage = error;
        _status = AuthStatus.error;
        notifyListeners();
      },
      onAutoVerify: (credential) async {
        // Auto-verification on Android
        await _signInWithCredential(credential);
      },
    );
    
    // Wait a bit for the callback to complete
    await Future.delayed(const Duration(milliseconds: 500));
    
    return verificationId;
  }
  
  /// Verify OTP and sign in
  Future<bool> verifyOtp(String verificationId, String otp) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final userCredential = await _authService.verifyOtp(
        verificationId: verificationId,
        otp: otp,
      );
      
      if (userCredential != null) {
        _firebaseUser = userCredential.user;
        
        // Check if this is a new user
        _needsProfileSetup = userCredential.additionalUserInfo?.isNewUser ?? false;
        
        // Get and save token
        final token = await _authService.getIdToken();
        if (token != null) {
          await _authService.saveToken(token);
        }
        
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      }
      
      _status = AuthStatus.error;
      _errorMessage = 'فشل التحقق';
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }
  
  /// Sign in with credential (for auto-verification)
  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      final userCredential = await _authService.signInWithCredential(credential);
      if (userCredential != null) {
        _firebaseUser = userCredential.user;
        _needsProfileSetup = userCredential.additionalUserInfo?.isNewUser ?? false;
        
        final token = await _authService.getIdToken();
        if (token != null) {
          await _authService.saveToken(token);
        }
        
        _status = AuthStatus.authenticated;
        notifyListeners();
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _status = AuthStatus.error;
      notifyListeners();
    }
  }
  
  /// Refresh token
  Future<String?> refreshToken() async {
    try {
      final token = await _authService.getIdToken(forceRefresh: true);
      if (token != null) {
        await _authService.saveToken(token);
      }
      return token;
    } catch (e) {
      return null;
    }
  }
  
  /// Sign out
  Future<void> signOut() async {
    _status = AuthStatus.loading;
    notifyListeners();
    
    await _authService.signOut();
    
    _firebaseUser = null;
    _needsProfileSetup = false;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
  
  /// Delete account
  Future<bool> deleteAccount() async {
    _status = AuthStatus.loading;
    notifyListeners();
    
    try {
      await _authService.deleteAccount();
      _firebaseUser = null;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }
  
  /// Clear error
  void clearError() {
    _errorMessage = null;
    if (_status == AuthStatus.error) {
      _status = _firebaseUser != null 
          ? AuthStatus.authenticated 
          : AuthStatus.unauthenticated;
    }
    notifyListeners();
  }
  
  /// Mark profile setup as complete
  void markProfileSetupComplete() {
    _needsProfileSetup = false;
    notifyListeners();
  }
}
