# JaCoCo coverage run over the backend tests (yarn coverage:java). No coverage gate: exits non-zero only
# when Maven itself fails (including a failing test). Uses the same JDK and Maven as build_backend.ps1;
# the coverage profile lives in the backend pom.xml, so the normal build never loads the agent.
# Report: 3. Backend/1. Source/target/site/jacoco/index.html (+ jacoco.csv, target/jacoco.exec)
$ErrorActionPreference = "Stop"
$backendRoot = "$PSScriptRoot\..\..\3. Backend"
$mvnExe = "$backendRoot\2. Apache Maven\apache-maven-3.10.0\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-27"

if (!(Test-Path $env:JAVA_HOME)) { Write-Error "JAVA_HOME not found: $env:JAVA_HOME"; exit 1 }
if (!(Test-Path $mvnExe)) { Write-Error "Maven not found at $mvnExe - run build_backend.ps1 once to download it."; exit 1 }

Set-Location "$backendRoot\1. Source"
& $mvnExe -Pcoverage test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Coverage run failed (exit $LASTEXITCODE) - see output above."
    exit 1
}
Write-Host "Coverage report: $((Get-Location).Path)\target\site\jacoco\index.html"
