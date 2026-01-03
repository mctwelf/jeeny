/**
 * Database Module - Variables
 */

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "environment" {
  description = "The deployment environment"
  type        = string
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}

variable "firestore_location" {
  description = "The Firestore database location"
  type        = string
  default     = "eur3" # Europe multi-region
}
