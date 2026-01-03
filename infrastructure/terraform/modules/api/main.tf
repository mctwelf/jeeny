/**
 * Jeeny API Module - Cloud Run Services
 *
 * Creates Cloud Run services for the REST API.
 * Replaces AWS API Gateway + Lambda.
 */

# Artifact Registry for container images
resource "google_artifact_registry_repository" "api" {
  location      = var.region
  repository_id = "jeeny-api-${var.environment}"
  description   = "Jeeny API container images"
  format        = "DOCKER"
  labels        = var.labels
}

# Service Account for Cloud Run services
resource "google_service_account" "api" {
  account_id   = "jeeny-api-${var.environment}"
  display_name = "Jeeny API Service Account"
  project      = var.project_id
}

# Grant Firestore access
resource "google_project_iam_member" "api_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Storage access
resource "google_project_iam_member" "api_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Pub/Sub access
resource "google_project_iam_member" "api_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Secret Manager access
resource "google_project_iam_member" "api_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant Firebase Auth access
resource "google_project_iam_member" "api_firebase" {
  project = var.project_id
  role    = "roles/firebase.sdkAdminServiceAgent"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Common environment variables for all services
locals {
  common_env_vars = {
    GCP_PROJECT_ID     = var.project_id
    GCP_REGION         = var.region
    ENVIRONMENT        = var.environment
    FIRESTORE_DATABASE = var.firestore_database
  }
}


# =====================================================
# CLOUD RUN SERVICES
# =====================================================

# Auth Service
resource "google_cloud_run_v2_service" "auth" {
  name     = "jeeny-auth-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/auth:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Users Service
resource "google_cloud_run_v2_service" "users" {
  name     = "jeeny-users-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/users:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Rides Service
resource "google_cloud_run_v2_service" "rides" {
  name     = "jeeny-rides-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email
    timeout         = "60s"

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 2 : 0
      max_instance_count = var.environment == "prod" ? 20 : 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/rides:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Drivers Service
resource "google_cloud_run_v2_service" "drivers" {
  name     = "jeeny-drivers-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/drivers:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Location Service
resource "google_cloud_run_v2_service" "location" {
  name     = "jeeny-location-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 15 : 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/location:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      env {
        name  = "GOOGLE_MAPS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "google-maps-api-key"
            version = "latest"
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}


# Payments Service
resource "google_cloud_run_v2_service" "payments" {
  name     = "jeeny-payments-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/payments:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Notifications Service
resource "google_cloud_run_v2_service" "notifications" {
  name     = "jeeny-notifications-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/notifications:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Chat Service
resource "google_cloud_run_v2_service" "chat" {
  name     = "jeeny-chat-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/chat:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Support Service
resource "google_cloud_run_v2_service" "support" {
  name     = "jeeny-support-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/support:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Promotions Service
resource "google_cloud_run_v2_service" "promotions" {
  name     = "jeeny-promotions-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/promotions:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Admin Service
resource "google_cloud_run_v2_service" "admin" {
  name     = "jeeny-admin-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/admin:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Analytics Service
resource "google_cloud_run_v2_service" "analytics" {
  name     = "jeeny-analytics-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/analytics:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Contracts Service
resource "google_cloud_run_v2_service" "contracts" {
  name     = "jeeny-contracts-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/contracts:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Intercity Service
resource "google_cloud_run_v2_service" "intercity" {
  name     = "jeeny-intercity-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/intercity:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Cities Service
resource "google_cloud_run_v2_service" "cities" {
  name     = "jeeny-cities-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 3 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/cities:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Pricing Service
resource "google_cloud_run_v2_service" "pricing" {
  name     = "jeeny-pricing-${var.environment}"
  location = var.region
  labels   = var.labels

  template {
    service_account = google_service_account.api.email

    dynamic "vpc_access" {
      for_each = var.vpc_connector != "" ? [1] : []
      content {
        connector = var.vpc_connector
        egress    = "PRIVATE_RANGES_ONLY"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 5 : 2
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}/pricing:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.common_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}


# =====================================================
# API GATEWAY (Cloud Endpoints / API Gateway)
# =====================================================

# API Gateway API
resource "google_api_gateway_api" "main" {
  provider = google-beta
  api_id   = "jeeny-api-${var.environment}"
  project  = var.project_id
  labels   = var.labels
}

# API Gateway Config
resource "google_api_gateway_api_config" "main" {
  provider      = google-beta
  api           = google_api_gateway_api.main.api_id
  api_config_id = "jeeny-api-config-${var.environment}"
  project       = var.project_id

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi.yaml.tpl", {
        project_id  = var.project_id
        region      = var.region
        environment = var.environment
        auth_url    = google_cloud_run_v2_service.auth.uri
        users_url   = google_cloud_run_v2_service.users.uri
        rides_url   = google_cloud_run_v2_service.rides.uri
        drivers_url = google_cloud_run_v2_service.drivers.uri
        location_url = google_cloud_run_v2_service.location.uri
        payments_url = google_cloud_run_v2_service.payments.uri
        notifications_url = google_cloud_run_v2_service.notifications.uri
        chat_url    = google_cloud_run_v2_service.chat.uri
        support_url = google_cloud_run_v2_service.support.uri
        promotions_url = google_cloud_run_v2_service.promotions.uri
        admin_url   = google_cloud_run_v2_service.admin.uri
        analytics_url = google_cloud_run_v2_service.analytics.uri
        contracts_url = google_cloud_run_v2_service.contracts.uri
        intercity_url = google_cloud_run_v2_service.intercity.uri
        cities_url  = google_cloud_run_v2_service.cities.uri
        pricing_url = google_cloud_run_v2_service.pricing.uri
      }))
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.api.email
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway
resource "google_api_gateway_gateway" "main" {
  provider   = google-beta
  api_config = google_api_gateway_api_config.main.id
  gateway_id = "jeeny-gateway-${var.environment}"
  project    = var.project_id
  region     = var.region
  labels     = var.labels
}

# =====================================================
# IAM - Allow unauthenticated access to API Gateway
# =====================================================

# Allow public access to auth service (for login/register)
resource "google_cloud_run_v2_service_iam_member" "auth_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.auth.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow API Gateway service account to invoke all services
resource "google_cloud_run_v2_service_iam_member" "users_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.users.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "rides_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.rides.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "drivers_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.drivers.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "location_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.location.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "payments_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.payments.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "notifications_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.notifications.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "chat_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.chat.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "support_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.support.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "promotions_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.promotions.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "admin_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.admin.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "analytics_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.analytics.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "contracts_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.contracts.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "intercity_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.intercity.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "cities_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.cities.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_service_iam_member" "pricing_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.pricing.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}
