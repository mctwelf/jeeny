/**
 * Jeeny Database Module - Firestore
 *
 * Creates Firestore database for the Jeeny taxi booking platform.
 * Replaces AWS DynamoDB tables.
 */

# Firestore Database
resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  # Enable point-in-time recovery for production
  point_in_time_recovery_enablement = var.environment == "prod" ? "POINT_IN_TIME_RECOVERY_ENABLED" : "POINT_IN_TIME_RECOVERY_DISABLED"

  # Concurrency mode
  concurrency_mode = "OPTIMISTIC"

  # App Engine integration (required for some features)
  app_engine_integration_mode = "DISABLED"

  # Delete protection for production
  delete_protection_state = var.environment == "prod" ? "DELETE_PROTECTION_ENABLED" : "DELETE_PROTECTION_DISABLED"
}

# Firestore Indexes

# Users collection indexes
resource "google_firestore_index" "users_role_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "users_city_driver_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "driverStatus"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "users_phone" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "phoneNumber"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# Rides collection indexes
resource "google_firestore_index" "rides_client_requested" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "rides_driver_requested" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "rides_status_requested" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "rides_city_requested" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

# Locations collection indexes (for geoqueries)
resource "google_firestore_index" "locations_geohash_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "locations"

  fields {
    field_path = "geohash"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "locations_city_updated" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "locations"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "updatedAt"
    order      = "DESCENDING"
  }
}

# Transactions collection indexes
resource "google_firestore_index" "transactions_user_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "transactions"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "transactions_ride_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "transactions"

  fields {
    field_path = "rideId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "transactions_status_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "transactions"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# Notifications collection indexes
resource "google_firestore_index" "notifications_user_read_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "notifications"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isRead"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# Chats collection indexes
resource "google_firestore_index" "chats_ride_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "chats"

  fields {
    field_path = "rideId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "chats_user_last_message" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "chats"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "lastMessageAt"
    order      = "DESCENDING"
  }
}

# Vehicles collection indexes
resource "google_firestore_index" "vehicles_driver_active" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "vehicles"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
}

# Promotions collection indexes
resource "google_firestore_index" "promotions_active_valid" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "promotions"

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }

  fields {
    field_path = "validTo"
    order      = "ASCENDING"
  }
}

# Support tickets collection indexes
resource "google_firestore_index" "support_tickets_user_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "supportTickets"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "support_tickets_status_priority" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "supportTickets"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "priority"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "support_tickets_assigned_created" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "supportTickets"

  fields {
    field_path = "assignedTo"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# TTL Policy for temporary data
resource "google_firestore_field" "locations_ttl" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "locations"
  field      = "ttl"

  ttl_config {}
}

resource "google_firestore_field" "notifications_ttl" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "notifications"
  field      = "ttl"

  ttl_config {}
}

# ==================== MONTHLY CONTRACTS INDEXES ====================

resource "google_firestore_index" "contracts_client_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "contracts"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "startDate"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "contracts_driver_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "contracts"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "contracts_type_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "contracts"

  fields {
    field_path = "contractType"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# ==================== INTERCITY ROUTES INDEXES ====================

resource "google_firestore_index" "intercity_routes_cities" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityRoutes"

  fields {
    field_path = "fromCityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "toCityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "intercity_routes_popular" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityRoutes"

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isPopular"
    order      = "ASCENDING"
  }

  fields {
    field_path = "totalTrips"
    order      = "DESCENDING"
  }
}

# ==================== INTERCITY TRIPS INDEXES ====================

resource "google_firestore_index" "intercity_trips_route_date" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityTrips"

  fields {
    field_path = "routeId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "departureDate"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "intercity_trips_driver" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityTrips"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "departureDate"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "intercity_trips_available" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityTrips"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "availableSeats"
    order      = "DESCENDING"
  }

  fields {
    field_path = "departureDate"
    order      = "ASCENDING"
  }
}

# ==================== INTERCITY BOOKINGS INDEXES ====================

resource "google_firestore_index" "intercity_bookings_client" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityBookings"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "intercity_bookings_trip" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "intercityBookings"

  fields {
    field_path = "tripId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

# ==================== CORPORATE ACCOUNTS INDEXES ====================

resource "google_firestore_index" "corporate_accounts_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "corporateAccounts"

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }

  fields {
    field_path = "verificationStatus"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# ==================== AIRPORTS INDEXES ====================

resource "google_firestore_index" "airports_city" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "airports"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
}

# ==================== PACKAGE DELIVERIES INDEXES ====================

resource "google_firestore_index" "deliveries_client_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "deliveries"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "deliveryStatus"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "deliveries_driver_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "deliveries"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "deliveryStatus"
    order      = "ASCENDING"
  }
}

# ==================== SHARED RIDES INDEXES ====================

resource "google_firestore_index" "shared_rides_status_departure" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "sharedRides"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "departureTime"
    order      = "ASCENDING"
  }

  fields {
    field_path = "availableSeats"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "shared_rides_driver" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "sharedRides"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "departureTime"
    order      = "ASCENDING"
  }
}

# ==================== HOURLY BOOKINGS INDEXES ====================

resource "google_firestore_index" "hourly_bookings_client" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "hourlyBookings"

  fields {
    field_path = "clientId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "startTime"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "hourly_bookings_driver" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "hourlyBookings"

  fields {
    field_path = "driverId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

# ==================== DRIVER SERVICE PREFERENCES INDEX ====================

resource "google_firestore_index" "users_driver_services" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "servicePreferences.acceptsIntercityTrips"
    order      = "ASCENDING"
  }

  fields {
    field_path = "driverStatus"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "users_driver_contracts" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "servicePreferences.acceptsMonthlyContracts"
    order      = "ASCENDING"
  }

  fields {
    field_path = "verificationStatus"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "users_driver_delivery" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "servicePreferences.acceptsPackageDelivery"
    order      = "ASCENDING"
  }

  fields {
    field_path = "driverStatus"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "users_female_drivers" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "users"

  fields {
    field_path = "role"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isFemaleDriver"
    order      = "ASCENDING"
  }

  fields {
    field_path = "driverStatus"
    order      = "ASCENDING"
  }
}

# ==================== RIDES BY TYPE INDEX ====================

resource "google_firestore_index" "rides_type_status" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "rideType"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "rides_vehicle_category" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "vehicleCategory"
    order      = "ASCENDING"
  }

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "rides_corporate" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "rides"

  fields {
    field_path = "corporateAccountId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "requestedAt"
    order      = "DESCENDING"
  }
}

# ==================== PRICING INDEXES ====================

resource "google_firestore_index" "pricing_rules_category" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "pricingRules"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "vehicleCategory"
    order      = "ASCENDING"
  }

  fields {
    field_path = "vehicleType"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "pricing_rules_ride_type" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "pricingRules"

  fields {
    field_path = "cityId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "rideType"
    order      = "ASCENDING"
  }

  fields {
    field_path = "isActive"
    order      = "ASCENDING"
  }
}
