import 'package:firebase_auth/firebase_auth.dart';
import '../core/storage/secure_storage.dart';
import '../models/user.dart' as app_models;

/// Authentication service with Firebase integration
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final SecureStorage _storage = SecureStorage();
  
  // Verification state
  String? _verificationId;
  int? _resendToken;
  
  /// Get current Firebase user
  User? get currentUser => _auth.currentUser;
  
  /// Check if user is logged in
  bool get isLoggedIn => _auth.currentUser != null;
  
  /// Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  
  /// Send OTP to phone number
  Future<String?> sendOtp({
    required String phoneNumber,
    required Function(String verificationId, int? resendToken) onCodeSent,
    required Function(String error) onError,
    Function(PhoneAuthCredential credential)? onAutoVerify,
  }) async {
    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Auto-verification on Android
          if (onAutoVerify != null) {
            onAutoVerify(credential);
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          String message = _getErrorMessage(e.code);
          onError(message);
        },
        codeSent: (String verificationId, int? resendToken) {
          _verificationId = verificationId;
          _resendToken = resendToken;
          onCodeSent(verificationId, resendToken);
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
        forceResendingToken: _resendToken,
      );
      return _verificationId;
    } catch (e) {
      onError(e.toString());
      return null;
    }
  }
  
  /// Verify OTP code
  Future<UserCredential?> verifyOtp({
    required String verificationId,
    required String otp,
  }) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: otp,
      );
      return await _auth.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      throw Exception(_getErrorMessage(e.code));
    }
  }
  
  /// Sign in with credential (for auto-verification)
  Future<UserCredential?> signInWithCredential(
    PhoneAuthCredential credential,
  ) async {
    try {
      return await _auth.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      throw Exception(_getErrorMessage(e.code));
    }
  }
  
  /// Get ID token for API calls
  Future<String?> getIdToken({bool forceRefresh = false}) async {
    try {
      return await _auth.currentUser?.getIdToken(forceRefresh);
    } catch (e) {
      return null;
    }
  }
  
  /// Save auth token to secure storage
  Future<void> saveToken(String token) async {
    await _storage.saveToken(token);
  }
  
  /// Get saved token
  Future<String?> getToken() async {
    return await _storage.getToken();
  }
  
  /// Sign out
  Future<void> signOut() async {
    await _auth.signOut();
    await _storage.deleteToken();
    _verificationId = null;
    _resendToken = null;
  }
  
  /// Delete account
  Future<void> deleteAccount() async {
    await _auth.currentUser?.delete();
    await _storage.deleteToken();
  }
  
  /// Get localized error message
  String _getErrorMessage(String code) {
    switch (code) {
      case 'invalid-phone-number':
        return 'رقم الهاتف غير صحيح';
      case 'too-many-requests':
        return 'تم إرسال عدد كبير من الطلبات. يرجى المحاولة لاحقاً';
      case 'invalid-verification-code':
        return 'رمز التحقق غير صحيح';
      case 'session-expired':
        return 'انتهت صلاحية الجلسة. يرجى إعادة إرسال الرمز';
      case 'network-request-failed':
        return 'فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت';
      case 'quota-exceeded':
        return 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً';
      default:
        return 'حدث خطأ غير متوقع';
    }
  }
}
