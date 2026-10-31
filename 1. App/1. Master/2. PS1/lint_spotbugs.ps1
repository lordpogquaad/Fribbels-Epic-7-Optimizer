# Report-only SpotBugs run over the backend (yarn lint:spotbugs). Never fails on findings; exits non-zero
# only when Maven itself cannot run. Uses the same JDK and Maven as build_backend.ps1; the plugin lives in
# the backend pom.xml with failOnError=false. Report: 3. Backend/1. Source/target/spotbugsXml.xml
$ErrorActionPreference = "Stop"
$backendRoot = "$PSScriptRoot\..\..\3. Backend"
$mvnExe = "$backendRoot\2. Apache Maven\apache-maven-3.10.0\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-27"

if (!(Test-Path $env:JAVA_HOME)) { Write-Error "JAVA_HOME not found: $env:JAVA_HOME"; exit 1 }
if (!(Test-Path $mvnExe)) { Write-Error "Maven not found at $mvnExe - run build_backend.ps1 once to download it."; exit 1 }

Set-Location "$backendRoot\1. Source"
& $mvnExe compile spotbugs:spotbugs
if ($LASTEXITCODE -ne 0) {
    Write-Error "SpotBugs run failed (exit $LASTEXITCODE) - see output above."
    exit 1
}
Write-Host "SpotBugs report: $((Get-Location).Path)\target\spotbugsXml.xml"
