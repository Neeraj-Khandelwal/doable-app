# Doable App — Android Release Build Script
# Run from project root: .\build-android.ps1

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

Write-Host "Step 1/4: Web build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Web build failed" -ForegroundColor Red; exit 1 }

Write-Host "Step 2/4: Capacitor sync..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "Cap sync failed" -ForegroundColor Red; exit 1 }

Write-Host "Step 3/4: Building release AAB..." -ForegroundColor Cyan
Set-Location android
.\gradlew bundleRelease
$result = $LASTEXITCODE
Set-Location ..
if ($result -ne 0) { Write-Host "Gradle build failed" -ForegroundColor Red; exit 1 }

Write-Host "Step 4/4: Building debug APK..." -ForegroundColor Cyan
Set-Location android
.\gradlew assembleDebug
$result = $LASTEXITCODE
Set-Location ..
if ($result -ne 0) { Write-Host "APK build failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "  Play Store AAB : android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "  Debug APK      : android\app\build\outputs\apk\debug\app-debug.apk"
