# Development setup script for Fanaka Loans (Windows)
# Run: powershell -ExecutionPolicy Bypass -File dev.ps1

Write-Host "================================" -ForegroundColor Blue
Write-Host "Fanaka Loans Development Setup" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
  Write-Host "Warning: .env.local not found!" -ForegroundColor Yellow
  Write-Host "Please create .env.local with PayHero credentials:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "VITE_PAYHERO_BASE_URL=https://backend.payhero.co.ke"
  Write-Host "VITE_PAYHERO_ACCOUNT_ID=3278"
  Write-Host "VITE_PAYHERO_CHANNEL_ID=3838"
  Write-Host "VITE_PAYHERO_AUTH_TOKEN=Basic ..."
  Write-Host "VITE_PAYHERO_CALLBACK_URL=http://localhost:8080/api/payment-callback"
  Write-Host ""
}

# Install server dependencies if needed
if (-not (Test-Path "server/node_modules")) {
  Write-Host "Installing server dependencies..." -ForegroundColor Yellow
  Set-Location server
  npm install
  Set-Location ..
}

Write-Host "Starting backend server (port 4100)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "node" -ArgumentList "server/payhero-example.js" -NoNewWindow -PassThru

Start-Sleep -Seconds 2

Write-Host "Starting frontend development server (port 8080)..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow -PassThru

Write-Host ""
Write-Host "✓ Both servers are running!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:8080" -ForegroundColor Blue
Write-Host "Backend:   http://localhost:4100" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Wait for both processes
$backendProcess.WaitForExit()
$frontendProcess.WaitForExit()
