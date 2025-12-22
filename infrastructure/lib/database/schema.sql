-- =============================================================================
-- jeeny Taxi Booking Platform - PostgreSQL Database Schema
-- =============================================================================
-- Database: jeeny_db
-- Description: Complete schema for taxi booking platform similar to Uber/Lyft
-- Version: 1.0.0
-- Created: 2025
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- ENUMS
-- =============================================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('CLIENT', 'DRIVER', 'ADMIN', 'EMPLOYEE');

-- User status enum
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'BANNED');

-- Driver status enum
CREATE TYPE driver_status AS ENUM ('ONLINE', 'OFFLINE', 'ON_TRIP', 'BUSY');

-- Driver verification status enum
CREATE TYPE driver_verification_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Vehicle type enum
CREATE TYPE vehicle_type AS ENUM ('ECONOMY', 'COMFORT', 'BUSINESS', 'VAN', 'LUXURY');

-- Ride status enum
CREATE TYPE ride_status AS ENUM (
    'PENDING',
    'SEARCHING',
    'DRIVER_ASSIGNED',
    'DRIVER_ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_DRIVERS_AVAILABLE'
);

-- Ride cancellation reason enum
CREATE TYPE ride_cancellation_reason AS ENUM (
    'DRIVER_NOT_FOUND',
    'DRIVER_CANCELLED',
    'CLIENT_CANCELLED',
    'CLIENT_NO_SHOW',
    'DRIVER_NO_SHOW',
    'ACCIDENT',
    'EMERGENCY',
    'OTHER'
);

-- Payment provider enum
CREATE TYPE payment_provider AS ENUM ('BANKILY', 'SEDAD', 'MASRVI', 'CASH', 'WALLET');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- Transaction type enum
CREATE TYPE transaction_type AS ENUM (
    'RIDE_PAYMENT',
    'REFUND',
    'TOP_UP',
    'WITHDRAWAL',
    'COMMISSION',
    'BONUS',
    'PROMOTION'
);

-- Document type enum
CREATE TYPE document_type AS ENUM (
    'DRIVERS_LICENSE',
    'VEHICLE_REGISTRATION',
    'INSURANCE',
    'NATIONAL_ID',
    'PROFILE_PHOTO',
    'VEHICLE_PHOTO'
);

-- Document status enum
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Support ticket status enum
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');

-- Support ticket priority enum
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Support ticket category enum
CREATE TYPE ticket_category AS ENUM (
    'RIDE_ISSUE',
    'PAYMENT_ISSUE',
    'DRIVER_COMPLAINT',
    'CLIENT_COMPLAINT',
    'APP_BUG',
    'ACCOUNT_ISSUE',
    'SUGGESTION',
    'OTHER'
);

-- Gender enum
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- Language enum
CREATE TYPE language_code AS ENUM ('ar', 'fr', 'en');

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'RIDE_REQUEST',
    'RIDE_ACCEPTED',
    'DRIVER_ARRIVED',
    'RIDE_STARTED',
    'RIDE_COMPLETED',
    'RIDE_CANCELLED',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'PROMOTION',
    'SYSTEM',
    'CHAT_MESSAGE',
    'RATING_RECEIVED',
    'DOCUMENT_STATUS'
);

-- Message type enum
CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'location');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users Table (Base table for all user types)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    phone_country_code VARCHAR(5) NOT NULL DEFAULT '+222',
    email VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    profile_photo_url TEXT,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    language language_code NOT NULL DEFAULT 'ar',
    gender gender,
    date_of_birth DATE,
    last_login_at TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT users_phone_unique UNIQUE (phone_country_code, phone_number),
    CONSTRAINT users_email_unique UNIQUE (email) WHERE email IS NOT NULL
);

-- Create indexes for users
CREATE INDEX idx_users_phone ON users(phone_country_code, phone_number);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- -----------------------------------------------------------------------------
-- Clients Table (Extended user info for clients/passengers)
-- -----------------------------------------------------------------------------
CREATE TABLE clients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_payment_method_id UUID,
    total_rides INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES clients(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for clients
CREATE INDEX idx_clients_referral_code ON clients(referral_code);

-- -----------------------------------------------------------------------------
-- Drivers Table (Extended user info for drivers)
-- -----------------------------------------------------------------------------
CREATE TABLE drivers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    driver_status driver_status NOT NULL DEFAULT 'OFFLINE',
    verification_status driver_verification_status NOT NULL DEFAULT 'PENDING',
    current_vehicle_id UUID,
    current_location GEOGRAPHY(POINT, 4326),
    current_heading DECIMAL(5, 2),
    current_speed DECIMAL(6, 2),
    last_location_update TIMESTAMPTZ,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    online_at TIMESTAMPTZ,
    total_trips INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    acceptance_rate DECIMAL(5, 4) DEFAULT 0.0000,
    cancellation_rate DECIMAL(5, 4) DEFAULT 0.0000,
    total_earnings DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.2000, -- 20% default
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES drivers(id),
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for drivers
CREATE INDEX idx_drivers_status ON drivers(driver_status);
CREATE INDEX idx_drivers_verification ON drivers(verification_status);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_online ON drivers(is_online);
CREATE INDEX idx_drivers_rating ON drivers(average_rating);

-- -----------------------------------------------------------------------------
-- Admins Table (Extended user info for administrators)
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    department VARCHAR(100),
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Employees Table (Extended user info for company employees)
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    department VARCHAR(100) NOT NULL,
    supervisor_id UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Device Tokens Table (Push notification tokens)
-- -----------------------------------------------------------------------------
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
    device_id VARCHAR(255),
    device_model VARCHAR(100),
    app_version VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT device_tokens_unique UNIQUE (user_id, token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- =============================================================================
-- LOCATION TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Cities Table
-- -----------------------------------------------------------------------------
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Mauritania',
    country_code VARCHAR(3) NOT NULL DEFAULT 'MR',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Nouakchott',
    currency VARCHAR(10) NOT NULL DEFAULT 'MRU',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    bounds_northeast GEOGRAPHY(POINT, 4326),
    bounds_southwest GEOGRAPHY(POINT, 4326),
    center GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default cities (Mauritania)
INSERT INTO cities (name, name_ar, name_fr, code, center) VALUES
    ('Nouakchott', 'نواكشوط', 'Nouakchott', 'NKC', ST_GeogFromText('POINT(-15.9582 18.0735)')),
    ('Nouadhibou', 'نواذيبو', 'Nouadhibou', 'NDB', ST_GeogFromText('POINT(-17.0347 20.9333)')),
    ('Kiffa', 'كيفا', 'Kiffa', 'KFA', ST_GeogFromText('POINT(-11.4014 16.6166)')),
    ('Kaédi', 'كيهيدي', 'Kaédi', 'KAE', ST_GeogFromText('POINT(-13.5028 16.1503)')),
    ('Rosso', 'روصو', 'Rosso', 'RSO', ST_GeogFromText('POINT(-15.8050 16.5000)')),
    ('Zouerate', 'ازويرات', 'Zouérat', 'ZOU', ST_GeogFromText('POINT(-12.4833 22.7333)')),
    ('Atar', 'أطار', 'Atar', 'ATR', ST_GeogFromText('POINT(-13.0500 20.5167)')),
    ('Aleg', 'ألاك', 'Aleg', 'ALG', ST_GeogFromText('POINT(-13.9167 17.0500)')),
    ('Akjoujt', 'أكجوجت', 'Akjoujt', 'AKJ', ST_GeogFromText('POINT(-14.3833 19.7500)'));

-- -----------------------------------------------------------------------------
-- Neighborhoods Table
-- -----------------------------------------------------------------------------
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    bounds_northeast GEOGRAPHY(POINT, 4326),
    bounds_southwest GEOGRAPHY(POINT, 4326),
    center GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);

-- -----------------------------------------------------------------------------
-- Driver Working Cities (Many-to-many relationship)
-- -----------------------------------------------------------------------------
CREATE TABLE driver_working_cities (
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (driver_id, city_id)
);

-- -----------------------------------------------------------------------------
-- Employee Assigned Cities (Many-to-many relationship)
-- -----------------------------------------------------------------------------
CREATE TABLE employee_assigned_cities (
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (employee_id, city_id)
);

-- =============================================================================
-- VEHICLE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vehicles Table
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type vehicle_type NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    color_ar VARCHAR(50),
    plate_number VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registration_expiry_date DATE,
    insurance_expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT vehicles_plate_unique UNIQUE (plate_number)
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_type ON vehicles(type);

-- -----------------------------------------------------------------------------
-- Vehicle Photos Table
-- -----------------------------------------------------------------------------
CREATE TABLE vehicle_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50), -- 'front', 'back', 'side', 'interior'
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id);

-- =============================================================================
-- DRIVER DOCUMENTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Driver Documents Table
-- -----------------------------------------------------------------------------
CREATE TABLE driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    status document_status NOT NULL DEFAULT 'PENDING',
    file_url TEXT NOT NULL,
    expiry_date DATE,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_documents_driver ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);
CREATE INDEX idx_driver_documents_type ON driver_documents(type);

-- =============================================================================
-- ADDRESSES & FAVORITES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Saved Addresses Table
-- -----------------------------------------------------------------------------
CREATE TABLE saved_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100),
    address_type VARCHAR(20) DEFAULT 'other', -- 'home', 'work', 'other'
    full_address TEXT NOT NULL,
    street_address TEXT,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    place_id VARCHAR(255), -- AWS Location Service Place ID
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_addresses_user ON saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_location ON saved_addresses USING GIST(location);

-- -----------------------------------------------------------------------------
-- Favorite Locations Table
-- -----------------------------------------------------------------------------
CREATE TABLE favorite_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(20) NOT NULL DEFAULT 'star', -- 'home', 'work', 'star', 'heart'
    full_address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    place_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_favorite_locations_user ON favorite_locations(user_id);

-- =============================================================================
-- PRICING TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Pricing Rules Table
-- -----------------------------------------------------------------------------
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    vehicle_type vehicle_type NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    minimum_fare DECIMAL(10, 2) NOT NULL,
    per_km_rate DECIMAL(10, 2) NOT NULL,
    per_minute_rate DECIMAL(10, 2) NOT NULL,
    waiting_per_minute_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cancellation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    booking_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'MRU',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pricing_rules_unique UNIQUE (city_id, vehicle_type, effective_from)
);

CREATE INDEX idx_pricing_rules_city ON pricing_rules(city_id);
CREATE INDEX idx_pricing_rules_vehicle ON pricing_rules(vehicle_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);

-- -----------------------------------------------------------------------------
-- Surge Pricing Table
-- -----------------------------------------------------------------------------
CREATE TABLE surge_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    reason VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surge_pricing_city ON surge_pricing(city_id);
CREATE INDEX idx_surge_pricing_time ON surge_pricing(start_time, end_time);
CREATE INDEX idx_surge_pricing_active ON surge_pricing(is_active);

-- -----------------------------------------------------------------------------
-- Commission Rates Table
-- -----------------------------------------------------------------------------
CREATE TABLE commission_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE, -- NULL = applies to all
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE, -- NULL = applies to all
    vehicle_type vehicle_type, -- NULL = applies to all
    percentage DECIMAL(5, 4) NOT NULL, -- e.g., 0.2000 = 20%
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_rates_driver ON commission_rates(driver_id);
CREATE INDEX idx_commission_rates_active ON commission_rates(is_active);

-- =============================================================================
-- RIDES TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rides Table (Main ride/trip table)
-- -----------------------------------------------------------------------------
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable ride ID
    client_id UUID NOT NULL REFERENCES clients(id),
    driver_id UUID REFERENCES drivers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    city_id UUID NOT NULL REFERENCES cities(id),

    -- Locations
    pickup_address TEXT NOT NULL,
    pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_place_id VARCHAR(255),
    dropoff_address TEXT NOT NULL,
    dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_place_id VARCHAR(255),

    -- Route information
    route_polyline TEXT, -- Encoded polyline
    estimated_distance INTEGER NOT NULL, -- In meters
    actual_distance INTEGER,
    estimated_duration INTEGER NOT NULL, -- In seconds
    actual_duration INTEGER,

    -- Status
    status ride_status NOT NULL DEFAULT 'PENDING',
    cancellation_reason ride_cancellation_reason,
    cancelled_by user_role,
    cancelled_at TIMESTAMPTZ,

    -- Timestamps
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    driver_arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Pricing
    vehicle_type vehicle_type NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    distance_fare DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    time_fare DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    waiting_fare DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tolls_fare DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    surge_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    promotion_id UUID,
    estimated_fare DECIMAL(10, 2) NOT NULL,
    actual_fare DECIMAL(10, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'MRU',

    -- Payment
    payment_method payment_provider NOT NULL DEFAULT 'CASH',
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    transaction_id UUID,

    -- Ratings
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_rating_comment TEXT,
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    driver_rating_comment TEXT,

    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for rides
CREATE INDEX idx_rides_client ON rides(client_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_city ON rides(city_id);
CREATE INDEX idx_rides_requested_at ON rides(requested_at);
CREATE INDEX idx_rides_scheduled ON rides(scheduled_at) WHERE is_scheduled = TRUE;
CREATE INDEX idx_rides_pickup_location ON rides USING GIST(pickup_location);
CREATE INDEX idx_rides_dropoff_location ON rides USING GIST(dropoff_location);

-- Generate ride number function
CREATE OR REPLACE FUNCTION generate_ride_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ride_number := 'GC' || TO_CHAR(NOW(), 'YYMMDD') || '-' ||
                       LPAD(NEXTVAL('ride_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ride_number_seq START 1;

CREATE TRIGGER trigger_generate_ride_number
    BEFORE INSERT ON rides
    FOR EACH ROW
    EXECUTE FUNCTION generate_ride_number();

-- -----------------------------------------------------------------------------
-- Ride Stops Table (Multiple stops within a ride)
-- -----------------------------------------------------------------------------
CREATE TABLE ride_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    place_id VARCHAR(255),
    arrived_at TIMESTAMPTZ,
    departed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_stops_ride ON ride_stops(ride_id);

-- -----------------------------------------------------------------------------
-- Ride Tracking Table (Real-time location updates during ride)
-- -----------------------------------------------------------------------------
CREATE TABLE ride_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2), -- km/h
    accuracy DECIMAL(8, 2), -- meters
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_tracking_ride ON ride_tracking(ride_id);
CREATE INDEX idx_ride_tracking_time ON ride_tracking(recorded_at);

-- Partition ride_tracking by month for better performance
-- (For production, implement table partitioning)

-- -----------------------------------------------------------------------------
-- Driver Location History Table
-- -----------------------------------------------------------------------------
CREATE TABLE driver_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    is_online BOOLEAN NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_location_history_driver ON driver_location_history(driver_id);
CREATE INDEX idx_driver_location_history_time ON driver_location_history(recorded_at);

-- =============================================================================
-- PAYMENT TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Payment Providers Configuration Table
-- -----------------------------------------------------------------------------
CREATE TABLE payment_providers_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider payment_provider NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    display_name_fr VARCHAR(100) NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    api_endpoint TEXT,
    merchant_id VARCHAR(255),
    api_key_encrypted TEXT, -- Encrypted API key
    supported_currencies TEXT[] NOT NULL DEFAULT ARRAY['MRU'],
    min_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_amount DECIMAL(10, 2),
    transaction_fee_percent DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    transaction_fee_fixed DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    config_json JSONB, -- Additional provider-specific configuration
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default payment providers
INSERT INTO payment_providers_config (provider, display_name, display_name_ar, display_name_fr) VALUES
    ('CASH', 'Cash', 'نقداً', 'Espèces'),
    ('BANKILY', 'Bankily', 'بنكيلي', 'Bankily'),
    ('SEDAD', 'Sedad', 'السداد', 'Sedad'),
    ('MASRVI', 'Masrvi', 'مصرفي', 'Masrvi'),
    ('WALLET', 'Wallet', 'المحفظة', 'Portefeuille');

-- -----------------------------------------------------------------------------
-- Payment Methods Table (User's saved payment methods)
-- -----------------------------------------------------------------------------
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    phone_number VARCHAR(20), -- For mobile money
    account_number VARCHAR(100), -- For bank accounts
    account_holder_name VARCHAR(200),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);

-- Add foreign key to clients for default payment method
ALTER TABLE clients
    ADD CONSTRAINT fk_clients_default_payment_method
    FOREIGN KEY (default_payment_method_id)
    REFERENCES payment_methods(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Wallets Table
-- -----------------------------------------------------------------------------
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'MRU',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- -----------------------------------------------------------------------------
-- Transactions Table
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    ride_id UUID
