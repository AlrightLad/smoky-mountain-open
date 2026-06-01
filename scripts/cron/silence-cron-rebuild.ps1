# silence-cron-rebuild.ps1
# Runs from silence-cron-LAUNCH.cmd in an ADMIN context. Deletes the
# existing PARBAUGHS-* scheduled tasks (which have RunLevel=Highest
# blocking ordinary edits) and re-registers each one fresh with:
#   - wscript.exe + run-hidden.vbs wrapper for invisible execution
#   - Hidden=True at the task level
#   - RunLevel=Limited (least privilege)
#   - Same trigger intervals as before
#
# After this, future modifications can be made WITHOUT admin elevation
# because the rebuilt tasks no longer have the Highest run level.

$ErrorActionPreference = 'Continue'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$Wrapper = Join-Path $RepoRoot "scripts\cron\run-hidden.vbs"

Write-Host ""
Write-Host "PARBAUGHS Cron Silencer (admin rebuild)"
Write-Host "  Repo : $RepoRoot"
Write-Host ""

if (-not (Test-Path $Wrapper)) {
  Write-Error "Wrapper missing: $Wrapper"
  exit 1
}

# Task definitions: name -> @{ ps1=..., trigger=...(seconds), description=... }
# Trigger intervals captured from current task definitions before they were disabled.
$defs = @(
  @{ Name = "PARBAUGHS-Downloads-Watcher"
     PS1 = "$RepoRoot\scripts\cron\downloads-watcher.ps1"
     RepeatMin = 5
     Description = "Watches for orchestration-pipeline staleness every 5 min. Commits dashboards on dirty tree." }
  @{ Name = "PARBAUGHS-Daily-Maintenance"
     PS1 = "$RepoRoot\scripts\cron\maintenance.ps1"
     RepeatMin = 1440
     Description = "Daily cleanup: aggregate-app-health, ship-progress sweep, archive old reports." }
  @{ Name = "PARBAUGHS-Overnight-Triage"
     PS1 = "$RepoRoot\scripts\cron\overnight-triage.ps1"
     RepeatMin = 1440
     Description = "Daily: scan proposals + amendments + escalations for staleness. Once per day (Founder directive 2026-06-01); overnight-triage.ps1 also self-gates to one Claude launch per calendar day." }
  @{ Name = "PARBAUGHS-Proposal-Readiness-Scanner"
     PS1 = "$RepoRoot\scripts\cron\proposal-readiness.ps1"
     RepeatMin = 15
     Description = "Every 15 min: detect proposals ready to apply via watcher." }
  @{ Name = "PARBAUGHS-Token-Sidecar"
     PS1 = "$RepoRoot\scripts\sidecar\usage-snapshot.ps1"
     RepeatMin = 5
     Description = "Every 5 min: snapshot token usage from .claude/projects/*.jsonl." }
)

foreach ($d in $defs) {
  $name = $d.Name
  $ps1 = $d.PS1

  Write-Host ("Task: " + $name)

  if (-not (Test-Path $ps1)) {
    Write-Warning ("  PS1 missing: " + $ps1)
    continue
  }

  # 1. Capture existing triggers so we preserve any custom start time.
  $existingStart = $null
  try {
    $existing = Get-ScheduledTask -TaskName $name -ErrorAction Stop
    if ($existing.Triggers -and $existing.Triggers[0].StartBoundary) {
      $existingStart = [datetime]$existing.Triggers[0].StartBoundary
    }
  } catch {
    Write-Host "  (no existing task; will create fresh)"
  }

  # 2. Unregister existing (admin context required for RunLevel=Highest).
  try {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction Stop
    Write-Host "  Unregistered existing task"
  } catch {
    Write-Host ("  (no existing to unregister: " + $_.Exception.Message + ")")
  }

  # 3. Build new action: wscript wrapper.
  $newArg = '"' + $Wrapper + '" "' + $ps1 + '"'
  $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $newArg -WorkingDirectory $RepoRoot

  # 4. Trigger: every N minutes, indefinitely.
  $startAt = if ($existingStart) { $existingStart } else { (Get-Date).AddMinutes(1) }
  $trigger = New-ScheduledTaskTrigger -Once -At $startAt -RepetitionInterval (New-TimeSpan -Minutes $d.RepeatMin)

  # 5. Settings: Hidden=True, indefinite repeat, allow demand start, no exec timeout.
  $settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RestartCount 0 `
    -MultipleInstances IgnoreNew

  # 6. Principal: current user, Interactive logon, Limited run level (no admin).
  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

  # 7. Register fresh.
  try {
    Register-ScheduledTask `
      -TaskName $name `
      -Action $action `
      -Trigger $trigger `
      -Settings $settings `
      -Principal $principal `
      -Description $d.Description `
      -Force `
      -ErrorAction Stop | Out-Null
    Write-Host "  Registered: Hidden=True, RunLevel=Limited, every $($d.RepeatMin) min" -ForegroundColor Green
  } catch {
    Write-Warning ("  Register failed: " + $_.Exception.Message)
  }
}

Write-Host ""
Write-Host "All tasks rebuilt. They will run silently going forward."
Write-Host "Verify with: Get-ScheduledTask -TaskName 'PARBAUGHS*' | Format-Table TaskName, State, @{N='Hidden';E={`$_.Settings.Hidden}}, @{N='RunLevel';E={`$_.Principal.RunLevel}}"
