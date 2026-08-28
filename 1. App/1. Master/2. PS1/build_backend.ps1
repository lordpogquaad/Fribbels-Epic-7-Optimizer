$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendRoot = "$root\..\..\3. Backend"
$mvnDir = "$backendRoot\2. Apache Maven"
$mvnZip = "$backendRoot\2. Apache Maven\apache-maven-3.9.16-bin.zip"
$mvnExe = "$mvnDir\apache-maven-3.9.16\bin\mvn.cmd"
$env:JAVA_HOME = "F:\VSCode-Data\jdk\jdk-25.0.3+9"

if (!(Test-Path $env:JAVA_HOME)) {
    Write-Error "JAVA_HOME not found: $env:JAVA_HOME`nUpdate the path in this script if the portable JDK 25 was moved or upgraded (look under F:\VSCode-Data\jdk\jdk-25*)."
    exit 1
}

# Download Maven if not already present
if (!(Test-Path $mvnExe)) {
    Write-Host "Downloading Maven 3.9.16..."
    New-Item -ItemType Directory -Force -Path "$backendRoot\2. Apache Maven" | Out-Null
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip" -OutFile $mvnZip
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
