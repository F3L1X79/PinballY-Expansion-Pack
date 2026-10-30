# ============================================================
# Script Reader install helper (common/core/pinbally_host.js starts it
# hidden; PinballY stays open and polls CodeFile). See docs/adr/0021.
# Downloads ZipUrl, checks its SHA-256, extracts vpxtool.exe, renames the
# current one aside, moves the new one in, checks its --version answers
# Version, then deletes the old one; on any failure it puts the old one back.
# Writes OutputFile, then CodeFile last (0 once installed, 1 otherwise).
# Logs each step to LogFile (%TEMP%\PinballYExpansionPack\script-reader-install.log). Windows PowerShell 5.1, ASCII only.
# - PinballY counts the install failed after 90 s: no swap starts past 75 s.
# ============================================================

param([string]$LogFile, [string]$OutputFile, [string]$CodeFile, [string]$ZipUrl, [string]$Sha256, [string]$Version, [string]$ToolsFolder)

# Rename-Item, Move-Item and Copy-Item fail without throwing otherwise: no catch would see them.
$ErrorActionPreference = 'Stop'

$DownloadTimeoutSec = 60
# -TimeoutSec does not bound a slow transfer: past this, no swap happens at all.
$SwapDeadlineSec = 75
$watch = [Diagnostics.Stopwatch]::StartNew()

function Log([string]$Text) {
    Add-Content -Path $LogFile -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff') + ' ' + $Text)
}

# The answer PinballY reads: the output first, the exit code last, as the hidden program runner writes them.
function Answer([int]$Code, [string]$Text) {
    Set-Content -Path $OutputFile -Value $Text -Encoding ASCII
    Set-Content -Path $CodeFile -Value $Code -Encoding ASCII
    exit $Code
}

$temporary = Split-Path $LogFile
$zip = Join-Path $temporary ('vpxtool-' + $Version + '.zip')
$extracted = Join-Path $temporary 'vpxtool-new'
$current = Join-Path $ToolsFolder 'vpxtool.exe'
$aside = Join-Path $ToolsFolder 'vpxtool.old.exe'
$swapped = $false

try {
    Log ('---- vpxtool ' + $Version + ' install asked by PinballY')
    # Windows PowerShell 5.1 may still offer only TLS 1.0, which GitHub refuses.
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    # The progress bar slows Invoke-WebRequest down many times over, even hidden.
    $ProgressPreference = 'SilentlyContinue'
    Log ('downloading ' + $ZipUrl)
    Invoke-WebRequest -Uri $ZipUrl -OutFile $zip -UseBasicParsing -TimeoutSec $DownloadTimeoutSec
    $digest = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($digest -ne $Sha256.ToLowerInvariant()) { throw ('SHA-256 ' + $digest + ' is not the expected ' + $Sha256) }
    Log 'SHA-256 checked'

    if (Test-Path -LiteralPath $extracted) { Remove-Item -LiteralPath $extracted -Recurse -Force }
    Expand-Archive -LiteralPath $zip -DestinationPath $extracted
    $new = Join-Path $extracted 'vpxtool.exe'
    if (-not (Test-Path -LiteralPath $new)) { throw 'no vpxtool.exe in the zip' }
    # The Mark of the Web would have SmartScreen hold the hidden runs.
    Unblock-File -LiteralPath $new
    Log ('extracted to ' + $extracted)

    # PinballY has said "nothing has changed" by now: a late swap would contradict it.
    if ($watch.Elapsed.TotalSeconds -gt $SwapDeadlineSec) { throw ('too late to swap after ' + [int]$watch.Elapsed.TotalSeconds + ' s') }
    if (-not (Test-Path -LiteralPath $ToolsFolder)) { New-Item -ItemType Directory -Path $ToolsFolder | Out-Null }
    if (Test-Path -LiteralPath $aside) { Remove-Item -LiteralPath $aside -Force }
    if (Test-Path -LiteralPath $current) {
        Rename-Item -LiteralPath $current -NewName (Split-Path $aside -Leaf)
        Log 'previous vpxtool.exe renamed aside'
    }
    $swapped = $true
    Move-Item -LiteralPath $new -Destination $current
    Log 'new vpxtool.exe moved in'

    $answer = (& $current --version 2>$null | Out-String).Trim()
    Log ('--version answers: ' + $answer)
    $match = [regex]::Match($answer, '\d+\.\d+\.\d+')
    if (-not $match.Success -or $match.Value -ne $Version) { throw ('--version answers "' + $answer + '", not ' + $Version) }

    # A previous vpxtool.exe still running can be renamed but not deleted: the next install removes it.
    if (Test-Path -LiteralPath $aside) { Remove-Item -LiteralPath $aside -Force -ErrorAction SilentlyContinue }
    Log ('vpxtool ' + $Version + ' installed')
    $outcome = 0
} catch {
    $failure = [string]$_
    Log ('ERROR ' + $failure)
    $outcome = 1
    if ($swapped) {
        try {
            if (Test-Path -LiteralPath $current) { Remove-Item -LiteralPath $current -Force }
            if (Test-Path -LiteralPath $aside) {
                Rename-Item -LiteralPath $aside -NewName 'vpxtool.exe'
                Log 'previous vpxtool.exe put back'
            }
        } catch {
            Log ('ERROR putting the previous vpxtool.exe back: ' + $_)
        }
    }
}

try {
    if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
    if (Test-Path -LiteralPath $extracted) { Remove-Item -LiteralPath $extracted -Recurse -Force }
} catch {
    Log ('ERROR cleaning up: ' + $_)
}

if ($outcome -eq 0) { Answer 0 $answer }
Answer 1 $failure
