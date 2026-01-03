/**
 * Jeeny Infrastructure - Outputs
 *
 * Output values for the Jeeny GCP infrastructure.
 */

# Project Information
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "The deployment environment"
  value       = var.environment
}

# Network Outputs
output "vpc_network_name" {
  description = "The VPC network name"
  value       = module.network.vpc_network_name
}

output "vpc_connector_id" {
  description = "The VPC connector ID for serverless services"
  value       = module.network.vpc_connector_id
}

# Auth Outputs
output "firebase_project_id" {
  description = "The Firebase project ID"
  value       = module.auth.firebase_project_id
}

# Database Outputs
output "firestore_database" {
  description = "The Firestore database name"
  value       = module.database.firestore_database
}

# Storage Outputs
output "assets_bucket" {
  description = "The assets storage bucket name"
  value       = module.storage.bucket_names.assets
}

output "user_uploads_bucket" {
  description = "The user uploads storage bucket name"
  value       = module.storage.bucket_names.user_uploads
}

output "driver_documents_bucket" {
  description = "The driver documents storage bucket name"
  value       = module.storage.bucket_names.driver_documents
}

output "ride_media_bucket" {
  description = "The ride media storage bucket name"
  value       = module.storage.bucket_names.ride_media
}

output "cdn_url" {
  description = "The Cloud CDN URL for assets"
  value       = module.storage.cdn_url
}

# Pub/Sub Outputs
output "pubsub_topics" {
  description = "The Pub/Sub topic names"
  value       = module.pubsub.topic_names
}

# API Outputs
output "api_gateway_url" {
  description = "The API Gateway URL"
  value       = module.api.api_gateway_url
}

output "api_service_urls" {
  description = "The Cloud Run service URLs"
  value       = module.api.service_urls
}

output "artifact_registry_url" {
  description = "The Artifact Registry URL for container images"
  value       = module.api.artifact_registry_url
}

# Function Outputs
output "function_urls" {
  description = "The Cloud Function URLs"
  value       = module.functions.function_urls
}

output "functions_source_bucket" {
  description = "The storage bucket for function source code"
  value       = module.functions.functions_source_bucket
}

# Monitoring Outputs
output "monitoring_dashboard_id" {
  description = "The Cloud Monitoring dashboard ID"
  value       = module.monitoring.dashboard_id
}
