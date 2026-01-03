/**
 * Jeeny Monitoring Module - Outputs
 */

output "dashboard_id" {
  description = "Monitoring Dashboard ID"
  value       = google_monitoring_dashboard.main.id
}

output "notification_channel_ids" {
  description = "Notification Channel IDs"
  value       = local.notification_channels
}

output "alert_policy_ids" {
  description = "Alert Policy IDs"
  value = {
    high_error_rate     = google_monitoring_alert_policy.high_error_rate.name
    high_latency        = google_monitoring_alert_policy.high_latency.name
    function_errors     = google_monitoring_alert_policy.function_errors.name
    firestore_high_usage = google_monitoring_alert_policy.firestore_high_usage.name
    pubsub_dlq          = google_monitoring_alert_policy.pubsub_dlq.name
  }
}

output "uptime_check_id" {
  description = "API Gateway Uptime Check ID"
  value       = google_monitoring_uptime_check_config.api_gateway.uptime_check_id
}

output "log_metrics" {
  description = "Log-based metric names"
  value = {
    ride_requests   = google_logging_metric.ride_requests.name
    payment_success = google_logging_metric.payment_success.name
    drivers_online  = google_logging_metric.drivers_online.name
  }
}
