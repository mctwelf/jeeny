import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';
import 'user.dart';

/// Package delivery info
class PackageDeliveryInfo extends Equatable {
  final String id;
  final String clientId;
  final String? driverId;
  final Address pickup;
  final Address dropoff;
  final String senderName;
  final String senderPhone;
  final String recipientName;
  final String recipientPhone;
  final String? packageDescription;
  final PackageSize packageSize;
  final double? weight;
  final bool fragile;
  final DeliveryStatus status;
  final Money fare;
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final Driver? driver;
  final DateTime? pickedUpAt;
  final DateTime? deliveredAt;
  final DateTime createdAt;

  const PackageDeliveryInfo({
    required this.id,
    required this.clientId,
    this.driverId,
    required this.pickup,
    required this.dropoff,
    required this.senderName,
    required this.senderPhone,
    required this.recipientName,
    required this.recipientPhone,
    this.packageDescription,
    required this.packageSize,
    this.weight,
    this.fragile = false,
    required this.status,
    required this.fare,
    required this.paymentMethod,
    required this.paymentStatus,
    this.driver,
    this.pickedUpAt,
    this.deliveredAt,
    required this.createdAt,
  });

  factory PackageDeliveryInfo.fromJson(Map<String, dynamic> json) {
    return PackageDeliveryInfo(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      driverId: json['driverId'] as String?,
      pickup: Address.fromJson(json['pickup'] as Map<String, dynamic>),
      dropoff: Address.fromJson(json['dropoff'] as Map<String, dynamic>),
      senderName: json['senderName'] as String,
      senderPhone: json['senderPhone'] as String,
      recipientName: json['recipientName'] as String,
      recipientPhone: json['recipientPhone'] as String,
      packageDescription: json['packageDescription'] as String?,
      packageSize: PackageSize.values.firstWhere(
        (e) => e.name == json['packageSize'],
        orElse: () => PackageSize.medium,
      ),
      weight: (json['weight'] as num?)?.toDouble(),
      fragile: json['fragile'] as bool? ?? false,
      status: DeliveryStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => DeliveryStatus.pending,
      ),
      fare: Money.fromJson(json['fare'] as Map<String, dynamic>),
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['paymentStatus'],
        orElse: () => PaymentStatus.pending,
      ),
      driver: json['driver'] != null
          ? Driver.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      pickedUpAt: json['pickedUpAt'] != null
          ? DateTime.parse(json['pickedUpAt'] as String)
          : null,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'clientId': clientId,
        if (driverId != null) 'driverId': driverId,
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'senderName': senderName,
        'senderPhone': senderPhone,
        'recipientName': recipientName,
        'recipientPhone': recipientPhone,
        if (packageDescription != null) 'packageDescription': packageDescription,
        'packageSize': packageSize.name,
        if (weight != null) 'weight': weight,
        'fragile': fragile,
        'status': status.name,
        'fare': fare.toJson(),
        'paymentMethod': paymentMethod.name,
        'paymentStatus': paymentStatus.name,
        if (driver != null) 'driver': driver!.toJson(),
        if (pickedUpAt != null) 'pickedUpAt': pickedUpAt!.toIso8601String(),
        if (deliveredAt != null) 'deliveredAt': deliveredAt!.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, status];
}
