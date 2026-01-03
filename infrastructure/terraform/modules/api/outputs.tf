/**
 * Jeeny API Module - Outputs
 */

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://${google_api_gateway_gateway.main.default_hostname}"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = google_api_gateway_gateway.main.gateway_id
}

output "artifact_registry_url" {
  description = "Artifact Registry URL for container images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}"
}

output "service_account_email" {
  description = "API Service Account email"
  value       = google_service_account.api.email
}

output "service_names" {
  description = "Map of Cloud Run service names"
  value = {
    auth          = google_cloud_run_v2_service.auth.name
    users         = google_cloud_run_v2_service.users.name
    rides         = google_cloud_run_v2_service.rides.name
    drivers       = google_cloud_run_v2_service.drivers.name
    location      = google_cloud_run_v2_service.location.name
    payments      = google_cloud_run_v2_service.payments.name
    notifications = google_cloud_run_v2_service.notifications.name
    chat          = google_cloud_run_v2_service.chat.name
    support       = google_cloud_run_v2_service.support.name
    promotions    = google_cloud_run_v2_service.promotions.name
    admin         = google_cloud_run_v2_service.admin.name
    analytics     = google_cloud_run_v2_service.analytics.name
  }
}

output "service_urls" {
  description = "Map of Cloud Run service URLs"
  value = {
    auth          = google_cloud_run_v2_service.auth.uri
    users         = google_cloud_run_v2_service.users.uri
    rides         = google_cloud_run_v2_service.rides.uri
    drivers       = google_cloud_run_v2_service.drivers.uri
    location      = google_cloud_run_v2_service.location.uri
    payments      = google_cloud_run_v2_service.payments.uri
    notifications = google_cloud_run_v2_service.notifications.uri
    chat          = google_cloud_run_v2_service.chat.uri
    support       = google_cloud_run_v2_service.support.uri
    promotions    = google_cloud_run_v2_service.promotions.uri
    admin         = google_cloud_run_v2_service.admin.uri
    analytics     = google_cloud_run_v2_service.analytics.uri
  }
}
