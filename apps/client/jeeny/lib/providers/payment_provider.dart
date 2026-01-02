import 'package:flutter/foundation.dart';
import '../models/payment.dart';
import '../models/enums.dart' as enums;
import '../services/payment_service.dart';

/// Payment state provider
class PaymentProvider extends ChangeNotifier {
  final PaymentService _paymentService;

  PaymentProvider(this._paymentService);

  // State
  List<PaymentMethod> _paymentMethods = [];
  Wallet? _wallet;
  List<Transaction> _transactions = [];
  Transaction? _currentTransaction;
  bool _isLoading = false;
  String? _error;

  // Pagination
  int _currentPage = 1;
  bool _hasMoreTransactions = true;

  // Getters
  List<PaymentMethod> get paymentMethods => _paymentMethods;
  PaymentMethod? get defaultPaymentMethod =>
      _paymentMethods.where((m) => m.isDefault).firstOrNull;
  Wallet? get wallet => _wallet;
  List<Transaction> get transactions => _transactions;
  Transaction? get currentTransaction => _currentTransaction;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMoreTransactions => _hasMoreTransactions;

  /// Load payment methods
  Future<void> loadPaymentMethods() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _paymentMethods = await _paymentService.getPaymentMethods();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Add a new payment method
  Future<bool> addPaymentMethod({
    required enums.PaymentProvider provider,
    required String accountNumber,
    String? accountName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final method = await _paymentService.addPaymentMethod(
        provider: provider,
        accountNumber: accountNumber,
        accountName: accountName,
      );
      _paymentMethods.add(method);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Remove a payment method
  Future<bool> removePaymentMethod(String methodId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _paymentService.removePaymentMethod(methodId);
      _paymentMethods.removeWhere((m) => m.id == methodId);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Set default payment method
  Future<bool> setDefaultPaymentMethod(String methodId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _paymentService.setDefaultPaymentMethod(methodId);
      // Update local state
      _paymentMethods = _paymentMethods.map((m) {
        if (m.id == methodId) {
          return PaymentMethod(
            id: m.id,
            provider: m.provider,
            accountNumber: m.accountNumber,
            maskedNumber: m.maskedNumber,
            isDefault: true,
            isVerified: m.isVerified,
            createdAt: m.createdAt,
          );
        } else if (m.isDefault) {
          return PaymentMethod(
            id: m.id,
            provider: m.provider,
            accountNumber: m.accountNumber,
            maskedNumber: m.maskedNumber,
            isDefault: false,
            isVerified: m.isVerified,
            createdAt: m.createdAt,
          );
        }
        return m;
      }).toList();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load wallet info
  Future<void> loadWallet() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _wallet = await _paymentService.getWallet();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Initiate a payment
  Future<Transaction?> initiatePayment({
    required String rideId,
    required enums.PaymentProvider provider,
    required double amount,
    String? paymentMethodId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentTransaction = await _paymentService.initiatePayment(
        rideId: rideId,
        provider: provider,
        amount: amount,
        paymentMethodId: paymentMethodId,
      );
      return _currentTransaction;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Confirm a payment
  Future<Transaction?> confirmPayment(String transactionId, {
    String? confirmationCode,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentTransaction = await _paymentService.confirmPayment(
        transactionId,
        confirmationCode: confirmationCode,
      );
      return _currentTransaction;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load transaction history
  Future<void> loadTransactions({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMoreTransactions = true;
      _transactions = [];
    }

    if (!_hasMoreTransactions) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newTransactions = await _paymentService.getTransactionHistory(
        page: _currentPage,
      );

      if (newTransactions.isEmpty) {
        _hasMoreTransactions = false;
      } else {
        _transactions.addAll(newTransactions);
        _currentPage++;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Top up wallet
  Future<Transaction?> topUpWallet({
    required enums.PaymentProvider provider,
    required double amount,
    String? paymentMethodId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final transaction = await _paymentService.topUpWallet(
        provider: provider,
        amount: amount,
        paymentMethodId: paymentMethodId,
      );
      // Refresh wallet balance
      await loadWallet();
      return transaction;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Withdraw from wallet
  Future<Transaction?> withdrawFromWallet({
    required enums.PaymentProvider provider,
    required double amount,
    required String accountNumber,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final transaction = await _paymentService.withdrawFromWallet(
        provider: provider,
        amount: amount,
        accountNumber: accountNumber,
      );
      // Refresh wallet balance
      await loadWallet();
      return transaction;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Apply promo code
  Future<Map<String, dynamic>?> applyPromoCode(String code, {
    String? rideId,
    double? amount,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _paymentService.applyPromoCode(
        code,
        rideId: rideId,
        amount: amount,
      );
      return result;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear current transaction
  void clearCurrentTransaction() {
    _currentTransaction = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
