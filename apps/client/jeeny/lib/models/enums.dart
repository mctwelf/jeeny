/// User roles in the system
enum UserRole {
  client,
  driver,
  admin,
}

/// Ride status
enum RideStatus {
  pending,
  accepted,
  driverArriving,
  driverArrived,
  inProgress,
  completed,
  cancelled,
}

/// Payment providers in Mauritania
enum PaymentProvider {
  cash,
  bankily,
  sedad,
  masrvi,
  wallet,
}

/// Payment status
enum PaymentStatus {
  pending,
  processing,
  completed,
  failed,
  refunded,
}

/// Vehicle types
enum VehicleType {
  economy,
  comfort,
  premium,
  suv,
  van,
}

/// Delivery package size
enum PackageSize {
  small,
  medium,
  large,
  extraLarge,
}

/// Delivery status
enum DeliveryStatus {
  pending,
  pickedUp,
  inTransit,
  delivered,
  cancelled,
}

/// Food order status
enum FoodOrderStatus {
  pending,
  confirmed,
  preparing,
  readyForPickup,
  pickedUp,
  delivered,
  cancelled,
}

/// Contract type
enum ContractType {
  daily,
  weekly,
  monthly,
  school,
  corporate,
}

/// Contract status
enum ContractStatus {
  pending,
  active,
  paused,
  completed,
  cancelled,
}

/// Intercity booking status
enum IntercityBookingStatus {
  pending,
  confirmed,
  inProgress,
  completed,
  cancelled,
}

/// Message type
enum MessageType {
  text,
  image,
  location,
  system,
}

/// Notification type
enum NotificationType {
  ride,
  payment,
  promotion,
  system,
  chat,
  general,
}

/// Transaction type
enum TransactionType {
  payment,
  topUp,
  refund,
  withdrawal,
  transfer,
}

/// Transaction status
enum TransactionStatus {
  pending,
  processing,
  completed,
  failed,
  cancelled,
}

/// Gender
enum Gender {
  male,
  female,
  other,
}

/// Day of week
enum DayOfWeek {
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday,
}

/// Extension methods for enums
extension UserRoleExtension on UserRole {
  String get nameAr {
    switch (this) {
      case UserRole.client:
        return 'عميل';
      case UserRole.driver:
        return 'سائق';
      case UserRole.admin:
        return 'مدير';
    }
  }
}

extension RideStatusExtension on RideStatus {
  String get nameAr {
    switch (this) {
      case RideStatus.pending:
        return 'في الانتظار';
      case RideStatus.accepted:
        return 'مقبول';
      case RideStatus.driverArriving:
        return 'السائق في الطريق';
      case RideStatus.driverArrived:
        return 'السائق وصل';
      case RideStatus.inProgress:
        return 'جاري';
      case RideStatus.completed:
        return 'مكتمل';
      case RideStatus.cancelled:
        return 'ملغي';
    }
  }
}

extension PaymentProviderExtension on PaymentProvider {
  String get nameAr {
    switch (this) {
      case PaymentProvider.cash:
        return 'نقداً';
      case PaymentProvider.bankily:
        return 'بنكيلي';
      case PaymentProvider.sedad:
        return 'سداد';
      case PaymentProvider.masrvi:
        return 'مصرفي';
      case PaymentProvider.wallet:
        return 'المحفظة';
    }
  }
  
  String get icon {
    switch (this) {
      case PaymentProvider.cash:
        return 'assets/icons/cash.png';
      case PaymentProvider.bankily:
        return 'assets/images/bankily_icon.png';
      case PaymentProvider.sedad:
        return 'assets/images/sedad_icon.png';
      case PaymentProvider.masrvi:
        return 'assets/images/masrvi_icon.png';
      case PaymentProvider.wallet:
        return 'assets/icons/wallet.png';
    }
  }
}

extension VehicleTypeExtension on VehicleType {
  String get nameAr {
    switch (this) {
      case VehicleType.economy:
        return 'اقتصادي';
      case VehicleType.comfort:
        return 'مريح';
      case VehicleType.premium:
        return 'فاخر';
      case VehicleType.suv:
        return 'دفع رباعي';
      case VehicleType.van:
        return 'فان';
    }
  }
}

extension DayOfWeekExtension on DayOfWeek {
  String get nameAr {
    switch (this) {
      case DayOfWeek.monday:
        return 'الإثنين';
      case DayOfWeek.tuesday:
        return 'الثلاثاء';
      case DayOfWeek.wednesday:
        return 'الأربعاء';
      case DayOfWeek.thursday:
        return 'الخميس';
      case DayOfWeek.friday:
        return 'الجمعة';
      case DayOfWeek.saturday:
        return 'السبت';
      case DayOfWeek.sunday:
        return 'الأحد';
    }
  }
}
