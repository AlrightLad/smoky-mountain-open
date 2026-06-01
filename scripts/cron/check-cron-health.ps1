# check-cron-health.ps1
# Standing orchestration check: every PARBAUGHS-* scheduled task must be
# Ready + Hidden=True + RunLevel=Limited + LastResult=0 + LastRun recent.
# Emits JSON to .claude/state/aggregates/cron-health.json which the
# dashboard regen consumes.

$ErrorActionPreference = 'Continue'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$OutDir = Join-Path $RepoRoot ".claude\state\aggregates"
$OutFile = Join-Path $OutDir "cron-health.json"

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

$tasks = Get-ScheduledTask -TaskName "PARBAUGHS*" -ErrorAction SilentlyContinue

if (-not $tasks) {
  $report = @{
    schema_version = "cron-health-v1"
    generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    status = "missing"
    issues = @(@{
      severity = "RED"
      what = "No PARBAUGHS-* scheduled tasks registered"
      where = "Task Scheduler (taskschd.msc)"
      what_action = "Run scripts/cron/silence-cron-LAUNCH.cmd as Administrator to register tasks"
    })
    tasks = @()
  }
  $json = $report | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText($OutFile, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "[cron-health] missing - no PARBAUGHS-* tasks found"
  exit 1
}

$expectedIntervals = @{
  "PARBAUGHS-Daily-Maintenance"          = 1440
  "PARBAUGHS-Downloads-Watcher"          = 5
  "PARBAUGHS-Overnight-Triage"           = 1440
  "PARBAUGHS-Proposal-Readiness-Scanner" = 15
  "PARBAUGHS-Token-Sidecar"              = 5
}

$issues = @()
$taskReports = @()
$overall = "green"

foreach ($t in $tasks) {
  $info = Get-ScheduledTaskInfo -TaskName $t.TaskName
  $report = [ordered]@{
    name = $t.TaskName
    state = $t.State.ToString()
    hidden = [bool]$t.Settings.Hidden
    run_level = $t.Principal.RunLevel.ToString()
    last_result = $info.LastTaskResult
    last_run = if ($info.LastRunTime) { $info.LastRunTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") } else { $null }
    issues = @()
  }

  if ($t.State -ne "Ready") {
    $report.issues += "State=$($t.State) (expected Ready)"
    $issues += @{
      severity = "RED"
      what = "$($t.TaskName) not Ready (State=$($t.State))"
      where = "Task Scheduler"
      what_action = "Enable-ScheduledTask -TaskName '$($t.TaskName)'"
    }
    $overall = "red"
  }

  if (-not $t.Settings.Hidden) {
    $report.issues += "Hidden=False"
    $issues += @{
      severity = "YELLOW"
      what = "$($t.TaskName) not Hidden - will flash PowerShell window during cron run"
      where = "Task Scheduler"
      what_action = "Run silence-cron-LAUNCH.cmd as Administrator"
    }
    if ($overall -ne "red") { $overall = "yellow" }
  }

  if ($t.Principal.RunLevel -ne "Limited") {
    $report.issues += "RunLevel=$($t.Principal.RunLevel) (expected Limited)"
    $issues += @{
      severity = "YELLOW"
      what = "$($t.TaskName) has elevated RunLevel - future modifications need admin"
      where = "Task Scheduler"
      what_action = "Run silence-cron-LAUNCH.cmd as Administrator to rebuild with Limited"
    }
    if ($overall -ne "red") { $overall = "yellow" }
  }

  if ($info.LastTaskResult -ne $null -and $info.LastTaskResult -ne 0 -and $info.LastTaskResult -ne 267009) {
    # 267009 = "Task is currently running" - not a real error
    $report.issues += "LastResult=$($info.LastTaskResult)"
    $issues += @{
      severity = "RED"
      what = "$($t.TaskName) last run exited $($info.LastTaskResult)"
      where = "scripts/cron/logs/"
      what_action = "Check the .ps1's log file under scripts/cron/logs/ for the failure"
    }
    $overall = "red"
  }

  # Stale check: LastRun should be within 2x the expected interval (if cron job is enabled).
  if ($expectedIntervals.ContainsKey($t.TaskName) -and $info.LastRunTime) {
    $intervalMin = $expectedIntervals[$t.TaskName]
    $ageMin = ((Get-Date) - $info.LastRunTime).TotalMinutes
    if ($ageMin -gt ($intervalMin * 2)) {
      $report.issues += "LastRun was $([int]$ageMin)min ago (expected within $($intervalMin * 2)min)"
      $issues += @{
        severity = "YELLOW"
        what = "$($t.TaskName) last ran $([int]$ageMin) min ago (expected within $($intervalMin * 2))"
        where = "scripts/cron/logs/"
        what_action = "Check whether cron tasks are firing on schedule (Task Scheduler -> Run History)"
      }
      if ($overall -ne "red") { $overall = "yellow" }
    }
  }

  $taskReports += $report
}

$out = [ordered]@{
  schema_version = "cron-health-v1"
  generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  status = $overall
  issues_total = $issues.Count
  issues = $issues
  tasks = $taskReports
}

$json = $out | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($OutFile, $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("[cron-health] " + $overall + " - " + $issues.Count + " issues across " + $taskReports.Count + " tasks")
if ($overall -eq "red") { exit 1 }
exit 0
