# Jeeny API - Build and Push Docker Images
# Run from packages/api directory

$ErrorActionPreference = "Stop"

$PROJECT_ID = "jeeny-platforme"
$REGION = "europe-west1"
$REGISTRY = "$REGION-docker.pkg.dev/$PROJECT_ID/jeeny-api-dev"
$DOCKER = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

$services = @(
    "auth",
    "users", 
    "rides",
    "drivers",
    "location",
    "payments",
    "notifications",
    "chat",
    "support",
    "promotions",
    "admin",
    "analytics",
    "contracts",
    "intercity",
    "cities",
    "pricing"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Jeeny API - Building Docker Images" -ForegroundColor Cyan
Write-Host "Registry: $REGISTRY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($service in $services) {
    Write-Host "`n>> Building $service service..." -ForegroundColor Yellow
    
    $dockerfile = "Dockerfile.$service"
    $imageName = "$REGISTRY/$service`:latest"
    
    if (!(Test-Path $dockerfile)) {
        Write-Host "   ERROR: $dockerfile not found!" -ForegroundColor Red
        continue
    }
    
    # Build
    Write-Host "   Building image: $imageName"
    & $DOCKER build -t $imageName -f $dockerfile .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERROR: Build failed for $service" -ForegroundColor Red
        exit 1
    }
    
    # Push
    Write-Host "   Pushing to registry..."
    & $DOCKER push $imageName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ERROR: Push failed for $service" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   SUCCESS: $service built and pushed" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All images built and pushed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
