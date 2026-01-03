/**
 * Jeeny Functions Module - Outputs
 */

output "service_account_email" {
  description = "Cloud Functions Service Account email"
  value       = google_service_account.functions.email
}

output "functions_source_bucket" {
  description = "Storage bucket for function source code"
  value       = google_storage_bucket.functions_source.name
}

output "function_names" {
  description = "Map of Cloud Function names"
  value = {
    ride_created           = google_cloudfunctions2_function.ride_created.name
    ride_status_changed    = google_cloudfunctions2_function.ride_status_changed.name
    driver_location_updated = google_cloudfunctions2_function.driver_location_updated.name
    driver_status_changed  = google_cloudfunctions2_function.driver_status_changed.name
    send_notification      = google_cloudfunctions2_function.send_notification.name
    send_sms               = google_cloudfunctions2_function.send_sms.name
    process_payment        = google_cloudfunctions2_function.process_payment.name
    scheduled_tasks        = google_cloudfunctions2_function.scheduled_tasks.name
    user_created           = google_cloudfunctions2_function.user_created.name
  }
}

output "function_urls" {
  description = "Map of Cloud Function URLs"
  value = {
    ride_created           = google_cloudfunctions2_function.ride_created.url
    ride_status_changed    = google_cloudfunctions2_function.ride_status_changed.url
    driver_location_updated = google_cloudfunctions2_function.driver_location_updated.url
    driver_status_changed  = google_cloudfunctions2_function.driver_status_changed.url
    send_notification      = google_cloudfunctions2_function.send_notification.url
    send_sms               = google_cloudfunctions2_function.send_sms.url
    process_payment        = google_cloudfunctions2_function.process_payment.url
    scheduled_tasks        = google_cloudfunctions2_function.scheduled_tasks.url
    user_created           = google_cloudfunctions2_function.user_created.url
  }
}
