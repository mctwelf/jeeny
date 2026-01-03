/**
 * Jeeny Monitoring Module - Cloud Monitoring
 *
 * Creates monitoring dashboards, alerts, and uptime checks.
 * Replaces AWS CloudWatch.
 */

# =====================================================
# NOTIFICATION CHANNELS
# =====================================================

# Email notification channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Jeeny Ops Email - ${var.environment}"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
  enabled = true
}

# Slack notification channel (optional)
resource "google_monitoring_notification_channel" "slack" {
  count        = var.slack_webhook_url != "" ? 1 : 0
  display_name = "Jeeny Ops Slack - ${var.environment}"
  type         = "slack"
  labels = {
    channel_name = "#jeeny-alerts-${var.environment}"
  }
  sensitive_labels {
    auth_token = var.slack_webhook_url
  }
  enabled = true
}

locals {
  notification_channels = concat(
    [google_monitoring_notification_channel.email.name],
    var.slack_webhook_url != "" ? [google_monitoring_notification_channel.slack[0].name] : []
  )
}

# =====================================================
# UPTIME CHECKS
# =====================================================

# API Gateway uptime check
resource "google_monitoring_uptime_check_config" "api_gateway" {
  display_name = "Jeeny API Gateway - ${var.environment}"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.api_gateway_host
    }
  }

  content_matchers {
    content = "ok"
    matcher = "CONTAINS_STRING"
  }
}

# =====================================================
# ALERT POLICIES
# =====================================================

# High Error Rate Alert
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "Jeeny High Error Rate - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run Error Rate > 5%"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name"]
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "High error rate detected in Jeeny API services. Check Cloud Run logs for details."
    mime_type = "text/markdown"
  }
}

# High Latency Alert
resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "Jeeny High Latency - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run P99 Latency > 5s"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_latencies\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5000

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MAX"
        group_by_fields      = ["resource.label.service_name"]
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "High latency detected in Jeeny API services. Check service performance and scaling."
    mime_type = "text/markdown"
  }
}

# Cloud Function Errors Alert
resource "google_monitoring_alert_policy" "function_errors" {
  display_name = "Jeeny Function Errors - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Function Error Rate > 1%"
    condition_threshold {
      filter          = "resource.type = \"cloud_function\" AND metric.type = \"cloudfunctions.googleapis.com/function/execution_count\" AND metric.labels.status != \"ok\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.function_name"]
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "Cloud Function errors detected. Check function logs for details."
    mime_type = "text/markdown"
  }
}


# Firestore High Read/Write Alert
resource "google_monitoring_alert_policy" "firestore_high_usage" {
  display_name = "Jeeny Firestore High Usage - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Firestore Read Operations > 10000/min"
    condition_threshold {
      filter          = "resource.type = \"firestore_database\" AND metric.type = \"firestore.googleapis.com/document/read_count\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10000

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "High Firestore usage detected. Review query patterns and consider optimization."
    mime_type = "text/markdown"
  }
}

# Pub/Sub Dead Letter Queue Alert
resource "google_monitoring_alert_policy" "pubsub_dlq" {
  display_name = "Jeeny Pub/Sub DLQ Messages - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Messages in Dead Letter Queue"
    condition_threshold {
      filter          = "resource.type = \"pubsub_subscription\" AND metric.type = \"pubsub.googleapis.com/subscription/dead_letter_message_count\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "Messages detected in Pub/Sub dead letter queue. Investigate failed message processing."
    mime_type = "text/markdown"
  }
}

# =====================================================
# DASHBOARD
# =====================================================

resource "google_monitoring_dashboard" "main" {
  dashboard_json = jsonencode({
    displayName = "Jeeny Platform Dashboard - ${var.environment}"
    gridLayout = {
      columns = 2
      widgets = [
        # Request Count
        {
          title = "API Request Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            timeshiftDuration = "0s"
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Error Rate
        {
          title = "API Error Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Latency
        {
          title = "API Latency (P95)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_latencies\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_PERCENTILE_95"
                    crossSeriesReducer = "REDUCE_MAX"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Instance Count
        {
          title = "Cloud Run Instance Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/container/instance_count\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_MEAN"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.service_name"]
                  }
                }
              }
              plotType = "STACKED_AREA"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Firestore Operations
        {
          title = "Firestore Operations"
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"firestore_database\" AND metric.type = \"firestore.googleapis.com/document/read_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
                plotType   = "LINE"
                legendTemplate = "Reads"
              },
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type = \"firestore_database\" AND metric.type = \"firestore.googleapis.com/document/write_count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
                plotType   = "LINE"
                legendTemplate = "Writes"
              }
            ]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Pub/Sub Messages
        {
          title = "Pub/Sub Message Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"pubsub_topic\" AND metric.type = \"pubsub.googleapis.com/topic/send_message_operation_count\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.topic_id"]
                  }
                }
              }
              plotType = "STACKED_BAR"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Cloud Functions Executions
        {
          title = "Cloud Functions Executions"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_function\" AND metric.type = \"cloudfunctions.googleapis.com/function/execution_count\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["resource.label.function_name"]
                  }
                }
              }
              plotType = "STACKED_AREA"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        },
        # Cloud Functions Duration
        {
          title = "Cloud Functions Duration (P95)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_function\" AND metric.type = \"cloudfunctions.googleapis.com/function/execution_times\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_PERCENTILE_95"
                    crossSeriesReducer = "REDUCE_MAX"
                    groupByFields      = ["resource.label.function_name"]
                  }
                }
              }
              plotType = "LINE"
            }]
            yAxis = {
              scale = "LINEAR"
            }
          }
        }
      ]
    }
  })
}

# =====================================================
# LOG-BASED METRICS
# =====================================================

# Ride Request Metric
resource "google_logging_metric" "ride_requests" {
  name   = "jeeny-ride-requests-${var.environment}"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"ride_requested\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "vehicle_type"
      value_type  = "STRING"
      description = "Type of vehicle requested"
    }
  }

  label_extractors = {
    "vehicle_type" = "EXTRACT(jsonPayload.vehicleType)"
  }
}

# Payment Success Metric
resource "google_logging_metric" "payment_success" {
  name   = "jeeny-payment-success-${var.environment}"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"payment_completed\" AND jsonPayload.status=\"success\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "payment_method"
      value_type  = "STRING"
      description = "Payment method used"
    }
  }

  label_extractors = {
    "payment_method" = "EXTRACT(jsonPayload.paymentMethod)"
  }
}

# Driver Online Metric
resource "google_logging_metric" "drivers_online" {
  name   = "jeeny-drivers-online-${var.environment}"
  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"driver_status_changed\" AND jsonPayload.status=\"online\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}
