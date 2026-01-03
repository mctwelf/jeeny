/**
 * Jeeny Pub/Sub Module - Cloud Pub/Sub
 *
 * Creates Pub/Sub topics and subscriptions for the Jeeny taxi booking platform.
 * Replaces AWS SNS/SQS.
 */

# Dead Letter Topic
resource "google_pubsub_topic" "dead_letter" {
  name    = "jeeny-dead-letter-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s" # 7 days

  labels = var.labels
}

# Dead Letter Subscription (for monitoring)
resource "google_pubsub_subscription" "dead_letter" {
  name    = "jeeny-dead-letter-sub-${var.environment}"
  topic   = google_pubsub_topic.dead_letter.name
  project = var.project_id

  message_retention_duration = "604800s" # 7 days
  retain_acked_messages      = true
  ack_deadline_seconds       = 60

  expiration_policy {
    ttl = "" # Never expire
  }

  labels = var.labels
}

# Ride Requests Topic
resource "google_pubsub_topic" "ride_requests" {
  name    = "jeeny-ride-requests-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s" # 7 days

  labels = var.labels
}

resource "google_pubsub_subscription" "ride_requests" {
  name    = "jeeny-ride-requests-sub-${var.environment}"
  topic   = google_pubsub_topic.ride_requests.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Ride Updates Topic
resource "google_pubsub_topic" "ride_updates" {
  name    = "jeeny-ride-updates-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "ride_updates" {
  name    = "jeeny-ride-updates-sub-${var.environment}"
  topic   = google_pubsub_topic.ride_updates.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Payments Topic
resource "google_pubsub_topic" "payments" {
  name    = "jeeny-payments-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "payments" {
  name    = "jeeny-payments-sub-${var.environment}"
  topic   = google_pubsub_topic.payments.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Notifications Topic
resource "google_pubsub_topic" "notifications" {
  name    = "jeeny-notifications-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

# Push Notifications Subscription
resource "google_pubsub_subscription" "notifications_push" {
  name    = "jeeny-notifications-push-sub-${var.environment}"
  topic   = google_pubsub_topic.notifications.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  filter = "attributes.channel = \"push\" OR attributes.channel = \"all\""

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# SMS Notifications Subscription
resource "google_pubsub_subscription" "notifications_sms" {
  name    = "jeeny-notifications-sms-sub-${var.environment}"
  topic   = google_pubsub_topic.notifications.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  filter = "attributes.channel = \"sms\" OR attributes.channel = \"all\""

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Email Notifications Subscription
resource "google_pubsub_subscription" "notifications_email" {
  name    = "jeeny-notifications-email-sub-${var.environment}"
  topic   = google_pubsub_topic.notifications.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  filter = "attributes.channel = \"email\" OR attributes.channel = \"all\""

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# System Alerts Topic
resource "google_pubsub_topic" "system_alerts" {
  name    = "jeeny-system-alerts-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "system_alerts" {
  name    = "jeeny-system-alerts-sub-${var.environment}"
  topic   = google_pubsub_topic.system_alerts.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = true
  ack_deadline_seconds       = 60

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Service Account for Pub/Sub
resource "google_service_account" "pubsub" {
  account_id   = "jeeny-pubsub-${var.environment}"
  display_name = "Jeeny Pub/Sub Service Account"
  project      = var.project_id
}

# Grant publish permissions
resource "google_pubsub_topic_iam_member" "ride_requests_publisher" {
  topic   = google_pubsub_topic.ride_requests.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "ride_updates_publisher" {
  topic   = google_pubsub_topic.ride_updates.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "payments_publisher" {
  topic   = google_pubsub_topic.payments.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "notifications_publisher" {
  topic   = google_pubsub_topic.notifications.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "system_alerts_publisher" {
  topic   = google_pubsub_topic.system_alerts.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}


# =====================================================
# ADDITIONAL TOPICS FOR CLOUD FUNCTIONS
# =====================================================

# Ride Events Topic (for ride lifecycle events)
resource "google_pubsub_topic" "ride_events" {
  name    = "jeeny-ride-events-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "ride_events" {
  name    = "jeeny-ride-events-sub-${var.environment}"
  topic   = google_pubsub_topic.ride_events.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Driver Events Topic (for driver status/location updates)
resource "google_pubsub_topic" "driver_events" {
  name    = "jeeny-driver-events-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "driver_events" {
  name    = "jeeny-driver-events-sub-${var.environment}"
  topic   = google_pubsub_topic.driver_events.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 30

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "5s"
    maximum_backoff = "60s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# SMS Topic (for SMS notifications)
resource "google_pubsub_topic" "sms" {
  name    = "jeeny-sms-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "sms" {
  name    = "jeeny-sms-sub-${var.environment}"
  topic   = google_pubsub_topic.sms.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# Scheduled Tasks Topic (for cron jobs)
resource "google_pubsub_topic" "scheduled_tasks" {
  name    = "jeeny-scheduled-tasks-${var.environment}"
  project = var.project_id

  message_retention_duration = "604800s"

  labels = var.labels
}

resource "google_pubsub_subscription" "scheduled_tasks" {
  name    = "jeeny-scheduled-tasks-sub-${var.environment}"
  topic   = google_pubsub_topic.scheduled_tasks.name
  project = var.project_id

  message_retention_duration = "604800s"
  retain_acked_messages      = false
  ack_deadline_seconds       = 600

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "60s"
    maximum_backoff = "600s"
  }

  expiration_policy {
    ttl = ""
  }

  labels = var.labels
}

# IAM for new topics
resource "google_pubsub_topic_iam_member" "ride_events_publisher" {
  topic   = google_pubsub_topic.ride_events.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "driver_events_publisher" {
  topic   = google_pubsub_topic.driver_events.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "sms_publisher" {
  topic   = google_pubsub_topic.sms.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}

resource "google_pubsub_topic_iam_member" "scheduled_tasks_publisher" {
  topic   = google_pubsub_topic.scheduled_tasks.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.pubsub.email}"
  project = var.project_id
}
