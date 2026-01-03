/**
 * Jeeny API Module - Variables
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

variable "vpc_connector" {
  description = "VPC Connector ID for Cloud Run (optional)"
  type        = string
  default     = ""
}

variable "firestore_database" {
  description = "Firestore database name"
  type        = string
}

variable "storage_buckets" {
  description = "Map of storage bucket names"
  type        = map(string)
  default     = {}
}

variable "pubsub_topics" {
  description = "Map of Pub/Sub topic names"
  type        = map(string)
  default     = {}
}
