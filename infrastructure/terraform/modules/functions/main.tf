/**
 * Jeeny Functions Module - Cloud Functions
 *
 * Creates Cloud Functions for event-driven processing.
 * Replaces AWS Lambda event triggers.
 */

# Service Account for Cloud Functions
resource "google_service_account" "functions" {
  account_id   = "jeeny-functions-${var.environment}"
  display_name = "Jeeny Cloud Functions Service Account"
  project      = var.project_id
}

# Grant Firestore access
resource "google_project_iam_member" "functions_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Grant Storage access
resource "google_project_iam_member" "functions_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Grant Pub/Sub access
resource "google_project_iam_member" "functions_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_project_iam_member" "functions_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Grant Secret Manager access
resource "google_project_iam_member" "functions_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Grant Firebase Messaging access
resource "google_project_iam_member" "functions_fcm" {
  project = var.project_id
  role    = "roles/firebase.sdkAdminServiceAgent"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# Storage bucket for function source code
resource "google_storage_bucket" "functions_source" {
  name          = "jeeny-functions-source-${var.project_id}-${var.environment}"
  location      = var.region
  force_destroy = var.environment != "prod"
  labels        = var.labels

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

# Common environment variables
locals {
  common_env_vars = {
    GCP_PROJECT_ID     = var.project_id
    GCP_REGION         = var.region
    ENVIRONMENT        = var.environment
    FIRESTORE_DATABASE = var.firestore_database
  }
}


# =====================================================
# RIDE EVENT FUNCTIONS
# =====================================================

# Ride Created - Notify nearby drivers
resource "google_cloudfunctions2_function" "ride_created" {
  name     = "jeeny-ride-created-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "rideCreated"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/ride-events.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 100 : 10
    min_instance_count    = var.environment == "prod" ? 1 : 0
    available_memory      = "512Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["ride_events"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# Ride Status Changed - Update driver/client
resource "google_cloudfunctions2_function" "ride_status_changed" {
  name     = "jeeny-ride-status-changed-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "rideStatusChanged"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/ride-events.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 100 : 10
    min_instance_count    = var.environment == "prod" ? 1 : 0
    available_memory      = "512Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["ride_events"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# =====================================================
# DRIVER EVENT FUNCTIONS
# =====================================================

# Driver Location Updated - Update nearby rides
resource "google_cloudfunctions2_function" "driver_location_updated" {
  name     = "jeeny-driver-location-updated-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "driverLocationUpdated"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/driver-events.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 200 : 20
    min_instance_count    = var.environment == "prod" ? 2 : 0
    available_memory      = "256Mi"
    timeout_seconds       = 30
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["driver_events"]}"
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# Driver Status Changed
resource "google_cloudfunctions2_function" "driver_status_changed" {
  name     = "jeeny-driver-status-changed-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "driverStatusChanged"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/driver-events.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 50 : 5
    min_instance_count    = 0
    available_memory      = "256Mi"
    timeout_seconds       = 30
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["driver_events"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}


# =====================================================
# NOTIFICATION FUNCTIONS
# =====================================================

# Send Push Notification
resource "google_cloudfunctions2_function" "send_notification" {
  name     = "jeeny-send-notification-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "sendNotification"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/notifications.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 100 : 10
    min_instance_count    = var.environment == "prod" ? 1 : 0
    available_memory      = "256Mi"
    timeout_seconds       = 30
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["notifications"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# Send SMS Notification
resource "google_cloudfunctions2_function" "send_sms" {
  name     = "jeeny-send-sms-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "sendSms"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/notifications.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 50 : 5
    min_instance_count    = 0
    available_memory      = "256Mi"
    timeout_seconds       = 30
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["sms"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# =====================================================
# PAYMENT FUNCTIONS
# =====================================================

# Process Payment
resource "google_cloudfunctions2_function" "process_payment" {
  name     = "jeeny-process-payment-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "processPayment"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/payments.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 50 : 5
    min_instance_count    = var.environment == "prod" ? 1 : 0
    available_memory      = "512Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["payments"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# =====================================================
# SCHEDULED FUNCTIONS
# =====================================================

# Cleanup expired rides (runs every hour)
resource "google_cloud_scheduler_job" "cleanup_expired_rides" {
  name        = "jeeny-cleanup-expired-rides-${var.environment}"
  description = "Cleanup expired ride requests"
  schedule    = "0 * * * *"
  time_zone   = "Africa/Nouakchott"
  region      = var.region

  pubsub_target {
    topic_name = "projects/${var.project_id}/topics/${var.pubsub_topics["scheduled_tasks"]}"
    data       = base64encode("{\"task\": \"cleanup_expired_rides\"}")
  }
}

# Daily analytics aggregation (runs at 2 AM)
resource "google_cloud_scheduler_job" "daily_analytics" {
  name        = "jeeny-daily-analytics-${var.environment}"
  description = "Aggregate daily analytics"
  schedule    = "0 2 * * *"
  time_zone   = "Africa/Nouakchott"
  region      = var.region

  pubsub_target {
    topic_name = "projects/${var.project_id}/topics/${var.pubsub_topics["scheduled_tasks"]}"
    data       = base64encode("{\"task\": \"daily_analytics\"}")
  }
}

# Scheduled Tasks Handler
resource "google_cloudfunctions2_function" "scheduled_tasks" {
  name     = "jeeny-scheduled-tasks-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "handleScheduledTask"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/scheduled-tasks.zip"
      }
    }
  }

  service_config {
    max_instance_count    = 5
    min_instance_count    = 0
    available_memory      = "1Gi"
    timeout_seconds       = 540
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topics["scheduled_tasks"]}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}

# =====================================================
# FIRESTORE TRIGGER FUNCTIONS
# =====================================================

# User Created Trigger
resource "google_cloudfunctions2_function" "user_created" {
  name     = "jeeny-user-created-${var.environment}"
  location = var.region
  labels   = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "onUserCreated"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "functions/firestore-triggers.zip"
      }
    }
  }

  service_config {
    max_instance_count    = var.environment == "prod" ? 20 : 5
    min_instance_count    = 0
    available_memory      = "256Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.functions.email
    
    vpc_connector                 = var.vpc_connector != "" ? var.vpc_connector : null
    vpc_connector_egress_settings = var.vpc_connector != "" ? "PRIVATE_RANGES_ONLY" : null

    environment_variables = local.common_env_vars
  }

  event_trigger {
    trigger_region        = var.region
    event_type            = "google.cloud.firestore.document.v1.created"
    retry_policy          = "RETRY_POLICY_RETRY"
    
    event_filters {
      attribute = "database"
      value     = "(default)"
    }
    event_filters {
      attribute = "document"
      value     = "users/{userId}"
      operator  = "match-path-pattern"
    }
  }

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].object,
    ]
  }
}
