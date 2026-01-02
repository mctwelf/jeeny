/**
 * Jeeny Shared Types
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

// ==================== VEHICLE ENUMS ====================

// Vehicle Category - Physical type of vehicle (سيارة، دراجة، إلخ)
export enum VehicleCategory {
  CAR = 'CAR',                     // سيارة
  MOTORCYCLE = 'MOTORCYCLE',       // دراجة نارية
  TRICYCLE = 'TRICYCLE',           // توك توك / ثلاثية العجلات
  BICYCLE = 'BICYCLE',             // دراجة هوائية (للتوصيل)
  PICKUP_TRUCK = 'PICKUP_TRUCK',   // بيك أب (للنقل)
  MINIBUS = 'MINIBUS',             // حافلة صغيرة
}

// Vehicle Service Type - Service level within category
export enum VehicleType {
  ECONOMY = 'ECONOMY',
  COMFORT = 'COMFORT',
  BUSINESS = 'BUSINESS',
  VAN = 'VAN',
  LUXURY = 'LUXURY',
  MOTO_STANDARD = 'MOTO_STANDARD',     // دراجة عادية
  MOTO_EXPRESS = 'MOTO_EXPRESS',       // دراجة سريعة
  TRICYCLE_STANDARD = 'TRICYCLE_STANDARD',
  PICKUP_SMALL = 'PICKUP_SMALL',       // بيك أب صغير
  PICKUP_LARGE = 'PICKUP_LARGE',       // بيك أب كبير
  MINIBUS_7 = 'MINIBUS_7',             // 7 مقاعد
  MINIBUS_14 = 'MINIBUS_14',           // 14 مقعد
}

// ==================== RIDE TYPE ENUMS ====================

export enum RideType {
  STANDARD = 'STANDARD',                   // رحلة عادية
  SCHEDULED = 'SCHEDULED',                 // رحلة مجدولة
  INTERCITY = 'INTERCITY',                 // بين المدن
  AIRPORT = 'AIRPORT',                     // من/إلى المطار
  HOURLY = 'HOURLY',                       // بالساعة
  MONTHLY_CONTRACT = 'MONTHLY_CONTRACT',   // عقد شهري
  PACKAGE_DELIVERY = 'PACKAGE_DELIVERY',   // توصيل طرود
  GROCERY_DELIVERY = 'GROCERY_DELIVERY',   // توصيل مشتريات
  FOOD_DELIVERY = 'FOOD_DELIVERY',         // توصيل طعام
  MOVING = 'MOVING',                       // نقل أثاث/عفش
  SHARED_RIDE = 'SHARED_RIDE',             // رحلة مشتركة
}

// ==================== CONTRACT ENUMS ====================

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ContractType {
  MONTHLY = 'MONTHLY',           // شهري
  WEEKLY = 'WEEKLY',             // أسبوعي
  DAILY = 'DAILY',               // يومي
  SCHOOL = 'SCHOOL',             // مدرسي (توصيل طلاب)
  CORPORATE = 'CORPORATE',       // شركات
  MEDICAL = 'MEDICAL',           // طبي (مواعيد غسيل كلى، إلخ)
}

// ==================== PACKAGE/DELIVERY ENUMS ====================

export enum PackageSize {
  ENVELOPE = 'ENVELOPE',         // ظرف/مستندات
  SMALL = 'SMALL',               // صغير (يد واحدة)
  MEDIUM = 'MEDIUM',             // متوسط (يدين)
  LARGE = 'LARGE',               // كبير
  EXTRA_LARGE = 'EXTRA_LARGE',   // كبير جداً
}

export enum PackageType {
  DOCUMENTS = 'DOCUMENTS',       // مستندات
  FOOD = 'FOOD',                 // طعام
  GROCERIES = 'GROCERIES',       // مشتريات
  ELECTRONICS = 'ELECTRONICS',   // إلكترونيات
  CLOTHING = 'CLOTHING',         // ملابس
  MEDICINE = 'MEDICINE',         // أدوية
  FRAGILE = 'FRAGILE',           // قابل للكسر
  OTHER = 'OTHER',
}

export enum DeliveryStatus {
  PENDING_PICKUP = 'PENDING_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
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
  CRIMINAL_RECORD = 'CRIMINAL_RECORD',           // السجل العدلي
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',   // شهادة طبية
  TAXI_LICENSE = 'TAXI_LICENSE',                 // رخصة التاكسي
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',         // إقامة (للأجانب)
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ==================== SCHEDULE ENUMS ====================

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// ==================== INTERCITY ENUMS ====================

export enum IntercityTripStatus {
  SCHEDULED = 'SCHEDULED',
  OPEN_FOR_BOOKING = 'OPEN_FOR_BOOKING',
  FULL = 'FULL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED',
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
  placeId?: string; 
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
  
  // ==================== CLIENT PREFERENCES ====================
  preferFemaleDriver: boolean;                // تفضيل سائقة أنثى
  preferredVehicleCategory: VehicleCategory;  // نوع المركبة المفضل
  preferredVehicleType: VehicleType;          // فئة الخدمة المفضلة
  preferredPaymentMethod: PaymentProvider;    // طريقة الدفع المفضلة
  
  // ==================== ACCESSIBILITY ====================
  requiresWheelchairAccess: boolean;          // يحتاج وصول كرسي متحرك
  requiresChildSeat: boolean;                 // يحتاج كرسي أطفال
  
  // ==================== CORPORATE ====================
  corporateAccountId?: string;                // حساب شركة
  isCorporateUser: boolean;                   // مستخدم شركة
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
  
  // ==================== SERVICE PREFERENCES ====================
  // تفضيلات الخدمة
  servicePreferences: DriverServicePreferences;
  
  // ==================== SCHEDULE ====================
  // جدول العمل
  workingSchedule: DriverWorkingSchedule[];
  
  // ==================== ADDITIONAL INFO ====================
  isFemaleDriver: boolean;                    // سائقة أنثى
  speaksLanguages: Language[];                // اللغات المتحدثة
  yearsOfExperience: number;                  // سنوات الخبرة
  bio?: string;                               // نبذة عن السائق
  bioAr?: string;
  bioFr?: string;
}

// ==================== DRIVER SERVICE PREFERENCES ====================

export interface DriverServicePreferences {
  // Ride Types - أنواع الرحلات المقبولة
  acceptsStandardRides: boolean;              // رحلات عادية
  acceptsScheduledRides: boolean;             // رحلات مجدولة
  acceptsIntercityTrips: boolean;             // النقل بين المدن
  acceptsAirportTrips: boolean;               // رحلات المطار
  acceptsHourlyBooking: boolean;              // الحجز بالساعة
  acceptsMonthlyContracts: boolean;           // العقود الشهرية
  acceptsSchoolContracts: boolean;            // عقود المدارس
  acceptsCorporateContracts: boolean;         // عقود الشركات
  
  // Delivery Services - خدمات التوصيل
  acceptsPackageDelivery: boolean;            // توصيل الطرود
  acceptsFoodDelivery: boolean;               // توصيل الطعام
  acceptsGroceryDelivery: boolean;            // توصيل المشتريات
  acceptsMovingService: boolean;              // نقل الأثاث
  
  // Passenger Preferences - تفضيلات الركاب
  acceptsFemalePassengersOnly: boolean;       // ركاب إناث فقط
  acceptsMalePassengersOnly: boolean;         // ركاب ذكور فقط
  acceptsChildrenWithCarSeat: boolean;        // أطفال مع كرسي
  acceptsPets: boolean;                       // حيوانات أليفة
  acceptsSmokers: boolean;                    // مدخنين
  acceptsWheelchair: boolean;                 // كرسي متحرك
  
  // Vehicle Features - مميزات المركبة
  hasAirConditioning: boolean;                // تكييف
  hasWifi: boolean;                           // واي فاي
  hasChildSeat: boolean;                      // كرسي أطفال
  hasWheelchairAccess: boolean;               // وصول كرسي متحرك
  hasLuggageSpace: boolean;                   // مساحة أمتعة
  
  // Service Areas - مناطق الخدمة
  serviceAreaCityIds: string[];               // المدن
  serviceAreaNeighborhoodIds: string[];       // الأحياء
  maxDistanceFromCurrentLocation: number;     // أقصى مسافة (كم)
  
  // Intercity Specific - خاص بين المدن
  intercityRouteIds: string[];                // المسارات بين المدن
  maxIntercityDistance: number;               // أقصى مسافة بين المدن
}

// ==================== DRIVER WORKING SCHEDULE ====================

export interface DriverWorkingSchedule {
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  shifts: WorkingShift[];
}

export interface WorkingShift {
  startTime: string;  // "08:00"
  endTime: string;    // "18:00"
  breakStart?: string;
  breakEnd?: string;
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
  category: VehicleCategory;                  // سيارة، دراجة، إلخ
  type: VehicleType;                          // فئة الخدمة
  make: string;                               // الشركة المصنعة
  model: string;
  year: number;
  color: string;
  colorAr?: string;
  plateNumber: string;
  capacity: number;                           // عدد الركاب
  isActive: boolean;
  photoUrls: string[];
  registrationExpiryDate?: string;
  insuranceExpiryDate?: string;
  
  // ==================== VEHICLE FEATURES ====================
  features: VehicleFeatures;
  
  // ==================== FOR DELIVERY VEHICLES ====================
  maxLoadWeight?: number;                     // أقصى وزن (كجم)
  cargoSpaceDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface VehicleFeatures {
  hasAirConditioning: boolean;
  hasWifi: boolean;
  hasCharger: boolean;                        // شاحن هاتف
  hasChildSeat: boolean;
  hasWheelchairAccess: boolean;
  hasGPS: boolean;
  hasDashCam: boolean;                        // كاميرا
  hasFirstAidKit: boolean;                    // حقيبة إسعافات
  luggageCapacity: 'small' | 'medium' | 'large' | 'extra_large';
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

  // ==================== RIDE TYPE ====================
  rideType: RideType;                         // نوع الرحلة
  vehicleCategory: VehicleCategory;           // فئة المركبة
  vehicleType: VehicleType;                   // نوع الخدمة

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

  // ==================== SCHEDULING ====================
  scheduledAt?: string;
  isScheduled: boolean;
  
  // ==================== SPECIAL REQUESTS ====================
  specialRequests: RideSpecialRequests;
  
  // ==================== INTERCITY SPECIFIC ====================
  intercityRouteId?: string;
  isIntercity: boolean;
  returnTrip: boolean;
  returnTripDate?: string;
  
  // ==================== HOURLY BOOKING ====================
  isHourlyBooking: boolean;
  bookedHours?: number;
  hourlyRate?: number;
  
  // ==================== PACKAGE DELIVERY ====================
  packageDelivery?: PackageDeliveryInfo;
  
  // Meta
  notes?: string;
  notesAr?: string;
  cityId: string;
  
  // ==================== CORPORATE ====================
  corporateAccountId?: string;
  isCorporateRide: boolean;
  corporateReference?: string;
}

export interface RideSpecialRequests {
  needsFemaleDriver: boolean;
  needsChildSeat: boolean;
  needsWheelchairAccess: boolean;
  needsExtraLuggage: boolean;
  needsQuietRide: boolean;                    // رحلة هادئة
  needsAirConditioning: boolean;
  allowsPets: boolean;
  numberOfPassengers: number;
  numberOfLuggage: number;
}

// ==================== PACKAGE DELIVERY ====================

export interface PackageDeliveryInfo {
  packageSize: PackageSize;
  packageType: PackageType;
  weight?: number;                            // الوزن بالكجم
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isFragile: boolean;                         // قابل للكسر
  requiresSignature: boolean;                 // يتطلب توقيع
  requiresPhoto: boolean;                     // يتطلب صورة عند التسليم
  cashOnDelivery: boolean;                    // الدفع عند الاستلام
  cashOnDeliveryAmount?: number;
  
  // Recipient Info
  recipientName: string;
  recipientPhone: string;
  recipientAlternatePhone?: string;
  deliveryInstructions?: string;
  deliveryInstructionsAr?: string;
  
  // Status
  deliveryStatus: DeliveryStatus;
  deliveredAt?: string;
  deliveryPhotoUrl?: string;
  signatureUrl?: string;
  
  // Return
  returnIfNotDelivered: boolean;
  maxDeliveryAttempts: number;
  deliveryAttempts: number;
}

export interface RideTracking {
  rideId: string;
  driverId: string;
  location: GeoLocation;
  heading: number;
  speed: number;
  timestamp: string;
}

// ==================== MONTHLY CONTRACTS ====================
// العقود الشهرية

export interface MonthlyContract extends Timestamps {
  id: string;
  contractNumber: string;                     // رقم العقد
  contractType: ContractType;
  status: ContractStatus;
  
  // Parties
  clientId: string;
  client?: Client;
  driverId?: string;
  driver?: Driver;
  
  // Duration
  startDate: string;
  endDate: string;
  renewalDate?: string;
  autoRenew: boolean;
  
  // Pricing
  monthlyRate: number;                        // السعر الشهري
  currency: string;
  includedKilometers: number;                 // الكيلومترات المشمولة
  includedHours: number;                      // الساعات المشمولة
  extraKmRate: number;                        // سعر الكيلومتر الإضافي
  extraHourRate: number;                      // سعر الساعة الإضافية
  
  // Usage Tracking
  usedKilometers: number;
  usedHours: number;
  totalTrips: number;
  
  // Schedule
  schedule: ContractScheduleItem[];
  
  // Locations
  pickupLocations: Address[];                 // مواقع الانطلاق
  dropoffLocations: Address[];                // مواقع الوصول
  
  // Vehicle Requirements
  vehicleCategory: VehicleCategory;
  vehicleType: VehicleType;
  
  // Special Requirements
  specialRequirements?: string;
  specialRequirementsAr?: string;
  
  // Payment
  paymentMethod: PaymentProvider;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  
  // Notes
  notes?: string;
  notesAr?: string;
  
  // Corporate
  corporateAccountId?: string;
}

export interface ContractScheduleItem {
  id: string;
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  trips: ContractScheduledTrip[];
}

export interface ContractScheduledTrip {
  id: string;
  pickupTime: string;                         // "07:30"
  pickupLocation: Address;
  dropoffLocation: Address;
  returnTrip: boolean;
  returnTime?: string;
  passengerName?: string;                     // اسم الراكب (للمدارس)
  passengerPhone?: string;
  notes?: string;
}

// ==================== SCHOOL CONTRACTS ====================
// عقود المدارس

export interface SchoolContract extends MonthlyContract {
  contractType: ContractType.SCHOOL;
  schoolName: string;
  schoolNameAr?: string;
  schoolAddress: Address;
  students: StudentInfo[];
  academicYear: string;                       // "2024-2025"
  semester: 'first' | 'second' | 'full_year';
}

export interface StudentInfo {
  id: string;
  name: string;
  nameAr?: string;
  grade: string;
  homeAddress: Address;
  parentPhone: string;
  parentAlternatePhone?: string;
  specialNeeds?: string;
  pickupTime: string;
  dropoffTime: string;
}

// ==================== INTERCITY ROUTES ====================
// المسارات بين المدن

export interface IntercityRoute extends Timestamps {
  id: string;
  fromCityId: string;
  fromCity?: City;
  toCityId: string;
  toCity?: City;
  
  // Route Info
  name: string;
  nameAr: string;
  nameFr?: string;
  distance: number;                           // المسافة بالكيلومتر
  estimatedDuration: number;                  // الوقت المتوقع بالدقائق
  
  // Stops
  intermediateStops: IntercityStop[];
  
  // Pricing
  basePricePerPerson: number;                 // السعر الأساسي للشخص
  basePricePrivate: number;                   // السعر الخاص (سيارة كاملة)
  pricePerKg?: number;                        // سعر الكيلو (للشحن)
  currency: string;
  
  // Vehicle Types Available
  availableVehicleTypes: VehicleType[];
  
  // Schedule
  hasFixedSchedule: boolean;
  fixedDepartureTimes?: string[];             // ["06:00", "10:00", "14:00"]
  
  // Status
  isActive: boolean;
  isPopular: boolean;
  
  // Stats
  totalTrips: number;
  averageRating: number;
}

export interface IntercityStop {
  id: string;
  cityId?: string;
  name: string;
  nameAr: string;
  location: GeoLocation;
  address: string;
  distanceFromStart: number;                  // المسافة من البداية
  additionalFare: number;                     // رسوم إضافية للتوقف
  estimatedArrivalMinutes: number;
}

// ==================== INTERCITY TRIPS ====================
// رحلات بين المدن

export interface IntercityTrip extends Timestamps {
  id: string;
  routeId: string;
  route?: IntercityRoute;
  driverId: string;
  driver?: Driver;
  vehicleId: string;
  vehicle?: Vehicle;
  
  // Schedule
  departureDate: string;
  departureTime: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  
  // Capacity
  totalSeats: number;
  availableSeats: number;
  
  // Pricing
  pricePerSeat: number;
  privatePrice: number;
  currency: string;
  
  // Status
  status: IntercityTripStatus;
  
  // Bookings
  bookings: IntercityBooking[];
  
  // Options
  allowsPackages: boolean;
  maxPackageWeight?: number;
  
  // Notes
  notes?: string;
  notesAr?: string;
}

export interface IntercityBooking extends Timestamps {
  id: string;
  tripId: string;
  clientId: string;
  client?: Client;
  
  // Booking Details
  seatsBooked: number;
  pickupStopId?: string;                      // نقطة الصعود
  dropoffStopId?: string;                     // نقطة النزول
  
  // Passengers
  passengers: PassengerInfo[];
  
  // Pricing
  totalPrice: number;
  currency: string;
  discount?: number;
  promotionId?: string;
  
  // Payment
  paymentMethod: PaymentProvider;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  
  // Status
  status: BookingStatus;
  
  // Package (if any)
  hasPackage: boolean;
  packageInfo?: {
    description: string;
    weight: number;
    price: number;
  };
  
  // Contact
  contactPhone: string;
  
  // Notes
  notes?: string;
}

export interface PassengerInfo {
  name: string;
  phone?: string;
  nationalId?: string;
  seatNumber?: number;
}

// ==================== CORPORATE ACCOUNTS ====================
// حسابات الشركات

export interface CorporateAccount extends Timestamps {
  id: string;
  companyName: string;
  companyNameAr?: string;
  registrationNumber: string;                 // السجل التجاري
  taxNumber?: string;                         // الرقم الضريبي
  
  // Contact
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: Address;
  
  // Billing
  billingEmail: string;
  billingAddress?: Address;
  paymentTerms: 'prepaid' | 'postpaid_weekly' | 'postpaid_monthly';
  creditLimit?: number;
  currentBalance: number;
  
  // Settings
  allowedVehicleTypes: VehicleType[];
  maxRidesPerMonth?: number;
  maxAmountPerRide?: number;
  requiresApproval: boolean;
  approverEmails?: string[];
  
  // Users
  adminUserIds: string[];
  employeeUserIds: string[];
  
  // Status
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Stats
  totalRides: number;
  totalSpent: number;
  
  // Contract
  contractStartDate?: string;
  contractEndDate?: string;
  discountPercentage?: number;
}

// ==================== AIRPORT TRANSFERS ====================
// رحلات المطار

export interface Airport extends Timestamps {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  code: string;                               // رمز المطار (NKC)
  cityId: string;
  location: GeoLocation;
  address: string;
  
  // Terminals
  terminals: AirportTerminal[];
  
  // Pricing
  pickupSurcharge: number;                    // رسوم إضافية للاستلام
  dropoffSurcharge: number;                   // رسوم إضافية للتوصيل
  waitingFeePerMinute: number;
  
  // Settings
  meetingPoints: MeetingPoint[];
  parkingInfo?: string;
  parkingInfoAr?: string;
  
  isActive: boolean;
}

export interface AirportTerminal {
  id: string;
  name: string;
  nameAr: string;
  location: GeoLocation;
}

export interface MeetingPoint {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  location: GeoLocation;
  terminalId?: string;
}

export interface AirportTransfer extends Ride {
  rideType: RideType.AIRPORT;
  airportId: string;
  airport?: Airport;
  terminalId?: string;
  meetingPointId?: string;
  flightNumber?: string;
  flightArrivalTime?: string;
  flightDepartureTime?: string;
  isPickup: boolean;                          // true = من المطار، false = إلى المطار
  passengerName?: string;
  numberOfBags: number;
  meetAndGreet: boolean;                      // استقبال بلوحة الاسم
  meetAndGreetFee?: number;
}

// ==================== HOURLY BOOKING ====================
// الحجز بالساعة

export interface HourlyBooking extends Timestamps {
  id: string;
  rideId: string;
  clientId: string;
  driverId?: string;
  
  // Booking Details
  startTime: string;
  endTime?: string;
  bookedHours: number;
  actualHours?: number;
  
  // Pricing
  hourlyRate: number;
  minimumHours: number;
  estimatedTotal: number;
  actualTotal?: number;
  currency: string;
  
  // Extensions
  extensions: HourlyExtension[];
  
  // Status
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface HourlyExtension {
  id: string;
  requestedAt: string;
  additionalHours: number;
  additionalCost: number;
  approved: boolean;
  approvedAt?: string;
}

// ==================== SHARED RIDES ====================
// الرحلات المشتركة

export interface SharedRide extends Timestamps {
  id: string;
  driverId: string;
  driver?: Driver;
  vehicleId: string;
  
  // Route
  routePolyline: string;
  startLocation: Address;
  endLocation: Address;
  
  // Schedule
  departureTime: string;
  estimatedArrivalTime: string;
  
  // Capacity
  totalSeats: number;
  availableSeats: number;
  
  // Pricing
  pricePerSeat: number;
  currency: string;
  
  // Passengers
  passengers: SharedRidePassenger[];
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  
  // Settings
  allowsDetours: boolean;
  maxDetourMinutes: number;
  genderRestriction?: 'male_only' | 'female_only' | 'none';
}

export interface SharedRidePassenger {
  id: string;
  clientId: string;
  client?: Client;
  pickupLocation: Address;
  dropoffLocation: Address;
  seatsBooked: number;
  fare: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'dropped_off' | 'cancelled';
  pickupOrder: number;
  dropoffOrder: number;
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
  vehicleCategory: VehicleCategory;           // فئة المركبة
  vehicleType: VehicleType;                   // نوع الخدمة
  rideType: RideType;                         // نوع الرحلة
  baseFare: number;
  minimumFare: number;
  perKmRate: number;
  perMinuteRate: number;
  waitingPerMinuteRate: number;
  cancellationFee: number;
  bookingFee: number;
  currency: string;
  isActive: boolean;
  
  // Time-based pricing
  peakHoursMultiplier?: number;
  peakHoursStart?: string;                    // "07:00"
  peakHoursEnd?: string;                      // "09:00"
  nightMultiplier?: number;
  nightStart?: string;                        // "22:00"
  nightEnd?: string;                          // "06:00"
}

// Intercity Pricing
export interface IntercityPricing extends Timestamps {
  id: string;
  routeId: string;
  vehicleCategory: VehicleCategory;
  vehicleType: VehicleType;
  pricePerSeat: number;
  privateVehiclePrice: number;
  packagePricePerKg?: number;
  currency: string;
  isActive: boolean;
}

// Hourly Pricing
export interface HourlyPricing extends Timestamps {
  id: string;
  cityId: string;
  vehicleCategory: VehicleCategory;
  vehicleType: VehicleType;
  hourlyRate: number;
  minimumHours: number;
  extraKmRate: number;                        // بعد الكيلومترات المشمولة
  includedKmPerHour: number;
  currency: string;
  isActive: boolean;
}

// Delivery Pricing
export interface DeliveryPricing extends Timestamps {
  id: string;
  cityId: string;
  vehicleCategory: VehicleCategory;
  packageSize: PackageSize;
  baseFare: number;
  perKmRate: number;
  weightSurchargePerKg?: number;
  fragileItemSurcharge?: number;
  cashOnDeliverySurcharge?: number;
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
