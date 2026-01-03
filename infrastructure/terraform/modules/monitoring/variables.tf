/**
 * Jeeny Monitoring Module - Variables
 */

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "labels" {
  description = "Common labels for resources"
  type        = map(string)
  default     = {}
}

variable "cloud_run_services" {
  description = "Map of Cloud Run service names to monitor"
  type        = map(string)
  default     = {}
}

variable "cloud_functions" {
  description = "Map of Cloud Function names to monitor"
  type        = map(string)
  default     = {}
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  default     = "ops@jeeny.app"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_gateway_host" {
  description = "API Gateway hostname for uptime checks"
  type        = string
  default     = ""
}
