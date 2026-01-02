import 'package:equatable/equatable.dart';
import 'enums.dart';
import 'base_models.dart';

/// Restaurant model
class Restaurant extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final Address address;
  final double rating;
  final int reviewCount;
  final List<String> categories;
  final bool isOpen;
  final String? openingHours;
  final int? deliveryTime; // in minutes
  final Money? deliveryFee;
  final Money? minimumOrder;

  const Restaurant({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    required this.address,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.categories = const [],
    this.isOpen = true,
    this.openingHours,
    this.deliveryTime,
    this.deliveryFee,
    this.minimumOrder,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      address: Address.fromJson(json['address'] as Map<String, dynamic>),
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      categories: json['categories'] != null
          ? List<String>.from(json['categories'] as List)
          : [],
      isOpen: json['isOpen'] as bool? ?? true,
      openingHours: json['openingHours'] as String?,
      deliveryTime: json['deliveryTime'] as int?,
      deliveryFee: json['deliveryFee'] != null
          ? Money.fromJson(json['deliveryFee'] as Map<String, dynamic>)
          : null,
      minimumOrder: json['minimumOrder'] != null
          ? Money.fromJson(json['minimumOrder'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (description != null) 'description': description,
        if (imageUrl != null) 'imageUrl': imageUrl,
        'address': address.toJson(),
        'rating': rating,
        'reviewCount': reviewCount,
        'categories': categories,
        'isOpen': isOpen,
        if (openingHours != null) 'openingHours': openingHours,
        if (deliveryTime != null) 'deliveryTime': deliveryTime,
        if (deliveryFee != null) 'deliveryFee': deliveryFee!.toJson(),
        if (minimumOrder != null) 'minimumOrder': minimumOrder!.toJson(),
      };

  @override
  List<Object?> get props => [id, name];
}

/// Menu item
class MenuItem extends Equatable {
  final String id;
  final String restaurantId;
  final String name;
  final String? description;
  final String? imageUrl;
  final Money price;
  final String? category;
  final bool isAvailable;
  final List<MenuItemOption>? options;

  const MenuItem({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    this.imageUrl,
    required this.price,
    this.category,
    this.isAvailable = true,
    this.options,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] as String,
      restaurantId: json['restaurantId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      price: Money.fromJson(json['price'] as Map<String, dynamic>),
      category: json['category'] as String?,
      isAvailable: json['isAvailable'] as bool? ?? true,
      options: json['options'] != null
          ? (json['options'] as List)
              .map((e) => MenuItemOption.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'restaurantId': restaurantId,
        'name': name,
        if (description != null) 'description': description,
        if (imageUrl != null) 'imageUrl': imageUrl,
        'price': price.toJson(),
        if (category != null) 'category': category,
        'isAvailable': isAvailable,
        if (options != null) 'options': options!.map((e) => e.toJson()).toList(),
      };

  @override
  List<Object?> get props => [id, name, price];
}

/// Menu item option
class MenuItemOption extends Equatable {
  final String id;
  final String name;
  final Money? additionalPrice;
  final bool isRequired;

  const MenuItemOption({
    required this.id,
    required this.name,
    this.additionalPrice,
    this.isRequired = false,
  });

  factory MenuItemOption.fromJson(Map<String, dynamic> json) {
    return MenuItemOption(
      id: json['id'] as String,
      name: json['name'] as String,
      additionalPrice: json['additionalPrice'] != null
          ? Money.fromJson(json['additionalPrice'] as Map<String, dynamic>)
          : null,
      isRequired: json['isRequired'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (additionalPrice != null) 'additionalPrice': additionalPrice!.toJson(),
        'isRequired': isRequired,
      };

  @override
  List<Object?> get props => [id, name];
}

/// Food order
class FoodOrder extends Equatable {
  final String id;
  final String clientId;
  final String restaurantId;
  final Restaurant? restaurant;
  final List<OrderItem> items;
  final Address deliveryAddress;
  final FoodOrderStatus status;
  final Money subtotal;
  final Money deliveryFee;
  final Money total;
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final String? notes;
  final int? estimatedDeliveryTime;
  final DateTime createdAt;

  const FoodOrder({
    required this.id,
    required this.clientId,
    required this.restaurantId,
    this.restaurant,
    required this.items,
    required this.deliveryAddress,
    required this.status,
    required this.subtotal,
    required this.deliveryFee,
    required this.total,
    required this.paymentMethod,
    required this.paymentStatus,
    this.notes,
    this.estimatedDeliveryTime,
    required this.createdAt,
  });

  factory FoodOrder.fromJson(Map<String, dynamic> json) {
    return FoodOrder(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      restaurantId: json['restaurantId'] as String,
      restaurant: json['restaurant'] != null
          ? Restaurant.fromJson(json['restaurant'] as Map<String, dynamic>)
          : null,
      items: (json['items'] as List)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      deliveryAddress:
          Address.fromJson(json['deliveryAddress'] as Map<String, dynamic>),
      status: FoodOrderStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => FoodOrderStatus.pending,
      ),
      subtotal: Money.fromJson(json['subtotal'] as Map<String, dynamic>),
      deliveryFee: Money.fromJson(json['deliveryFee'] as Map<String, dynamic>),
      total: Money.fromJson(json['total'] as Map<String, dynamic>),
      paymentMethod: PaymentProvider.values.firstWhere(
        (e) => e.name == json['paymentMethod'],
        orElse: () => PaymentProvider.cash,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['paymentStatus'],
        orElse: () => PaymentStatus.pending,
      ),
      notes: json['notes'] as String?,
      estimatedDeliveryTime: json['estimatedDeliveryTime'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'clientId': clientId,
        'restaurantId': restaurantId,
        if (restaurant != null) 'restaurant': restaurant!.toJson(),
        'items': items.map((e) => e.toJson()).toList(),
        'deliveryAddress': deliveryAddress.toJson(),
        'status': status.name,
        'subtotal': subtotal.toJson(),
        'deliveryFee': deliveryFee.toJson(),
        'total': total.toJson(),
        'paymentMethod': paymentMethod.name,
        'paymentStatus': paymentStatus.name,
        if (notes != null) 'notes': notes,
        if (estimatedDeliveryTime != null)
          'estimatedDeliveryTime': estimatedDeliveryTime,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, status];
}

/// Order item
class OrderItem extends Equatable {
  final String menuItemId;
  final String name;
  final int quantity;
  final Money unitPrice;
  final Money totalPrice;
  final List<String>? selectedOptions;
  final String? specialInstructions;

  const OrderItem({
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.selectedOptions,
    this.specialInstructions,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      menuItemId: json['menuItemId'] as String,
      name: json['name'] as String,
      quantity: json['quantity'] as int,
      unitPrice: Money.fromJson(json['unitPrice'] as Map<String, dynamic>),
      totalPrice: Money.fromJson(json['totalPrice'] as Map<String, dynamic>),
      selectedOptions: json['selectedOptions'] != null
          ? List<String>.from(json['selectedOptions'] as List)
          : null,
      specialInstructions: json['specialInstructions'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'menuItemId': menuItemId,
        'name': name,
        'quantity': quantity,
        'unitPrice': unitPrice.toJson(),
        'totalPrice': totalPrice.toJson(),
        if (selectedOptions != null) 'selectedOptions': selectedOptions,
        if (specialInstructions != null)
          'specialInstructions': specialInstructions,
      };

  @override
  List<Object?> get props => [menuItemId, quantity];
}
