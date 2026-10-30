# Report-only PMD run over the backend (yarn lint:java). Never fails on findings; exits non-zero only
# when Maven itself cannot run. Uses the same JDK and Maven as build_backend.ps1; the plugin and the
# ruleset live in the backend pom.xml and pmd-ruleset.xml. Report: 3. Backend/1. Source/target/pmd.xml
$ErrorActionPreference = "Stop"
$backendRoot = "$PSScriptRoot\..\..\3. Backend"
$mvnExe = "$backendRoot\2. Apache Maven\apache-maven-3.10.0\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-27"

if (!(Test-Path $env:JAVA_HOME)) { Write-Error "JAVA_HOME not found: $env:JAVA_HOME"; exit 1 }
if (!(Test-Path $mvnExe)) { Write-Error "Maven not found at $mvnExe - run build_backend.ps1 once to download it."; exit 1 }

Set-Location "$backendRoot\1. Source"
& $mvnExe pmd:pmd pmd:check
if ($LASTEXITCODE -ne 0) {
    Write-Error "PMD run failed (exit $LASTEXITCODE) - see output above."
    exit 1
}
