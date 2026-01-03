/**
 * Jeeny Auth Module - Firebase Authentication
 *
 * Creates Firebase project and authentication configuration.
 * Replaces AWS Cognito.
 */

# Firebase Project
resource "google_firebase_project" "main" {
  provider = google-beta
  project  = var.project_id
}

# Firebase Web App (for Admin Dashboard)
resource "google_firebase_web_app" "admin" {
  provider     = google-beta
  project      = var.project_id
  display_name = "Jeeny Admin Dashboard"

  depends_on = [google_firebase_project.main]
}

# Get Firebase Web App config
data "google_firebase_web_app_config" "admin" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.admin.app_id
}

# Identity Platform Config (Firebase Auth)
# NOTE: Configure via Firebase Console due to ADC quota project issues
# resource "google_identity_platform_config" "main" {
#   provider = google-beta
#   project  = var.project_id
#
#   # Sign-in configuration
#   sign_in {
#     allow_duplicate_emails = false
#
#     # Phone authentication
#     phone_number {
#       enabled            = true
#       test_phone_numbers = var.environment != "prod" ? var.test_phone_numbers : {}
#     }
#
#     # Email authentication (optional, for admin)
#     email {
#       enabled           = true
#       password_required = true
#     }
#
#     # Anonymous authentication (disabled)
#     anonymous {
#       enabled = false
#     }
#   }
#
#   # SMS region config for Mauritania
#   sms_region_config {
#     allow_by_default {
#     }
#   }
#
#   # Quota config
#   quota {
#     sign_up_quota_config {
#       quota          = 1000
#       start_time     = ""
#       quota_duration = "86400s" # 1 day
#     }
#   }
#
#   # Authorized domains
#   authorized_domains = concat(
#     ["localhost"],
#     var.authorized_domains
#   )
#
#   depends_on = [google_firebase_project.main]
# }

# Identity Platform Tenant (optional, for multi-tenancy)
# resource "google_identity_platform_tenant" "main" {
#   provider     = google-beta
#   project      = var.project_id
#   display_name = "Jeeny ${var.environment}"
# }

# Service Account for Firebase Admin SDK
resource "google_service_account" "firebase_admin" {
  account_id   = "jeeny-firebase-admin-${var.environment}"
  display_name = "Jeeny Firebase Admin Service Account"
  project      = var.project_id
}

# Grant Firebase Admin permissions
resource "google_project_iam_member" "firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

resource "google_project_iam_member" "identity_admin" {
  project = var.project_id
  role    = "roles/identityplatform.admin"
  member  = "serviceAccount:${google_service_account.firebase_admin.email}"
}

# Service Account Key (for backend services)
resource "google_service_account_key" "firebase_admin" {
  service_account_id = google_service_account.firebase_admin.name
}

# Store the key in Secret Manager
resource "google_secret_manager_secret" "firebase_admin_key" {
  secret_id = "jeeny-firebase-admin-key-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = var.labels
}

resource "google_secret_manager_secret_version" "firebase_admin_key" {
  secret      = google_secret_manager_secret.firebase_admin_key.id
  secret_data = base64decode(google_service_account_key.firebase_admin.private_key)
}

# Firebase App Check (optional, for app verification)
# resource "google_firebase_app_check_service_config" "main" {
#   provider         = google-beta
#   project          = var.project_id
#   service_id       = "firestore.googleapis.com"
#   enforcement_mode = "ENFORCED"
# }
