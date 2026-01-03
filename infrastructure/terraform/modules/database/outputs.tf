/**
 * Database Module - Outputs
 */

output "firestore_database" {
  description = "The Firestore database name"
  value       = google_firestore_database.main.name
}

output "firestore_database_id" {
  description = "The Firestore database ID"
  value       = google_firestore_database.main.id
}
