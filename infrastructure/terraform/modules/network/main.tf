/**
 * Jeeny Network Module - VPC and Networking
 *
 * Creates VPC network, subnets, firewall rules, and VPC connector
 * for the Jeeny taxi booking platform on GCP.
 */

# VPC Network
resource "google_compute_network" "main" {
  name                    = "jeeny-vpc-${var.environment}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  project                 = var.project_id
}

# Public Subnet
resource "google_compute_subnetwork" "public" {
  name          = "jeeny-public-${var.environment}"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  project       = var.project_id

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Private Subnet
resource "google_compute_subnetwork" "private" {
  name          = "jeeny-private-${var.environment}"
  ip_cidr_range = "10.0.2.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  project       = var.project_id

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Serverless VPC Connector Subnet
resource "google_compute_subnetwork" "serverless" {
  name          = "jeeny-serverless-${var.environment}"
  ip_cidr_range = "10.0.3.0/28"
  region        = var.region
  network       = google_compute_network.main.id
  project       = var.project_id

  private_ip_google_access = true
}

# VPC Connector for Cloud Run and Cloud Functions
# NOTE: Commented out due to internal GCP errors - create manually if needed
# resource "google_vpc_access_connector" "connector" {
#   name          = "jeeny-connector-${var.environment}"
#   region        = var.region
#   project       = var.project_id
#   
#   subnet {
#     name = google_compute_subnetwork.serverless.name
#   }
#
#   min_instances = 2
#   max_instances = 10
#
#   machine_type = "e2-micro"
# }

# Cloud NAT for outbound internet access
resource "google_compute_router" "router" {
  name    = "jeeny-router-${var.environment}"
  region  = var.region
  network = google_compute_network.main.id
  project = var.project_id
}

resource "google_compute_router_nat" "nat" {
  name                               = "jeeny-nat-${var.environment}"
  router                             = google_compute_router.router.name
  region                             = var.region
  project                            = var.project_id
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall Rules

# Allow internal traffic
resource "google_compute_firewall" "allow_internal" {
  name    = "jeeny-allow-internal-${var.environment}"
  network = google_compute_network.main.name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
  priority      = 1000
}

# Allow health checks from GCP load balancers
resource "google_compute_firewall" "allow_health_checks" {
  name    = "jeeny-allow-health-checks-${var.environment}"
  network = google_compute_network.main.name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = [
    "35.191.0.0/16",   # GCP health check ranges
    "130.211.0.0/22",
  ]
  priority = 1000
}

# Allow SSH from IAP (Identity-Aware Proxy)
resource "google_compute_firewall" "allow_iap_ssh" {
  name    = "jeeny-allow-iap-ssh-${var.environment}"
  network = google_compute_network.main.name
  project = var.project_id

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"] # IAP range
  priority      = 1000
}

# Deny all other ingress (default deny)
resource "google_compute_firewall" "deny_all_ingress" {
  name    = "jeeny-deny-all-ingress-${var.environment}"
  network = google_compute_network.main.name
  project = var.project_id

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 65534
}

# Private Service Connection for managed services
resource "google_compute_global_address" "private_ip_range" {
  name          = "jeeny-private-ip-range-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
  project       = var.project_id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}
