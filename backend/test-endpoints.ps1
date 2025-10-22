# Script de prueba automática de endpoints
# Ejecutar con: powershell .\test-endpoints.ps1

Write-Host "🧪 INICIANDO PRUEBAS DE ENDPOINTS" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1️⃣ Probando Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -Method GET
    Write-Host "✅ PASADO - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ FALLÓ - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Obtener Roles
Write-Host "`n2️⃣ Probando obtener roles..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/users/roles" -Method GET
    $content = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASADO - Roles encontrados: $($content.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ FALLÓ - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Validar Email
Write-Host "`n3️⃣ Probando validar email..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/users/validate-email" -Method POST -Body '{"email": "test@workshop.com"}' -ContentType "application/json"
    Write-Host "✅ PASADO - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ FALLÓ - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Registrar Usuario
Write-Host "`n4️⃣ Probando registrar usuario..." -ForegroundColor Yellow
try {
    $body = @{
        nombre_completo = "Usuario Test"
        correo = "usuario.test.$(Get-Date -Format 'yyyyMMddHHmmss')@workshop.com"
        telefono = "555-TEST"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register-user-info" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ PASADO - Usuario registrado" -ForegroundColor Green
} catch {
    Write-Host "❌ FALLÓ - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green