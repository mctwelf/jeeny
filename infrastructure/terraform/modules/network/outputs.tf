/**
 * Network Module - Outputs
 */

output "vpc_network_name" {
  description = "The VPC network name"
  value       = google_compute_network.main.name
}

output "vpc_network_id" {
  description = "The VPC network ID"
  value       = google_compute_network.main.id
}

output "vpc_network_self_link" {
  description = "The VPC network self link"
  value       = google_compute_network.main.self_link
}

output "public_subnet_name" {
  description = "The public subnet name"
  value       = google_compute_subnetwork.public.name
}

output "public_subnet_id" {
  description = "The public subnet ID"
  value       = google_compute_subnetwork.public.id
}

output "private_subnet_name" {
  description = "The private subnet name"
  value       = google_compute_subnetwork.private.name
}

output "private_subnet_id" {
  description = "The private subnet ID"
  value       = google_compute_subnetwork.private.id
}

output "vpc_connector_id" {
  description = "The VPC connector ID"
  value       = "" # VPC connector disabled due to GCP internal errors
}

output "vpc_connector_name" {
  description = "The VPC connector name"
  value       = "" # VPC connector disabled due to GCP internal errors
}
