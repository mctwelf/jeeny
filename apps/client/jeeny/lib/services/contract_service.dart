import '../core/api_client.dart';
import '../models/contract.dart';
import '../models/enums.dart';

/// Service for contract operations
class ContractService {
  final ApiClient _apiClient;

  ContractService(this._apiClient);

  /// Get all contracts for the current user
  Future<List<Contract>> getContracts({
    ContractStatus? status,
    ContractType? type,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status.name;
    if (type != null) queryParams['type'] = type.name;

    final response = await _apiClient.get(
      '/contracts',
      queryParameters: queryParams,
    );

    final List<dynamic> data = response.data['contracts'] ?? [];
    return data.map((json) {
      if (json['type'] == ContractType.school.name) {
        return SchoolContract.fromJson(json);
      }
      return Contract.fromJson(json);
    }).toList();
  }

  /// Get a single contract by ID
  Future<Contract> getContract(String contractId) async {
    final response = await _apiClient.get('/contracts/$contractId');
    final json = response.data['contract'];
    if (json['type'] == ContractType.school.name) {
      return SchoolContract.fromJson(json);
    }
    return Contract.fromJson(json);
  }

  /// Create a new contract
  Future<Contract> createContract({
    required ContractType type,
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required List<Map<String, dynamic>> schedule,
    required DateTime startDate,
    DateTime? endDate,
    required String paymentMethod,
    String? notes,
  }) async {
    final response = await _apiClient.post('/contracts', data: {
      'type': type.name,
      'pickup': pickup,
      'dropoff': dropoff,
      'schedule': schedule,
      'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
      'paymentMethod': paymentMethod,
      if (notes != null) 'notes': notes,
    });

    return Contract.fromJson(response.data['contract']);
  }

  /// Create a school contract
  Future<SchoolContract> createSchoolContract({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> schoolAddress,
    required String schoolName,
    required List<Map<String, dynamic>> students,
    required List<Map<String, dynamic>> schedule,
    required DateTime startDate,
    DateTime? endDate,
    required String paymentMethod,
    String? notes,
  }) async {
    final response = await _apiClient.post('/contracts/school', data: {
      'type': ContractType.school.name,
      'pickup': pickup,
      'dropoff': schoolAddress,
      'schoolAddress': schoolAddress,
      'schoolName': schoolName,
      'students': students,
      'schedule': schedule,
      'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
      'paymentMethod': paymentMethod,
      if (notes != null) 'notes': notes,
    });

    return SchoolContract.fromJson(response.data['contract']);
  }

  /// Update an existing contract
  Future<Contract> updateContract(
    String contractId, {
    List<Map<String, dynamic>>? schedule,
    String? paymentMethod,
    String? notes,
  }) async {
    final response = await _apiClient.patch('/contracts/$contractId', data: {
      if (schedule != null) 'schedule': schedule,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (notes != null) 'notes': notes,
    });

    return Contract.fromJson(response.data['contract']);
  }

  /// Pause a contract
  Future<Contract> pauseContract(String contractId) async {
    final response = await _apiClient.post('/contracts/$contractId/pause');
    return Contract.fromJson(response.data['contract']);
  }

  /// Resume a paused contract
  Future<Contract> resumeContract(String contractId) async {
    final response = await _apiClient.post('/contracts/$contractId/resume');
    return Contract.fromJson(response.data['contract']);
  }

  /// Cancel a contract
  Future<Contract> cancelContract(String contractId, {String? reason}) async {
    final response = await _apiClient.post(
      '/contracts/$contractId/cancel',
      data: {if (reason != null) 'reason': reason},
    );
    return Contract.fromJson(response.data['contract']);
  }

  /// Get contract usage statistics
  Future<ContractUsage> getUsage(String contractId, {
    DateTime? periodStart,
    DateTime? periodEnd,
  }) async {
    final queryParams = <String, dynamic>{};
    if (periodStart != null) {
      queryParams['periodStart'] = periodStart.toIso8601String();
    }
    if (periodEnd != null) {
      queryParams['periodEnd'] = periodEnd.toIso8601String();
    }

    final response = await _apiClient.get(
      '/contracts/$contractId/usage',
      queryParameters: queryParams,
    );

    return ContractUsage.fromJson(response.data['usage']);
  }

  /// Create a trip for a contract
  Future<void> createContractTrip(
    String contractId, {
    required DateTime scheduledTime,
    bool isReturn = false,
  }) async {
    await _apiClient.post('/contracts/$contractId/trips', data: {
      'scheduledTime': scheduledTime.toIso8601String(),
      'isReturn': isReturn,
    });
  }

  /// Get estimated monthly price for a contract
  Future<double> getEstimatedPrice({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required List<Map<String, dynamic>> schedule,
    required ContractType type,
  }) async {
    final response = await _apiClient.post('/contracts/estimate', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'schedule': schedule,
      'type': type.name,
    });

    return (response.data['estimatedPrice'] as num).toDouble();
  }
}
