# Requirements Document

## Introduction

This document defines the requirements for adapting the existing Flutter UI template (`preferance_ui`) to integrate with the Jeeny ride-sharing backend services. The goal is to transform the static UI into a fully functional client application supporting rides, intercity travel, delivery services, food ordering, contracts, and real-time communication with drivers.

## Glossary

- **Client_App**: The Flutter mobile application used by passengers to book rides and services
- **Backend_API**: The Node.js/TypeScript microservices providing REST endpoints
- **Auth_Service**: Backend service handling user authentication via Firebase
- **Ride_Service**: Backend service managing ride requests, matching, and status
- **Intercity_Service**: Backend service handling intercity routes, trips, and bookings
- **Contract_Service**: Backend service managing monthly, school, and corporate contracts
- **Payment_Service**: Backend service processing payments via Bankily, Sedad, Masrvi, or cash
- **Location_Service**: Backend service handling real-time driver location updates
- **Notification_Service**: Backend service sending push notifications via FCM
- **Chat_Service**: Backend service managing conversations and messages
- **State_Manager**: Provider-based state management in Flutter
- **Firestore**: Firebase Cloud Firestore for real-time data sync

## Requirements

### Requirement 1: Project Configuration and Dependencies

**User Story:** As a developer, I want to configure the Flutter project with necessary dependencies and environment settings, so that the app can communicate with backend services.

**Note:** The new client app SHALL be created in `apps/client/jeeny/` directory. The `preferance_ui` folder serves as a UI reference only and SHALL NOT be modified. Reusable UI components and patterns should be adapted from `preferance_ui` into the new project.

#### Acceptance Criteria

1. THE Client_App SHALL be created as a new Flutter project named "jeeny" in `apps/client/jeeny/`
2. THE Client_App SHALL add Firebase dependencies (firebase_core, firebase_auth, cloud_firestore, firebase_messaging)
3. THE Client_App SHALL add HTTP client dependencies (dio, retrofit) for API communication
4. THE Client_App SHALL add location dependencies (geolocator, google_maps_flutter)
5. THE Client_App SHALL add WebRTC/Agora dependencies for in-app voice calls
6. THE Client_App SHALL configure environment variables for API base URL and Firebase config
7. THE Client_App SHALL update the app name and bundle identifiers for Android and iOS

### Requirement 2: Arabic RTL Default with Beautiful Typography

**User Story:** As a Mauritanian user, I want the app to display in Arabic by default with beautiful Tajweed-style typography and bold numbers, so that I can read content naturally.

#### Acceptance Criteria

1. THE Client_App SHALL set Arabic (ar) as the default language
2. THE Client_App SHALL render all screens in RTL (right-to-left) layout by default
3. THE Client_App SHALL use a beautiful Arabic font family (Tajawal or similar) for all text
4. THE Client_App SHALL display numbers in bold Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) or bold Western numerals based on user preference
5. THE Client_App SHALL support French (fr) and English (en) as secondary languages
6. THE Client_App SHALL persist the user's language preference locally
7. WHEN the user switches language, THE Client_App SHALL immediately update all UI text and layout direction
8. THE Client_App SHALL load localized strings from JSON files for all three languages

### Requirement 3: Authentication Integration

**User Story:** As a user, I want to sign up and log in using my phone number, so that I can access the ride-sharing services.

#### Acceptance Criteria

1. WHEN a user enters a valid Mauritanian phone number (+222) and requests OTP, THE Auth_Service SHALL send a verification code via SMS
2. WHEN a user enters the correct OTP, THE Client_App SHALL authenticate with Firebase and receive a JWT token
3. WHEN a user completes phone verification for the first time, THE Client_App SHALL navigate to profile completion
4. WHEN a user is already registered, THE Client_App SHALL navigate to the home screen after login
5. THE Client_App SHALL persist the authentication token securely using flutter_secure_storage
6. WHEN the authentication token expires, THE Client_App SHALL automatically refresh it or redirect to login
7. IF authentication fails, THEN THE Client_App SHALL display an appropriate error message in Arabic

### Requirement 4: User Profile Management

**User Story:** As a user, I want to manage my profile information and preferences, so that drivers can identify me and I can customize my experience.

#### Acceptance Criteria

1. THE Client_App SHALL allow users to update firstName, lastName, email, gender, and profilePhoto
2. THE Client_App SHALL allow users to set preferred language (Arabic, French, English)
3. THE Client_App SHALL allow users to set ride preferences (preferFemaleDriver, preferredVehicleType, preferredPaymentMethod)
4. THE Client_App SHALL allow users to set accessibility needs (requiresWheelchairAccess, requiresChildSeat)
5. THE Client_App SHALL allow users to manage saved addresses (home, work, favorites) with Arabic labels
6. WHEN profile data is updated, THE Client_App SHALL sync changes with the Backend_API
7. THE Client_App SHALL display the user's wallet balance from the backend

### Requirement 5: Standard Ride Booking Flow

**User Story:** As a user, I want to book a ride by selecting pickup and dropoff locations, so that I can travel to my destination.

#### Acceptance Criteria

1. WHEN the user opens the home screen, THE Client_App SHALL display a map centered on the user's current location
2. THE Client_App SHALL allow users to search for locations using Google Places API with Arabic results
3. THE Client_App SHALL allow users to select pickup location from map, search, or saved addresses
4. THE Client_App SHALL allow users to select dropoff location from map, search, or saved addresses
5. THE Client_App SHALL allow users to add intermediate stops (up to 3)
6. WHEN both locations are selected, THE Client_App SHALL request fare estimates from the Pricing_Service
7. THE Client_App SHALL display available vehicle types (Economy, Comfort, Business, VAN) with estimated fares in MRU
8. THE Client_App SHALL allow users to select special requests (female driver, child seat, wheelchair access)
9. WHEN the user confirms booking, THE Ride_Service SHALL create a ride request and search for drivers
10. THE Client_App SHALL display real-time ride status updates (searching, driver_assigned, driver_arrived, in_progress, completed)

### Requirement 6: Real-Time Driver Tracking

**User Story:** As a user, I want to see my driver's location in real-time, so that I know when they will arrive.

#### Acceptance Criteria

1. WHEN a driver is assigned, THE Client_App SHALL display the driver's current location on the map
2. THE Client_App SHALL update the driver's location every 3-5 seconds using Firestore real-time listeners
3. THE Client_App SHALL display estimated time of arrival (ETA) based on driver location
4. THE Client_App SHALL show the route from driver to pickup location with animated marker
5. WHEN the driver arrives, THE Client_App SHALL notify the user via push notification and in-app alert
6. THE Client_App SHALL display driver information (name, photo, rating, vehicle details, plate number)

### Requirement 7: Intercity Travel

**User Story:** As a user, I want to book intercity trips between Mauritanian cities, so that I can travel long distances affordably.

#### Acceptance Criteria

1. THE Client_App SHALL display a dedicated intercity travel section
2. THE Client_App SHALL allow users to search for routes by selecting origin and destination cities
3. THE Client_App SHALL display available trips with departure times, available seats, and prices per seat
4. THE Client_App SHALL allow users to book multiple seats for a trip
5. THE Client_App SHALL allow users to add passenger information for each seat
6. THE Client_App SHALL allow users to select intermediate pickup/dropoff stops along the route
7. THE Client_App SHALL allow users to add package delivery to intercity trips (with weight and description)
8. WHEN a booking is confirmed, THE Client_App SHALL display booking details and trip status
9. THE Client_App SHALL notify users when the trip starts and completes
10. THE Client_App SHALL allow users to view and cancel their intercity bookings

### Requirement 8: Package Delivery Service

**User Story:** As a user, I want to send packages to other locations, so that I can deliver items without traveling myself.

#### Acceptance Criteria

1. THE Client_App SHALL display a dedicated delivery section
2. THE Client_App SHALL allow users to select package size (envelope, small, medium, large, extra_large)
3. THE Client_App SHALL allow users to select package type (documents, food, groceries, electronics, medicine, fragile)
4. THE Client_App SHALL allow users to enter recipient name, phone, and delivery instructions
5. THE Client_App SHALL allow users to enable cash-on-delivery with amount
6. THE Client_App SHALL display delivery fare based on distance, size, and type
7. WHEN delivery is confirmed, THE Client_App SHALL track delivery status (pending_pickup, picked_up, in_transit, delivered)
8. THE Client_App SHALL allow users to require signature or photo confirmation on delivery
9. THE Client_App SHALL notify users at each delivery status change

### Requirement 9: Food Delivery and Restaurant Browsing

**User Story:** As a user, I want to browse restaurants and order food for delivery, so that I can enjoy meals from my favorite places.

#### Acceptance Criteria

1. THE Client_App SHALL display a dedicated food delivery section with restaurant listings
2. THE Client_App SHALL allow users to browse restaurants by category (fast food, traditional, cafes, etc.)
3. THE Client_App SHALL allow users to search restaurants by name or cuisine type
4. THE Client_App SHALL display restaurant details (name, rating, delivery time, minimum order, menu)
5. THE Client_App SHALL allow users to view menu items with photos, descriptions, and prices in MRU
6. THE Client_App SHALL allow users to add items to cart with quantity and special instructions
7. THE Client_App SHALL display order summary with subtotal, delivery fee, and total
8. WHEN order is placed, THE Client_App SHALL track order status (preparing, picked_up, on_the_way, delivered)
9. THE Client_App SHALL allow users to save favorite restaurants
10. THE Client_App SHALL display estimated delivery time based on restaurant preparation and driver distance

### Requirement 10: Monthly Contracts with Drivers

**User Story:** As a user, I want to create monthly contracts with drivers for regular trips, so that I can have reliable transportation for recurring needs.

#### Acceptance Criteria

1. THE Client_App SHALL display a contracts section showing active and past contracts
2. THE Client_App SHALL allow users to request new contracts (monthly, weekly, school, medical)
3. THE Client_App SHALL allow users to specify contract details (start date, end date, monthly rate)
4. THE Client_App SHALL allow users to define a weekly schedule with pickup times and locations
5. THE Client_App SHALL allow users to add multiple pickup/dropoff locations for the contract
6. THE Client_App SHALL display contract usage (kilometers used, hours used, trips completed)
7. WHEN a contract is approved, THE Client_App SHALL notify the user and display assigned driver
8. THE Client_App SHALL allow users to request trips from their active contract
9. THE Client_App SHALL allow users to pause, resume, or cancel contracts
10. THE Client_App SHALL display extra charges if usage exceeds included kilometers/hours

### Requirement 11: School Contracts

**User Story:** As a parent, I want to set up school transportation contracts for my children, so that they can travel safely to and from school.

#### Acceptance Criteria

1. THE Client_App SHALL allow users to create school-specific contracts
2. THE Client_App SHALL allow users to add student information (name, grade, school, special needs)
3. THE Client_App SHALL allow users to specify school address and home address
4. THE Client_App SHALL allow users to set morning pickup and afternoon return times
5. THE Client_App SHALL display the assigned driver with verification status
6. THE Client_App SHALL notify parents when children are picked up and dropped off
7. THE Client_App SHALL allow parents to track the school bus/car in real-time

### Requirement 12: Payment Integration

**User Story:** As a user, I want to pay for rides using my preferred payment method, so that I can complete transactions conveniently.

#### Acceptance Criteria

1. THE Client_App SHALL support payment methods: Bankily, Sedad, Masrvi, and Cash
2. THE Client_App SHALL display payment provider logos and names in Arabic
3. THE Client_App SHALL allow users to add and manage payment methods
4. WHEN a ride is completed, THE Client_App SHALL display the final fare breakdown in MRU
5. WHEN the user selects a mobile payment method, THE Client_App SHALL initiate the payment flow with the provider
6. THE Client_App SHALL display payment status (pending, completed, failed)
7. IF payment fails, THEN THE Client_App SHALL allow retry or alternative payment method
8. THE Client_App SHALL allow users to top up their wallet balance
9. THE Client_App SHALL display transaction history with dates and amounts

### Requirement 13: Ride History and Receipts

**User Story:** As a user, I want to view my past rides and receipts, so that I can track my travel expenses.

#### Acceptance Criteria

1. THE Client_App SHALL display a list of past rides with date, route, fare, and status
2. THE Client_App SHALL allow users to filter history by ride type (standard, intercity, delivery, food)
3. THE Client_App SHALL allow users to view detailed ride information including route map
4. THE Client_App SHALL allow users to download or share ride receipts as PDF
5. THE Client_App SHALL allow users to rate past rides if not already rated
6. THE Client_App SHALL display monthly spending summaries

### Requirement 14: Driver Rating and Feedback

**User Story:** As a user, I want to rate my driver after a ride, so that I can provide feedback on the service quality.

#### Acceptance Criteria

1. WHEN a ride is completed, THE Client_App SHALL prompt the user to rate the driver (1-5 stars)
2. THE Client_App SHALL display rating tags (clean car, polite, safe driving, etc.) in Arabic
3. THE Client_App SHALL allow users to add optional comments with the rating
4. THE Client_App SHALL allow users to tip the driver through the app
5. WHEN a rating is submitted, THE Client_App SHALL send it to the Backend_API

### Requirement 15: Push Notifications

**User Story:** As a user, I want to receive push notifications about my ride status, so that I stay informed without keeping the app open.

#### Acceptance Criteria

1. THE Client_App SHALL register device tokens with Firebase Cloud Messaging
2. THE Client_App SHALL receive notifications for: ride_accepted, driver_arrived, ride_started, ride_completed, ride_cancelled
3. THE Client_App SHALL receive notifications for intercity trip updates
4. THE Client_App SHALL receive notifications for delivery status changes
5. THE Client_App SHALL receive notifications for food order updates
6. THE Client_App SHALL display notifications in Arabic by default
7. WHEN a notification is tapped, THE Client_App SHALL navigate to the relevant screen

### Requirement 16: In-App Chat with Driver

**User Story:** As a user, I want to chat with my assigned driver, so that I can communicate pickup details or special instructions.

#### Acceptance Criteria

1. WHEN a driver is assigned, THE Client_App SHALL enable in-app chat with the driver
2. THE Client_App SHALL support text messages in the chat
3. THE Client_App SHALL display chat messages in real-time using Firestore
4. THE Client_App SHALL persist conversation history for the duration of the ride
5. THE Client_App SHALL display message status (sent, delivered, read)
6. THE Client_App SHALL support sending location messages

### Requirement 17: Conversation History

**User Story:** As a user, I want to view my past conversations with drivers, so that I can reference previous communications.

#### Acceptance Criteria

1. THE Client_App SHALL display a list of past conversations
2. THE Client_App SHALL show conversation preview with last message and timestamp
3. THE Client_App SHALL allow users to view full conversation history
4. THE Client_App SHALL link conversations to their associated rides
5. THE Client_App SHALL allow users to search through conversation history

### Requirement 18: In-App Voice Calls

**User Story:** As a user, I want to call my driver directly from the app, so that I can communicate quickly without sharing my phone number.

#### Acceptance Criteria

1. WHEN a driver is assigned, THE Client_App SHALL display a call button
2. WHEN the user taps call, THE Client_App SHALL initiate a VoIP call using WebRTC or Agora
3. THE Client_App SHALL display call status (connecting, ringing, in_call, ended)
4. THE Client_App SHALL allow users to mute/unmute and enable/disable speaker
5. THE Client_App SHALL end the call when either party hangs up
6. IF VoIP fails, THEN THE Client_App SHALL offer to call via regular phone (masking numbers)

### Requirement 19: Promotions and Discounts

**User Story:** As a user, I want to apply promo codes to get discounts on rides, so that I can save money.

#### Acceptance Criteria

1. THE Client_App SHALL allow users to enter promo codes before confirming a ride
2. WHEN a valid promo code is entered, THE Client_App SHALL display the discounted fare
3. THE Client_App SHALL display available promotions in a dedicated section
4. THE Client_App SHALL show promotion details (discount amount, validity, conditions) in Arabic
5. IF a promo code is invalid or expired, THEN THE Client_App SHALL display an appropriate error message

### Requirement 20: Offline Handling and Error States

**User Story:** As a user, I want the app to handle network issues gracefully, so that I have a good experience even with poor connectivity.

#### Acceptance Criteria

1. WHEN the device is offline, THE Client_App SHALL display an offline indicator in Arabic
2. THE Client_App SHALL cache essential data (user profile, saved addresses, recent rides) for offline access
3. WHEN an API request fails, THE Client_App SHALL display a user-friendly error message in Arabic
4. THE Client_App SHALL implement retry logic for failed requests
5. WHEN connectivity is restored, THE Client_App SHALL sync pending actions

### Requirement 21: Data Models and API Integration Layer

**User Story:** As a developer, I want well-defined data models and API services, so that the app can communicate reliably with the backend.

#### Acceptance Criteria

1. THE Client_App SHALL define Dart models matching the backend TypeScript types (User, Ride, Payment, Contract, IntercityTrip, etc.)
2. THE Client_App SHALL implement API service classes for each backend microservice
3. THE Client_App SHALL handle API response parsing and error handling consistently
4. THE Client_App SHALL implement request/response interceptors for authentication headers
5. WHEN serializing data to JSON, THE Client_App SHALL produce valid JSON matching backend expectations
6. WHEN deserializing JSON from the backend, THE Client_App SHALL correctly parse all fields into Dart objects

### Requirement 22: Scheduled Rides

**User Story:** As a user, I want to schedule rides in advance, so that I can plan my transportation ahead of time.

#### Acceptance Criteria

1. THE Client_App SHALL allow users to select a future date and time for pickup
2. THE Client_App SHALL validate that scheduled time is at least 30 minutes in the future
3. THE Client_App SHALL display scheduled rides in a dedicated section
4. THE Client_App SHALL send reminders before scheduled pickup time
5. THE Client_App SHALL allow users to cancel or modify scheduled rides

### Requirement 23: Airport Transfers

**User Story:** As a user, I want to book airport transfers with flight tracking, so that I can travel to/from the airport reliably.

#### Acceptance Criteria

1. THE Client_App SHALL display airport transfer as a special ride type
2. THE Client_App SHALL allow users to enter flight number for tracking
3. THE Client_App SHALL display terminal and meeting point options
4. THE Client_App SHALL offer meet-and-greet service with name board
5. THE Client_App SHALL adjust pickup time based on flight arrival status

### Requirement 24: Support and Help

**User Story:** As a user, I want to access help and support, so that I can resolve issues with my rides or account.

#### Acceptance Criteria

1. THE Client_App SHALL display a help section with FAQs in Arabic
2. THE Client_App SHALL allow users to create support tickets
3. THE Client_App SHALL allow users to select ticket category (ride issue, payment issue, driver complaint, etc.)
4. THE Client_App SHALL display ticket status and responses
5. THE Client_App SHALL provide emergency contact options
