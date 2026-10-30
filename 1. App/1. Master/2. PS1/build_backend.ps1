$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendRoot = "$root\..\..\3. Backend"
$mvnDir = "$backendRoot\2. Apache Maven"
$mvnZip = "$backendRoot\2. Apache Maven\apache-maven-3.10.0-bin.zip"
$mvnExe = "$mvnDir\apache-maven-3.10.0\bin\mvn.cmd"
# Junction the Oracle installer repoints at each 27.x patch, so patch updates need no edit here.
$env:JAVA_HOME = "C:\Program Files\Java\latest\jdk-27"

if (!(Test-Path $env:JAVA_HOME)) {
    Write-Error "JAVA_HOME not found: $env:JAVA_HOME`nInstall JDK 27 or update the path in this script (the portable JDK 25 fallback is F:\VSCode-Data\jdk\jdk-25.0.3+9, but pom.xml targets release 27)."
    exit 1
}

# Download Maven if not already present
if (!(Test-Path $mvnExe)) {
    Write-Host "Downloading Maven 3.10.0..."
    New-Item -ItemType Directory -Force -Path "$backendRoot\2. Apache Maven" | Out-Null
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.10.0/binaries/apache-maven-3.10.0-bin.zip" -OutFile $mvnZip
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $mvnZip -DestinationPath $mvnDir -Force
    Remove-Item $mvnZip
    Write-Host "Maven ready."
}
else {
    Write-Host "Maven already present."
}

# Build (runs the JUnit test suite as part of `package`; build fails if a test fails)
Write-Host "Building backend jar..."
Set-Location "$backendRoot\1. Source\3. XML"
& $mvnExe clean package
# Native (mvn.cmd) failures only auto-throw under PS 7.3+ ($PSNativeCommandUseErrorActionPreference);
# this explicit check makes a failed build/test halt with a non-zero exit on every PowerShell version.
if ($LASTEXITCODE -ne 0) {
    Write-Error "Maven build failed (exit $LASTEXITCODE) - see output above. backend.jar NOT updated."
    exit 1
}

# Copy jar
$builtJar = "$backendRoot\1. Source\target\backend-1.0.2-jar-with-dependencies.jar"
$destJar = "$root\..\3. Jar\backend.jar"
if (Test-Path $builtJar) {
    Copy-Item $builtJar $destJar -Force
    Write-Host "SUCCESS: backend.jar updated at $destJar"
}
else {
    Write-Host "ERROR: built jar not found at $builtJar"
    Get-ChildItem "$backendRoot\1. Source\target\*.jar"
}
