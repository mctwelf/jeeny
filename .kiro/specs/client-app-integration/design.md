# Design Document: Jeeny Client App Integration

## Overview

This design document outlines the architecture and implementation approach for the Jeeny Flutter client application. The app will be built as a new project in `apps/client/jeeny/`, using the `preferance_ui` template as a UI reference. The architecture follows a clean separation of concerns with Provider for state management, Dio for API communication, and Firebase for real-time features.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Jeeny Client App                          │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer (UI)                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Screens │ │ Widgets │ │  Theme  │ │  i18n   │ │  Assets │   │
│  └────┬────┘ └────┬────┘ └─────────┘ └─────────┘ └─────────┘   │
│       │           │                                              │
├───────┴───────────┴──────────────────────────────────────────────┤
│  State Management Layer (Providers)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │AuthProv  │ │RideProv  │ │ChatProv  │ │MoreProv │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │            │                   │
├───────┴────────────┴────────────┴────────────┴───────────────────┤
│  Domain Layer (Services & Repositories)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │AuthSvc   │ │RideSvc   │ │PaymentSvc│ │LocationSvc│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │            │                   │
├───────┴────────────┴────────────┴────────────┴───────────────────┤
│  Data Layer                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │API Client│ │Firestore │ │  Cache   │ │  Models  │            │
│  │  (Dio)   │ │ Realtime │ │(SharedPr)│ │  (Dart)  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services (GCP)                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Auth │ │Rides│ │Inter│ │Cont │ │Chat │ │Pay  │ │Notif│       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
apps/client/jeeny/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── app.dart                     # MaterialApp configuration
│   ├── config/
│   │   ├── env.dart                 # Environment configuration
│   │   ├── routes.dart              # Route definitions
│   │   └── theme.dart               # App theme (RTL, Arabic fonts)
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart      # Dio HTTP client
│   │   │   ├── api_interceptors.dart
│   │   │   └── api_endpoints.dart
│   │   ├── firebase/
│   │   │   ├── firebase_service.dart
│   │   │   └── firestore_service.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart
│   │   │   └── cache_service.dart
│   │   └── utils/
│   │       ├── validators.dart
│   │       └── formatters.dart
│   ├── l10n/
│   │   ├── app_ar.arb               # Arabic translations
│   │   ├── app_fr.arb               # French translations
│   │   └── app_en.arb               # English translations
│   ├── models/
│   │   ├── user.dart
│   │   ├── ride.dart
│   │   ├── intercity.dart
│   │   ├── contract.dart
│   │   ├── delivery.dart
│   │   ├── restaurant.dart
│   │   ├── payment.dart
│   │   ├── chat.dart
│   │   └── notification.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── user_provider.dart
│   │   ├── ride_provider.dart
│   │   ├── intercity_provider.dart
│   │   ├── contract_provider.dart
│   │   ├── delivery_provider.dart
│   │   ├── food_provider.dart
│   │   ├── payment_provider.dart
│   │   ├── chat_provider.dart
│   │   ├── location_provider.dart
│   │   └── notification_provider.dart
│   ├── services/
│   │   ├── auth_service.dart
│   │   ├── user_service.dart
│   │   ├── ride_service.dart
│   │   ├── intercity_service.dart
│   │   ├── contract_service.dart
│   │   ├── delivery_service.dart
│   │   ├── food_service.dart
│   │   ├── payment_service.dart
│   │   ├── chat_service.dart
│   │   ├── location_service.dart
│   │   └── notification_service.dart
│   ├── screens/
│   │   ├── splash/
│   │   ├── onboarding/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   ├── otp_screen.dart
│   │   │   └── profile_setup_screen.dart
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   └── widgets/
│   │   ├── ride/
│   │   │   ├── booking_screen.dart
│   │   │   ├── searching_screen.dart
│   │   │   ├── tracking_screen.dart
│   │   │   └── rating_screen.dart
│   │   ├── intercity/
│   │   │   ├── intercity_search_screen.dart
│   │   │   ├── trip_list_screen.dart
│   │   │   ├── booking_screen.dart
│   │   │   └── trip_details_screen.dart
│   │   ├── delivery/
│   │   │   ├── delivery_screen.dart
│   │   │   └── tracking_screen.dart
│   │   ├── food/
│   │   │   ├── restaurants_screen.dart
│   │   │   ├── menu_screen.dart
│   │   │   ├── cart_screen.dart
│   │   │   └── order_tracking_screen.dart
│   │   ├── contracts/
│   │   │   ├── contracts_list_screen.dart
│   │   │   ├── contract_details_screen.dart
│   │   │   └── create_contract_screen.dart
│   │   ├── chat/
│   │   │   ├── conversations_screen.dart
│   │   │   └── chat_screen.dart
│   │   ├── history/
│   │   │   └── history_screen.dart
│   │   ├── wallet/
│   │   │   └── wallet_screen.dart
│   │   ├── profile/
│   │   │   ├── profile_screen.dart
│   │   │   └── settings_screen.dart
│   │   └── support/
│   │       └── support_screen.dart
│   └── widgets/
│       ├── common/
│       │   ├── app_button.dart
│       │   ├── app_text_field.dart
│       │   ├── loading_overlay.dart
│       │   └── error_widget.dart
│       ├── map/
│       │   ├── map_widget.dart
│       │   └── location_picker.dart
│       └── cards/
│           ├── ride_card.dart
│           ├── driver_card.dart
│           └── restaurant_card.dart
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│       └── Tajawal/
├── android/
├── ios/
├── pubspec.yaml
└── analysis_options.yaml
```

## Components and Interfaces

### 1. API Client (Dio)

```dart
// lib/core/api/api_client.dart
class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage;
  
  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ar', // Default Arabic
      },
    ));
    
    _dio.interceptors.addAll([
      AuthInterceptor(_storage),
      LoggingInterceptor(),
      RetryInterceptor(),
    ]);
  }
  
  Future<ApiResponse<T>> get<T>(String path, {Map<String, dynamic>? params});
  Future<ApiResponse<T>> post<T>(String path, {dynamic data});
  Future<ApiResponse<T>> put<T>(String path, {dynamic data});
  Future<ApiResponse<T>> delete<T>(String path);
}
```

### 2. Authentication Service

```dart
// lib/services/auth_service.dart
class AuthService {
  final FirebaseAuth _firebaseAuth;
  final ApiClient _apiClient;
  final SecureStorage _storage;
  
  // Phone authentication with OTP
  Future<void> sendOtp(String phoneNumber);
  Future<UserCredential> verifyOtp(String verificationId, String otp);
  Future<User> signIn(UserCredential credential);
  Future<void> signOut();
  Future<String?> getIdToken();
  Future<void> refreshToken();
  Stream<User?> get authStateChanges;
}
```

### 3. Ride Service

```dart
// lib/services/ride_service.dart
class RideService {
  final ApiClient _apiClient;
  final FirestoreService _firestore;
  
  // Fare estimation
  Future<List<FareEstimate>> getFareEstimates(RideRequest request);
  
  // Ride lifecycle
  Future<Ride> createRide(RideRequest request);
  Future<Ride> getRide(String rideId);
  Future<void> cancelRide(String rideId, String reason);
  
  // Real-time tracking
  Stream<DriverLocation> trackDriver(String rideId);
  Stream<RideStatus> watchRideStatus(String rideId);
  
  // Rating
  Future<void> rateRide(String rideId, int rating, String? comment);
}
```

### 4. Intercity Service

```dart
// lib/services/intercity_service.dart
class IntercityService {
  final ApiClient _apiClient;
  
  // Routes
  Future<List<IntercityRoute>> getRoutes({String? fromCityId, String? toCityId});
  Future<IntercityRoute> getRoute(String routeId);
  
  // Trips
  Future<List<IntercityTrip>> searchTrips(String fromCityId, String toCityId, DateTime date, int passengers);
  Future<IntercityTrip> getTrip(String tripId);
  
  // Bookings
  Future<IntercityBooking> createBooking(IntercityBookingRequest request);
  Future<List<IntercityBooking>> getMyBookings();
  Future<void> cancelBooking(String bookingId, String reason);
}
```

### 5. Contract Service

```dart
// lib/services/contract_service.dart
class ContractService {
  final ApiClient _apiClient;
  
  // Contract management
  Future<List<Contract>> getContracts({ContractStatus? status});
  Future<Contract> getContract(String contractId);
  Future<Contract> createContract(ContractRequest request);
  Future<void> updateContract(String contractId, ContractUpdate update);
  Future<void> pauseContract(String contractId, String reason);
  Future<void> resumeContract(String contractId);
  Future<void> cancelContract(String contractId, String reason);
  
  // Usage
  Future<ContractUsage> getUsage(String contractId);
  
  // Trips from contract
  Future<Ride> createContractTrip(String contractId, ContractTripRequest request);
  Future<List<Ride>> getContractTrips(String contractId);
}
```

### 6. Chat Service

```dart
// lib/services/chat_service.dart
class ChatService {
  final ApiClient _apiClient;
  final FirestoreService _firestore;
  
  // Conversations
  Future<List<Conversation>> getConversations();
  Future<Conversation> getOrCreateConversation(String participantId, {String? rideId});
  
  // Messages (real-time via Firestore)
  Stream<List<Message>> watchMessages(String conversationId);
  Future<Message> sendMessage(String conversationId, String content, {MessageType type = MessageType.text});
  Future<void> markAsRead(String conversationId, String messageId);
}
```

### 7. Location Service

```dart
// lib/services/location_service.dart
class LocationService {
  final Geolocator _geolocator;
  final GoogleMapsPlaces _places;
  
  // Current location
  Future<Position> getCurrentLocation();
  Stream<Position> watchLocation();
  
  // Places search
  Future<List<PlacePrediction>> searchPlaces(String query, {LatLng? location});
  Future<PlaceDetails> getPlaceDetails(String placeId);
  
  // Geocoding
  Future<Address> reverseGeocode(LatLng location);
  Future<LatLng> geocode(String address);
  
  // Distance & duration
  Future<RouteInfo> getRoute(LatLng origin, LatLng destination, {List<LatLng>? waypoints});
}
```

## Data Models

### User Model

```dart
// lib/models/user.dart
@JsonSerializable()
class User {
  final String id;
  final String phoneNumber;
  final String phoneCountryCode;
  final String? email;
  final String firstName;
  final String lastName;
  final String? profilePhotoUrl;
  final UserRole role;
  final UserStatus status;
  final Language language;
  final Gender? gender;
  final List<Address> savedAddresses;
  final double walletBalance;
  final bool preferFemaleDriver;
  final VehicleType preferredVehicleType;
  final PaymentProvider preferredPaymentMethod;
  final bool requiresWheelchairAccess;
  final bool requiresChildSeat;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  String get fullName => '$firstName $lastName';
}
```

### Ride Model

```dart
// lib/models/ride.dart
@JsonSerializable()
class Ride {
  final String id;
  final String clientId;
  final String? driverId;
  final Driver? driver;
  final Vehicle? vehicle;
  final RideType rideType;
  final VehicleType vehicleType;
  final Address pickupLocation;
  final Address dropoffLocation;
  final List<Address> stops;
  final RideStatus status;
  final double estimatedFare;
  final double? actualFare;
  final String currency;
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final RideSpecialRequests specialRequests;
  final DateTime requestedAt;
  final DateTime? scheduledAt;
  final DateTime? acceptedAt;
  final DateTime? driverArrivedAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int? clientRating;
  final String? clientRatingComment;
}
```

### Intercity Models

```dart
// lib/models/intercity.dart
@JsonSerializable()
class IntercityRoute {
  final String id;
  final String fromCityId;
  final City? fromCity;
  final String toCityId;
  final City? toCity;
  final String name;
  final String nameAr;
  final double distance;
  final int estimatedDuration;
  final List<IntercityStop> intermediateStops;
  final double basePricePerPerson;
  final double basePricePrivate;
  final String currency;
  final bool isActive;
}

@JsonSerializable()
class IntercityTrip {
  final String id;
  final String routeId;
  final IntercityRoute? route;
  final String? driverId;
  final Driver? driver;
  final String departureDate;
  final String departureTime;
  final String estimatedArrivalTime;
  final int totalSeats;
  final int availableSeats;
  final double pricePerSeat;
  final double privatePrice;
  final String currency;
  final IntercityTripStatus status;
  final bool allowsPackages;
}

@JsonSerializable()
class IntercityBooking {
  final String id;
  final String tripId;
  final IntercityTrip? trip;
  final String clientId;
  final int seatsBooked;
  final List<PassengerInfo> passengers;
  final double totalPrice;
  final String currency;
  final PaymentProvider paymentMethod;
  final PaymentStatus paymentStatus;
  final BookingStatus status;
  final bool hasPackage;
  final PackageInfo? packageInfo;
}
```

### Contract Model

```dart
// lib/models/contract.dart
@JsonSerializable()
class Contract {
  final String id;
  final String contractNumber;
  final ContractType contractType;
  final ContractStatus status;
  final String clientId;
  final String? driverId;
  final Driver? driver;
  final DateTime startDate;
  final DateTime endDate;
  final double monthlyRate;
  final String currency;
  final int includedKilometers;
  final int includedHours;
  final double extraKmRate;
  final double extraHourRate;
  final double usedKilometers;
  final double usedHours;
  final int totalTrips;
  final List<ContractScheduleDay> schedule;
  final List<Address> pickupLocations;
  final List<Address> dropoffLocations;
  final VehicleType vehicleType;
  final PaymentProvider paymentMethod;
  final bool autoRenew;
  
  // School contract specific
  final String? schoolName;
  final String? schoolNameAr;
  final Address? schoolAddress;
  final List<StudentInfo>? students;
}
```

## Theme and Localization

### Arabic RTL Theme

```dart
// lib/config/theme.dart
class AppTheme {
  static ThemeData get arabicTheme => ThemeData(
    fontFamily: 'Tajawal',
    primarySwatch: Colors.amber,
    primaryColor: Color(0xFFFFC107), // Jeeny Yellow
    scaffoldBackgroundColor: Colors.white,
    
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'Tajawal',
        fontWeight: FontWeight.bold,
        fontSize: 32,
      ),
      bodyLarge: TextStyle(
        fontFamily: 'Tajawal',
        fontSize: 16,
      ),
      // Bold numbers
      labelLarge: TextStyle(
        fontFamily: 'Tajawal',
        fontWeight: FontWeight.bold,
        fontSize: 18,
      ),
    ),
    
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Colors.black,
      elevation: 0,
      centerTitle: true,
    ),
    
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Color(0xFFFFC107),
        foregroundColor: Colors.black,
        padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
  );
  
  // Number formatting for Arabic
  static String formatNumber(num number, {bool useBoldStyle = true}) {
    final formatter = NumberFormat('#,##0', 'ar');
    return formatter.format(number);
  }
  
  static String formatCurrency(double amount, {String currency = 'MRU'}) {
    return '${formatNumber(amount)} $currency';
  }
}
```

### Localization Setup

```dart
// lib/l10n/app_ar.arb
{
  "@@locale": "ar",
  "appName": "جيني",
  "welcome": "مرحباً بك في جيني",
  "login": "تسجيل الدخول",
  "phoneNumber": "رقم الهاتف",
  "enterOtp": "أدخل رمز التحقق",
  "whereToGo": "إلى أين تريد الذهاب؟",
  "currentLocation": "موقعك الحالي",
  "searchDestination": "ابحث عن وجهتك",
  "bookRide": "احجز رحلة",
  "intercityTravel": "السفر بين المدن",
  "delivery": "التوصيل",
  "foodDelivery": "توصيل الطعام",
  "contracts": "العقود",
  "wallet": "المحفظة",
  "history": "السجل",
  "profile": "الملف الشخصي",
  "settings": "الإعدادات",
  "help": "المساعدة",
  "economy": "اقتصادي",
  "comfort": "مريح",
  "business": "أعمال",
  "estimatedFare": "التكلفة المتوقعة",
  "confirmBooking": "تأكيد الحجز",
  "searchingForDriver": "جاري البحث عن سائق...",
  "driverOnTheWay": "السائق في الطريق",
  "driverArrived": "وصل السائق",
  "rideInProgress": "الرحلة جارية",
  "rideCompleted": "اكتملت الرحلة",
  "rateYourRide": "قيّم رحلتك",
  "mru": "أوقية"
}
```

## Real-Time Features

### Firestore Listeners

```dart
// lib/core/firebase/firestore_service.dart
class FirestoreService {
  final FirebaseFirestore _firestore;
  
  // Driver location tracking
  Stream<DriverLocation> watchDriverLocation(String rideId) {
    return _firestore
      .collection('rides')
      .doc(rideId)
      .collection('tracking')
      .orderBy('timestamp', descending: true)
      .limit(1)
      .snapshots()
      .map((snapshot) => DriverLocation.fromFirestore(snapshot.docs.first));
  }
  
  // Ride status updates
  Stream<RideStatus> watchRideStatus(String rideId) {
    return _firestore
      .collection('rides')
      .doc(rideId)
      .snapshots()
      .map((doc) => RideStatus.values.byName(doc.data()?['status'] ?? 'PENDING'));
  }
  
  // Chat messages
  Stream<List<Message>> watchMessages(String conversationId) {
    return _firestore
      .collection('messages')
      .where('conversationId', isEqualTo: conversationId)
      .orderBy('createdAt', descending: false)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => Message.fromFirestore(doc)).toList());
  }
}
```

### Push Notifications

```dart
// lib/services/notification_service.dart
class NotificationService {
  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications;
  
  Future<void> initialize() async {
    // Request permission
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    // Get FCM token
    final token = await _messaging.getToken();
    await _registerToken(token);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background/terminated messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    
    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }
  
  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'jeeny_channel',
          'Jeeny Notifications',
          importance: Importance.high,
        ),
      ),
    );
  }
}
```

## In-App Voice Calls

```dart
// lib/services/call_service.dart
class CallService {
  final AgoraRtcEngine _engine;
  
  Future<void> initialize() async {
    await _engine.initialize(RtcEngineContext(
      appId: Env.agoraAppId,
    ));
    await _engine.enableAudio();
  }
  
  Future<void> startCall(String channelId, String token) async {
    await _engine.joinChannel(
      token: token,
      channelId: channelId,
      uid: 0,
      options: ChannelMediaOptions(
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
      ),
    );
  }
  
  Future<void> endCall() async {
    await _engine.leaveChannel();
  }
  
  Future<void> toggleMute(bool muted) async {
    await _engine.muteLocalAudioStream(muted);
  }
  
  Future<void> toggleSpeaker(bool enabled) async {
    await _engine.setEnableSpeakerphone(enabled);
  }
}
```

## Error Handling

```dart
// lib/core/api/api_response.dart
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;
  final String? messageAr;
  final String? messageEn;
  
  String get localizedMessage => 
    AppLocalizations.current.locale.languageCode == 'ar' 
      ? (messageAr ?? error?.messageAr ?? 'حدث خطأ')
      : (messageEn ?? error?.message ?? 'An error occurred');
}

class ApiError {
  final String code;
  final String message;
  final String? messageAr;
  
  static ApiError fromDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiError(
          code: 'TIMEOUT',
          message: 'Connection timeout',
          messageAr: 'انتهت مهلة الاتصال',
        );
      case DioExceptionType.connectionError:
        return ApiError(
          code: 'NO_CONNECTION',
          message: 'No internet connection',
          messageAr: 'لا يوجد اتصال بالإنترنت',
        );
      default:
        return ApiError(
          code: 'UNKNOWN',
          message: 'An error occurred',
          messageAr: 'حدث خطأ',
        );
    }
  }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Model Serialization Round Trip

*For any* valid Dart model object (User, Ride, IntercityTrip, IntercityBooking, Contract, Message, Conversation, FareEstimate, Address, etc.), serializing to JSON and then deserializing back SHALL produce an equivalent object.

**Validates: Requirements 21.5, 21.6, 4.1, 4.5, 5.7, 7.3, 7.4, 10.3, 10.6, 12.4, 13.1, 16.3, 17.4**

### Property 2: Secure Token Storage Round Trip

*For any* valid authentication token string, storing it in secure storage and then retrieving it SHALL return the exact same token string.

**Validates: Requirements 3.5**

### Property 3: Language Preference Persistence Round Trip

*For any* valid Language enum value (ar, fr, en), saving the preference to local storage and then loading it SHALL return the same Language value.

**Validates: Requirements 2.6**

### Property 4: RTL Layout Direction for Arabic

*For any* screen in the application, when the current locale is Arabic (ar), the text direction SHALL be RTL (right-to-left).

**Validates: Requirements 2.2**

### Property 5: Number Formatting Consistency

*For any* numeric value, the formatted output SHALL contain the same numeric value (when parsed back) regardless of whether Arabic-Indic or Western numerals are used.

**Validates: Requirements 2.4**

### Property 6: Fare Estimate Request Validity

*For any* valid pickup location, dropoff location, and vehicle type combination, the fare estimate request SHALL produce a valid JSON payload that matches the backend API schema.

**Validates: Requirements 5.6, 5.7**

### Property 7: Enum Serialization Consistency

*For any* enum value (PackageSize, PackageType, RideStatus, ContractStatus, PaymentProvider, etc.), serializing to string and deserializing back SHALL produce the same enum value.

**Validates: Requirements 8.2, 8.3**

### Property 8: Address Model Completeness

*For any* Address object with all required fields (id, fullAddress, city, location), serialization SHALL include all fields and deserialization SHALL correctly populate all fields.

**Validates: Requirements 4.5**

## Error Handling

### API Error Handling Strategy

```dart
// Centralized error handling
class ErrorHandler {
  static String getLocalizedMessage(dynamic error, BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    if (error is ApiError) {
      return error.messageAr ?? error.message;
    }
    
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.receiveTimeout:
          return l10n.errorTimeout;
        case DioExceptionType.connectionError:
          return l10n.errorNoConnection;
        default:
          return l10n.errorGeneric;
      }
    }
    
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'invalid-verification-code':
          return l10n.errorInvalidOtp;
        case 'session-expired':
          return l10n.errorSessionExpired;
        default:
          return l10n.errorAuthFailed;
      }
    }
    
    return l10n.errorGeneric;
  }
}
```

### Offline Handling

```dart
// Connectivity monitoring
class ConnectivityService {
  final Connectivity _connectivity;
  
  Stream<bool> get onConnectivityChanged => 
    _connectivity.onConnectivityChanged.map((result) => 
      result != ConnectivityResult.none);
  
  Future<bool> get isConnected async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
}

// Offline-aware API calls
class OfflineAwareApiClient {
  final ApiClient _apiClient;
  final CacheService _cache;
  final ConnectivityService _connectivity;
  
  Future<T> getWithCache<T>(
    String path, 
    T Function(Map<String, dynamic>) fromJson,
    {Duration cacheDuration = const Duration(hours: 1)}
  ) async {
    // Try cache first if offline
    if (!await _connectivity.isConnected) {
      final cached = await _cache.get(path);
      if (cached != null) {
        return fromJson(jsonDecode(cached));
      }
      throw OfflineException();
    }
    
    // Fetch from API
    final response = await _apiClient.get<Map<String, dynamic>>(path);
    
    // Cache the response
    await _cache.set(path, jsonEncode(response.data), cacheDuration);
    
    return fromJson(response.data!);
  }
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Model Tests**: Verify JSON parsing for sample API responses
2. **Validator Tests**: Test phone number, email, and input validation
3. **Formatter Tests**: Test currency, date, and number formatting
4. **Service Tests**: Test service method logic with mocked dependencies

### Property-Based Tests

Property-based tests will use the `glados` package for Dart to verify universal properties:

```dart
// Example property test setup
import 'package:glados/glados.dart';

void main() {
  Glados<User>().test('User serialization round trip', (user) {
    final json = user.toJson();
    final restored = User.fromJson(json);
    expect(restored, equals(user));
  });
  
  Glados<String>().test('Token storage round trip', (token) async {
    final storage = SecureStorage();
    await storage.write(key: 'token', value: token);
    final retrieved = await storage.read(key: 'token');
    expect(retrieved, equals(token));
  });
  
  Glados<Language>().test('Language preference round trip', (language) async {
    final prefs = SharedPreferences.getInstance();
    await prefs.setString('language', language.name);
    final retrieved = Language.values.byName(prefs.getString('language')!);
    expect(retrieved, equals(language));
  });
}
```

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Authentication Flow**: Phone → OTP → Profile setup
2. **Ride Booking Flow**: Location selection → Fare estimate → Booking → Tracking
3. **Payment Flow**: Method selection → Payment initiation → Confirmation

### Widget Tests

Widget tests will verify UI behavior:

1. **RTL Layout**: Verify Arabic screens render RTL
2. **Language Switching**: Verify UI updates on language change
3. **Form Validation**: Verify error messages display correctly

### Test Configuration

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  glados: ^1.1.1
  mockito: ^5.4.0
  build_runner: ^2.4.0
```

Each property test should run minimum 100 iterations to ensure comprehensive coverage.

## Dependencies

### pubspec.yaml

```yaml
name: jeeny
description: Jeeny - Ride sharing app for Mauritania
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_auth: ^4.16.0
  cloud_firestore: ^4.14.0
  firebase_messaging: ^14.7.0
  firebase_storage: ^11.6.0
  
  # State Management
  provider: ^6.1.1
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3
  
  # Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # Location & Maps
  geolocator: ^10.1.0
  google_maps_flutter: ^2.5.0
  google_maps_webservice: ^0.0.20
  
  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  flutter_rating_bar: ^4.0.1
  pinput: ^3.0.1
  
  # Voice Calls
  agora_rtc_engine: ^6.2.4
  
  # Utilities
  intl: ^0.18.1
  json_annotation: ^4.8.1
  equatable: ^2.0.5
  connectivity_plus: ^5.0.2
  url_launcher: ^6.2.2
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.8
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.6
  glados: ^1.1.1
  mockito: ^5.4.4
  
flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/
  
  fonts:
    - family: Tajawal
      fonts:
        - asset: assets/fonts/Tajawal/Tajawal-Regular.ttf
        - asset: assets/fonts/Tajawal/Tajawal-Medium.ttf
          weight: 500
        - asset: assets/fonts/Tajawal/Tajawal-Bold.ttf
          weight: 700
        - asset: assets/fonts/Tajawal/Tajawal-ExtraBold.ttf
          weight: 800
```
