import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';

/// Payment method model
class PaymentMethod extends Equatable {
  final String id;
  final PaymentProvider provider;
  final String? accountNumber;
  final String? maskedNumber;
  final bool isDefault;
  final bool isVerified;
  final DateTime createdAt;

  const PaymentMethod({
    required this.id,
    required this.provider,
    this.accountNumber,
    this.maskedNumber,
    this.isDefault = false,
    this.isVerified = false,
    required this.createdAt,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      id: json['id'] as String,
      provider: PaymentProvider.values.firstWhere(
        (e) => e.name == json['provider'],
        orElse: () => PaymentProvider.cash,
      ),
      accountNumber: json['accountNumber'] as String?,
      maskedNumber: json['maskedNumber'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'provider': provider.name,
        if (accountNumber != null) 'accountNumber': accountNumber,
        if (maskedNumber != null) 'maskedNumber': maskedNumber,
        'isDefault': isDefault,
        'isVerified': isVerified,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, provider, isDefault];
}

/// Transaction model
class Transaction extends Equatable {
  final String id;
  final String userId;
  final TransactionType type;
  final TransactionStatus status;
  final Money amount;
  final PaymentProvider paymentProvider;
  final String? referenceId;
  final String? description;
  final String? rideId;
  final String? orderId;
  final DateTime createdAt;
  final DateTime? completedAt;

  const Transaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.status,
    required this.amount,
    required this.paymentProvider,
    this.referenceId,
    this.description,
    this.rideId,
    this.orderId,
    required this.createdAt,
    this.completedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: TransactionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TransactionType.payment,
      ),
      status: TransactionStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TransactionStatus.pending,
      ),
      amount: Money.fromJson(json['amount'] as Map<String, dynamic>),
      paymentProvider: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentProvider'],
        orElse: () => PaymentProvider.cash,
      ),
      referenceId: json['referenceId'] as String?,
      description: json['description'] as String?,
      rideId: json['rideId'] as String?,
      orderId: json['orderId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.name,
        'status': status.name,
        'amount': amount.toJson(),
        'paymentProvider': paymentProvider.name,
        if (referenceId != null) 'referenceId': referenceId,
        if (description != null) 'description': description,
        if (rideId != null) 'rideId': rideId,
        if (orderId != null) 'orderId': orderId,
        'createdAt': createdAt.toIso8601String(),
        if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, type, status, amount];
}

/// Wallet model
class Wallet extends Equatable {
  final String userId;
  final Money balance;
  final bool isActive;
  final DateTime updatedAt;

  const Wallet({
    required this.userId,
    required this.balance,
    this.isActive = true,
    required this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      userId: json['userId'] as String,
      balance: Money.fromJson(json['balance'] as Map<String, dynamic>),
      isActive: json['isActive'] as bool? ?? true,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'balance': balance.toJson(),
        'isActive': isActive,
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [userId, balance, isActive];
}

/// Payment request model
class PaymentRequest extends Equatable {
  final Money amount;
  final PaymentProvider provider;
  final String? rideId;
  final String? orderId;
  final String? description;

  const PaymentRequest({
    required this.amount,
    required this.provider,
    this.rideId,
    this.orderId,
    this.description,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount.toJson(),
        'provider': provider.name,
        if (rideId != null) 'rideId': rideId,
        if (orderId != null) 'orderId': orderId,
        if (description != null) 'description': description,
      };

  @override
  List<Object?> get props => [amount, provider, rideId, orderId];
}

/// Top up request model
class TopUpRequest extends Equatable {
  final Money amount;
  final PaymentProvider provider;
  final String? accountNumber;

  const TopUpRequest({
    required this.amount,
    required this.provider,
    this.accountNumber,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount.toJson(),
        'provider': provider.name,
        if (accountNumber != null) 'accountNumber': accountNumber,
      };

  @override
  List<Object?> get props => [amount, provider];
}
