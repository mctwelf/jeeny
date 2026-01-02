import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';
import 'user.dart';

/// Ride model
class Ride extends Equatable {
  final String id;
  final String clientId;
  final String? driverId;
  final Address pickup;
  final Address dropoff;
  final RideStatus status;
  final VehicleType vehicleType;
  final Money fare;
  final Money? tip;
  final double? distance; // in meters
  final int? duration; // in seconds
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final RideSpecialRequests? specialRequests;
  final Driver? driver;
  final double? rating;
  final String? ratingComment;
  final DateTime? scheduledAt;
  final DateTime? acceptedAt;
  final DateTime? arrivedAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? cancelledAt;
  final String? cancellationReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Ride({
    required this.id,
    required this.clientId,
    this.driverId,
    required this.pickup,
    required this.dropoff,
    required this.status,
    required this.vehicleType,
    required this.fare,
    this.tip,
    this.distance,
    this.duration,
    required this.paymentMethod,
    this.paymentStatus = PaymentStatus.pending,
    this.specialRequests,
    this.driver,
    this.rating,
    this.ratingComment,
    this.scheduledAt,
    this.acceptedAt,
    this.arrivedAt,
    this.startedAt,
    this.completedAt,
    this.cancelledAt,
    this.cancellationReason,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      driverId: json['driverId'] as String?,
      pickup: Address.fromJson(json['pickup'] as Map<String, dynamic>),
      dropoff: Address.fromJson(json['dropoff'] as Map<String, dynamic>),
      status: RideStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => RideStatus.pending,
      ),
      vehicleType: VehicleType.values.firstWhere(
        (e) => e.name == json['vehicleType'],
        orElse: () => VehicleType.economy,
      ),
      fare: Money.fromJson(json['fare'] as Map<String, dynamic>),
      tip: json['tip'] != null
          ? Money.fromJson(json['tip'] as Map<String, dynamic>)
          : null,
      distance: (json['distance'] as num?)?.toDouble(),
      duration: json['duration'] as int?,
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['paymentStatus'],
        orElse: () => PaymentStatus.pending,
      ),
      specialRequests: json['specialRequests'] != null
          ? RideSpecialRequests.fromJson(
              json['specialRequests'] as Map<String, dynamic>)
          : null,
      driver: json['driver'] != null
          ? Driver.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      rating: (json['rating'] as num?)?.toDouble(),
      ratingComment: json['ratingComment'] as String?,
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.parse(json['scheduledAt'] as String)
          : null,
      acceptedAt: json['acceptedAt'] != null
          ? DateTime.parse(json['acceptedAt'] as String)
          : null,
      arrivedAt: json['arrivedAt'] != null
          ? DateTime.parse(json['arrivedAt'] as String)
          : null,
      startedAt: json['startedAt'] != null
          ? DateTime.parse(json['startedAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      cancelledAt: json['cancelledAt'] != null
          ? DateTime.parse(json['cancelledAt'] as String)
          : null,
      cancellationReason: json['cancellationReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientId': clientId,
      if (driverId != null) 'driverId': driverId,
      'pickup': pickup.toJson(),
      'dropoff': dropoff.toJson(),
      'status': status.name,
      'vehicleType': vehicleType.name,
      'fare': fare.toJson(),
      if (tip != null) 'tip': tip!.toJson(),
      if (distance != null) 'distance': distance,
      if (duration != null) 'duration': duration,
      'paymentMethod': paymentMethod.name,
      'paymentStatus': paymentStatus.name,
      if (specialRequests != null) 'specialRequests': specialRequests!.toJson(),
      if (driver != null) 'driver': driver!.toJson(),
      if (rating != null) 'rating': rating,
      if (ratingComment != null) 'ratingComment': ratingComment,
      if (scheduledAt != null) 'scheduledAt': scheduledAt!.toIso8601String(),
      if (acceptedAt != null) 'acceptedAt': acceptedAt!.toIso8601String(),
      if (arrivedAt != null) 'arrivedAt': arrivedAt!.toIso8601String(),
      if (startedAt != null) 'startedAt': startedAt!.toIso8601String(),
      if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      if (cancelledAt != null) 'cancelledAt': cancelledAt!.toIso8601String(),
      if (cancellationReason != null) 'cancellationReason': cancellationReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, status, updatedAt];
}

/// Ride request for creating a new ride
class RideRequest extends Equatable {
  final Address pickup;
  final Address dropoff;
  final VehicleType vehicleType;
  final PaymentProvider paymentMethod;
  final RideSpecialRequests? specialRequests;
  final DateTime? scheduledAt;

  const RideRequest({
    required this.pickup,
    required this.dropoff,
    required this.vehicleType,
    required this.paymentMethod,
    this.specialRequests,
    this.scheduledAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'pickup': pickup.toJson(),
      'dropoff': dropoff.toJson(),
      'vehicleType': vehicleType.name,
      'paymentMethod': paymentMethod.name,
      if (specialRequests != null) 'specialRequests': specialRequests!.toJson(),
      if (scheduledAt != null) 'scheduledAt': scheduledAt!.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [pickup, dropoff, vehicleType, paymentMethod];
}

/// Fare estimate
class FareEstimate extends Equatable {
  final VehicleType vehicleType;
  final Money fare;
  final double distance; // in meters
  final int duration; // in seconds
  final String? surgeMultiplier;

  const FareEstimate({
    required this.vehicleType,
    required this.fare,
    required this.distance,
    required this.duration,
    this.surgeMultiplier,
  });

  factory FareEstimate.fromJson(Map<String, dynamic> json) {
    return FareEstimate(
      vehicleType: VehicleType.values.firstWhere(
        (e) => e.name == json['vehicleType'],
        orElse: () => VehicleType.economy,
      ),
      fare: Money.fromJson(json['fare'] as Map<String, dynamic>),
      distance: (json['distance'] as num).toDouble(),
      duration: json['duration'] as int,
      surgeMultiplier: json['surgeMultiplier'] as String?,
    );
  }

  @override
  List<Object?> get props => [vehicleType, fare, distance, duration];
}

/// Special requests for a ride
class RideSpecialRequests extends Equatable {
  final bool childSeat;
  final bool wheelchair;
  final bool petFriendly;
  final int? numberOfPassengers;
  final String? notes;

  const RideSpecialRequests({
    this.childSeat = false,
    this.wheelchair = false,
    this.petFriendly = false,
    this.numberOfPassengers,
    this.notes,
  });

  factory RideSpecialRequests.fromJson(Map<String, dynamic> json) {
    return RideSpecialRequests(
      childSeat: json['childSeat'] as bool? ?? false,
      wheelchair: json['wheelchair'] as bool? ?? false,
      petFriendly: json['petFriendly'] as bool? ?? false,
      numberOfPassengers: json['numberOfPassengers'] as int?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'childSeat': childSeat,
      'wheelchair': wheelchair,
      'petFriendly': petFriendly,
      if (numberOfPassengers != null) 'numberOfPassengers': numberOfPassengers,
      if (notes != null) 'notes': notes,
    };
  }

  @override
  List<Object?> get props => [
        childSeat,
        wheelchair,
        petFriendly,
        numberOfPassengers,
        notes,
      ];
}
