swagger: "2.0"
info:
  title: Jeeny Taxi Platform API
  description: REST API for Jeeny taxi booking platform
  version: "1.0.0"
host: "jeeny-gateway-${environment}.${region}.gateway.dev"
schemes:
  - https
produces:
  - application/json
consumes:
  - application/json

securityDefinitions:
  firebase:
    authorizationUrl: ""
    flow: "implicit"
    type: "oauth2"
    x-google-issuer: "https://securetoken.google.com/${project_id}"
    x-google-jwks_uri: "https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    x-google-audiences: "${project_id}"

paths:
  # ===== AUTH =====
  /auth/register:
    post:
      summary: Register new user
      operationId: authRegister
      x-google-backend:
        address: ${auth_url}/register
      responses:
        200:
          description: Success

  /auth/verify-otp:
    post:
      summary: Verify OTP
      operationId: authVerifyOtp
      x-google-backend:
        address: ${auth_url}/verify-otp
      responses:
        200:
          description: Success

  /auth/login:
    post:
      summary: Login
      operationId: authLogin
      x-google-backend:
        address: ${auth_url}/login
      responses:
        200:
          description: Success

  /auth/refresh-token:
    post:
      summary: Refresh token
      operationId: authRefreshToken
      x-google-backend:
        address: ${auth_url}/refresh-token
      responses:
        200:
          description: Success

  /auth/logout:
    post:
      summary: Logout
      operationId: authLogout
      security:
        - firebase: []
      x-google-backend:
        address: ${auth_url}/logout
      responses:
        200:
          description: Success

  # ===== USERS =====
  /users:
    get:
      summary: List users
      operationId: listUsers
      security:
        - firebase: []
      x-google-backend:
        address: ${users_url}
      responses:
        200:
          description: Success

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUser
      security:
        - firebase: []
      x-google-backend:
        address: ${users_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: userId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success
    put:
      summary: Update user
      operationId: updateUser
      security:
        - firebase: []
      x-google-backend:
        address: ${users_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: userId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /me:
    get:
      summary: Get current user
      operationId: getCurrentUser
      security:
        - firebase: []
      x-google-backend:
        address: ${users_url}/me
      responses:
        200:
          description: Success
    put:
      summary: Update current user
      operationId: updateCurrentUser
      security:
        - firebase: []
      x-google-backend:
        address: ${users_url}/me
      responses:
        200:
          description: Success

  # ===== RIDES =====
  /rides:
    get:
      summary: List rides
      operationId: listRides
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
      responses:
        200:
          description: Success
    post:
      summary: Create ride
      operationId: createRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
      responses:
        200:
          description: Success

  /rides/estimate:
    post:
      summary: Get ride estimate
      operationId: getRideEstimate
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}/estimate
      responses:
        200:
          description: Success

  /rides/current:
    get:
      summary: Get current ride
      operationId: getCurrentRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}/current
      responses:
        200:
          description: Success

  /rides/{rideId}:
    get:
      summary: Get ride by ID
      operationId: getRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: rideId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /rides/{rideId}/accept:
    post:
      summary: Accept ride
      operationId: acceptRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: rideId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /rides/{rideId}/cancel:
    post:
      summary: Cancel ride
      operationId: cancelRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: rideId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /rides/{rideId}/complete:
    post:
      summary: Complete ride
      operationId: completeRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: rideId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /rides/{rideId}/rate:
    post:
      summary: Rate ride
      operationId: rateRide
      security:
        - firebase: []
      x-google-backend:
        address: ${rides_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: rideId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success


  # ===== DRIVERS =====
  /drivers:
    get:
      summary: List drivers
      operationId: listDrivers
      security:
        - firebase: []
      x-google-backend:
        address: ${drivers_url}
      responses:
        200:
          description: Success

  /drivers/nearby:
    get:
      summary: Get nearby drivers
      operationId: getNearbyDrivers
      security:
        - firebase: []
      x-google-backend:
        address: ${drivers_url}/nearby
      responses:
        200:
          description: Success

  /drivers/{driverId}:
    get:
      summary: Get driver by ID
      operationId: getDriver
      security:
        - firebase: []
      x-google-backend:
        address: ${drivers_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: driverId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /drivers/{driverId}/status:
    put:
      summary: Update driver status
      operationId: updateDriverStatus
      security:
        - firebase: []
      x-google-backend:
        address: ${drivers_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: driverId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /drivers/{driverId}/location:
    put:
      summary: Update driver location
      operationId: updateDriverLocation
      security:
        - firebase: []
      x-google-backend:
        address: ${drivers_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: driverId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  # ===== LOCATION =====
  /location/search:
    get:
      summary: Search places
      operationId: searchPlaces
      security:
        - firebase: []
      x-google-backend:
        address: ${location_url}/search
      responses:
        200:
          description: Success

  /location/autocomplete:
    get:
      summary: Autocomplete places
      operationId: autocompletePlaces
      security:
        - firebase: []
      x-google-backend:
        address: ${location_url}/autocomplete
      responses:
        200:
          description: Success

  /location/reverse-geocode:
    get:
      summary: Reverse geocode
      operationId: reverseGeocode
      security:
        - firebase: []
      x-google-backend:
        address: ${location_url}/reverse-geocode
      responses:
        200:
          description: Success

  /location/route:
    post:
      summary: Calculate route
      operationId: calculateRoute
      security:
        - firebase: []
      x-google-backend:
        address: ${location_url}/route
      responses:
        200:
          description: Success

  /location/eta:
    post:
      summary: Get ETA
      operationId: getEta
      security:
        - firebase: []
      x-google-backend:
        address: ${location_url}/eta
      responses:
        200:
          description: Success

  # ===== PAYMENTS =====
  /payments:
    get:
      summary: List payments
      operationId: listPayments
      security:
        - firebase: []
      x-google-backend:
        address: ${payments_url}
      responses:
        200:
          description: Success

  /payments/methods:
    get:
      summary: Get payment methods
      operationId: getPaymentMethods
      security:
        - firebase: []
      x-google-backend:
        address: ${payments_url}/methods
      responses:
        200:
          description: Success
    post:
      summary: Add payment method
      operationId: addPaymentMethod
      security:
        - firebase: []
      x-google-backend:
        address: ${payments_url}/methods
      responses:
        200:
          description: Success

  /payments/wallet:
    get:
      summary: Get wallet balance
      operationId: getWalletBalance
      security:
        - firebase: []
      x-google-backend:
        address: ${payments_url}/wallet
      responses:
        200:
          description: Success

  /payments/wallet/topup:
    post:
      summary: Top up wallet
      operationId: topUpWallet
      security:
        - firebase: []
      x-google-backend:
        address: ${payments_url}/wallet/topup
      responses:
        200:
          description: Success

  # ===== NOTIFICATIONS =====
  /notifications:
    get:
      summary: List notifications
      operationId: listNotifications
      security:
        - firebase: []
      x-google-backend:
        address: ${notifications_url}
      responses:
        200:
          description: Success

  /notifications/device-token:
    post:
      summary: Register device token
      operationId: registerDeviceToken
      security:
        - firebase: []
      x-google-backend:
        address: ${notifications_url}/device-token
      responses:
        200:
          description: Success

  /notifications/settings:
    get:
      summary: Get notification settings
      operationId: getNotificationSettings
      security:
        - firebase: []
      x-google-backend:
        address: ${notifications_url}/settings
      responses:
        200:
          description: Success
    put:
      summary: Update notification settings
      operationId: updateNotificationSettings
      security:
        - firebase: []
      x-google-backend:
        address: ${notifications_url}/settings
      responses:
        200:
          description: Success

  # ===== CHAT =====
  /chat/conversations:
    get:
      summary: List conversations
      operationId: listConversations
      security:
        - firebase: []
      x-google-backend:
        address: ${chat_url}/conversations
      responses:
        200:
          description: Success

  /chat/conversations/{conversationId}/messages:
    get:
      summary: Get messages
      operationId: getMessages
      security:
        - firebase: []
      x-google-backend:
        address: ${chat_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: conversationId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success
    post:
      summary: Send message
      operationId: sendMessage
      security:
        - firebase: []
      x-google-backend:
        address: ${chat_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: conversationId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  # ===== SUPPORT =====
  /support/tickets:
    get:
      summary: List support tickets
      operationId: listSupportTickets
      security:
        - firebase: []
      x-google-backend:
        address: ${support_url}/tickets
      responses:
        200:
          description: Success
    post:
      summary: Create support ticket
      operationId: createSupportTicket
      security:
        - firebase: []
      x-google-backend:
        address: ${support_url}/tickets
      responses:
        200:
          description: Success

  /support/faq:
    get:
      summary: Get FAQ
      operationId: getFaq
      x-google-backend:
        address: ${support_url}/faq
      responses:
        200:
          description: Success

  # ===== PROMOTIONS =====
  /promotions:
    get:
      summary: List promotions
      operationId: listPromotions
      security:
        - firebase: []
      x-google-backend:
        address: ${promotions_url}
      responses:
        200:
          description: Success

  /promotions/apply:
    post:
      summary: Apply promotion code
      operationId: applyPromotion
      security:
        - firebase: []
      x-google-backend:
        address: ${promotions_url}/apply
      responses:
        200:
          description: Success

  # ===== ADMIN =====
  /admin/dashboard:
    get:
      summary: Get admin dashboard
      operationId: getAdminDashboard
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/dashboard
      responses:
        200:
          description: Success

  /admin/stats:
    get:
      summary: Get admin stats
      operationId: getAdminStats
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/stats
      responses:
        200:
          description: Success

  /admin/users:
    get:
      summary: Admin list users
      operationId: adminListUsers
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/users
      responses:
        200:
          description: Success

  /admin/drivers:
    get:
      summary: Admin list drivers
      operationId: adminListDrivers
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/drivers
      responses:
        200:
          description: Success

  /admin/drivers/pending:
    get:
      summary: Admin list pending drivers
      operationId: adminListPendingDrivers
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/drivers/pending
      responses:
        200:
          description: Success

  /admin/rides:
    get:
      summary: Admin list rides
      operationId: adminListRides
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/rides
      responses:
        200:
          description: Success

  /admin/settings:
    get:
      summary: Get admin settings
      operationId: getAdminSettings
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/settings
      responses:
        200:
          description: Success
    put:
      summary: Update admin settings
      operationId: updateAdminSettings
      security:
        - firebase: []
      x-google-backend:
        address: ${admin_url}/settings
      responses:
        200:
          description: Success

  # ===== ANALYTICS =====
  /analytics/rides:
    get:
      summary: Get ride analytics
      operationId: getRideAnalytics
      security:
        - firebase: []
      x-google-backend:
        address: ${analytics_url}/rides
      responses:
        200:
          description: Success

  /analytics/revenue:
    get:
      summary: Get revenue analytics
      operationId: getRevenueAnalytics
      security:
        - firebase: []
      x-google-backend:
        address: ${analytics_url}/revenue
      responses:
        200:
          description: Success

  /analytics/users:
    get:
      summary: Get user analytics
      operationId: getUserAnalytics
      security:
        - firebase: []
      x-google-backend:
        address: ${analytics_url}/users
      responses:
        200:
          description: Success

  /analytics/heatmap:
    get:
      summary: Get heatmap data
      operationId: getHeatmapData
      security:
        - firebase: []
      x-google-backend:
        address: ${analytics_url}/heatmap
      responses:
        200:
          description: Success

  # ===== CONTRACTS =====
  /contracts:
    get:
      summary: List contracts
      operationId: listContracts
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
      responses:
        200:
          description: Success
    post:
      summary: Create contract
      operationId: createContract
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
      responses:
        200:
          description: Success

  /contracts/{contractId}:
    get:
      summary: Get contract by ID
      operationId: getContract
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: contractId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success
    put:
      summary: Update contract
      operationId: updateContract
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: contractId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /contracts/{contractId}/approve:
    post:
      summary: Approve contract
      operationId: approveContract
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: contractId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /contracts/{contractId}/trips:
    get:
      summary: Get contract trips
      operationId: getContractTrips
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: contractId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success
    post:
      summary: Create contract trip
      operationId: createContractTrip
      security:
        - firebase: []
      x-google-backend:
        address: ${contracts_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: contractId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  # ===== INTERCITY =====
  /intercity/routes:
    get:
      summary: List intercity routes
      operationId: listIntercityRoutes
      x-google-backend:
        address: ${intercity_url}/routes
      responses:
        200:
          description: Success
    post:
      summary: Create intercity route
      operationId: createIntercityRoute
      security:
        - firebase: []
      x-google-backend:
        address: ${intercity_url}/routes
      responses:
        200:
          description: Success

  /intercity/routes/{routeId}:
    get:
      summary: Get intercity route
      operationId: getIntercityRoute
      x-google-backend:
        address: ${intercity_url}/routes
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: routeId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /intercity/trips:
    get:
      summary: List intercity trips
      operationId: listIntercityTrips
      x-google-backend:
        address: ${intercity_url}/trips
      responses:
        200:
          description: Success
    post:
      summary: Create intercity trip
      operationId: createIntercityTrip
      security:
        - firebase: []
      x-google-backend:
        address: ${intercity_url}/trips
      responses:
        200:
          description: Success

  /intercity/trips/{tripId}:
    get:
      summary: Get intercity trip
      operationId: getIntercityTrip
      x-google-backend:
        address: ${intercity_url}/trips
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: tripId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /intercity/bookings:
    get:
      summary: List intercity bookings
      operationId: listIntercityBookings
      security:
        - firebase: []
      x-google-backend:
        address: ${intercity_url}/bookings
      responses:
        200:
          description: Success
    post:
      summary: Create intercity booking
      operationId: createIntercityBooking
      security:
        - firebase: []
      x-google-backend:
        address: ${intercity_url}/bookings
      responses:
        200:
          description: Success

  /intercity/search:
    get:
      summary: Search intercity trips
      operationId: searchIntercityTrips
      x-google-backend:
        address: ${intercity_url}/search
      responses:
        200:
          description: Success

  # ===== CITIES =====
  /cities:
    get:
      summary: List cities
      operationId: listCities
      x-google-backend:
        address: ${cities_url}/cities
      responses:
        200:
          description: Success
    post:
      summary: Create city
      operationId: createCity
      security:
        - firebase: []
      x-google-backend:
        address: ${cities_url}/cities
      responses:
        200:
          description: Success

  /cities/{cityId}:
    get:
      summary: Get city
      operationId: getCity
      x-google-backend:
        address: ${cities_url}/cities
        path_translation: APPEND_PATH_TO_ADDRESS
      parameters:
        - name: cityId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Success

  /neighborhoods:
    get:
      summary: List neighborhoods
      operationId: listNeighborhoods
      x-google-backend:
        address: ${cities_url}/neighborhoods
      responses:
        200:
          description: Success

  /airports:
    get:
      summary: List airports
      operationId: listAirports
      x-google-backend:
        address: ${cities_url}/airports
      responses:
        200:
          description: Success

  # ===== PRICING =====
  /pricing/rules:
    get:
      summary: List pricing rules
      operationId: listPricingRules
      x-google-backend:
        address: ${pricing_url}/rules
      responses:
        200:
          description: Success
    post:
      summary: Create pricing rule
      operationId: createPricingRule
      security:
        - firebase: []
      x-google-backend:
        address: ${pricing_url}/rules
      responses:
        200:
          description: Success

  /pricing/calculate:
    post:
      summary: Calculate fare
      operationId: calculateFare
      x-google-backend:
        address: ${pricing_url}/calculate
      responses:
        200:
          description: Success

  /pricing/surge:
    get:
      summary: Get surge pricing
      operationId: getSurgePricing
      x-google-backend:
        address: ${pricing_url}/surge
      responses:
        200:
          description: Success
    post:
      summary: Create surge pricing
      operationId: createSurgePricing
      security:
        - firebase: []
      x-google-backend:
        address: ${pricing_url}/surge
      responses:
        200:
          description: Success

  /pricing/commissions:
    get:
      summary: List commissions
      operationId: listCommissions
      security:
        - firebase: []
      x-google-backend:
        address: ${pricing_url}/commissions
      responses:
        200:
          description: Success

