/**
 * GoCap Shared Constants
 * Application-wide constants, colors, and configuration values
 */

// ==================== APP INFO ====================

export const APP_NAME = 'Jeeny';
export const APP_NAME_AR = 'جيني';
export const APP_NAME_FR = 'Jeeny';

export const APP_VERSION = '1.0.0';
export const APP_BUILD_NUMBER = 1;

export const COMPANY_NAME = 'Jeeny Mauritania';
export const SUPPORT_EMAIL = 'support@jeeny.mr';
export const SUPPORT_PHONE = '+222 00 00 00 00';
export const WEBSITE_URL = 'https://jeeny.mr';

// ==================== COLORS (Based on Design) ====================

export const COLORS = {
  // Primary Colors
  primary: {
    main: '#FFD600', // Yellow - Main brand color
    light: '#FFEB3B',
    dark: '#FFC107',
    contrast: '#000000',
  },

  // Secondary Colors
  secondary: {
    main: '#1A1A2E', // Dark Blue/Navy
    light: '#16213E',
    dark: '#0F0F1A',
    contrast: '#FFFFFF',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#FAFAFA',
    dark: '#1A1A2E',
    card: '#FFFFFF',
    modal: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#1A1A2E',
    secondary: '#666666',
    tertiary: '#999999',
    placeholder: '#BBBBBB',
    inverse: '#FFFFFF',
    link: '#FFD600',
    error: '#F44336',
    success: '#4CAF50',
  },

  // Status Colors
  status: {
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    error: '#F44336',
    errorLight: '#FFEBEE',
    info: '#2196F3',
    infoLight: '#E3F2FD',
  },

  // UI Element Colors
  ui: {
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    divider: '#EEEEEE',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.25)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#CCCCCC',
    disabledBackground: '#F5F5F5',
  },

  // Map Colors
  map: {
    route: '#FFD600',
    routeAlt: '#1A1A2E',
    pickup: '#4CAF50',
    dropoff: '#F44336',
    stop: '#FF9800',
    driver: '#FFD600',
    driverArea: 'rgba(255, 214, 0, 0.2)',
  },

  // Vehicle Type Colors
  vehicle: {
    economy: '#4CAF50',
    comfort: '#2196F3',
    business: '#9C27B0',
    van: '#FF9800',
    luxury: '#FFD600',
  },

  // Rating Colors
  rating: {
    filled: '#FFD600',
    empty: '#E0E0E0',
  },

  // Social/Payment Provider Colors
  providers: {
    bankily: '#00A859',
    sedad: '#1E3A8A',
    masrvi: '#E31837',
    cash: '#4CAF50',
  },

  // Gradient definitions
  gradients: {
    primary: ['#FFD600', '#FFC107'],
    secondary: ['#1A1A2E', '#16213E'],
    dark: ['#0F0F1A', '#1A1A2E'],
    card: ['#FFFFFF', '#F5F5F5'],
  },

  // Transparent variants
  transparent: {
    black10: 'rgba(0, 0, 0, 0.1)',
    black20: 'rgba(0, 0, 0, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black70: 'rgba(0, 0, 0, 0.7)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white50: 'rgba(255, 255, 255, 0.5)',
    white70: 'rgba(255, 255, 255, 0.7)',
    primary20: 'rgba(255, 214, 0, 0.2)',
    primary50: 'rgba(255, 214, 0, 0.5)',
  },
} as const;

// ==================== DARK THEME COLORS ====================

export const DARK_COLORS = {
  ...COLORS,
  background: {
    primary: '#0F0F1A',
    secondary: '#1A1A2E',
    tertiary: '#16213E',
    dark: '#000000',
    card: '#1A1A2E',
    modal: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    tertiary: '#999999',
    placeholder: '#666666',
    inverse: '#1A1A2E',
    link: '#FFD600',
    error: '#EF5350',
    success: '#66BB6A',
  },
  ui: {
    border: '#2A2A3E',
    borderLight: '#1A1A2E',
    divider: '#2A2A3E',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: '#444444',
    disabledBackground: '#1A1A2E',
  },
} as const;

// ==================== TYPOGRAPHY ====================

export const FONTS = {
  family: {
    regular: 'Gilroy-Regular',
    medium: 'Gilroy-Medium',
    semiBold: 'Gilroy-SemiBold',
    bold: 'Gilroy-Bold',
    extraBold: 'Gilroy-ExtraBold',
    black: 'Gilroy-Black',
    light: 'Gilroy-Light',
    thin: 'Gilroy-Thin',
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// ==================== SPACING ====================

export const SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// ==================== BORDER RADIUS ====================

export const BORDER_RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ==================== SHADOWS ====================

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// ==================== ANIMATIONS ====================

export const ANIMATION = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ==================== API CONFIGURATION ====================

export const API_CONFIG = {
  // Base URLs (will be replaced with actual values from environment)
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.jeeny.mr',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://ws.jeeny.mr',

  // Timeouts
  timeout: 30000, // 30 seconds
  uploadTimeout: 120000, // 2 minutes

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

// ==================== AWS CONFIGURATION ====================

export const AWS_CONFIG = {
  accountId: '160343708363',
  region: process.env.EXPO_PUBLIC_AWS_REGION || 'eu-north-1',

  // Cognito
  cognito: {
    userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
    clientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
    identityPoolId: process.env.EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
  },

  // S3
  s3: {
    bucket: process.env.EXPO_PUBLIC_S3_BUCKET || 'jeeny-assets',
    region: process.env.EXPO_PUBLIC_S3_REGION || 'eu-north-1',
  },

  // Location Service
  location: {
    mapName: process.env.EXPO_PUBLIC_AWS_MAP_NAME || 'jeeny-map',
    placeIndex: process.env.EXPO_PUBLIC_AWS_PLACE_INDEX || 'jeeny-place-index',
    routeCalculator: process.env.EXPO_PUBLIC_AWS_ROUTE_CALCULATOR || 'jeeny-route-calculator',
    trackerName: process.env.EXPO_PUBLIC_AWS_TRACKER_NAME || 'jeeny-tracker',
    geofenceCollection: process.env.EXPO_PUBLIC_AWS_GEOFENCE_COLLECTION || 'jeeny-geofences',
  },

  // Pinpoint
  pinpoint: {
    appId: process.env.EXPO_PUBLIC_PINPOINT_APP_ID || '',
  },
} as const;

// ==================== API ENDPOINTS ====================

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    refreshToken: '/auth/refresh-token',
    logout: '/auth/logout',
    deleteAccount: '/auth/delete-account',
  },

  // Users
  users: {
    me: '/users/me',
    profile: '/users/profile',
    updateProfile: '/users/profile',
    uploadPhoto: '/users/photo',
    preferences: '/users/preferences',
    devices: '/users/devices',
  },

  // Clients
  clients: {
    list: '/clients',
    detail: (id: string) => `/clients/${id}`,
    savedAddresses: '/clients/addresses',
    favorites: '/clients/favorites',
    rideHistory: '/clients/rides',
    stats: '/clients/stats',
  },

  // Drivers
  drivers: {
    list: '/drivers',
    detail: (id: string) => `/drivers/${id}`,
    nearby: '/drivers/nearby',
    online: '/drivers/online',
    status: '/drivers/status',
    location: '/drivers/location',
    documents: '/drivers/documents',
    uploadDocument: '/drivers/documents/upload',
    vehicle: '/drivers/vehicle',
    earnings: '/drivers/earnings',
    stats: '/drivers/stats',
    rideHistory: '/drivers/rides',
  },

  // Rides
  rides: {
    list: '/rides',
    detail: (id: string) => `/rides/${id}`,
    create: '/rides',
    estimate: '/rides/estimate',
    cancel: (id: string) => `/rides/${id}/cancel`,
    accept: (id: string) => `/rides/${id}/accept`,
    reject: (id: string) => `/rides/${id}/reject`,
    arrived: (id: string) => `/rides/${id}/arrived`,
    start: (id: string) => `/rides/${id}/start`,
    complete: (id: string) => `/rides/${id}/complete`,
    rate: (id: string) => `/rides/${id}/rate`,
    tracking: (id: string) => `/rides/${id}/tracking`,
    active: '/rides/active',
    scheduled: '/rides/scheduled',
  },

  // Payments
  payments: {
    methods: '/payments/methods',
    addMethod: '/payments/methods',
    removeMethod: (id: string) => `/payments/methods/${id}`,
    setDefault: (id: string) => `/payments/methods/${id}/default`,
    transactions: '/payments/transactions',
    wallet: '/payments/wallet',
    topUp: '/payments/wallet/top-up',
    withdraw: '/payments/wallet/withdraw',
  },

  // Locations
  locations: {
    cities: '/locations/cities',
    neighborhoods: (cityId: string) => `/locations/cities/${cityId}/neighborhoods`,
    search: '/locations/search',
    geocode: '/locations/geocode',
    reverseGeocode: '/locations/reverse-geocode',
    route: '/locations/route',
  },

  // Pricing
  pricing: {
    rules: '/pricing/rules',
    estimate: '/pricing/estimate',
    surge: '/pricing/surge',
  },

  // Promotions
  promotions: {
    list: '/promotions',
    validate: '/promotions/validate',
    apply: '/promotions/apply',
  },

  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    settings: '/notifications/settings',
  },

  // Chat
  chat: {
    conversations: '/chat/conversations',
    messages: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    send: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  },

  // Support
  support: {
    tickets: '/support/tickets',
    createTicket: '/support/tickets',
    ticketDetail: (id: string) => `/support/tickets/${id}`,
    ticketMessages: (id: string) => `/support/tickets/${id}/messages`,
    faq: '/support/faq',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    drivers: '/admin/drivers',
    clients: '/admin/clients',
    employees: '/admin/employees',
    rides: '/admin/rides',
    transactions: '/admin/transactions',
    pricing: '/admin/pricing',
    promotions: '/admin/promotions',
    cities: '/admin/cities',
    neighborhoods: '/admin/neighborhoods',
    paymentProviders: '/admin/payment-providers',
    settings: '/admin/settings',
    reports: '/admin/reports',
    auditLogs: '/admin/audit-logs',
  },

  // Employee
  employee: {
    tasks: '/employee/tasks',
    verifyDocument: '/employee/verify-document',
    supportTickets: '/employee/support-tickets',
  },
} as const;

// ==================== WEBSOCKET EVENTS ====================

export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',

  // Location
  LOCATION_UPDATE: 'location:update',
  DRIVER_LOCATION: 'driver:location',
  SUBSCRIBE_DRIVER: 'driver:subscribe',
  UNSUBSCRIBE_DRIVER: 'driver:unsubscribe',

  // Ride
  RIDE_REQUEST: 'ride:request',
  RIDE_ACCEPTED: 'ride:accepted',
  RIDE_REJECTED: 'ride:rejected',
  RIDE_CANCELLED: 'ride:cancelled',
  DRIVER_ARRIVED: 'ride:driver_arrived',
  RIDE_STARTED: 'ride:started',
  RIDE_COMPLETED: 'ride:completed',
  RIDE_UPDATE: 'ride:update',

  // Chat
  MESSAGE_NEW: 'chat:message:new',
  MESSAGE_READ: 'chat:message:read',
  TYPING_START: 'chat:typing:start',
  TYPING_STOP: 'chat:typing:stop',

  // Driver Status
  DRIVER_ONLINE: 'driver:online',
  DRIVER_OFFLINE: 'driver:offline',
  DRIVER_BUSY: 'driver:busy',

  // Notifications
  NOTIFICATION: 'notification',
} as const;

// ==================== APP CONSTANTS ====================

export const APP_CONSTANTS = {
  // Phone validation
  phone: {
    mauritaniaCode: '+222',
    mauritaniaCodeNumeric: '222',
    minLength: 8,
    maxLength: 8,
    pattern: /^[234]\d{7}$/, // Mauritania phone numbers start with 2, 3, or 4
  },

  // OTP
  otp: {
    length: 6,
    expirySeconds: 120,
    maxAttempts: 3,
    resendDelaySeconds: 60,
  },

  // Rating
  rating: {
    min: 1,
    max: 5,
    minForGoodDriver: 4.0,
    minForGoodClient: 4.0,
  },

  // Ride
  ride: {
    maxStops: 3,
    searchRadiusMeters: 5000,
    driverSearchTimeoutSeconds: 120,
    waitingTimeMinutes: 5,
    maxScheduleAheadDays: 7,
    cancellationFreeMinutes: 2,
  },

  // Driver
  driver: {
    minAcceptanceRate: 0.7,
    maxCancellationRate: 0.15,
    locationUpdateIntervalMs: 5000,
    offlineAfterNoUpdateMinutes: 5,
  },

  // Map
  map: {
    defaultZoom: 15,
    searchZoom: 14,
    rideZoom: 16,
    maxZoom: 20,
    minZoom: 10,
    defaultCenter: {
      latitude: 18.0735, // Nouakchott, Mauritania
      longitude: -15.9582,
    },
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // File upload
  upload: {
    maxImageSizeMB: 5,
    maxDocumentSizeMB: 10,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },

  // Cache
  cache: {
    userDataTTL: 3600000, // 1 hour
    citiesTTL: 86400000, // 24 hours
    pricingTTL: 300000, // 5 minutes
  },

  // Currency
  currency: {
    default: 'MRU', // Mauritanian Ouguiya
    symbol: 'MRU',
    decimalPlaces: 0,
  },
} as const;

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: '@jeeny/auth_token',
  REFRESH_TOKEN: '@jeeny/refresh_token',
  USER_DATA: '@jeeny/user_data',

  // Preferences
  LANGUAGE: '@jeeny/language',
  THEME: '@jeeny/theme',
  ONBOARDING_COMPLETE: '@jeeny/onboarding_complete',
  NOTIFICATION_SETTINGS: '@jeeny/notification_settings',

  // Cache
  CITIES_CACHE: '@jeeny/cities_cache',
  RECENT_SEARCHES: '@jeeny/recent_searches',
  RECENT_LOCATIONS: '@jeeny/recent_locations',

  // Device
  DEVICE_ID: '@jeeny/device_id',
  PUSH_TOKEN: '@jeeny/push_token',
  DEVICE_INFO: '@jeeny/device_info',

  // Driver specific
  DRIVER_STATUS: '@jeeny/driver_status',
  LAST_LOCATION: '@jeeny/last_location',
} as const;

// ==================== ERROR CODES ====================

export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_PHONE: 'AUTH_001',
  AUTH_INVALID_OTP: 'AUTH_002',
  AUTH_OTP_EXPIRED: 'AUTH_003',
  AUTH_TOO_MANY_ATTEMPTS: 'AUTH_004',
  AUTH_SESSION_EXPIRED: 'AUTH_005',
  AUTH_UNAUTHORIZED: 'AUTH_006',

  // User
  USER_NOT_FOUND: 'USER_001',
  USER_ALREADY_EXISTS: 'USER_002',
  USER_SUSPENDED: 'USER_003',
  USER_BANNED: 'USER_004',

  // Driver
  DRIVER_NOT_VERIFIED: 'DRIVER_001',
  DRIVER_OFFLINE: 'DRIVER_002',
  DRIVER_BUSY: 'DRIVER_003',
  DRIVER_NOT_FOUND: 'DRIVER_004',

  // Ride
  RIDE_NOT_FOUND: 'RIDE_001',
  RIDE_ALREADY_ACCEPTED: 'RIDE_002',
  RIDE_ALREADY_CANCELLED: 'RIDE_003',
  RIDE_INVALID_STATUS: 'RIDE_004',
  NO_DRIVERS_AVAILABLE: 'RIDE_005',
  RIDE_TOO_FAR: 'RIDE_006',

  // Payment
  PAYMENT_FAILED: 'PAYMENT_001',
  PAYMENT_INSUFFICIENT_BALANCE: 'PAYMENT_002',
  PAYMENT_METHOD_INVALID: 'PAYMENT_003',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_004',

  // Promotion
  PROMO_INVALID: 'PROMO_001',
  PROMO_EXPIRED: 'PROMO_002',
  PROMO_MAX_USES: 'PROMO_003',
  PROMO_NOT_APPLICABLE: 'PROMO_004',

  // Location
  LOCATION_NOT_SUPPORTED: 'LOCATION_001',
  LOCATION_PERMISSION_DENIED: 'LOCATION_002',

  // General
  VALIDATION_ERROR: 'VALIDATION_001',
  NETWORK_ERROR: 'NETWORK_001',
  SERVER_ERROR: 'SERVER_001',
  UNKNOWN_ERROR: 'UNKNOWN_001',
} as const;

// ==================== VEHICLE CATEGORIES CONFIG ====================
// فئات المركبات

export const VEHICLE_CATEGORIES = {
  CAR: {
    id: 'CAR',
    name: 'Car',
    nameAr: 'سيارة',
    nameFr: 'Voiture',
    description: 'Standard cars for passenger transport',
    descriptionAr: 'سيارات عادية لنقل الركاب',
    descriptionFr: 'Voitures standard pour le transport de passagers',
    icon: 'car',
    minCapacity: 2,
    maxCapacity: 7,
  },
  MOTORCYCLE: {
    id: 'MOTORCYCLE',
    name: 'Motorcycle',
    nameAr: 'دراجة نارية',
    nameFr: 'Moto',
    description: 'Fast delivery and single passenger transport',
    descriptionAr: 'توصيل سريع ونقل راكب واحد',
    descriptionFr: 'Livraison rapide et transport d\'un passager',
    icon: 'motorcycle',
    minCapacity: 1,
    maxCapacity: 1,
  },
  TRICYCLE: {
    id: 'TRICYCLE',
    name: 'Tricycle',
    nameAr: 'توك توك',
    nameFr: 'Tricycle',
    description: 'Three-wheeled vehicles for short trips',
    descriptionAr: 'مركبات ثلاثية العجلات للرحلات القصيرة',
    descriptionFr: 'Véhicules à trois roues pour les courts trajets',
    icon: 'tricycle',
    minCapacity: 2,
    maxCapacity: 3,
  },
  BICYCLE: {
    id: 'BICYCLE',
    name: 'Bicycle',
    nameAr: 'دراجة هوائية',
    nameFr: 'Vélo',
    description: 'Eco-friendly delivery option',
    descriptionAr: 'خيار توصيل صديق للبيئة',
    descriptionFr: 'Option de livraison écologique',
    icon: 'bicycle',
    minCapacity: 0,
    maxCapacity: 0,
  },
  PICKUP_TRUCK: {
    id: 'PICKUP_TRUCK',
    name: 'Pickup Truck',
    nameAr: 'بيك أب',
    nameFr: 'Pick-up',
    description: 'For moving and large deliveries',
    descriptionAr: 'للنقل والتوصيلات الكبيرة',
    descriptionFr: 'Pour les déménagements et grandes livraisons',
    icon: 'pickup',
    minCapacity: 2,
    maxCapacity: 3,
  },
  MINIBUS: {
    id: 'MINIBUS',
    name: 'Minibus',
    nameAr: 'حافلة صغيرة',
    nameFr: 'Minibus',
    description: 'For group transport',
    descriptionAr: 'لنقل المجموعات',
    descriptionFr: 'Pour le transport de groupes',
    icon: 'minibus',
    minCapacity: 7,
    maxCapacity: 14,
  },
} as const;

// ==================== VEHICLE TYPES CONFIG ====================
// أنواع الخدمات

export const VEHICLE_TYPES = {
  // Cars - سيارات
  ECONOMY: {
    id: 'ECONOMY',
    category: 'CAR',
    name: 'Economy',
    nameAr: 'اقتصادي',
    nameFr: 'Économique',
    description: 'Affordable rides for everyday trips',
    descriptionAr: 'رحلات بأسعار معقولة للرحلات اليومية',
    descriptionFr: 'Trajets abordables pour les déplacements quotidiens',
    capacity: 4,
    icon: 'car_1',
    color: COLORS.vehicle.economy,
  },
  COMFORT: {
    id: 'COMFORT',
    category: 'CAR',
    name: 'Comfort',
    nameAr: 'مريح',
    nameFr: 'Confort',
    description: 'Comfortable rides with more space',
    descriptionAr: 'رحلات مريحة مع مساحة أكبر',
    descriptionFr: 'Trajets confortables avec plus d\'espace',
    capacity: 4,
    icon: 'car_2',
    color: COLORS.vehicle.comfort,
  },
  BUSINESS: {
    id: 'BUSINESS',
    category: 'CAR',
    name: 'Business',
    nameAr: 'أعمال',
    nameFr: 'Affaires',
    description: 'Premium rides for business professionals',
    descriptionAr: 'رحلات متميزة لرجال الأعمال',
    descriptionFr: 'Trajets premium pour les professionnels',
    capacity: 4,
    icon: 'car_3',
    color: COLORS.vehicle.business,
  },
  VAN: {
    id: 'VAN',
    category: 'CAR',
    name: 'Van',
    nameAr: 'فان',
    nameFr: 'Van',
    description: 'Spacious rides for groups',
    descriptionAr: 'رحلات واسعة للمجموعات',
    descriptionFr: 'Trajets spacieux pour les groupes',
    capacity: 6,
    icon: 'car_4',
    color: COLORS.vehicle.van,
  },
  LUXURY: {
    id: 'LUXURY',
    category: 'CAR',
    name: 'Luxury',
    nameAr: 'فاخر',
    nameFr: 'Luxe',
    description: 'High-end vehicles for special occasions',
    descriptionAr: 'سيارات فاخرة للمناسبات الخاصة',
    descriptionFr: 'Véhicules haut de gamme pour occasions spéciales',
    capacity: 4,
    icon: 'car_5',
    color: COLORS.vehicle.luxury,
  },
  
  // Motorcycles - دراجات نارية
  MOTO_STANDARD: {
    id: 'MOTO_STANDARD',
    category: 'MOTORCYCLE',
    name: 'Moto Standard',
    nameAr: 'دراجة عادية',
    nameFr: 'Moto Standard',
    description: 'Standard motorcycle for delivery',
    descriptionAr: 'دراجة نارية عادية للتوصيل',
    descriptionFr: 'Moto standard pour la livraison',
    capacity: 1,
    icon: 'moto_1',
    color: '#FF5722',
  },
  MOTO_EXPRESS: {
    id: 'MOTO_EXPRESS',
    category: 'MOTORCYCLE',
    name: 'Moto Express',
    nameAr: 'دراجة سريعة',
    nameFr: 'Moto Express',
    description: 'Fast motorcycle for urgent delivery',
    descriptionAr: 'دراجة نارية سريعة للتوصيل العاجل',
    descriptionFr: 'Moto rapide pour livraison urgente',
    capacity: 1,
    icon: 'moto_2',
    color: '#E91E63',
  },
  
  // Tricycles - توك توك
  TRICYCLE_STANDARD: {
    id: 'TRICYCLE_STANDARD',
    category: 'TRICYCLE',
    name: 'Tricycle',
    nameAr: 'توك توك',
    nameFr: 'Tricycle',
    description: 'Three-wheeled vehicle for short trips',
    descriptionAr: 'مركبة ثلاثية العجلات للرحلات القصيرة',
    descriptionFr: 'Véhicule à trois roues pour courts trajets',
    capacity: 2,
    icon: 'tricycle',
    color: '#00BCD4',
  },
  
  // Pickup Trucks - بيك أب
  PICKUP_SMALL: {
    id: 'PICKUP_SMALL',
    category: 'PICKUP_TRUCK',
    name: 'Small Pickup',
    nameAr: 'بيك أب صغير',
    nameFr: 'Petit Pick-up',
    description: 'Small pickup for light moving',
    descriptionAr: 'بيك أب صغير للنقل الخفيف',
    descriptionFr: 'Petit pick-up pour déménagement léger',
    capacity: 2,
    icon: 'pickup_small',
    color: '#795548',
  },
  PICKUP_LARGE: {
    id: 'PICKUP_LARGE',
    category: 'PICKUP_TRUCK',
    name: 'Large Pickup',
    nameAr: 'بيك أب كبير',
    nameFr: 'Grand Pick-up',
    description: 'Large pickup for heavy moving',
    descriptionAr: 'بيك أب كبير للنقل الثقيل',
    descriptionFr: 'Grand pick-up pour déménagement lourd',
    capacity: 3,
    icon: 'pickup_large',
    color: '#5D4037',
  },
  
  // Minibuses - حافلات صغيرة
  MINIBUS_7: {
    id: 'MINIBUS_7',
    category: 'MINIBUS',
    name: 'Minibus 7 Seats',
    nameAr: 'حافلة 7 مقاعد',
    nameFr: 'Minibus 7 Places',
    description: '7-seater minibus for groups',
    descriptionAr: 'حافلة صغيرة 7 مقاعد للمجموعات',
    descriptionFr: 'Minibus 7 places pour groupes',
    capacity: 7,
    icon: 'minibus_7',
    color: '#3F51B5',
  },
  MINIBUS_14: {
    id: 'MINIBUS_14',
    category: 'MINIBUS',
    name: 'Minibus 14 Seats',
    nameAr: 'حافلة 14 مقعد',
    nameFr: 'Minibus 14 Places',
    description: '14-seater minibus for large groups',
    descriptionAr: 'حافلة صغيرة 14 مقعد للمجموعات الكبيرة',
    descriptionFr: 'Minibus 14 places pour grands groupes',
    capacity: 14,
    icon: 'minibus_14',
    color: '#303F9F',
  },
} as const;

// ==================== RIDE TYPES CONFIG ====================
// أنواع الرحلات

export const RIDE_TYPES = {
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Ride',
    nameAr: 'رحلة عادية',
    nameFr: 'Trajet Standard',
    description: 'Regular point-to-point ride',
    descriptionAr: 'رحلة عادية من نقطة إلى نقطة',
    descriptionFr: 'Trajet standard point à point',
    icon: 'ride_standard',
  },
  SCHEDULED: {
    id: 'SCHEDULED',
    name: 'Scheduled Ride',
    nameAr: 'رحلة مجدولة',
    nameFr: 'Trajet Programmé',
    description: 'Book a ride in advance',
    descriptionAr: 'احجز رحلة مسبقاً',
    descriptionFr: 'Réservez un trajet à l\'avance',
    icon: 'ride_scheduled',
  },
  INTERCITY: {
    id: 'INTERCITY',
    name: 'Intercity',
    nameAr: 'بين المدن',
    nameFr: 'Interurbain',
    description: 'Travel between cities',
    descriptionAr: 'السفر بين المدن',
    descriptionFr: 'Voyager entre les villes',
    icon: 'ride_intercity',
  },
  AIRPORT: {
    id: 'AIRPORT',
    name: 'Airport Transfer',
    nameAr: 'نقل المطار',
    nameFr: 'Transfert Aéroport',
    description: 'To or from the airport',
    descriptionAr: 'من أو إلى المطار',
    descriptionFr: 'Vers ou depuis l\'aéroport',
    icon: 'ride_airport',
  },
  HOURLY: {
    id: 'HOURLY',
    name: 'Hourly Booking',
    nameAr: 'حجز بالساعة',
    nameFr: 'Réservation Horaire',
    description: 'Book a driver by the hour',
    descriptionAr: 'احجز سائق بالساعة',
    descriptionFr: 'Réservez un chauffeur à l\'heure',
    icon: 'ride_hourly',
  },
  MONTHLY_CONTRACT: {
    id: 'MONTHLY_CONTRACT',
    name: 'Monthly Contract',
    nameAr: 'عقد شهري',
    nameFr: 'Contrat Mensuel',
    description: 'Regular scheduled rides',
    descriptionAr: 'رحلات منتظمة مجدولة',
    descriptionFr: 'Trajets réguliers programmés',
    icon: 'ride_contract',
  },
  PACKAGE_DELIVERY: {
    id: 'PACKAGE_DELIVERY',
    name: 'Package Delivery',
    nameAr: 'توصيل طرود',
    nameFr: 'Livraison de Colis',
    description: 'Send packages across the city',
    descriptionAr: 'أرسل طرود عبر المدينة',
    descriptionFr: 'Envoyez des colis à travers la ville',
    icon: 'ride_delivery',
  },
  GROCERY_DELIVERY: {
    id: 'GROCERY_DELIVERY',
    name: 'Grocery Delivery',
    nameAr: 'توصيل مشتريات',
    nameFr: 'Livraison Courses',
    description: 'Get groceries delivered',
    descriptionAr: 'احصل على مشترياتك',
    descriptionFr: 'Faites livrer vos courses',
    icon: 'ride_grocery',
  },
  FOOD_DELIVERY: {
    id: 'FOOD_DELIVERY',
    name: 'Food Delivery',
    nameAr: 'توصيل طعام',
    nameFr: 'Livraison Repas',
    description: 'Order food delivery',
    descriptionAr: 'اطلب توصيل الطعام',
    descriptionFr: 'Commandez la livraison de repas',
    icon: 'ride_food',
  },
  MOVING: {
    id: 'MOVING',
    name: 'Moving Service',
    nameAr: 'نقل أثاث',
    nameFr: 'Service Déménagement',
    description: 'Move furniture and belongings',
    descriptionAr: 'انقل الأثاث والممتلكات',
    descriptionFr: 'Déménagez meubles et affaires',
    icon: 'ride_moving',
  },
  SHARED_RIDE: {
    id: 'SHARED_RIDE',
    name: 'Shared Ride',
    nameAr: 'رحلة مشتركة',
    nameFr: 'Trajet Partagé',
    description: 'Share ride with others',
    descriptionAr: 'شارك الرحلة مع آخرين',
    descriptionFr: 'Partagez le trajet avec d\'autres',
    icon: 'ride_shared',
  },
} as const;

// ==================== PAYMENT PROVIDERS CONFIG ====================

export const PAYMENT_PROVIDERS = {
  BANKILY: {
    id: 'BANKILY',
    name: 'Bankily',
    nameAr: 'بنكيلي',
    nameFr: 'Bankily',
    logo: 'bankily_logo',
    color: COLORS.providers.bankily,
    isActive: true,
  },
  SEDAD: {
    id: 'SEDAD',
    name: 'Sedad',
    nameAr: 'السداد',
    nameFr: 'Sedad',
    logo: 'sedad_logo',
    color: COLORS.providers.sedad,
    isActive: true,
  },
  MASRVI: {
    id: 'MASRVI',
    name: 'Masrvi',
    nameAr: 'مصرفي',
    nameFr: 'Masrvi',
    logo: 'masrvi_logo',
    color: COLORS.providers.masrvi,
    isActive: true,
  },
  CASH: {
    id: 'CASH',
    name: 'Cash',
    nameAr: 'نقداً',
    nameFr: 'Espèces',
    logo: 'cash_icon',
    color: COLORS.providers.cash,
    isActive: true,
  },
} as const;

// ==================== LANGUAGES CONFIG ====================

export const LANGUAGES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    isRTL: true,
    flag: '🇲🇷',
  },
  fr: {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    isRTL: false,
    flag: '🇫🇷',
  },
  en: {
    code: 'en',
    name: 'English',
    englishName: 'English',
    isRTL: false,
    flag: '🇺🇸',
  },
} as const;

export const DEFAULT_LANGUAGE = 'ar';

// ==================== SCREEN NAMES ====================

export const SCREENS = {
  // Auth
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  PHONE_INPUT: 'PhoneInput',
  OTP_VERIFICATION: 'OtpVerification',
  REGISTER: 'Register',

  // Client
  CLIENT_HOME: 'ClientHome',
  CLIENT_SEARCH: 'ClientSearch',
  CLIENT_RIDE_REQUEST: 'ClientRideRequest',
  CLIENT_RIDE_TRACKING: 'ClientRideTracking',
  CLIENT_RIDE_COMPLETED: 'ClientRideCompleted',
  CLIENT_RIDE_HISTORY: 'ClientRideHistory',
  CLIENT_PROFILE: 'ClientProfile',
  CLIENT_SETTINGS: 'ClientSettings',
  CLIENT_WALLET: 'ClientWallet',
  CLIENT_FAVORITES: 'ClientFavorites',
  CLIENT_NOTIFICATIONS: 'ClientNotifications',
  CLIENT_SUPPORT: 'ClientSupport',

  // Driver
  DRIVER_HOME: 'DriverHome',
  DRIVER_RIDE_REQUEST: 'DriverRideRequest',
  DRIVER_RIDE_NAVIGATION: 'DriverRideNavigation',
  DRIVER_RIDE_COMPLETED: 'DriverRideCompleted',
  DRIVER_EARNINGS: 'DriverEarnings',
  DRIVER_PROFILE: 'DriverProfile',
  DRIVER_SETTINGS: 'DriverSettings',
  DRIVER_DOCUMENTS: 'DriverDocuments',
  DRIVER_VEHICLE: 'DriverVehicle',
  DRIVER_NOTIFICATIONS: 'DriverNotifications',

  // Common
