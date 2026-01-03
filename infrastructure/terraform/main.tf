/**
 * Jeeny Infrastructure - Main Terraform Configuration
 *
 * This is the main entry point for the Jeeny GCP infrastructure.
 * It creates all the necessary GCP resources for the taxi booking platform.
 *
 * GCP Project: jeeny-taxi-platform
 * Region: europe-west1 (closest to Mauritania)
 */

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "jeeny-terraform-state"
    prefix = "terraform/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "pubsub.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudtrace.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
    "fcm.googleapis.com",
    "maps-backend.googleapis.com",
    "places-backend.googleapis.com",
    "routes.googleapis.com",
    "geocoding-backend.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "eventarc.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# Local variables
locals {
  app_name    = "jeeny"
  environment = var.environment
  
  common_labels = {
    project     = "jeeny"
    environment = var.environment
    managed_by  = "terraform"
    application = "taxi-booking"
  }
}

# VPC Network Module
module "network" {
  source = "./modules/network"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  depends_on = [google_project_service.apis]
}

# Firebase/Auth Module
module "auth" {
  source = "./modules/auth"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  depends_on = [google_project_service.apis]
}

# Firestore Database Module
module "database" {
  source = "./modules/database"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  depends_on = [google_project_service.apis]
}

# Cloud Storage Module
module "storage" {
  source = "./modules/storage"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  depends_on = [google_project_service.apis]
}

# Pub/Sub Module
module "pubsub" {
  source = "./modules/pubsub"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  depends_on = [google_project_service.apis]
}

# Cloud Run API Module
module "api" {
  source = "./modules/api"

  project_id     = var.project_id
  region         = var.region
  environment    = var.environment
  labels         = local.common_labels
  vpc_connector  = module.network.vpc_connector_id
  
  # Service dependencies
  firestore_database = module.database.firestore_database
  storage_buckets    = module.storage.bucket_names
  pubsub_topics      = module.pubsub.topic_names

  depends_on = [
    google_project_service.apis,
    module.network,
    module.auth,
    module.database,
    module.storage,
    module.pubsub,
  ]
}

# Cloud Functions Module
module "functions" {
  source = "./modules/functions"

  project_id     = var.project_id
  region         = var.region
  environment    = var.environment
  labels         = local.common_labels
  vpc_connector  = module.network.vpc_connector_id
  
  # Service dependencies
  firestore_database = module.database.firestore_database
  storage_buckets    = module.storage.bucket_names
  pubsub_topics      = module.pubsub.topic_names

  depends_on = [
    google_project_service.apis,
    module.network,
    module.database,
    module.storage,
    module.pubsub,
  ]
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  labels      = local.common_labels

  # Services to monitor
  cloud_run_services = module.api.service_names
  cloud_functions    = module.functions.function_names

  # Alert configuration
  alert_email       = var.alert_email
  slack_webhook_url = var.alert_slack_webhook
  api_gateway_host  = replace(module.api.api_gateway_url, "https://", "")

  depends_on = [
    module.api,
    module.functions,
  ]
}
