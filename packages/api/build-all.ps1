# Jeeny API - Build and Push All Docker Images
# Run from packages/api directory

$ErrorActionPreference = "Stop"

$PROJECT_ID = "jeeny-platforme"
$REGION = "europe-west1"
$REGISTRY = "$REGION-docker.pkg.dev/$PROJECT_ID/jeeny-api-dev"
$DOCKER = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

$services = @(
    "auth", "users", "rides", "drivers", "location", "payments",
    "notifications", "chat", "support", "promotions", "admin",
    "analytics", "contracts", "intercity", "cities", "pricing"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Jeeny API - Building All Docker Images" -ForegroundColor Cyan
Write-Host "Registry: $REGISTRY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$built = @()
$failed = @()

foreach ($service in $services) {
    Write-Host "`n>> Building $service..." -ForegroundColor Yellow
    
    $dockerfile = "Dockerfile.$service"
    $imageName = "$REGISTRY/${service}:latest"
    
    if (!(Test-Path $dockerfile)) {
        Write-Host "   SKIP: $dockerfile not found" -ForegroundColor Gray
        continue
    }
    
    # Build
    & $DOCKER build -t $imageName -f $dockerfile . 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $built += $service
        Write-Host "   OK: $service built" -ForegroundColor Green
    } else {
        $failed += $service
        Write-Host "   FAIL: $service" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Built: $($built.Count) | Failed: $($failed.Count)" -ForegroundColor Cyan
if ($failed.Count -gt 0) {
    Write-Host "Failed services: $($failed -join ', ')" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan

# Push all built images
Write-Host "`nPushing images to registry..." -ForegroundColor Yellow
foreach ($service in $built) {
    $imageName = "$REGISTRY/${service}:latest"
    Write-Host "   Pushing $service..."
    & $DOCKER push $imageName 2>&1 | Out-Null
}
Write-Host "Done!" -ForegroundColor Green
