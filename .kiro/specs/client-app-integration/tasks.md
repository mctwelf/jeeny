# Implementation Plan: Jeeny Client App Integration

## Overview

This implementation plan breaks down the Jeeny Flutter client app into discrete, incremental tasks. Each task builds on previous work, ensuring no orphaned code. The app will be created in `apps/client/jeeny/` using `preferance_ui` as a UI reference.

## Tasks

- [-] 1. Project Setup and Configuration
  - [x] 1.1 Create new Flutter project structure
    - Create Flutter project in `apps/client/jeeny/`
    - Set up folder structure (lib/config, lib/core, lib/models, lib/providers, lib/services, lib/screens, lib/widgets)
    - Configure pubspec.yaml with all dependencies
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Configure Firebase integration
    - Add Firebase configuration files (google-services.json, GoogleService-Info.plist)
    - Initialize Firebase in main.dart
    - Set up Firebase Auth, Firestore, and Messaging
    - _Requirements: 1.2_

  - [x] 1.3 Set up Arabic RTL theme and localization
    - Create Tajawal font assets
    - Configure AppTheme with RTL support and Arabic typography
    - Set up flutter_localizations with ar, fr, en
    - Create ARB files for all three languages
    - Set Arabic as default locale
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 1.4 Write property test for language preference persistence
    - **Property 3: Language Preference Persistence Round Trip**
    - **Validates: Requirements 2.6**

- [ ] 2. Core Infrastructure
  - [x] 2.1 Implement API client with Dio
    - Create ApiClient class with base configuration
    - Implement AuthInterceptor for JWT token injection
    - Implement RetryInterceptor for failed requests
    - Create ApiResponse and ApiError classes
    - _Requirements: 21.2, 21.3, 21.4_

  - [x] 2.2 Implement secure storage service
    - Create SecureStorage wrapper for flutter_secure_storage
    - Implement token storage methods (save, get, delete)
    - _Requirements: 3.5_

  - [ ]* 2.3 Write property test for token storage round trip
    - **Property 2: Secure Token Storage Round Trip**
    - **Validates: Requirements 3.5**

  - [x] 2.4 Implement cache service
    - Create CacheService using SharedPreferences
    - Implement cache with expiration
    - _Requirements: 20.2_

  - [x] 2.5 Implement connectivity service
    - Create ConnectivityService for network monitoring
    - Implement offline detection and handling
    - _Requirements: 20.1, 20.4, 20.5_

- [ ] 3. Data Models
  - [x] 3.1 Create base models and enums
    - Implement all enums (UserRole, RideStatus, PaymentProvider, etc.)
    - Create GeoLocation, Address, Timestamps models
    - Set up json_serializable configuration
    - _Requirements: 21.1_

  - [x] 3.2 Create user and authentication models
    - Implement User, Client, Driver models
    - Implement UserPreferences model
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.3 Create ride and booking models
    - Implement Ride, RideRequest, FareEstimate models
    - Implement RideSpecialRequests model
    - _Requirements: 5.1-5.10, 6.1-6.6_

  - [x] 3.4 Create intercity models
    - Implement IntercityRoute, IntercityTrip, IntercityBooking models
    - Implement IntercityStop, PassengerInfo models
    - _Requirements: 7.1-7.10_

  - [x] 3.5 Create delivery and food models
    - Implement PackageDeliveryInfo model
    - Implement Restaurant, MenuItem, FoodOrder models
    - _Requirements: 8.1-8.9, 9.1-9.10_

  - [x] 3.6 Create contract models
    - Implement Contract, ContractScheduleDay, ContractScheduleTrip models
    - Implement SchoolContract, StudentInfo models
    - Implement ContractUsage model
    - _Requirements: 10.1-10.10, 11.1-11.7_

  - [x] 3.7 Create payment and transaction models
    - Implement PaymentMethod, Transaction, Wallet models
    - _Requirements: 12.1-12.9_

  - [x] 3.8 Create chat and notification models
    - Implement Conversation, Message models
    - Implement Notification model
    - _Requirements: 16.1-16.6, 17.1-17.5_

  - [ ]* 3.9 Write property tests for model serialization
    - **Property 1: Model Serialization Round Trip**
    - **Validates: Requirements 21.5, 21.6**

  - [ ]* 3.10 Write property test for enum serialization
    - **Property 7: Enum Serialization Consistency**
    - **Validates: Requirements 8.2, 8.3**

- [x] 4. Checkpoint - Core Infrastructure Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Authentication Module
  - [x] 5.1 Implement AuthService
    - Create AuthService with Firebase Auth integration
    - Implement sendOtp, verifyOtp, signIn, signOut methods
    - Implement token refresh logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 5.2 Implement AuthProvider
    - Create AuthProvider with ChangeNotifier
    - Manage auth state (loading, authenticated, unauthenticated, error)
    - Handle auth state persistence
    - _Requirements: 3.1-3.7_

  - [x] 5.3 Create authentication screens
    - Implement LoginScreen with phone input (adapted from preferance_ui)
    - Implement OtpScreen with pinput widget
    - Implement ProfileSetupScreen for new users
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [ ]* 5.4 Write unit tests for authentication flow
    - Test OTP validation logic
    - Test error message localization
    - _Requirements: 3.7_

- [x] 6. User Profile Module
  - [x] 6.1 Implement UserService
    - Create UserService for profile CRUD operations
    - Implement getProfile, updateProfile methods
    - Implement saved addresses management
    - _Requirements: 4.1-4.7_

  - [x] 6.2 Implement UserProvider
    - Create UserProvider with user state management
    - Handle profile updates and sync
    - _Requirements: 4.1-4.7_

  - [x] 6.3 Create profile screens
    - Implement ProfileScreen (adapted from preferance_ui)
    - Implement SettingsScreen with language selection
    - Implement SavedAddressesScreen
    - _Requirements: 4.1-4.7, 2.7_

- [x] 7. Location and Maps Module
  - [x] 7.1 Implement LocationService
    - Create LocationService with Geolocator
    - Implement getCurrentLocation, watchLocation
    - Implement Places API search and geocoding
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Implement LocationProvider
    - Create LocationProvider for location state
    - Handle location permissions
    - _Requirements: 5.1, 5.2_

  - [x] 7.3 Create map widgets
    - Implement MapWidget with Google Maps
    - Implement LocationPicker for address selection
    - Implement DriverMarker for tracking
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.4_

- [x] 8. Checkpoint - Auth and Location Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Ride Booking Module
  - [x] 9.1 Implement RideService
    - Create RideService for ride operations
    - Implement getFareEstimates, createRide, cancelRide
    - Implement getRide, rateRide methods
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10, 14.1-14.5_

  - [x] 9.2 Implement FirestoreService for real-time
    - Create FirestoreService for Firestore operations
    - Implement watchDriverLocation stream
    - Implement watchRideStatus stream
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.3 Implement RideProvider
    - Create RideProvider with ride state management
    - Handle ride lifecycle (booking → tracking → completion)
    - _Requirements: 5.1-5.10, 6.1-6.6_

  - [x] 9.4 Create ride booking screens
    - Implement HomeScreen with map and search (adapted from preferance_ui)
    - Implement BookingScreen with vehicle selection
    - Implement SearchingScreen with animation
    - Implement TrackingScreen with real-time map
    - Implement RatingScreen with stars and tips
    - _Requirements: 5.1-5.10, 6.1-6.6, 14.1-14.5_

  - [ ]* 9.5 Write property test for fare estimate request
    - **Property 6: Fare Estimate Request Validity**
    - **Validates: Requirements 5.6, 5.7**

- [x] 10. Intercity Travel Module
  - [x] 10.1 Implement IntercityService
    - Create IntercityService for intercity operations
    - Implement getRoutes, searchTrips, getTrip
    - Implement createBooking, getMyBookings, cancelBooking
    - _Requirements: 7.1-7.10_

  - [x] 10.2 Implement IntercityProvider
    - Create IntercityProvider with state management
    - Handle route search and trip booking
    - _Requirements: 7.1-7.10_

  - [x] 10.3 Create intercity screens
    - Implement IntercitySearchScreen with city selection
    - Implement TripListScreen with available trips
    - Implement IntercityBookingScreen with passenger info
    - Implement TripDetailsScreen with booking status
    - _Requirements: 7.1-7.10_

- [x] 11. Delivery Module
  - [x] 11.1 Implement DeliveryService
    - Create DeliveryService for package delivery
    - Implement createDelivery, trackDelivery methods
    - _Requirements: 8.1-8.9_

  - [x] 11.2 Implement DeliveryProvider
    - Create DeliveryProvider with delivery state
    - Handle package creation and tracking
    - _Requirements: 8.1-8.9_

  - [x] 11.3 Create delivery screens
    - Implement DeliveryScreen with package form
    - Implement DeliveryTrackingScreen with status
    - _Requirements: 8.1-8.9_

- [x] 12. Food Delivery Module
  - [x] 12.1 Implement FoodService
    - Create FoodService for restaurant and order operations
    - Implement getRestaurants, getMenu, createOrder
    - _Requirements: 9.1-9.10_

  - [x] 12.2 Implement FoodProvider
    - Create FoodProvider with cart and order state
    - Handle restaurant browsing and ordering
    - _Requirements: 9.1-9.10_

  - [x] 12.3 Create food delivery screens
    - Implement RestaurantsScreen with listings
    - Implement MenuScreen with items
    - Implement CartScreen with order summary
    - Implement OrderTrackingScreen with status
    - _Requirements: 9.1-9.10_

- [x] 13. Checkpoint - Booking Modules Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Contracts Module
  - [x] 14.1 Implement ContractService
    - Create ContractService for contract operations
    - Implement getContracts, createContract, updateContract
    - Implement pauseContract, resumeContract, cancelContract
    - Implement getUsage, createContractTrip
    - _Requirements: 10.1-10.10, 11.1-11.7_

  - [x] 14.2 Implement ContractProvider
    - Create ContractProvider with contract state
    - Handle contract lifecycle management
    - _Requirements: 10.1-10.10, 11.1-11.7_

  - [x] 14.3 Create contract screens
    - Implement ContractsListScreen with active/past contracts
    - Implement ContractDetailsScreen with usage stats
    - Implement CreateContractScreen with schedule builder
    - Implement SchoolContractScreen with student info
    - _Requirements: 10.1-10.10, 11.1-11.7_

- [x] 15. Payment Module
  - [x] 15.1 Implement PaymentService
    - Create PaymentService for payment operations
    - Implement getPaymentMethods, addPaymentMethod
    - Implement initiatePayment, getTransactionHistory
    - Implement topUpWallet
    - _Requirements: 12.1-12.9_

  - [x] 15.2 Implement PaymentProvider
    - Create PaymentProvider with payment state
    - Handle payment method selection and processing
    - _Requirements: 12.1-12.9_

  - [x] 15.3 Create payment screens
    - Implement PaymentMethodsScreen with provider list
    - Implement WalletScreen with balance and history
    - Implement PaymentScreen with provider integration
    - _Requirements: 12.1-12.9_

- [x] 16. Chat Module
  - [x] 16.1 Implement ChatService
    - Create ChatService for chat operations
    - Implement getConversations, getOrCreateConversation
    - Implement sendMessage, markAsRead
    - _Requirements: 16.1-16.6, 17.1-17.5_

  - [x] 16.2 Implement ChatProvider
    - Create ChatProvider with conversation state
    - Handle real-time message updates via Firestore
    - _Requirements: 16.1-16.6, 17.1-17.5_

  - [x] 16.3 Create chat screens
    - Implement ConversationsScreen with history
    - Implement ChatScreen with real-time messages
    - _Requirements: 16.1-16.6, 17.1-17.5_

- [x] 17. Voice Calls Module
  - [x] 17.1 Implement CallService
    - Create CallService with Agora integration
    - Implement startCall, endCall, toggleMute, toggleSpeaker
    - _Requirements: 18.1-18.6_

  - [x] 17.2 Create call UI
    - Implement CallScreen with controls
    - Implement call overlay widget
    - _Requirements: 18.1-18.6_

- [x] 18. Notifications Module
  - [x] 18.1 Implement NotificationService
    - Create NotificationService with FCM integration
    - Implement token registration and refresh
    - Handle foreground and background messages
    - Implement notification tap handling
    - _Requirements: 15.1-15.7_

  - [x] 18.2 Implement NotificationProvider
    - Create NotificationProvider with notification state
    - Handle notification display and navigation
    - _Requirements: 15.1-15.7_

- [x] 19. Checkpoint - Communication Modules Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. History and Support Module
  - [ ] 20.1 Implement HistoryService
    - Create HistoryService for ride history
    - Implement getRideHistory with filters
    - _Requirements: 13.1-13.6_

  - [ ] 20.2 Create history screens
    - Implement HistoryScreen with ride list
    - Implement RideDetailsScreen with receipt
    - _Requirements: 13.1-13.6_

  - [ ] 20.3 Implement SupportService
    - Create SupportService for support tickets
    - Implement createTicket, getTickets
    - _Requirements: 24.1-24.5_

  - [ ] 20.4 Create support screens
    - Implement SupportScreen with FAQs
    - Implement TicketScreen with form
    - _Requirements: 24.1-24.5_

- [ ] 21. Promotions Module
  - [ ] 21.1 Implement PromotionService
    - Create PromotionService for promo codes
    - Implement validatePromoCode, getPromotions
    - _Requirements: 19.1-19.5_

  - [ ] 21.2 Create promotions UI
    - Implement promo code input widget
    - Implement PromotionsScreen with available offers
    - _Requirements: 19.1-19.5_

- [ ] 22. Scheduled Rides and Airport Transfers
  - [ ] 22.1 Extend RideService for scheduling
    - Add scheduleRide, getScheduledRides methods
    - Add airport transfer specific methods
    - _Requirements: 22.1-22.5, 23.1-23.5_

  - [ ] 22.2 Create scheduling UI
    - Implement date/time picker for scheduling
    - Implement ScheduledRidesScreen
    - Implement AirportTransferScreen with flight info
    - _Requirements: 22.1-22.5, 23.1-23.5_

- [ ] 23. Final Integration and Polish
  - [ ] 23.1 Implement app navigation
    - Set up GoRouter or Navigator 2.0
    - Configure deep linking for notifications
    - _Requirements: 15.7_

  - [ ] 23.2 Implement splash and onboarding
    - Create SplashScreen with logo animation
    - Create OnboardingScreen (adapted from preferance_ui)
    - _Requirements: 2.1_

  - [ ] 23.3 Wire all providers in main.dart
    - Set up MultiProvider with all providers
    - Configure app initialization sequence
    - _Requirements: All_

  - [ ]* 23.4 Write property test for RTL layout
    - **Property 4: RTL Layout Direction for Arabic**
    - **Validates: Requirements 2.2**

  - [ ]* 23.5 Write property test for number formatting
    - **Property 5: Number Formatting Consistency**
    - **Validates: Requirements 2.4**

  - [ ]* 23.6 Write property test for address model
    - **Property 8: Address Model Completeness**
    - **Validates: Requirements 4.5**

- [ ] 24. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all screens render correctly in Arabic RTL
  - Test complete user flows end-to-end

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- UI components should be adapted from `preferance_ui` where applicable
