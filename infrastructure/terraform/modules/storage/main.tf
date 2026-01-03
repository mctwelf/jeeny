/**
 * Jeeny Storage Module - Cloud Storage
 *
 * Creates Cloud Storage buckets for the Jeeny taxi booking platform.
 * Replaces AWS S3 buckets.
 */

locals {
  bucket_prefix = "jeeny-${var.project_id}-${var.environment}"
}

# Logs Bucket (for access logs)
resource "google_storage_bucket" "logs" {
  name          = "${local.bucket_prefix}-logs"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = false
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age = 60
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  labels = var.labels
}

# Assets Bucket (public via CDN)
resource "google_storage_bucket" "assets" {
  name          = "${local.bucket_prefix}-assets"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  # Allow public access for CDN
  public_access_prevention = "inherited"

  versioning {
    enabled = true
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  logging {
    log_bucket = google_storage_bucket.logs.name
    log_object_prefix = "assets-logs/"
  }

  labels = var.labels
}

# Make assets bucket publicly readable
resource "google_storage_bucket_iam_member" "assets_public" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# User Uploads Bucket (private)
resource "google_storage_bucket" "user_uploads" {
  name          = "${local.bucket_prefix}-user-uploads"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  cors {
    origin          = ["http://localhost:*", "https://*.jeeny.mr", "https://jeeny.mr"]
    method          = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age                        = 7
      with_state                 = "ANY"
      matches_prefix             = ["temp/"]
      days_since_noncurrent_time = 7
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 90
    }
    action {
      type = "Delete"
    }
  }

  logging {
    log_bucket        = google_storage_bucket.logs.name
    log_object_prefix = "user-uploads-logs/"
  }

  labels = var.labels
}

# Driver Documents Bucket (private, encrypted)
resource "google_storage_bucket" "driver_documents" {
  name          = "${local.bucket_prefix}-driver-documents"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  # Customer-managed encryption key (optional, uses Google-managed by default)
  # encryption {
  #   default_kms_key_name = google_kms_crypto_key.driver_docs.id
  # }

  cors {
    origin          = ["http://localhost:*", "https://*.jeeny.mr", "https://jeeny.mr"]
    method          = ["GET", "PUT", "POST", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      days_since_noncurrent_time = 365
    }
    action {
      type = "Delete"
    }
  }

  logging {
    log_bucket        = google_storage_bucket.logs.name
    log_object_prefix = "driver-documents-logs/"
  }

  labels = var.labels
}

# Ride Media Bucket (private)
resource "google_storage_bucket" "ride_media" {
  name          = "${local.bucket_prefix}-ride-media"
  location      = var.region
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = false
  }

  cors {
    origin          = ["http://localhost:*", "https://*.jeeny.mr", "https://jeeny.mr"]
    method          = ["GET", "PUT", "POST", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 730 # 2 years
    }
    action {
      type = "Delete"
    }
  }

  logging {
    log_bucket        = google_storage_bucket.logs.name
    log_object_prefix = "ride-media-logs/"
  }

  labels = var.labels
}

# Cloud CDN Backend Bucket for Assets
resource "google_compute_backend_bucket" "assets_cdn" {
  name        = "jeeny-assets-cdn-${var.environment}"
  bucket_name = google_storage_bucket.assets.name
  project     = var.project_id
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    client_ttl        = 3600
    negative_caching  = true
    serve_while_stale = 86400
  }
}

# URL Map for CDN
resource "google_compute_url_map" "assets_cdn" {
  name            = "jeeny-assets-cdn-url-map-${var.environment}"
  project         = var.project_id
  default_service = google_compute_backend_bucket.assets_cdn.id
}

# HTTPS Proxy (requires SSL certificate)
resource "google_compute_target_https_proxy" "assets_cdn" {
  count            = var.ssl_certificate != "" ? 1 : 0
  name             = "jeeny-assets-cdn-https-proxy-${var.environment}"
  project          = var.project_id
  url_map          = google_compute_url_map.assets_cdn.id
  ssl_certificates = [var.ssl_certificate]
}

# HTTP Proxy (for development)
resource "google_compute_target_http_proxy" "assets_cdn" {
  name    = "jeeny-assets-cdn-http-proxy-${var.environment}"
  project = var.project_id
  url_map = google_compute_url_map.assets_cdn.id
}

# Global Forwarding Rule (HTTP)
resource "google_compute_global_forwarding_rule" "assets_cdn_http" {
  name       = "jeeny-assets-cdn-http-${var.environment}"
  project    = var.project_id
  target     = google_compute_target_http_proxy.assets_cdn.id
  port_range = "80"
}

# Service Account for Storage Access
resource "google_service_account" "storage_access" {
  account_id   = "jeeny-storage-${var.environment}"
  display_name = "Jeeny Storage Access Service Account"
  project      = var.project_id
}

# Grant storage access to service account
resource "google_storage_bucket_iam_member" "user_uploads_access" {
  bucket = google_storage_bucket.user_uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}

resource "google_storage_bucket_iam_member" "driver_documents_access" {
  bucket = google_storage_bucket.driver_documents.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}

resource "google_storage_bucket_iam_member" "ride_media_access" {
  bucket = google_storage_bucket.ride_media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}

resource "google_storage_bucket_iam_member" "assets_access" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}
