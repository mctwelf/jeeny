# Jeeny Infrastructure - Variables
# GCP Project Configuration

project_id = "jeeny-platforme"

# Region - europe-west1 is closest to Mauritania
region      = "europe-west1"
environment = "dev"
domain      = "jeeny.mr"

# API Configuration
api_min_instances = 0
api_max_instances = 10
api_memory        = "512Mi"
api_cpu           = "1"
api_timeout       = 60
api_concurrency   = 80

# Function Configuration
function_memory        = "512Mi"
function_timeout       = 60
function_max_instances = 10

# Google Maps API Key - will be set via environment variable or secret
google_maps_api_key = ""

# SMS Provider (Twilio) - configure later
twilio_account_sid  = ""
twilio_auth_token   = ""
twilio_phone_number = ""

# Email Provider (SendGrid) - configure later
sendgrid_api_key   = ""
email_from_address = "noreply@jeeny.mr"

# Alerting
alert_email         = ""
alert_slack_webhook = ""
