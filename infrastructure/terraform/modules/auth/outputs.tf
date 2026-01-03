/**
 * Jeeny Auth Module - Outputs
 */

output "firebase_project_id" {
  description = "Firebase Project ID"
  value       = google_firebase_project.main.project
}

output "firebase_web_app_id" {
  description = "Firebase Web App ID"
  value       = google_firebase_web_app.admin.app_id
}

output "firebase_web_app_config" {
  description = "Firebase Web App configuration"
  value = {
    api_key             = data.google_firebase_web_app_config.admin.api_key
    auth_domain         = data.google_firebase_web_app_config.admin.auth_domain
    storage_bucket      = data.google_firebase_web_app_config.admin.storage_bucket
    messaging_sender_id = data.google_firebase_web_app_config.admin.messaging_sender_id
    app_id              = google_firebase_web_app.admin.app_id
  }
  sensitive = true
}

output "firebase_admin_service_account_email" {
  description = "Firebase Admin Service Account email"
  value       = google_service_account.firebase_admin.email
}

output "firebase_admin_key_secret_id" {
  description = "Secret Manager secret ID for Firebase Admin key"
  value       = google_secret_manager_secret.firebase_admin_key.secret_id
}
