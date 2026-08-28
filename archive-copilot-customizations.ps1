[CmdletBinding()]
param(
    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$instructionsDir = Join-Path $repoRoot '.github\instructions'
$chatmodesDir = Join-Path $repoRoot '.github\chatmodes'
$archiveRoot = Join-Path $repoRoot '.github\_archive'

if (-not (Test-Path $instructionsDir)) {
    throw "Instructions directory not found: $instructionsDir"
}
if (-not (Test-Path $chatmodesDir)) {
    throw "Chatmodes directory not found: $chatmodesDir"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$instructionsArchiveDir = Join-Path $archiveRoot "instructions\$timestamp"
$chatmodesArchiveDir = Join-Path $archiveRoot "chatmodes\$timestamp"

$keepInstructions = @(
    'a11y.instructions.md',
    'security-and-owasp.instructions.md',
    'performance-optimization.instructions.md',
    'exclude-prompt-data.instructions.md',
    'taming-copilot.instructions.md',
    'context-engineering.instructions.md',
    'memory-bank.instructions.md',
    'update-docs-on-code-change.instructions.md',
    'html-css-style-color-guide.instructions.md',
    'qa-engineering-best-practices.instructions.md',
    'self-explanatory-code-commenting.instructions.md',
    'java-17-to-java-21-upgrade.instructions.md'
)

$keepChatmodes = @(
    'plan.agent.md',
    'debug.agent.md',
    'accessibility.agent.md',
    'accessibility-runtime-tester.agent.md',
    'expert-react-frontend-engineer.agent.md',
    'java-mcp-expert.agent.md',
    'modernize-java.agent.md',
    'playwright-tester.agent.md',
    'terminal-helper.agent.md',
    'ai-team-dev.agent.md',
    'ai-team-qa.agent.md'
)

$instructionFiles = @(Get-ChildItem -Path $instructionsDir -Filter '*.instructions.md' -File)
$chatmodeFiles = @(Get-ChildItem -Path $chatmodesDir -Filter '*.agent.md' -File)

$instructionsToArchive = @($instructionFiles | Where-Object { $keepInstructions -notcontains $_.Name })
$chatmodesToArchive = @($chatmodeFiles | Where-Object { $keepChatmodes -notcontains $_.Name })

Write-Host ''
Write-Host '=== Copilot customization cleanup preview ===' -ForegroundColor Cyan
Write-Host "Repo: $repoRoot"
Write-Host "Instructions kept: $($keepInstructions.Count), archive candidates: $($instructionsToArchive.Count)"
Write-Host "Chatmodes kept: $($keepChatmodes.Count), archive candidates: $($chatmodesToArchive.Count)"
Write-Host ''

if ($instructionsToArchive.Count -gt 0) {
    Write-Host 'Instructions to archive:' -ForegroundColor Yellow
    $instructionsToArchive.Name | Sort-Object | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
}

if ($chatmodesToArchive.Count -gt 0) {
    Write-Host 'Chatmodes to archive:' -ForegroundColor Yellow
    $chatmodesToArchive.Name | Sort-Object | ForEach-Object { Write-Host "  - $_" }
    Write-Host ''
}

if (-not $Apply) {
    Write-Host 'Dry run only. No files were moved.' -ForegroundColor Green
    Write-Host 'Run with -Apply to move files into timestamped _archive folders.' -ForegroundColor Green
    exit 0
}

if ($instructionsToArchive.Count -gt 0) {
    New-Item -ItemType Directory -Path $instructionsArchiveDir -Force | Out-Null
    foreach ($file in $instructionsToArchive) {
        Move-Item -Path $file.FullName -Destination (Join-Path $instructionsArchiveDir $file.Name)
    }
}

if ($chatmodesToArchive.Count -gt 0) {
    New-Item -ItemType Directory -Path $chatmodesArchiveDir -Force | Out-Null
    foreach ($file in $chatmodesToArchive) {
        Move-Item -Path $file.FullName -Destination (Join-Path $chatmodesArchiveDir $file.Name)
    }
}

Write-Host ''
Write-Host 'Archive complete.' -ForegroundColor Green
if (Test-Path $instructionsArchiveDir) {
    Write-Host "Instructions archived to: $instructionsArchiveDir"
}
if (Test-Path $chatmodesArchiveDir) {
    Write-Host "Chatmodes archived to: $chatmodesArchiveDir"
}
