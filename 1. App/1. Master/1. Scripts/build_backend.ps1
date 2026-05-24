$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendRoot = "$root\..\..\3. Backend"
$mvnDir = "$backendRoot\2. Maven"
$mvnZip = "$backendRoot\2. Maven\apache-maven-3.8.8-bin.zip"
$mvnExe = "$mvnDir\apache-maven-3.8.8\bin\mvn.cmd"
$env:JAVA_HOME = "C:\Users\Marcus\.vscode\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"

# Download Maven if not already present
if (!(Test-Path $mvnExe)) {
    Write-Host "Downloading Maven 3.8.8..."
    New-Item -ItemType Directory -Force -Path "$backendRoot\2. Maven" | Out-Null
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.8.8/binaries/apache-maven-3.8.8-bin.zip" -OutFile $mvnZip
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $mvnZip -DestinationPath $mvnDir -Force
    Remove-Item $mvnZip
    Write-Host "Maven ready."
}
else {
    Write-Host "Maven already present."
}

# Build
Write-Host "Building backend jar..."
Set-Location "$backendRoot\1. Source"
& $mvnExe clean package -DskipTests

# Copy jar
$builtJar = "$backendRoot\1. Source\target\backend-1.0-jar-with-dependencies.jar"
$destJar = "$root\..\2. Data\jar\backend.jar"
if (Test-Path $builtJar) {
    Copy-Item $builtJar $destJar -Force
    Write-Host "SUCCESS: backend.jar updated at $destJar"
}
else {
    Write-Host "ERROR: built jar not found at $builtJar"
    Get-ChildItem "$backendRoot\1. Source\target\*.jar"
}
