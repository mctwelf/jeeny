import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';

/// User model
class User extends Equatable {
  final String id;
  final String phoneNumber;
  final String? email;
  final String? fullName;
  final String? photoUrl;
  final UserRole role;
  final bool isVerified;
  final bool isActive;
  final UserPreferences? preferences;
  final List<Address>? savedAddresses;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.phoneNumber,
    this.email,
    this.fullName,
    this.photoUrl,
    this.role = UserRole.client,
    this.isVerified = false,
    this.isActive = true,
    this.preferences,
    this.savedAddresses,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      role: UserRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => UserRole.client,
      ),
      isVerified: json['isVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      preferences: json['preferences'] != null
          ? UserPreferences.fromJson(json['preferences'] as Map<String, dynamic>)
          : null,
      savedAddresses: json['savedAddresses'] != null
          ? (json['savedAddresses'] as List)
              .map((e) => Address.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phoneNumber': phoneNumber,
      if (email != null) 'email': email,
      if (fullName != null) 'fullName': fullName,
      if (photoUrl != null) 'photoUrl': photoUrl,
      'role': role.name,
      'isVerified': isVerified,
      'isActive': isActive,
      if (preferences != null) 'preferences': preferences!.toJson(),
      if (savedAddresses != null)
        'savedAddresses': savedAddresses!.map((e) => e.toJson()).toList(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? phoneNumber,
    String? email,
    String? fullName,
    String? photoUrl,
    UserRole? role,
    bool? isVerified,
    bool? isActive,
    UserPreferences? preferences,
    List<Address>? savedAddresses,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      photoUrl: photoUrl ?? this.photoUrl,
      role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      preferences: preferences ?? this.preferences,
      savedAddresses: savedAddresses ?? this.savedAddresses,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        phoneNumber,
        email,
        fullName,
        photoUrl,
        role,
        isVerified,
        isActive,
        preferences,
        savedAddresses,
        createdAt,
        updatedAt,
      ];
}

/// User preferences
class UserPreferences extends Equatable {
  final String language;
  final bool notificationsEnabled;
  final bool smsNotifications;
  final PaymentProvider? defaultPaymentMethod;
  final Address? homeAddress;
  final Address? workAddress;

  const UserPreferences({
    this.language = 'ar',
    this.notificationsEnabled = true,
    this.smsNotifications = true,
    this.defaultPaymentMethod,
    this.homeAddress,
    this.workAddress,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      language: json['language'] as String? ?? 'ar',
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      smsNotifications: json['smsNotifications'] as bool? ?? true,
      defaultPaymentMethod: json['defaultPaymentMethod'] != null
          ? PaymentProvider.values.firstWhere(
              (e) => e.name == json['defaultPaymentMethod'],
              orElse: () => PaymentProvider.cash,
            )
          : null,
      homeAddress: json['homeAddress'] != null
          ? Address.fromJson(json['homeAddress'] as Map<String, dynamic>)
          : null,
      workAddress: json['workAddress'] != null
          ? Address.fromJson(json['workAddress'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'language': language,
      'notificationsEnabled': notificationsEnabled,
      'smsNotifications': smsNotifications,
      if (defaultPaymentMethod != null)
        'defaultPaymentMethod': defaultPaymentMethod!.name,
      if (homeAddress != null) 'homeAddress': homeAddress!.toJson(),
      if (workAddress != null) 'workAddress': workAddress!.toJson(),
    };
  }

  UserPreferences copyWith({
    String? language,
    bool? notificationsEnabled,
    bool? smsNotifications,
    PaymentProvider? defaultPaymentMethod,
    Address? homeAddress,
    Address? workAddress,
  }) {
    return UserPreferences(
      language: language ?? this.language,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      smsNotifications: smsNotifications ?? this.smsNotifications,
      defaultPaymentMethod: defaultPaymentMethod ?? this.defaultPaymentMethod,
      homeAddress: homeAddress ?? this.homeAddress,
      workAddress: workAddress ?? this.workAddress,
    );
  }

  @override
  List<Object?> get props => [
        language,
        notificationsEnabled,
        smsNotifications,
        defaultPaymentMethod,
        homeAddress,
        workAddress,
      ];
}

/// Client model (extends User with client-specific fields)
class Client extends User {
  final double walletBalance;
  final List<SavedAddress>? savedPlaces;

  const Client({
    required super.id,
    required super.phoneNumber,
    super.email,
    super.fullName,
    super.photoUrl,
    super.role = UserRole.client,
    super.isVerified,
    super.isActive,
    super.preferences,
    super.savedAddresses,
    super.createdAt,
    super.updatedAt,
    this.walletBalance = 0.0,
    this.savedPlaces,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      role: UserRole.client,
      isVerified: json['isVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      preferences: json['preferences'] != null
          ? UserPreferences.fromJson(json['preferences'] as Map<String, dynamic>)
          : null,
      walletBalance: (json['walletBalance'] as num?)?.toDouble() ?? 0.0,
      savedPlaces: json['savedPlaces'] != null
          ? (json['savedPlaces'] as List)
              .map((e) => SavedAddress.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      ...super.toJson(),
      'walletBalance': walletBalance,
      if (savedPlaces != null)
        'savedPlaces': savedPlaces!.map((e) => e.toJson()).toList(),
    };
  }

  @override
  List<Object?> get props => [
        ...super.props,
        walletBalance,
        savedPlaces,
      ];
}

/// Saved address with label
class SavedAddress extends Equatable {
  final String id;
  final String label;
  final String type; // home, work, other
  final Address address;
  final DateTime createdAt;

  const SavedAddress({
    required this.id,
    required this.label,
    required this.type,
    required this.address,
    required this.createdAt,
  });

  factory SavedAddress.fromJson(Map<String, dynamic> json) {
    return SavedAddress(
      id: json['id'] as String,
      label: json['label'] as String,
      type: json['type'] as String? ?? 'other',
      address: Address.fromJson(json['address'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'type': type,
      'address': address.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, label, type, address];
}

/// Driver model (extends User with driver-specific fields)
class Driver extends User {
  final String? vehicleId;
  final String? vehiclePlate;
  final String? vehicleModel;
  final String? vehicleColor;
  final VehicleType? vehicleType;
  final double rating;
  final int totalRides;
  final bool isOnline;
  final GeoLocation? currentLocation;

  const Driver({
    required super.id,
    required super.phoneNumber,
    super.email,
    super.fullName,
    super.photoUrl,
    super.role = UserRole.driver,
    super.isVerified,
    super.isActive,
    super.preferences,
    super.savedAddresses,
    super.createdAt,
    super.updatedAt,
    this.vehicleId,
    this.vehiclePlate,
    this.vehicleModel,
    this.vehicleColor,
    this.vehicleType,
    this.rating = 0.0,
    this.totalRides = 0,
    this.isOnline = false,
    this.currentLocation,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      role: UserRole.driver,
      isVerified: json['isVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      vehicleId: json['vehicleId'] as String?,
      vehiclePlate: json['vehiclePlate'] as String?,
      vehicleModel: json['vehicleModel'] as String?,
      vehicleColor: json['vehicleColor'] as String?,
      vehicleType: json['vehicleType'] != null
          ? VehicleType.values.firstWhere(
              (e) => e.name == json['vehicleType'],
              orElse: () => VehicleType.economy,
            )
          : null,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      totalRides: json['totalRides'] as int? ?? 0,
      isOnline: json['isOnline'] as bool? ?? false,
      currentLocation: json['currentLocation'] != null
          ? GeoLocation.fromJson(json['currentLocation'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      ...super.toJson(),
      if (vehicleId != null) 'vehicleId': vehicleId,
      if (vehiclePlate != null) 'vehiclePlate': vehiclePlate,
      if (vehicleModel != null) 'vehicleModel': vehicleModel,
      if (vehicleColor != null) 'vehicleColor': vehicleColor,
      if (vehicleType != null) 'vehicleType': vehicleType!.name,
      'rating': rating,
      'totalRides': totalRides,
      'isOnline': isOnline,
      if (currentLocation != null) 'currentLocation': currentLocation!.toJson(),
    };
  }

  @override
  List<Object?> get props => [
        ...super.props,
        vehicleId,
        vehiclePlate,
        vehicleModel,
        vehicleColor,
        vehicleType,
        rating,
        totalRides,
        isOnline,
        currentLocation,
      ];
}
