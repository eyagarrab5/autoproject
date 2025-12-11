@echo off
title AutoProject - Car Rental Microservices
color 0A

echo ============================================
echo   AutoProject - Car Rental Microservices
echo   Starting all services...
echo ============================================
echo.

:: Check if MongoDB is running
echo [INFO] Make sure MongoDB is running on localhost:27017
echo.

:: Set the base path
set BASE_PATH=%~dp0

:: Start Discovery Service (Port 4000)
echo [1/5] Starting Discovery Service on port 4000...
start "Discovery Service - Port 4000" cmd /k "cd /d %BASE_PATH%services\discovery && npm install && npm start"
timeout /t 3 /nobreak > nul

:: Start Gateway (Port 5000)
echo [2/5] Starting Gateway on port 5000...
start "Gateway - Port 5000" cmd /k "cd /d %BASE_PATH%services\gateway && npm install && npm start"
timeout /t 3 /nobreak > nul

:: Start Auth Service (Port 3001)
echo [3/5] Starting Auth Service on port 3001...
start "Auth Service - Port 3001" cmd /k "cd /d %BASE_PATH%services\auth && npm install && npm start"
timeout /t 3 /nobreak > nul

:: Start Cars Service (Port 3002)
echo [4/5] Starting Cars Service on port 3002...
start "Cars Service - Port 3002" cmd /k "cd /d %BASE_PATH%services\cars && npm install && npm start"
timeout /t 3 /nobreak > nul

:: Start Payment Service (Port 3003)
echo [5/5] Starting Payment Service on port 3003...
start "Payment Service - Port 3003" cmd /k "cd /d %BASE_PATH%services\payment && npm install && npm start"
timeout /t 3 /nobreak > nul

:: Start Reservation Service (Port 3004)
echo [6/6] Starting Reservation Service on port 3004...
start "Reservation Service - Port 3004" cmd /k "cd /d %BASE_PATH%services\reservation && npm install && npm start"
timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo   All services are starting!
echo ============================================
echo.
echo   Service URLs:
echo   - Discovery:   http://localhost:4000
echo   - Gateway:     http://localhost:5000
echo   - Auth:        http://localhost:3001
echo   - Cars:        http://localhost:3002
echo   - Payment:     http://localhost:3003
echo   - Reservation: http://localhost:3004
echo.
echo   Gateway Routes (use these in Postman):
echo   - /auth-service/*        -> Auth Service
echo   - /cars-service/*        -> Cars Service
echo   - /payment-service/*     -> Payment Service
echo   - /reservation-service/* -> Reservation Service
echo.
echo   Press any key to close this window...
echo   (Services will continue running in their own windows)
echo ============================================
pause > nul
