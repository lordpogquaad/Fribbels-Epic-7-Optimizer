# Syncs hero/artifact game data and hero images from RexQian's upstream fork
# (the actively-maintained source; the original fribbels author has stopped
# updating). Run this after each game patch, before `yarn build`.
#
# What it does:
#   1. git fetch upstream
#   2. Copies data/cache/{herodata,artifactdata}.json from upstream/main into
#      the runtime cache seed (6. JSON/2. CACHE/cache/).
#   3. Copies any new/changed data/cachedimages/*.png from upstream/main into
#      the canonical hero-image source (3. ASSETS/1. PNG/2. Hero/5. Hero/...),
#      which CopyAssets.js later flattens into 1. HTML/assets/ on `yarn build`.
#   4. Records the synced upstream/main and upstream/feat/offline commits in
#      1. Master/upstream-sync.json.
#   5. Prints the non-data code diff between the previously-recorded
#      feat/offline commit and the current one, for manual review — Rex's
#      feat/offline branch carries code main.json data alone won't show.
#
# Idempotent: run it twice back to back and the second run reports 0 added/updated.

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$masterDir = Join-Path $scriptDir '..'
$repoRoot  = Join-Path $masterDir '..\..' | Resolve-Path | Select-Object -ExpandProperty Path
$appDir    = Join-Path $masterDir '..' | Resolve-Path | Select-Object -ExpandProperty Path
$sourceDir = Join-Path $appDir '2. Frontend\1. Source'

$cacheDir  = Join-Path $sourceDir '6. JSON\2. CACHE\cache'
$heroPngDir = Join-Path $sourceDir '3. ASSETS\1. PNG\2. Hero\5. Hero'
$syncRecordPath = Join-Path $masterDir 'upstream-sync.json'

$UPSTREAM_REMOTE = 'upstream'
$UPSTREAM_MAIN = "$UPSTREAM_REMOTE/main"
$UPSTREAM_OFFLINE = "$UPSTREAM_REMOTE/feat/offline"
$FALLBACK_BASELINE = 'ad81e24'

# Extracts a git blob by sha and writes it to $DestPath as raw bytes (avoids
# PowerShell's text pipeline, which corrupts binary PNG content on redirect/pipe).
function Export-GitBlob {
    param([string]$Sha, [string]$DestPath)

    $destParent = Split-Path -Parent $DestPath
    if (!(Test-Path $destParent)) {
        New-Item -ItemType Directory -Force -Path $destParent | Out-Null
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'git'
    $psi.Arguments = "cat-file blob $Sha"
    $psi.WorkingDirectory = $repoRoot
    $psi.RedirectStandardOutput = $true
    $psi.UseShellExecute = $false

    $proc = [System.Diagnostics.Process]::Start($psi)
    $outStream = [System.IO.File]::Create($DestPath)
    $proc.StandardOutput.BaseStream.CopyTo($outStream)
    $outStream.Close()
    $proc.WaitForExit()

    if ($proc.ExitCode -ne 0) {
        throw "git cat-file blob $Sha failed (exit $($proc.ExitCode))"
    }
}

# Returns the git blob sha of a local file (same algorithm git uses for tree
# entries), or $null if the file does not exist.
function Get-LocalBlobSha {
    param([string]$Path)
    if (!(Test-Path $Path)) { return $null }
    return (& git hash-object $Path).Trim()
}

Write-Host "Fetching $UPSTREAM_REMOTE ..."
Push-Location $repoRoot
try {
    git fetch $UPSTREAM_REMOTE
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git fetch $UPSTREAM_REMOTE failed (exit $LASTEXITCODE)"
        exit 1
    }

    $mainSha = (& git rev-parse $UPSTREAM_MAIN).Trim()
    $offlineSha = (& git rev-parse $UPSTREAM_OFFLINE).Trim()

    # --- 1. herodata.json / artifactdata.json -----------------------------
    Write-Host "`nSyncing data/cache/*.json from $UPSTREAM_MAIN ..."
    $jsonUpdated = 0
    foreach ($jsonName in @('herodata.json', 'artifactdata.json')) {
        $upstreamPath = "data/cache/$jsonName"
        $upstreamSha = (& git rev-parse "${UPSTREAM_MAIN}:${upstreamPath}").Trim()
        $localDest = Join-Path $cacheDir $jsonName
        $localSha = Get-LocalBlobSha $localDest

        if ($localSha -eq $upstreamSha) {
            Write-Host "  unchanged: $jsonName"
        } else {
            Export-GitBlob -Sha $upstreamSha -DestPath $localDest
            Write-Host "  updated:   $jsonName"
            $jsonUpdated++
        }
    }

    # --- 2. hero images ------------------------------------------------------
    Write-Host "`nSyncing data/cachedimages/*.png from $UPSTREAM_MAIN ..."
    $imageEntries = & git ls-tree -r $UPSTREAM_MAIN -- data/cachedimages |
        ForEach-Object {
            # format: <mode> blob <sha>\t<path>
            if ($_ -match '^\d+\s+blob\s+([0-9a-f]{40})\t(.+)$') {
                [PSCustomObject]@{ Sha = $Matches[1]; Path = $Matches[2] }
            }
        }

    $added = 0
    $updated = 0
    $unchanged = 0
    foreach ($entry in $imageEntries) {
        $filename = Split-Path -Leaf $entry.Path
        # cNNNN-coded files go in their own subfolder (matches the existing
        # local layout); everything else (legacy descriptive names) goes in Named/.
        if ($filename -match '^(c\d+)_') {
            $subDir = $Matches[1]
        } else {
            $subDir = 'Named'
        }
        $destPath = Join-Path (Join-Path $heroPngDir $subDir) $filename

        $localSha = Get-LocalBlobSha $destPath
        if ($null -eq $localSha) {
            Export-GitBlob -Sha $entry.Sha -DestPath $destPath
            $added++
        } elseif ($localSha -ne $entry.Sha) {
            Export-GitBlob -Sha $entry.Sha -DestPath $destPath
            $updated++
        } else {
            $unchanged++
        }
    }
    Write-Host "  added: $added   updated: $updated   unchanged: $unchanged"

    # --- 3. record synced commits + code-review diff --------------------
    $previousOfflineSha = $FALLBACK_BASELINE
    if (Test-Path $syncRecordPath) {
        try {
            $previous = Get-Content $syncRecordPath -Raw | ConvertFrom-Json
            if ($previous.upstreamFeatOffline) {
                $previousOfflineSha = $previous.upstreamFeatOffline
            }
        } catch {
            Write-Host "  (could not parse existing upstream-sync.json, using fallback baseline)"
        }
    }

    $syncRecord = [ordered]@{
        syncedAt             = (Get-Date).ToString('o')
        upstreamMain         = $mainSha
        upstreamFeatOffline  = $offlineSha
        heroJsonArtifactJsonUpdated = $jsonUpdated
        imagesAdded          = $added
        imagesUpdated        = $updated
    }
    $syncRecord | ConvertTo-Json | Set-Content -Path $syncRecordPath -Encoding utf8

    Write-Host "`nRecorded sync: main=$mainSha  feat/offline=$offlineSha"
    Write-Host "  -> $syncRecordPath"

    Write-Host "`nCode to review (non-data changes on feat/offline, $previousOfflineSha..$offlineSha):"
    if ($previousOfflineSha -eq $offlineSha) {
        Write-Host "  (feat/offline unchanged since last sync)"
    } else {
        & git diff --name-status "$previousOfflineSha..$offlineSha" -- ':!data/'
    }
} finally {
    Pop-Location
}
