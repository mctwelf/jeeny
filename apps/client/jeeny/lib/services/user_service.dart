import '../core/api/api_client.dart';
import '../models/user.dart';
import '../models/base_models.dart';

/// User profile service
class UserService {
  final ApiClient _apiClient = ApiClient();
  
  /// Get current user profile
  Future<Client?> getProfile() async {
    try {
      final response = await _apiClient.get('/users/me');
      
      if (response.isSuccess && response.data != null) {
        return Client.fromJson(response.data);
      }
      return null;
    } catch (e) {
      throw Exception('فشل تحميل الملف الشخصي');
    }
  }
  
  /// Create new user profile
  Future<Client> createProfile({
    required String name,
    String? email,
    required String phoneNumber,
    String? profileImageUrl,
  }) async {
    try {
      final response = await _apiClient.post('/users', data: {
        'name': name,
        if (email != null) 'email': email,
        'phoneNumber': phoneNumber,
        if (profileImageUrl != null) 'profileImageUrl': profileImageUrl,
      });
      
      if (response.isSuccess && response.data != null) {
        return Client.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل إنشاء الملف الشخصي');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل إنشاء الملف الشخصي');
    }
  }
  
  /// Update user profile
  Future<Client> updateProfile({
    String? name,
    String? email,
    String? profileImageUrl,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (email != null) data['email'] = email;
      if (profileImageUrl != null) data['profileImageUrl'] = profileImageUrl;
      
      final response = await _apiClient.patch('/users/me', data: data);
      
      if (response.isSuccess && response.data != null) {
        return Client.fromJson(response.data);
      }
      throw Exception(response.message ?? 'فشل تحديث الملف الشخصي');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل تحديث الملف الشخصي');
    }
  }
  
  /// Add saved address
  Future<void> addSavedAddress(SavedAddress address) async {
    try {
      final response = await _apiClient.post(
        '/users/me/addresses',
        data: address.toJson(),
      );
      
      if (!response.isSuccess) {
        throw Exception(response.message ?? 'فشل إضافة العنوان');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل إضافة العنوان');
    }
  }
  
  /// Remove saved address
  Future<void> removeSavedAddress(String addressId) async {
    try {
      final response = await _apiClient.delete('/users/me/addresses/$addressId');
      
      if (!response.isSuccess) {
        throw Exception(response.message ?? 'فشل حذف العنوان');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل حذف العنوان');
    }
  }
  
  /// Get saved addresses
  Future<List<SavedAddress>> getSavedAddresses() async {
    try {
      final response = await _apiClient.get('/users/me/addresses');
      
      if (response.isSuccess && response.data != null) {
        final List<dynamic> list = response.data;
        return list.map((e) => SavedAddress.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('فشل تحميل العناوين');
    }
  }
  
  /// Update user preferences
  Future<void> updatePreferences(UserPreferences preferences) async {
    try {
      final response = await _apiClient.patch(
        '/users/me/preferences',
        data: preferences.toJson(),
      );
      
      if (!response.isSuccess) {
        throw Exception(response.message ?? 'فشل تحديث التفضيلات');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('فشل تحديث التفضيلات');
    }
  }
}
