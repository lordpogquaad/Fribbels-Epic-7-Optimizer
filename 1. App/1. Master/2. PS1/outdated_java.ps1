# Lists newer versions of the backend's Maven dependencies and plugins (yarn outdated:java). Read-only:
# it updates nothing. Exits non-zero only when Maven itself cannot run. Same JDK and Maven as build_backend.ps1.
$ErrorActionPreference = "Stop"
$backendRoot = "$PSScriptRoot\..\..\3. Backend"
$mvnExe = "$backendRoot\2. Apache Maven\apache-maven-3.10.0\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-27"

if (!(Test-Path $env:JAVA_HOME)) { Write-Error "JAVA_HOME not found: $env:JAVA_HOME"; exit 1 }
if (!(Test-Path $mvnExe)) { Write-Error "Maven not found at $mvnExe - run build_backend.ps1 once to download it."; exit 1 }

Set-Location "$backendRoot\1. Source"
& $mvnExe versions:display-dependency-updates versions:display-plugin-updates
if ($LASTEXITCODE -ne 0) {
    Write-Error "Versions check failed (exit $LASTEXITCODE) - see output above."
    exit 1
}
