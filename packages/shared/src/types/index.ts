/**
 * GoCap Shared Types
 * Comprehensive TypeScript types for all platform entities
 */

// ==================== ENUMS ====================

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  BANNED = 'BANNED',
}

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ON_TRIP = 'ON_TRIP',
  BUSY = 'BUSY',
}

export enum DriverVerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum VehicleType {
  ECONOMY = 'ECONOMY',
  COMFORT = 'COMFORT',
  BUSINESS = 'BUSINESS',
  VAN = 'VAN',
  LUXURY = 'LUXURY',
}

export enum RideStatus {
  PENDING = 'PENDING',
  SEARCHING = 'SEARCHING',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_DRIVERS_AVAILABLE = 'NO_DRIVERS_AVAILABLE',
}

export enum RideCancellationReason {
  DRIVER_NOT_FOUND = 'DRIVER_NOT_FOUND',
  DRIVER_CANCELLED = 'DRIVER_CANCELLED',
  CLIENT_CANCELLED = 'CLIENT_CANCELLED',
  CLIENT_NO_SHOW = 'CLIENT_NO_SHOW',
  DRIVER_NO_SHOW = 'DRIVER_NO_SHOW',
  ACCIDENT = 'ACCIDENT',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export enum PaymentProvider {
  BANKILY = 'BANKILY',
  SEDAD = 'SEDAD',
  MASRVI = 'MASRVI',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  RIDE_PAYMENT = 'RIDE_PAYMENT',
  REFUND = 'REFUND',
  TOP_UP = 'TOP_UP',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION = 'COMMISSION',
  BONUS = 'BONUS',
  PROMOTION = 'PROMOTION',
}

export enum NotificationType {
  RIDE_REQUEST = 'RIDE_REQUEST',
  RIDE_ACCEPTED = 'RIDE_ACCEPTED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  RIDE_STARTED = 'RIDE_STARTED',
  RIDE_COMPLETED = 'RIDE_COMPLETED',
  RIDE_CANCELLED = 'RIDE_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  RATING_RECEIVED = 'RATING_RECEIVED',
  DOCUMENT_STATUS = 'DOCUMENT_STATUS',
}

export enum DocumentType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  NATIONAL_ID = 'NATIONAL_ID',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  VEHICLE_PHOTO = 'VEHICLE_PHOTO',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SupportTicketCategory {
  RIDE_ISSUE = 'RIDE_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  DRIVER_COMPLAINT = 'DRIVER_COMPLAINT',
  CLIENT_COMPLAINT = 'CLIENT_COMPLAINT',
  APP_BUG = 'APP_BUG',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  SUGGESTION = 'SUGGESTION',
  OTHER = 'OTHER',
}

export enum Language {
  AR = 'ar',
  FR = 'fr',
  EN = 'en',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

// ==================== BASE TYPES ====================

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDelete {
  deletedAt?: string;
  isDeleted: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Address {
  id: string;
  label?: string;
  fullAddress: string;
  streetAddress?: string;
  city: string;
  neighborhood?: string;
  location: GeoLocation;
  placeId?: string; // AWS Location Service Place ID
}

// ==================== USER TYPES ====================

export interface BaseUser extends Timestamps, SoftDelete {
  id: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePhotoUrl?: string;
  role: UserRole;
  status: UserStatus;
  language: Language;
  gender?: Gender;
  dateOfBirth?: string;
  lastLoginAt?: string;
  deviceTokens: string[];
}

export interface Client extends BaseUser {
  role: UserRole.CLIENT;
  savedAddresses: Address[];
  favoriteLocations: FavoriteLocation[];
  defaultPaymentMethodId?: string;
  totalRides: number;
  averageRating: number;
  totalRatings: number;
  walletBalance: number;
}

export interface Driver extends BaseUser {
  role: UserRole.DRIVER;
  driverStatus: DriverStatus;
  verificationStatus: DriverVerificationStatus;
  vehicleId?: string;
  vehicle?: Vehicle;
  currentLocation?: GeoLocation;
  lastLocationUpdate?: string;
  isOnline: boolean;
  onlineAt?: string;
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  acceptanceRate: number;
  cancellationRate: number;
  totalEarnings: number;
  walletBalance: number;
  commissionRate: number; // Percentage
  documents: DriverDocument[];
  workingCityIds: string[];
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN;
  permissions: AdminPermission[];
  department?: string;
  isSuperAdmin: boolean;
}

export interface Employee extends BaseUser {
  role: UserRole.EMPLOYEE;
  permissions: EmployeePermission[];
  department: string;
  supervisorId?: string;
  assignedCityIds: string[];
}

export type User = Client | Driver | Admin | Employee;

// ==================== PERMISSIONS ====================

export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_DRIVERS = 'MANAGE_DRIVERS',
  MANAGE_CLIENTS = 'MANAGE_CLIENTS',
  MANAGE_EMPLOYEES = 'MANAGE_EMPLOYEES',
  MANAGE_RIDES = 'MANAGE_RIDES',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_PRICING = 'MANAGE_PRICING',
  MANAGE_PROMOTIONS = 'MANAGE_PROMOTIONS',
  MANAGE_CITIES = 'MANAGE_CITIES',
  MANAGE_SUPPORT = 'MANAGE_SUPPORT',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',
  FULL_ACCESS = 'FULL_ACCESS',
}

export enum EmployeePermission {
  VERIFY_DOCUMENTS = 'VERIFY_DOCUMENTS',
  HANDLE_SUPPORT = 'HANDLE_SUPPORT',
  VIEW_RIDES = 'VIEW_RIDES',
  VIEW_USERS = 'VIEW_USERS',
  MODERATE_RATINGS = 'MODERATE_RATINGS',
}

// ==================== VEHICLE TYPES ====================

export interface Vehicle extends Timestamps {
  id: string;
  driverId: string;
  type: VehicleType;
  make: string; // Manufacturer
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  capacity: number; // Number of passengers
  isActive: boolean;
  photoUrls: string[];
  registrationExpiryDate?: string;
  insuranceExpiryDate?: string;
}

export interface DriverDocument extends Timestamps {
  id: string;
  driverId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  expiryDate?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ==================== RIDE TYPES ====================

export interface Ride extends Timestamps {
  id: string;
  clientId: string;
  client?: Client;
  driverId?: string;
  driver?: Driver;
  vehicleId?: string;
  vehicle?: Vehicle;

  // Locations
  pickupLocation: Address;
  dropoffLocation: Address;
  stops: Address[];

  // Route
  routePolyline?: string; // Encoded polyline
  estimatedDistance: number; // In meters
  actualDistance?: number;
  estimatedDuration: number; // In seconds
  actualDuration?: number;

  // Status
  status: RideStatus;
  cancellationReason?: RideCancellationReason;
  cancelledBy?: UserRole;
  cancelledAt?: string;

  // Timestamps
  requestedAt: string;
  acceptedAt?: string;
  driverArrivedAt?: string;
  startedAt?: string;
  completedAt?: string;

  // Pricing
  vehicleType: VehicleType;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingFare: number;
  tollsFare: number;
  surcharge: number;
  discount: number;
  promotionId?: string;
  estimatedFare: number;
  actualFare?: number;
  currency: string;

  // Payment
  paymentMethod: PaymentProvider;
  paymentStatus: PaymentStatus;
  transactionId?: string;

  // Ratings
  clientRating?: number;
  clientRatingComment?: string;
  driverRating?: number;
  driverRatingComment?: string;

  // Meta
  scheduledAt?: string;
  isScheduled: boolean;
  notes?: string;
  cityId: string;
}

export interface RideTracking {
  rideId: string;
  driverId: string;
  location: GeoLocation;
  heading: number;
  speed: number;
  timestamp: string;
}

export interface RideRequest {
  clientId: string;
  pickupLocation: Address;
  dropoffLocation: Address;
  stops?: Address[];
  vehicleType: VehicleType;
  paymentMethod: PaymentProvider;
  promotionCode?: string;
  scheduledAt?: string;
  notes?: string;
}

export interface FareEstimate {
  vehicleType: VehicleType;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  estimatedFare: number;
  currency: string;
  estimatedDuration: number;
  estimatedDistance: number;
  surgeMultiplier: number;
}

// ==================== PAYMENT TYPES ====================

export interface PaymentMethod extends Timestamps {
  id: string;
  userId: string;
  provider: PaymentProvider;
  phoneNumber?: string;
  accountNumber?: string;
  isDefault: boolean;
  isVerified: boolean;
  lastUsedAt?: string;
}

export interface Transaction extends Timestamps {
  id: string;
  userId: string;
  rideId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  reference: string;
  externalReference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  processedAt?: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface PaymentProviderConfig extends Timestamps {
  id: string;
  provider: PaymentProvider;
  displayName: string;
  displayNameAr: string;
  displayNameFr: string;
  logoUrl: string;
  isActive: boolean;
  apiEndpoint?: string;
  merchantId?: string;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  transactionFeePercent: number;
  transactionFeeFixed: number;
}

// ==================== LOCATION TYPES ====================

export interface City extends Timestamps {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  code: string;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  bounds: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
  center: GeoLocation;
}

export interface Neighborhood extends Timestamps {
  id: string;
  cityId: string;
  name: string;
  nameAr: string;
  nameFr: string;
  bounds?: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
  center?: GeoLocation;
  isActive: boolean;
}

export interface FavoriteLocation extends Timestamps {
  id: string;
  userId: string;
  name: string;
  icon: 'home' | 'work' | 'star' | 'heart';
  address: Address;
}

// ==================== PRICING TYPES ====================

export interface PricingRule extends Timestamps {
  id: string;
  cityId: string;
  vehicleType: VehicleType;
  baseFare: number;
  minimumFare: number;
  perKmRate: number;
  perMinuteRate: number;
  waitingPerMinuteRate: number;
  cancellationFee: number;
  bookingFee: number;
  currency: string;
  isActive: boolean;
}

export interface SurgePricing {
  id: string;
  cityId: string;
  neighborhoodId?: string;
  multiplier: number;
  reason: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Commission {
  id: string;
  driverId?: string; // If null, applies to all drivers
  cityId?: string; // If null, applies to all cities
  vehicleType?: VehicleType; // If null, applies to all vehicle types
  percentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification extends Timestamps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  titleFr: string;
  body: string;
  bodyAr: string;
  bodyFr: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  expiresAt?: string;
}

export interface PushNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ==================== CHAT & MESSAGING TYPES ====================

export interface Conversation extends Timestamps {
  id: string;
  rideId: string;
  participants: string[]; // User IDs
  lastMessageId?: string;
  lastMessageAt?: string;
  isActive: boolean;
}

export interface Message extends Timestamps {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'location';
  mediaUrl?: string;
  location?: GeoLocation;
  isRead: boolean;
  readAt?: string;
}

// ==================== RATING TYPES ====================

export interface Rating extends Timestamps {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  comment?: string;
  tags?: string[]; // e.g., 'clean_car', 'polite', 'safe_driving'
  isVisible: boolean;
}

// ==================== PROMOTION TYPES ====================

export interface Promotion extends Timestamps {
  id: string;
  code: string;
  title: string;
  titleAr: string;
  titleFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minRideAmount?: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  maxUses?: number;
  maxUsesPerUser: number;
  currentUses: number;
  applicableVehicleTypes?: VehicleType[];
  applicableCityIds?: string[];
  isActive: boolean;
  isFirstRideOnly: boolean;
}

export interface PromotionUsage extends Timestamps {
  id: string;
  promotionId: string;
  userId: string;
  rideId: string;
  discountAmount: number;
}

// ==================== SUPPORT TYPES ====================

export interface SupportTicket extends Timestamps {
  id: string;
  ticketNumber: string;
  userId: string;
  user?: User;
  rideId?: string;
  ride?: Ride;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo?: string;
  assignedEmployee?: Employee;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  attachments?: string[];
}

export interface SupportMessage extends Timestamps {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  attachments?: string[];
  isInternal: boolean; // For internal notes
}

// ==================== AUDIT LOG TYPES ====================

export interface AuditLog extends Timestamps {
  id: string;
  userId: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// ==================== ANALYTICS TYPES ====================

export interface DashboardStats {
  totalRides: number;
  totalRevenue: number;
  activeDrivers: number;
  activeClients: number;
  averageRating: number;
  completionRate: number;
  cancellationRate: number;
  averageRideDuration: number;
  averageRideDistance: number;
  periodStart: string;
  periodEnd: string;
}

export interface DriverStats {
  driverId: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
  totalCommission: number;
  netEarnings: number;
  averageRating: number;
  totalRatings: number;
  onlineHours: number;
  acceptanceRate: number;
  completionRate: number;
  periodStart: string;
  periodEnd: string;
}

// ==================== SETTINGS TYPES ====================

export interface UserPreferences {
  userId: string;
  language: Language;
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
    promotions: boolean;
    rideUpdates: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  mapType: 'standard' | 'satellite' | 'hybrid';
}

export interface AppSettings {
  id: string;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  description: string;
  category: string;
  isPublic: boolean;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== WEBSOCKET TYPES ====================

export enum WebSocketEventType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // Location
  LOCATION_UPDATE = 'location_update',
  DRIVER_LOCATION = 'driver_location',

  // Ride
  RIDE_REQUEST = 'ride_request',
  RIDE_ACCEPTED = 'ride_accepted',
  RIDE_REJECTED = 'ride_rejected',
  RIDE_CANCELLED = 'ride_cancelled',
  DRIVER_ARRIVED = 'driver_arrived',
  RIDE_STARTED = 'ride_started',
  RIDE_COMPLETED = 'ride_completed',

  // Chat
  NEW_MESSAGE = 'new_message',
  MESSAGE_READ = 'message_read',
  TYPING = 'typing',

  // Driver
  DRIVER_ONLINE = 'driver_online',
  DRIVER_OFFLINE = 'driver_offline',
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
