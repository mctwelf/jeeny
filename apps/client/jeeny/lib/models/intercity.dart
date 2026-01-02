import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';

/// Intercity route
class IntercityRoute extends Equatable {
  final String id;
  final String fromCity;
  final String toCity;
  final double distance;
  final int estimatedDuration;
  final Money basePrice;
  final List<IntercityStop>? stops;

  const IntercityRoute({
    required this.id,
    required this.fromCity,
    required this.toCity,
    required this.distance,
    required this.estimatedDuration,
    required this.basePrice,
    this.stops,
  });

  factory IntercityRoute.fromJson(Map<String, dynamic> json) {
    return IntercityRoute(
      id: json['id'] as String,
      fromCity: json['fromCity'] as String,
      toCity: json['toCity'] as String,
      distance: (json['distance'] as num).toDouble(),
      estimatedDuration: json['estimatedDuration'] as int,
      basePrice: Money.fromJson(json['basePrice'] as Map<String, dynamic>),
      stops: json['stops'] != null
          ? (json['stops'] as List)
              .map((e) => IntercityStop.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fromCity': fromCity,
        'toCity': toCity,
        'distance': distance,
        'estimatedDuration': estimatedDuration,
        'basePrice': basePrice.toJson(),
        if (stops != null) 'stops': stops!.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [id, fromCity, toCity];
}

/// Intercity stop
class IntercityStop extends Equatable {
  final String id;
  final String name;
  final GeoLocation location;
  final int order;

  const IntercityStop({
    required this.id,
    required this.name,
    required this.location,
    required this.order,
  });

  factory IntercityStop.fromJson(Map<String, dynamic> json) {
    return IntercityStop(
      id: json['id'] as String,
      name: json['name'] as String,
      location: GeoLocation.fromJson(json['location'] as Map<String, dynamic>),
      order: json['order'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'location': location.toJson(),
        'order': order,
      };

  @override
  List<Object?> get props => [id, name, order];
}

/// Intercity trip
class IntercityTrip extends Equatable {
  final String id;
  final IntercityRoute route;
  final String driverId;
  final DateTime departureTime;
  final int availableSeats;
  final int totalSeats;
  final Money pricePerSeat;
  final String? vehicleInfo;
  final List<String>? amenities;

  const IntercityTrip({
    required this.id,
    required this.route,
    required this.driverId,
    required this.departureTime,
    required this.availableSeats,
    required this.totalSeats,
    required this.pricePerSeat,
    this.vehicleInfo,
    this.amenities,
  });

  factory IntercityTrip.fromJson(Map<String, dynamic> json) {
    return IntercityTrip(
      id: json['id'] as String,
      route: IntercityRoute.fromJson(json['route'] as Map<String, dynamic>),
      driverId: json['driverId'] as String,
      departureTime: DateTime.parse(json['departureTime'] as String),
      availableSeats: json['availableSeats'] as int,
      totalSeats: json['totalSeats'] as int,
      pricePerSeat: Money.fromJson(json['pricePerSeat'] as Map<String, dynamic>),
      vehicleInfo: json['vehicleInfo'] as String?,
      amenities: json['amenities'] != null
          ? List<String>.from(json['amenities'] as List)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'route': route.toJson(),
        'driverId': driverId,
        'departureTime': departureTime.toIso8601String(),
        'availableSeats': availableSeats,
        'totalSeats': totalSeats,
        'pricePerSeat': pricePerSeat.toJson(),
        if (vehicleInfo != null) 'vehicleInfo': vehicleInfo,
        if (amenities != null) 'amenities': amenities,
      };

  @override
  List<Object?> get props => [id, route, departureTime];
}

/// Intercity booking
class IntercityBooking extends Equatable {
  final String id;
  final String tripId;
  final String clientId;
  final int numberOfSeats;
  final List<PassengerInfo> passengers;
  final Money totalPrice;
  final IntercityBookingStatus status;
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final DateTime createdAt;

  const IntercityBooking({
    required this.id,
    required this.tripId,
    required this.clientId,
    required this.numberOfSeats,
    required this.passengers,
    required this.totalPrice,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.createdAt,
  });

  factory IntercityBooking.fromJson(Map<String, dynamic> json) {
    return IntercityBooking(
      id: json['id'] as String,
      tripId: json['tripId'] as String,
      clientId: json['clientId'] as String,
      numberOfSeats: json['numberOfSeats'] as int,
      passengers: (json['passengers'] as List)
          .map((e) => PassengerInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalPrice: Money.fromJson(json['totalPrice'] as Map<String, dynamic>),
      status: IntercityBookingStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => IntercityBookingStatus.pending,
      ),
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['paymentStatus'],
        orElse: () => PaymentStatus.pending,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'tripId': tripId,
        'clientId': clientId,
        'numberOfSeats': numberOfSeats,
        'passengers': passengers.map((e) => e.toJson()).toList(),
        'totalPrice': totalPrice.toJson(),
        'status': status.name,
        'paymentMethod': paymentMethod.name,
        'paymentStatus': paymentStatus.name,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, tripId, status];
}

/// Passenger info
class PassengerInfo extends Equatable {
  final String name;
  final String? phoneNumber;
  final String? idNumber;

  const PassengerInfo({
    required this.name,
    this.phoneNumber,
    this.idNumber,
  });

  factory PassengerInfo.fromJson(Map<String, dynamic> json) {
    return PassengerInfo(
      name: json['name'] as String,
      phoneNumber: json['phoneNumber'] as String?,
      idNumber: json['idNumber'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (idNumber != null) 'idNumber': idNumber,
      };

  @override
  List<Object?> get props => [name, phoneNumber, idNumber];
}
