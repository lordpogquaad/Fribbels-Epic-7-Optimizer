# Installs frontend runtime packages from 2. Frontend/1. Source/package.json
# into 2. Frontend/1. Source/node_modules/

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir      = Join-Path $scriptDir '..\..'
$sourceDir   = Join-Path $appDir '2. Frontend\1. Source'
$pkg         = Join-Path $sourceDir 'package.json'

if (!(Test-Path $pkg)) {
    Write-Error "Cannot find package.json at: $pkg"
    exit 1
}

try {
    Write-Host "Running npm install in 1. Source/ ..."
    Push-Location $sourceDir
    npm install --ignore-scripts --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "Frontend packages installed successfully."
} finally {
    Pop-Location
    # The manifest is canonical here now (no temp copy). Only the lockfile is transient.
    Write-Host "Removing transient package-lock.json ..."
    Remove-Item (Join-Path $sourceDir 'package-lock.json') -Force -ErrorAction SilentlyContinue
    # Remove electron if npm installed it as a peer dep — the binary lives in
    # 1. App/node_modules/electron, not here; a stub here breaks @electron/remote.
    $electronStub = Join-Path $sourceDir 'node_modules\electron'
    if (Test-Path $electronStub) {
        Remove-Item $electronStub -Recurse -Force
        Write-Host "Removed stray electron peer-dep from node_modules."
    }
}

# Refresh the installedTransitives snapshot in package.json (a documentation-only
# field that npm ignores) from the freshly installed node_modules, so it can't
# drift. Only reached on a successful install (the failure path exits in the try).
$regenScript = Join-Path $appDir '4. Both\2. Build\1. Scripts\regen-installed-transitives.js'
Write-Host "Regenerating installedTransitives snapshot ..."
node $regenScript
