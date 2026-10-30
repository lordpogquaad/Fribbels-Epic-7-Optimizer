# sync-constants.ps1
# Copies shared constant files from the Google Sheets project source
# to the optimizer's frontend constants folder.
# Run this after editing either source file.
#
# WARNING: this overwrites the app copies whole. They hold edits the sources lack, and gearScorer.js
# reads some of them. Do not run it until R10 in .claude/plans/FIX LIST.md is done.

$base    = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$source  = Join-Path $base "2. Personal\Json Gear Project"
$dest    = Join-Path $base "1. App\2. Frontend\1. Source\4. JS\7. Gear Analysis Tab\constants"

$files = @(
    @{ From = "2. Archetype Rules.js";          To = "archetypeRules.js" },
    @{ From = "1. Epic Seven Gear Constant.js";  To = "epicSevenGearConstant.js" }
)

$anyFailed = $false

foreach ($f in $files) {
    $src = Join-Path $source $f.From
    $dst = Join-Path $dest  $f.To

    if (-not (Test-Path $src)) {
        Write-Warning "Source not found: $src"
        $anyFailed = $true
        continue
    }

    try {
        Copy-Item -Path $src -Destination $dst -Force
        $srcTime = (Get-Item $src).LastWriteTime.ToString("HH:mm:ss")
        Write-Host "OK  $($f.From) -> $($f.To)  [$srcTime]" -ForegroundColor Green
    } catch {
        Write-Warning "FAIL $($f.From): $_"
        $anyFailed = $true
    }
}

if ($anyFailed) {
    Write-Host "`nSync completed with errors." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nSync complete." -ForegroundColor Cyan
}
