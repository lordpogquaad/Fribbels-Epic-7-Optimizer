# compare-files.ps1
# Compares source files against originals and outputs a diff report to a .txt file
# Usage: .\compare-files.ps1 [filename]   e.g.  .\compare-files.ps1 style.css

$origDir  = "f:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\2. Personal\Fribbels orginal files"
$srcDir   = "f:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App\2. Frontend\1. Source"
$outFile  = "f:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\diff-report.txt"

# Map: original filename -> relative path in source dir
$fileMap = [ordered]@{
    "app.html"         = "app.html"
    "app.global.css"   = "app.global.css"
    "style.css"        = "css\style.css"
    "darktheme.css"    = "css\darktheme.css"
    "awn.css"          = "css\awn.css"
    "rangeslider.css"  = "css\rangeslider.css"
    "darkmode.js"      = "js\lib\darkmode.js"
    "optimizerGrid.js" = "js\lib\grids\optimizerGrid.js"
}

$fileArg = $args[0]   # optional: pass a filename to limit comparison
$output  = [System.Collections.Generic.List[string]]::new()

function out($text) { $output.Add($text) }

foreach ($origName in $fileMap.Keys) {
    if ($fileArg -and $origName -ne $fileArg) { continue }

    $origPath = Join-Path $origDir $origName
    $srcPath  = Join-Path $srcDir  $fileMap[$origName]

    out ""
    out "========================================"
    out "FILE: $origName"

    if (-not (Test-Path $origPath)) { out "  MISSING ORIGINAL"; continue }
    if (-not (Test-Path $srcPath))  { out "  MISSING SOURCE: $($fileMap[$origName])"; continue }

    $origLines = Get-Content $origPath
    $srcLines  = Get-Content $srcPath
    out "  Original : $($origLines.Count) lines"
    out "  Source   : $($srcLines.Count) lines"

    $origHash = (Get-FileHash $origPath -Algorithm MD5).Hash
    $srcHash  = (Get-FileHash $srcPath  -Algorithm MD5).Hash

    if ($origHash -eq $srcHash) { out "  STATUS   : IDENTICAL"; continue }

    # Normalize: strip whitespace, drop blank lines → compare content only
    $origNorm = $origLines | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
    $srcNorm  = $srcLines  | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

    # Build lookup sets for set-difference
    $origSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    $srcSet  = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($l in $origNorm) { $null = $origSet.Add($l) }
    foreach ($l in $srcNorm)  { $null = $srcSet.Add($l)  }

    # Lines only in original (removed)
    $removed = $origNorm | Where-Object { -not $srcSet.Contains($_) }
    # Lines only in source   (added)
    $added   = $srcNorm  | Where-Object { -not $origSet.Contains($_) }

    out "  STATUS   : DIFFERENT"
    out "  Orig content lines : $($origNorm.Count)  |  Src content lines: $($srcNorm.Count)"
    out "  Removed (not in src): $($removed.Count)  |  Added (not in orig): $($added.Count)"
    out ""

    if ($removed.Count -gt 0) {
        out "  ---- REMOVED lines (in original, gone from source) ----"
        foreach ($l in $removed) { out "    - $l" }
        out ""
    }
    if ($added.Count -gt 0) {
        out "  ---- ADDED lines (new in source, not in original) ----"
        foreach ($l in $added) { out "    + $l" }
        out ""
    }
}

out ""
out "========================================"
out "Done."

$output | Set-Content -Path $outFile -Encoding UTF8
Write-Host "Report written to: $outFile"
Write-Host "Lines: $($output.Count)"

# Print summary to console
foreach ($line in $output) {
    if ($line -match "^(========|FILE:|  STATUS|  Original|  Source|  MISSING|Done)") {
        Write-Host $line
    }
}
