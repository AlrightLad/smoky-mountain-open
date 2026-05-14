# User-journey audit transcript

Started: 2026-05-14T20:06:43.504Z
Viewport: 1920x1080
Mode: headed channel:chrome

## /dashboard.html — User journey

**Step 1 — Opened dashboard.html.** Screenshot: `C:\Users\Zach\smoky-mountain-open\dashboard\01-opened.png`
  - Founder Review Queue section present. First 200 chars: "FOUNDER REVIEW QUEUE\n\nItems below need Founder review before next ship-close.\n\nLAST VISIT: NEVER RECORDED\nGOVERNANCE GATES\nAMENDMENTS PENDING\n0\nawaiting Founder ratification\nBUBBLES FLAGGED\n0\ntie-brea"

**Step 2 — Scrolled to Recent 7 Days using mouse wheel (page.mouse.wheel × 4 × 400px).**
  Screenshot: `C:\Users\Zach\smoky-mountain-open\dashboard\02-after-wheel-scroll.png`
  - .recent-7days-charts count: 1
  - Recent 7 Days charts visible: true
  Screenshot of Recent 7 Days area: `C:\Users\Zach\smoky-mountain-open\dashboard\03-recent-7days-in-view.png`
  - Recent 7 Days legend swatches (with HSL for perceptual check):
      Complete             rgb(74, 128, 103)  HSL(152°, 42%, 40%)
      Handoffs             rgb(74, 138, 156)  HSL(193°, 53%, 45%)
      Paused               rgb(212, 168, 87)  HSL(39°, 59%, 59%)
      Ships                rgb(91, 155, 213)  HSL(209°, 57%, 60%)
      Bubbles              rgb(180, 123, 201)  HSL(284°, 39%, 64%)

  ⚠ PERCEPTUAL COLOR ISSUES:
      PERCEPTUAL COLLISION: Ships (HSL 209,57,60) vs Handoffs (HSL 193,53,45) — hue delta=16°

**Step 3 — Cron banner inspection.**
  Cron banner inner text (first 300 chars): "1 CRON TASK NEWLY INSTALLED · AWAITING FIRST FIRE\nNEWLY INSTALLED\nPARBAUGHS-Overnight-Triage\ninstalled · State=Ready · awaiting first fire (cadence 1440min)"
  ✓ Cron banner shows benign newly-installed language

**Step 4 — Cross-page navigation.**
  ✓ Click "Activity" → activity.html → page URL contains href? true
  ✓ Click "Discussion Bubbles" → discussion-bubbles.html → page URL contains href? true
  ✓ Click "Proposals" → proposals.html → page URL contains href? true
  ✓ Click "Amendments" → amendments.html → page URL contains href? true
  ✓ Click "Escalations" → escalations.html → page URL contains href? true
  ✓ Click "Main Flows" → main-flows.html → page URL contains href? true

## /main-flows.html — User journey

**Step 1 — Opened main-flows.html.** Screenshot: `C:\Users\Zach\smoky-mountain-open\main-flows\01-opened.png`

**Step 2 — Scrolled rail using mouse wheel (hover over rail, wheel × 10 × 200px).**
  Rail bbox: top=538 bottom=901 viewport h=1080
  Screenshot after wheel scroll: `C:\Users\Zach\smoky-mountain-open\main-flows\02-rail-after-wheel-scroll.png`
  Last rail item (F62): rect.top=859 rect.bottom=889 viewport h=1080
  Last item text: "F62Token observability + manual quota anchoringadm"
  Last item in viewport (after wheel scroll): ✓ YES

**Step 3 — Clicked F1 in rail.**
  Screenshot after F1 click: `C:\Users\Zach\smoky-mountain-open\main-flows\03-f1-clicked.png`
  After F1 click: gridHasSelection=true stepsHidden=false stepsCount=7
  ✓ Flow selection works

## /amendments.html — User journey

**Step 1 — Opened amendments.html.** Screenshot: `C:\Users\Zach\smoky-mountain-open\amendments\01-opened.png`
  Pending amendments count text: null

**Step 2 — Expanded <details> archive sections.**

**Step 3 — Scrolled to bottom of page via mouse wheel.**
  Screenshot after scroll: `C:\Users\Zach\smoky-mountain-open\amendments\02-scrolled-to-bottom.png`
  Last applied amendment rect: top=3547 bottom=3946 viewport h=1080
  Last applied text: "AMD-003      design-bot skill — Append DASHBOARD PR CHECKLIST (Phase 6 / DC-7)  "
  ✗ Last applied amendment visible after scroll

---
Finished: 2026-05-14T20:07:33.428Z
Output dir: C:\Users\Zach\smoky-mountain-open\.claude\state\user-journey-audits\2026-05-14T20-06-43Z
