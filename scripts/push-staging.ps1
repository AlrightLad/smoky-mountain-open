# scripts/push-staging.ps1 - push local main to origin/staging for Founder review
#
# Founder directive 2026-05-23: "Make sure we are continuing to push all
# parbaugh app changes from this loop on the staging branch so I can
# review and see please."
#
# Each cycle:
#   1. Commit work to local main
#   2. Run this script to refresh origin/staging from local main
#   3. Firebase Hosting deploy via seed-deploy-staging-hosting.mjs
#      (the staging RUNTIME at parbaughs-staging.web.app)
#
# Together: GitHub staging branch (code review) + Firebase staging URL
# (visual review) stay in sync.
#
# Force-with-lease is safe - refuses if remote moved unexpectedly.
# Force-push to MAIN remains AMD-018 gate-9 (Founder pre-auth); this
# touches STAGING only, which is explicitly a review branch.

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

$currentBranch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne "main") {
    Write-Host "[push-staging] NOT on main (currently $currentBranch). Skipping."
    exit 1
}

$headSha = (& git rev-parse --short=8 HEAD).Trim()
$headSubject = (& git log -1 --pretty=%s).Trim()

Write-Host ""
Write-Host "[push-staging] Pushing local main to origin/staging"
Write-Host "  HEAD: $headSha - $headSubject"

if ($DryRun) {
    Write-Host "[push-staging] DRY RUN - would run: git push origin main:staging --force-with-lease"
    exit 0
}

$result = & git push origin main:staging --force-with-lease 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "[push-staging] OK - origin/staging now at $headSha"
    Write-Host "  Review: https://github.com/AlrightLad/smoky-mountain-open/tree/staging"
    Write-Host "  Compare main: https://github.com/AlrightLad/smoky-mountain-open/compare/staging...main"
} else {
    Write-Host "[push-staging] FAIL (exit=$exitCode)"
    Write-Host $result
    exit $exitCode
}
