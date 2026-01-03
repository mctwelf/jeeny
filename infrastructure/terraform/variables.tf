/**
 * Jeeny Infrastructure - Variables
 *
 * Input variables for the Jeeny GCP infrastructure.
 */

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "europe-west1"
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "domain" {
  description = "The domain name for the application"
  type        = string
  default     = "jeeny.mr"
}

# API Configuration
variable "api_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "api_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 100
}

variable "api_memory" {
  description = "Memory allocation for Cloud Run instances"
  type        = string
  default     = "512Mi"
}

variable "api_cpu" {
  description = "CPU allocation for Cloud Run instances"
  type        = string
  default     = "1"
}

variable "api_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 60
}

variable "api_concurrency" {
  description = "Maximum concurrent requests per instance"
  type        = number
  default     = 80
}

# Function Configuration
variable "function_memory" {
  description = "Memory allocation for Cloud Functions"
  type        = string
  default     = "512Mi"
}

variable "function_timeout" {
  description = "Function timeout in seconds"
  type        = number
  default     = 60
}

variable "function_max_instances" {
  description = "Maximum number of function instances"
  type        = number
  default     = 100
}

# Google Maps API Key (sensitive)
variable "google_maps_api_key" {
  description = "Google Maps Platform API key"
  type        = string
  sensitive   = true
}

# SMS Provider Configuration
variable "twilio_account_sid" {
  description = "Twilio Account SID for SMS"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token for SMS"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_phone_number" {
  description = "Twilio phone number for sending SMS"
  type        = string
  default     = ""
}

# Email Provider Configuration
variable "sendgrid_api_key" {
  description = "SendGrid API key for email"
  type        = string
  sensitive   = true
  default     = ""
}

variable "email_from_address" {
  description = "From address for emails"
  type        = string
  default     = "noreply@jeeny.mr"
}

# Alert Configuration
variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "alert_slack_webhook" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
  default     = ""
}
