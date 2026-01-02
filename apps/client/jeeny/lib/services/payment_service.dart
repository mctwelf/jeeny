import '../core/api_client.dart';
import '../models/payment.dart';
import '../models/enums.dart';

/// Service for payment operations
class PaymentService {
  final ApiClient _apiClient;

  PaymentService(this._apiClient);

  /// Get all payment methods for the current user
  Future<List<PaymentMethod>> getPaymentMethods() async {
    final response = await _apiClient.get('/payments/methods');
    final List<dynamic> data = response.data['methods'] ?? [];
    return data.map((json) => PaymentMethod.fromJson(json)).toList();
  }

  /// Add a new payment method
  Future<PaymentMethod> addPaymentMethod({
    required PaymentProvider provider,
    required String accountNumber,
    String? accountName,
  }) async {
    final response = await _apiClient.post('/payments/methods', data: {
      'provider': provider.name,
      'accountNumber': accountNumber,
      if (accountName != null) 'accountName': accountName,
    });

    return PaymentMethod.fromJson(response.data['method']);
  }

  /// Remove a payment method
  Future<void> removePaymentMethod(String methodId) async {
    await _apiClient.delete('/payments/methods/$methodId');
  }

  /// Set default payment method
  Future<void> setDefaultPaymentMethod(String methodId) async {
    await _apiClient.post('/payments/methods/$methodId/default');
  }

  /// Initiate a payment
  Future<Transaction> initiatePayment({
    required String rideId,
    required PaymentProvider provider,
    required double amount,
    String? paymentMethodId,
  }) async {
    final response = await _apiClient.post('/payments/initiate', data: {
      'rideId': rideId,
      'provider': provider.name,
      'amount': amount,
      if (paymentMethodId != null) 'paymentMethodId': paymentMethodId,
    });

    return Transaction.fromJson(response.data['transaction']);
  }

  /// Confirm a payment (after mobile money confirmation)
  Future<Transaction> confirmPayment(String transactionId, {
    String? confirmationCode,
  }) async {
    final response = await _apiClient.post(
      '/payments/confirm/$transactionId',
      data: {if (confirmationCode != null) 'confirmationCode': confirmationCode},
    );

    return Transaction.fromJson(response.data['transaction']);
  }

  /// Get transaction history
  Future<List<Transaction>> getTransactionHistory({
    int page = 1,
    int limit = 20,
    TransactionType? type,
    TransactionStatus? status,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (type != null) queryParams['type'] = type.name;
    if (status != null) queryParams['status'] = status.name;

    final response = await _apiClient.get(
      '/payments/transactions',
      queryParameters: queryParams,
    );

    final List<dynamic> data = response.data['transactions'] ?? [];
    return data.map((json) => Transaction.fromJson(json)).toList();
  }

  /// Get a single transaction
  Future<Transaction> getTransaction(String transactionId) async {
    final response = await _apiClient.get('/payments/transactions/$transactionId');
    return Transaction.fromJson(response.data['transaction']);
  }

  /// Get wallet balance and info
  Future<Wallet> getWallet() async {
    final response = await _apiClient.get('/wallet');
    return Wallet.fromJson(response.data['wallet']);
  }

  /// Top up wallet
  Future<Transaction> topUpWallet({
    required PaymentProvider provider,
    required double amount,
    String? paymentMethodId,
  }) async {
    final response = await _apiClient.post('/wallet/topup', data: {
      'provider': provider.name,
      'amount': amount,
      if (paymentMethodId != null) 'paymentMethodId': paymentMethodId,
    });

    return Transaction.fromJson(response.data['transaction']);
  }

  /// Withdraw from wallet
  Future<Transaction> withdrawFromWallet({
    required PaymentProvider provider,
    required double amount,
    required String accountNumber,
  }) async {
    final response = await _apiClient.post('/wallet/withdraw', data: {
      'provider': provider.name,
      'amount': amount,
      'accountNumber': accountNumber,
    });

    return Transaction.fromJson(response.data['transaction']);
  }

  /// Get wallet transaction history
  Future<List<Transaction>> getWalletTransactions({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get(
      '/wallet/transactions',
      queryParameters: {'page': page, 'limit': limit},
    );

    final List<dynamic> data = response.data['transactions'] ?? [];
    return data.map((json) => Transaction.fromJson(json)).toList();
  }

  /// Apply promo code
  Future<Map<String, dynamic>> applyPromoCode(String code, {
    String? rideId,
    double? amount,
  }) async {
    final response = await _apiClient.post('/payments/promo/apply', data: {
      'code': code,
      if (rideId != null) 'rideId': rideId,
      if (amount != null) 'amount': amount,
    });

    return response.data;
  }
}
