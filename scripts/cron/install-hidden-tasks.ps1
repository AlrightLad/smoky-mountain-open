# install-hidden-tasks.ps1
# Rewrite PARBAUGHS Task Scheduler actions to use the run-hidden.vbs wrapper
# so PowerShell never flashes a window during cron runs.

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$Wrapper = Join-Path $RepoRoot "scripts\cron\run-hidden.vbs"
$DQ = [char]34

if (-not (Test-Path $Wrapper)) {
  Write-Error "run-hidden.vbs not found at $Wrapper"
  exit 1
}

Write-Host "PARBAUGHS task silencer"
Write-Host "  Repo root : $RepoRoot"
Write-Host "  Wrapper   : $Wrapper"
Write-Host ""

$tasks = Get-ScheduledTask -TaskName "PARBAUGHS*" -ErrorAction SilentlyContinue

if (-not $tasks) {
  Write-Warning "No PARBAUGHS-* scheduled tasks found"
  exit 0
}

$updated = 0
$skipped = 0
$failed  = 0

foreach ($task in $tasks) {
  $name = $task.TaskName
  Write-Host ("Task: " + $name)

  $oldAction = $task.Actions[0]
  $oldExec = $oldAction.Execute
  $oldArgs = $oldAction.Arguments

  if ($oldExec -like "*wscript.exe*") {
    Write-Host "  Already using wscript wrapper - skipping"
    $skipped++
    continue
  }

  $scriptPath = $null
  $fileMarker = "-File " + $DQ
  $idx = $oldArgs.IndexOf($fileMarker)
  if ($idx -ge 0) {
    $startPos = $idx + $fileMarker.Length
    $endPos = $oldArgs.IndexOf($DQ, $startPos)
    if ($endPos -gt $startPos) {
      $scriptPath = $oldArgs.Substring($startPos, $endPos - $startPos)
    }
  }

  if (-not $scriptPath) {
    $idx2 = $oldArgs.IndexOf("-File ")
    if ($idx2 -ge 0) {
      $remainder = $oldArgs.Substring($idx2 + 6).Trim()
      if ($remainder.EndsWith(".ps1")) { $scriptPath = $remainder }
    }
  }

  if (-not $scriptPath) {
    Write-Warning "  Could not extract .ps1 path from args"
    $failed++
    continue
  }

  if (-not (Test-Path $scriptPath)) {
    Write-Warning "  PS1 path does not exist"
    $failed++
    continue
  }

  Write-Host ("  PS1: " + $scriptPath)

  $newArg = $DQ + $Wrapper + $DQ + " " + $DQ + $scriptPath + $DQ

  $newAction = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $newArg -WorkingDirectory $RepoRoot

  try {
    Set-ScheduledTask -TaskName $name -Action $newAction | Out-Null
    Enable-ScheduledTask -TaskName $name | Out-Null
    Write-Host "  Updated + enabled" -ForegroundColor Green
    $updated++
  }
  catch {
    Write-Warning ("  Failed to update: " + $_.Exception.Message)
    $failed++
  }
}

Write-Host ""
Write-Host ("Summary: " + $updated + " updated, " + $skipped + " skipped, " + $failed + " failed")

if ($failed -gt 0) { exit 1 }
exit 0
