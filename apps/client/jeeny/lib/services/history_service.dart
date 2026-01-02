import '../core/api_client.dart';
import '../models/ride.dart';
import '../models/enums.dart';

/// Service for ride history operations
class HistoryService {
  final ApiClient _apiClient;

  HistoryService(this._apiClient);

  /// Get ride history with filters
  Future<List<Ride>> getRideHistory({
    int page = 1,
    int limit = 20,
    RideStatus? status,
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (status != null) queryParams['status'] = status.name;
    if (fromDate != null) queryParams['fromDate'] = fromDate.toIso8601String();
    if (toDate != null) queryParams['toDate'] = toDate.toIso8601String();

    final response = await _apiClient.get(
      '/rides/history',
      queryParameters: queryParams,
    );

    final List<dynamic> data = response.data['rides'] ?? [];
    return data.map((json) => Ride.fromJson(json)).toList();
  }

  /// Get ride details with receipt
  Future<Map<String, dynamic>> getRideDetails(String rideId) async {
    final response = await _apiClient.get('/rides/$rideId/details');
    return response.data;
  }

  /// Get ride receipt
  Future<Map<String, dynamic>> getRideReceipt(String rideId) async {
    final response = await _apiClient.get('/rides/$rideId/receipt');
    return response.data;
  }

  /// Request ride receipt by email
  Future<void> sendReceiptByEmail(String rideId, String email) async {
    await _apiClient.post('/rides/$rideId/receipt/email', data: {
      'email': email,
    });
  }
}
