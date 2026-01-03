/**
 * Pub/Sub Module - Outputs
 */

output "topic_names" {
  description = "The Pub/Sub topic names"
  value = {
    ride_requests   = google_pubsub_topic.ride_requests.name
    ride_updates    = google_pubsub_topic.ride_updates.name
    ride_events     = google_pubsub_topic.ride_events.name
    driver_events   = google_pubsub_topic.driver_events.name
    payments        = google_pubsub_topic.payments.name
    notifications   = google_pubsub_topic.notifications.name
    sms             = google_pubsub_topic.sms.name
    scheduled_tasks = google_pubsub_topic.scheduled_tasks.name
    system_alerts   = google_pubsub_topic.system_alerts.name
    dead_letter     = google_pubsub_topic.dead_letter.name
  }
}

output "topic_ids" {
  description = "The Pub/Sub topic IDs"
  value = {
    ride_requests   = google_pubsub_topic.ride_requests.id
    ride_updates    = google_pubsub_topic.ride_updates.id
    ride_events     = google_pubsub_topic.ride_events.id
    driver_events   = google_pubsub_topic.driver_events.id
    payments        = google_pubsub_topic.payments.id
    notifications   = google_pubsub_topic.notifications.id
    sms             = google_pubsub_topic.sms.id
    scheduled_tasks = google_pubsub_topic.scheduled_tasks.id
    system_alerts   = google_pubsub_topic.system_alerts.id
    dead_letter     = google_pubsub_topic.dead_letter.id
  }
}

output "subscription_names" {
  description = "The Pub/Sub subscription names"
  value = {
    ride_requests       = google_pubsub_subscription.ride_requests.name
    ride_updates        = google_pubsub_subscription.ride_updates.name
    ride_events         = google_pubsub_subscription.ride_events.name
    driver_events       = google_pubsub_subscription.driver_events.name
    payments            = google_pubsub_subscription.payments.name
    notifications_push  = google_pubsub_subscription.notifications_push.name
    notifications_sms   = google_pubsub_subscription.notifications_sms.name
    notifications_email = google_pubsub_subscription.notifications_email.name
    sms                 = google_pubsub_subscription.sms.name
    scheduled_tasks     = google_pubsub_subscription.scheduled_tasks.name
    system_alerts       = google_pubsub_subscription.system_alerts.name
    dead_letter         = google_pubsub_subscription.dead_letter.name
  }
}

output "pubsub_service_account" {
  description = "The Pub/Sub service account email"
  value       = google_service_account.pubsub.email
}
