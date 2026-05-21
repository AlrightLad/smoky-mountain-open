# silence-cron-via-xml.ps1
# Export each PARBAUGHS-* task to XML, rewrite (1) the action to use
# wscript.exe + run-hidden.vbs wrapper, (2) Hidden=true, (3) RunLevel
# from HighestAvailable to LeastPrivilege so future edits don't need
# admin. Then Register-ScheduledTask -Xml -Force replaces in place.
#
# This avoids the elevated UAC popup that Set-ScheduledTask requires
# when RunLevel=Highest.

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$Wrapper = Join-Path $RepoRoot "scripts\cron\run-hidden.vbs"

if (-not (Test-Path $Wrapper)) {
  Write-Error "Wrapper missing: $Wrapper"
  exit 1
}

$mapping = @{
  "PARBAUGHS-Daily-Maintenance"          = "$RepoRoot\scripts\cron\maintenance.ps1"
  "PARBAUGHS-Downloads-Watcher"          = "$RepoRoot\scripts\cron\downloads-watcher.ps1"
  "PARBAUGHS-Overnight-Triage"           = "$RepoRoot\scripts\cron\overnight-triage.ps1"
  "PARBAUGHS-Proposal-Readiness-Scanner" = "$RepoRoot\scripts\cron\proposal-readiness.ps1"
  "PARBAUGHS-Token-Sidecar"              = "$RepoRoot\scripts\sidecar\usage-snapshot.ps1"
}

$updated = 0
$failed = 0

foreach ($name in $mapping.Keys) {
  $ps1 = $mapping[$name]
  Write-Host ("Task: " + $name)

  if (-not (Test-Path $ps1)) {
    Write-Warning ("  PS1 missing: " + $ps1)
    $failed++
    continue
  }

  try {
    $xml = Export-ScheduledTask -TaskName $name
  } catch {
    Write-Warning ("  Export failed: " + $_.Exception.Message)
    $failed++
    continue
  }

  $newArg = '"' + $Wrapper + '" "' + $ps1 + '"'

  $xmlDoc = New-Object System.Xml.XmlDocument
  $xmlDoc.LoadXml($xml)

  $ns = New-Object System.Xml.XmlNamespaceManager $xmlDoc.NameTable
  $ns.AddNamespace("t", "http://schemas.microsoft.com/windows/2004/02/mit/task")

  # Replace the Exec node
  $execNode = $xmlDoc.SelectSingleNode("//t:Exec", $ns)
  if ($execNode) {
    $cmdNode = $execNode.SelectSingleNode("t:Command", $ns)
    $argNode = $execNode.SelectSingleNode("t:Arguments", $ns)
    if ($cmdNode) { $cmdNode.InnerText = "wscript.exe" }
    if ($argNode) {
      $argNode.InnerText = $newArg
    } else {
      $newArgNode = $xmlDoc.CreateElement("Arguments", "http://schemas.microsoft.com/windows/2004/02/mit/task")
      $newArgNode.InnerText = $newArg
      $execNode.AppendChild($newArgNode) | Out-Null
    }
  }

  # Set Hidden=true in Settings
  $settingsNode = $xmlDoc.SelectSingleNode("//t:Settings", $ns)
  if ($settingsNode) {
    $hiddenNode = $settingsNode.SelectSingleNode("t:Hidden", $ns)
    if ($hiddenNode) {
      $hiddenNode.InnerText = "true"
    } else {
      $newHidden = $xmlDoc.CreateElement("Hidden", "http://schemas.microsoft.com/windows/2004/02/mit/task")
      $newHidden.InnerText = "true"
      $settingsNode.AppendChild($newHidden) | Out-Null
    }
    # Enable the task
    $enabledNode = $settingsNode.SelectSingleNode("t:Enabled", $ns)
    if ($enabledNode) { $enabledNode.InnerText = "true" }
  }

  # Lower RunLevel from Highest -> Limited (LeastPrivilege)
  $runLevelNode = $xmlDoc.SelectSingleNode("//t:Principal/t:RunLevel", $ns)
  if ($runLevelNode) {
    $runLevelNode.InnerText = "LeastPrivilege"
  }

  $newXml = $xmlDoc.OuterXml

  try {
    Register-ScheduledTask -TaskName $name -Xml $newXml -Force -ErrorAction Stop | Out-Null
    Write-Host "  OK: action rewritten, Hidden=true, RunLevel=Limited, enabled" -ForegroundColor Green
    $updated++
  } catch {
    Write-Warning ("  Register failed: " + $_.Exception.Message)
    $failed++
  }
}

Write-Host ""
Write-Host ("Done: " + $updated + " updated, " + $failed + " failed")
if ($failed -gt 0) { exit 1 }
exit 0
