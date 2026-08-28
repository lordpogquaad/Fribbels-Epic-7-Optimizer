[CmdletBinding()]
param(
    [string]$Timestamp,
    [switch]$Latest,
    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$instructionsArchiveRoot = Join-Path $repoRoot '.github\_archive\instructions'
$chatmodesArchiveRoot = Join-Path $repoRoot '.github\_archive\chatmodes'
$legacyInstructionsArchiveRoot = Join-Path $repoRoot '.github\instructions\_archive'
$legacyChatmodesArchiveRoot = Join-Path $repoRoot '.github\chatmodes\_archive'
$instructionsDir = Join-Path $repoRoot '.github\instructions'
$chatmodesDir = Join-Path $repoRoot '.github\chatmodes'

if (-not (Test-Path $instructionsArchiveRoot) -and -not (Test-Path $chatmodesArchiveRoot) -and -not (Test-Path $legacyInstructionsArchiveRoot) -and -not (Test-Path $legacyChatmodesArchiveRoot)) {
    throw 'No _archive folders found for instructions or chatmodes.'
}

$availableTimestamps = New-Object 'System.Collections.Generic.List[string]'
foreach ($root in @($instructionsArchiveRoot, $chatmodesArchiveRoot, $legacyInstructionsArchiveRoot, $legacyChatmodesArchiveRoot)) {
    if (Test-Path $root) {
        foreach ($name in (Get-ChildItem -Path $root -Directory | Select-Object -ExpandProperty Name)) {
            $availableTimestamps.Add([string]$name)
        }
    }
}
$availableTimestamps = @($availableTimestamps | Sort-Object -Unique)

if ($availableTimestamps.Count -eq 0) {
    throw 'No timestamped archive folders found.'
}

$selectedTimestamp = $null
if ($Timestamp) {
    if ($availableTimestamps -notcontains $Timestamp) {
        throw "Timestamp '$Timestamp' not found. Available: $($availableTimestamps -join ', ')"
    }
    $selectedTimestamp = $Timestamp
} elseif ($Latest) {
    $sortedTimestamps = @($availableTimestamps | Sort-Object)
    $selectedTimestamp = $sortedTimestamps[$sortedTimestamps.Count - 1]
} else {
    $sortedTimestamps = @($availableTimestamps | Sort-Object)
    $selectedTimestamp = $sortedTimestamps[$sortedTimestamps.Count - 1]
}

$instructionsSource = $null
$chatmodesSource = $null

foreach ($candidate in @((Join-Path $instructionsArchiveRoot $selectedTimestamp), (Join-Path $legacyInstructionsArchiveRoot $selectedTimestamp))) {
    if (Test-Path $candidate) {
        $instructionsSource = $candidate
        break
    }
}

foreach ($candidate in @((Join-Path $chatmodesArchiveRoot $selectedTimestamp), (Join-Path $legacyChatmodesArchiveRoot $selectedTimestamp))) {
    if (Test-Path $candidate) {
        $chatmodesSource = $candidate
        break
    }
}

$instructionFilesToRestore = @()
$chatmodeFilesToRestore = @()

if ($instructionsSource -and (Test-Path $instructionsSource)) {
    $instructionFilesToRestore = @(Get-ChildItem -Path $instructionsSource -Filter '*.instructions.md' -File)
}
if ($chatmodesSource -and (Test-Path $chatmodesSource)) {
    $chatmodeFilesToRestore = @(Get-ChildItem -Path $chatmodesSource -Filter '*.agent.md' -File)
}

Write-Host ''
Write-Host '=== Copilot customization restore preview ===' -ForegroundColor Cyan
Write-Host "Repo: $repoRoot"
Write-Host "Timestamp: $selectedTimestamp"
Write-Host "Instruction files to restore: $($instructionFilesToRestore.Count)"
Write-Host "Chatmode files to restore: $($chatmodeFilesToRestore.Count)"
Write-Host ''

if ($instructionFilesToRestore.Count -gt 0) {
    Write-Host 'Instructions to restore:' -ForegroundColor Yellow
    $instructionFilesToRestore.Name | Sort-Object | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
}

if ($chatmodeFilesToRestore.Count -gt 0) {
    Write-Host 'Chatmodes to restore:' -ForegroundColor Yellow
    $chatmodeFilesToRestore.Name | Sort-Object | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
}

if (-not $Apply) {
    Write-Host 'Dry run only. No files were moved.' -ForegroundColor Green
    Write-Host 'Run with -Apply to restore files from this timestamp.' -ForegroundColor Green
    exit 0
}

foreach ($file in $instructionFilesToRestore) {
    $destination = Join-Path $instructionsDir $file.Name
    if (Test-Path $destination) {
        Write-Warning "Skipping existing instruction file: $($file.Name)"
        continue
    }
    Move-Item -Path $file.FullName -Destination $destination
}

foreach ($file in $chatmodeFilesToRestore) {
    $destination = Join-Path $chatmodesDir $file.Name
    if (Test-Path $destination) {
        Write-Warning "Skipping existing chatmode file: $($file.Name)"
        continue
    }
    Move-Item -Path $file.FullName -Destination $destination
}

# Optionally clean up empty timestamp folders
if ($instructionsSource -and (Test-Path $instructionsSource) -and -not (Get-ChildItem -Path $instructionsSource -File -Force)) {
    Remove-Item -Path $instructionsSource -Force
}
if ($chatmodesSource -and (Test-Path $chatmodesSource) -and -not (Get-ChildItem -Path $chatmodesSource -File -Force)) {
    Remove-Item -Path $chatmodesSource -Force
}

Write-Host ''
Write-Host 'Restore complete.' -ForegroundColor Green
Write-Host "Restored from timestamp: $selectedTimestamp"
