/**
 * Jeeny Auth Module - Variables
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

variable "authorized_domains" {
  description = "List of authorized domains for Firebase Auth"
  type        = list(string)
  default     = []
}

variable "test_phone_numbers" {
  description = "Test phone numbers for development (phone -> OTP code)"
  type        = map(string)
  default     = {}
}
