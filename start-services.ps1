# Start all microservices locally
# Make sure MongoDB is running locally on port 27017

Write-Host "Starting Car Rental Microservices..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "development"
$env:JWT_SECRET = "your_jwt_secret_key_change_this_in_production"
$env:JWT_EXPIRE = "7d"
$env:MONGODB_URI = "mongodb://localhost:27017"

# Discovery Service
Write-Host "`nStarting Discovery Service on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\discovery'; npm install; npm start"

Start-Sleep -Seconds 3

# Auth Service
Write-Host "Starting Auth Service on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\auth'; `$env:PORT=3001; `$env:MONGODB_URI='mongodb://localhost:27017/userdb'; `$env:JWT_SECRET='your_jwt_secret_key_change_this_in_production'; `$env:JWT_EXPIRE='7d'; `$env:DISCOVERY_URL='http://localhost:3000'; `$env:SERVICE_HOST='localhost'; npm install; npm start"

Start-Sleep -Seconds 2

# Cars Service
Write-Host "Starting Cars Service on port 3002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\cars'; `$env:PORT=3002; `$env:MONGODB_URI='mongodb://localhost:27017/carsdb'; `$env:JWT_SECRET='your_jwt_secret_key_change_this_in_production'; `$env:DISCOVERY_URL='http://localhost:3000'; `$env:SERVICE_HOST='localhost'; `$env:AUTH_SERVICE_URL='http://localhost:3001'; npm install; npm start"

Start-Sleep -Seconds 2

# Payment Service
Write-Host "Starting Payment Service on port 3003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\payment'; `$env:PORT=3003; `$env:MONGODB_URI='mongodb://localhost:27017/paymentdb'; `$env:JWT_SECRET='your_jwt_secret_key_change_this_in_production'; `$env:DISCOVERY_URL='http://localhost:3000'; `$env:SERVICE_HOST='localhost'; `$env:AUTH_SERVICE_URL='http://localhost:3001'; npm install; npm start"

Start-Sleep -Seconds 2

# Reservation Service
Write-Host "Starting Reservation Service on port 3004..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\reservation'; `$env:PORT=3004; `$env:MONGODB_URI='mongodb://localhost:27017/reservationdb'; `$env:JWT_SECRET='your_jwt_secret_key_change_this_in_production'; `$env:DISCOVERY_URL='http://localhost:3000'; `$env:SERVICE_HOST='localhost'; `$env:AUTH_SERVICE_URL='http://localhost:3001'; `$env:CARS_SERVICE_URL='http://localhost:3002'; npm install; npm start"

Start-Sleep -Seconds 2

# Gateway Service
Write-Host "Starting Gateway Service on port 8081..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\services\gateway'; `$env:PORT=8081; `$env:DISCOVERY_URL='http://localhost:3000'; npm install; npm start"

Write-Host "`n✅ All services starting!" -ForegroundColor Green
Write-Host "`nService URLs:" -ForegroundColor Cyan
Write-Host "  Discovery: http://localhost:3000"
Write-Host "  Auth:      http://localhost:3001"
Write-Host "  Cars:      http://localhost:3002"
Write-Host "  Payment:   http://localhost:3003"
Write-Host "  Reservation: http://localhost:3004"
Write-Host "  Gateway:   http://localhost:8081"
Write-Host "`nUse Gateway (http://localhost:8081) for all API requests" -ForegroundColor Magenta
