---
status: verified-closed
severity: yellow
priority: HIGH
founder_action_required: true
gate: AMD-018 gate 1 (Cloud Functions deploy) — session classifier walls `firebase deploy`
execute_by: founder
verify_command: "curl -s 'https://us-central1-parbaughs.cloudfunctions.net/searchCourses?q=pebble'"
verify_expected: "JSON course list (not an error about a key)"
---

# THE ONE DEPLOY — full walkthrough (~5 minutes, 3 steps)

One PowerShell session ships two waiting features: **course search for all
members** (no personal API keys) and **in-app account deletion**
(App-Store requirement). Every command below is copy-paste ready.

## Before you start

Open **PowerShell** and go to the repo:

```powershell
cd C:\Users\Zach\smoky-mountain-open
```

## Step 1 — Find your GolfCourseAPI key (1 min)

Your key lives in your browser on the device where course search already
works for you. Two ways to get it — use whichever is easier:

**Way A (your phone or desktop app):** Settings → scroll to the Course
Data / API section — the key field shows your saved key. Copy it.

**Way B (desktop browser console):** open the app in the browser you use,
press F12, click "Console", paste this and press Enter — it prints the key:

```js
localStorage.getItem("golfcourse_api_key")
```

(If both come up empty, get a fresh free key at
https://golfcourseapi.com — sign up, copy the key from the dashboard.)

## Step 2 — Put the key in the function's env file (1 min)

Back in PowerShell, run this — **replace `PASTE_KEY_HERE` with the key**
(keep the quotes):

```powershell
Set-Content -Path functions\.env -Value "GOLFCOURSE_API_KEY=PASTE_KEY_HERE" -Encoding ascii
```

Sanity checks (both should print without error; the second MUST print the
path, proving git will never commit the key):

```powershell
Get-Content functions\.env
git check-ignore functions\.env
```

## Step 3 — Deploy both functions (2-3 min)

```powershell
firebase deploy --only functions:searchCourses,functions:deleteMyAccount --project parbaughs --force
```

Wait for `Deploy complete!`. If it asks you to log in first, run
`firebase login`, finish in the browser, and re-run the command.

## Step 4 — Tell the agent

Say **"deploy done"** in the chat (or anything similar). The agent then:
verifies course search works key-less from a clean curl, verifies
deleteMyAccount answers, flips this file to closed, and closes tasks
#24 + #26.

## If anything goes wrong

Copy the red error text into the chat — the agent diagnoses from there.
Nothing in this procedure can break the live app: a failed deploy leaves
the current functions running untouched.


---
**VERIFIED-CLOSED 2026-06-11:** Founder ran the deploy ("deploy done"). Agent verified: key-less searchCourses returns real course JSON; deleteMyAccount answers with proper credential guard (not 404). Course auto-create fully live for all members; account deletion live (App Store 5.1.1(v) satisfied).
