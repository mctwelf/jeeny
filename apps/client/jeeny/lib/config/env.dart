/// Environment configuration for Jeeny app
class Env {
  static const String _apiBaseUrlDev = 'http://localhost:8080';
  static const String _apiBaseUrlProd = 'https://api.jeeny.mr';
  
  static bool _isProduction = false;
  
  /// Initialize environment
  static Future<void> initialize() async {
    // TODO: Load from .env file or build config
    _isProduction = const bool.fromEnvironment('PRODUCTION', defaultValue: false);
  }
  
  /// API base URL
  static String get apiBaseUrl => _isProduction ? _apiBaseUrlProd : _apiBaseUrlDev;
  
  /// Is production environment
  static bool get isProduction => _isProduction;
  
  /// Firebase configuration
  static const String firebaseProjectId = 'jeeny-platforme';
  
  /// Agora App ID for voice calls
  static const String agoraAppId = 'fe83835e54434424b8942f259877949a';
  
  /// Google Maps API Key
  static const String googleMapsApiKey = 'AIzaSyA2z33NNl1xoScU66NtsBShAIfMdZZ1nR8';
}
