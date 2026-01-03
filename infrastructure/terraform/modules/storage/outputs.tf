/**
 * Storage Module - Outputs
 */

output "bucket_names" {
  description = "The storage bucket names"
  value = {
    assets           = google_storage_bucket.assets.name
    user_uploads     = google_storage_bucket.user_uploads.name
    driver_documents = google_storage_bucket.driver_documents.name
    ride_media       = google_storage_bucket.ride_media.name
    logs             = google_storage_bucket.logs.name
  }
}

output "bucket_urls" {
  description = "The storage bucket URLs"
  value = {
    assets           = google_storage_bucket.assets.url
    user_uploads     = google_storage_bucket.user_uploads.url
    driver_documents = google_storage_bucket.driver_documents.url
    ride_media       = google_storage_bucket.ride_media.url
    logs             = google_storage_bucket.logs.url
  }
}

output "cdn_url" {
  description = "The Cloud CDN URL for assets"
  value       = "https://${google_compute_global_forwarding_rule.assets_cdn_http.ip_address}"
}

output "cdn_ip" {
  description = "The Cloud CDN IP address"
  value       = google_compute_global_forwarding_rule.assets_cdn_http.ip_address
}

output "storage_service_account" {
  description = "The storage access service account email"
  value       = google_service_account.storage_access.email
}
