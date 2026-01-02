import 'package:equatable/equatable.dart';

/// Geographic location
class GeoLocation extends Equatable {
  final double latitude;
  final double longitude;

  const GeoLocation({
    required this.latitude,
    required this.longitude,
  });

  factory GeoLocation.fromJson(Map<String, dynamic> json) {
    return GeoLocation(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  @override
  List<Object?> get props => [latitude, longitude];
}

/// Address model
class Address extends Equatable {
  final String? id;
  final String? name;
  final String? street;
  final String? city;
  final String? country;
  final String? postalCode;
  final String? formattedAddress;
  final GeoLocation? location;
  final String? placeId;

  const Address({
    this.id,
    this.name,
    this.street,
    this.city,
    this.country,
    this.postalCode,
    this.formattedAddress,
    this.location,
    this.placeId,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'] as String?,
      name: json['name'] as String?,
      street: json['street'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String?,
      postalCode: json['postalCode'] as String?,
      formattedAddress: json['formattedAddress'] as String?,
      location: json['location'] != null
          ? GeoLocation.fromJson(json['location'] as Map<String, dynamic>)
          : null,
      placeId: json['placeId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (street != null) 'street': street,
      if (city != null) 'city': city,
      if (country != null) 'country': country,
      if (postalCode != null) 'postalCode': postalCode,
      if (formattedAddress != null) 'formattedAddress': formattedAddress,
      if (location != null) 'location': location!.toJson(),
      if (placeId != null) 'placeId': placeId,
    };
  }

  Address copyWith({
    String? id,
    String? name,
    String? street,
    String? city,
    String? country,
    String? postalCode,
    String? formattedAddress,
    GeoLocation? location,
    String? placeId,
  }) {
    return Address(
      id: id ?? this.id,
      name: name ?? this.name,
      street: street ?? this.street,
      city: city ?? this.city,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      formattedAddress: formattedAddress ?? this.formattedAddress,
      location: location ?? this.location,
      placeId: placeId ?? this.placeId,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        street,
        city,
        country,
        postalCode,
        formattedAddress,
        location,
        placeId,
      ];
}

/// Timestamps for created/updated tracking
class Timestamps extends Equatable {
  final DateTime createdAt;
  final DateTime updatedAt;

  const Timestamps({
    required this.createdAt,
    required this.updatedAt,
  });

  factory Timestamps.fromJson(Map<String, dynamic> json) {
    return Timestamps(
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [createdAt, updatedAt];
}

/// Price/Money model
class Money extends Equatable {
  final double amount;
  final String currency;

  const Money({
    required this.amount,
    this.currency = 'MRU',
  });

  factory Money.fromJson(Map<String, dynamic> json) {
    return Money(
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'MRU',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'currency': currency,
    };
  }

  String get formatted => '${amount.toStringAsFixed(0)} $currency';

  Money operator +(Money other) {
    assert(currency == other.currency, 'Cannot add different currencies');
    return Money(amount: amount + other.amount, currency: currency);
  }

  Money operator -(Money other) {
    assert(currency == other.currency, 'Cannot subtract different currencies');
    return Money(amount: amount - other.amount, currency: currency);
  }

  @override
  List<Object?> get props => [amount, currency];
}

/// Time range
class TimeRange extends Equatable {
  final String start; // HH:mm format
  final String end; // HH:mm format

  const TimeRange({
    required this.start,
    required this.end,
  });

  factory TimeRange.fromJson(Map<String, dynamic> json) {
    return TimeRange(
      start: json['start'] as String,
      end: json['end'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'start': start,
      'end': end,
    };
  }

  @override
  List<Object?> get props => [start, end];
}
