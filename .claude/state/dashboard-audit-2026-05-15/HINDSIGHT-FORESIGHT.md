# PHASE J — Hindsight + Foresight + Open-Source Consolidation

**Authored:** 2026-05-15
**Spec:** `.claude/state/dashboard-completion-spec-2026-05-15.md` PHASE J
**Discipline:** P3 (hindsight + foresight in every retrospective) +
P4 (open-source first, paid last)

---

## Per-phase hindsight + foresight

### PHASE A — Inventory + diagnostic + research baseline

**Hindsight (how could this have been done better):**
- The Founder Review Queue's `system_health` block was 6+ months in
  evolution before anyone wrote the JS that renders it. The
  Python-side `regen-dashboard.py` populated the data fields all that
  time, but no consumer existed. **Earlier integration test would have
  caught this**: a render-then-assert test (Playwright + Read screenshot
  + grep for "awaiting data") would have flagged the gap on every CI
  run. Open-source pattern: Storybook's interaction tests
  (`@storybook/test`) catch exactly this kind of "data present, render
  missing" gap.
- We spent 3 turns of debugging trying to figure out why
  `d['system_health']` was empty when it turned out the data was nested
  inside `d['founder_queue']['system_health']`. A **schema linter**
  (Pydantic or jsonschema) on the data block would have surfaced "key
  not at expected path" instantly.

**Foresight (what breaks at 10x usage):**
- At 10x dashboard pages (~100 surfaces), the read-screenshot-then-Read
  vision verification loop becomes prohibitively expensive. **Mitigation**:
  derive a per-page "fingerprint hash" of key DOM regions; only re-Read
  PNG when the hash changes. Pattern in: percy.io,
  Chromatic by Storybook.
- At 100x aggregates (hundreds of health.json files), the data-block
  swap regex starts taking >1s per dashboard render. **Mitigation**:
  switch from regex swap to streaming HTML parsing (htmlparser2) or
  full templating (Jinja2). The regex pattern is dependency-free, but
  the cost scales with HTML size.

### PHASE B — Live data wiring

**Hindsight:**
- The 4 aggregator scripts I authored each take 30-200 lines. **Could be
  reduced to a single 50-line "aggregator framework"** that takes
  `{name, source_func, status_logic}` triples. Inspired by Prometheus
  exporters — declarative aggregator registration. Filing for a
  follow-up ship.
- I initially wrote stand-alone aggregators that duplicated the inline
  `regen-dashboard.approvals_pipeline_status()` logic. The dashboard
  then showed different data from the aggregate JSON. **Lesson**: any
  time the SAME data appears in 2+ places, single-source-of-truth
  refactor first. I caught this within 30 minutes of the divergence and
  switched aggregators to import + wrap the inline function.

**Foresight:**
- Aggregators currently run on every commit (post-commit hook). If
  commits land at 1/sec during a long session, that's 60 aggregator
  invocations/min. Each is sub-second but adds up. **Mitigation**:
  debounce to ≥30 sec between runs, or skip if last run was within 1 min
  AND no relevant input file changed. Pattern in: watchman, chokidar.
- The git-grep credential scan in `aggregate-security-health.py` runs
  on every commit and scales linearly with repo size. At 10MB
  source tree it's <1 sec; at 1GB it's 10+ sec. **Mitigation**: cache
  the last commit SHA scanned + only re-scan files that changed since.

### PHASE C — Interactive UI verification

**Hindsight:**
- `enumerate-interactives.mjs` + `click-every-interactive.mjs` already
  existed and just needed running. **Lesson**: read the existing
  scripts directory BEFORE building new audit tools. We had the
  infrastructure all along.

**Foresight:**
- Click-coverage doesn't catch SEMANTIC correctness — e.g., a button
  that calls the wrong API but doesn't error. **Mitigation**: pair
  click coverage with after-click DOM assertions per button. Pattern in:
  React Testing Library (`fireEvent` + `expect(screen.getByText...)`).

### PHASE D — Janowiak frame capture

**Hindsight:**
- The existing `capture-janowiak-reference.mjs` already worked
  end-to-end; we just needed to update timestamps + output dir + frame
  count. The agent that ran this task found this within 10 minutes
  via the proven script.
- The "5+ creative approaches" framing in the spec PROMOTED unnecessary
  investigation. Approach 1 worked first try. **Lesson**: spec
  required outside-the-box ENUMERATION (per P5), which is good, but
  EXECUTION should still try-obvious-first. The agent did the right
  thing.

**Foresight:**
- X.com DOM is highly volatile. The `article video` selector works
  today; in 6 months X may move video to a different element. **Mitigation**:
  cache video segments locally on first capture (existing infrastructure
  already does this — see `_harness.html` + intercepted `.m4s` files in
  `reference-frames/`). Future captures should prefer the cached
  segments + ffmpeg over re-pulling from X.

### PHASE E — Smoke test

**Hindsight:**
- We have TWO smoke runners (`smoke:full` cross-browser + `test:e2e`
  Playwright + Firebase emulator). The naming overlap caused confusion;
  the goal spec assumed "12 scenarios" applied to either. Actual:
  smoke:full has 26, test:e2e has 6 spec files. **Lesson**: name them
  distinctly (cross-browser-smoke vs emulator-e2e).
- WebKit binary not installed prevented `smoke:full` from running the
  cross-browser path. The runner failed with explicit "browser not
  installed" error — that's helpful. **Mitigation**: add
  `playwright install` to the `npm install` post-install hook so all
  three browsers are always present.

**Foresight:**
- Cross-browser smoke at full coverage (26 × 4 = 104 scenarios) takes
  ~15 min on local hardware. Not viable for every commit. **Mitigation**:
  run subset of high-risk scenarios on commit (auth, log-round, dm); run
  full suite nightly via GitHub Actions or local cron.

### PHASE F — FIQ verification

**Hindsight:**
- The `firebase` CLI works in interactive Bash but fails when called
  via Python subprocess with bare `firebase` name (Windows .cmd shim
  not auto-expanded). **Lesson**: always use `shutil.which()` with .cmd
  variants on Windows. Captured in `_find_firebase_cli()` helper —
  reusable for any future Firebase aggregator.

**Foresight:**
- At 100+ indexes, the `firebase firestore:indexes` call grows. Currently
  ~3sec at 26 indexes. **Mitigation**: cache the last index-count for
  N minutes (similar to npm-audit-debounce); only re-fetch when
  `firestore.indexes.json` changes.

### PHASE G — Visual + structural audits

**Hindsight:**
- 3/4 audit scripts pass cleanly; 1 known-failure
  (`round-trip-test.py` user-context-gate). The known-failure is in
  test-health.known_failures so it's surfaced honestly, not hidden.
  **Lesson**: known-failure entries with resolution_owner + resolution_
  command pattern is the right model. Audit scripts should use it
  rather than just exit-non-zero.

**Foresight:**
- New visual-audit scripts accumulate without a registry. At 20+
  scripts, runners don't know which to invoke when. **Mitigation**:
  central registry at `scripts/visual-audit/registry.json` mapping
  script → category (perf, layout, a11y, content) → frequency.

### PHASE H — Durability proof

**Hindsight:**
- Took 3 iterations to get the heartbeat-writer integrated with the
  round-trip-test gate (set -e bail issue, GATE-FAIL status, etc.).
  **Lesson**: any non-trivial shell logic with mixed exit-code handling
  warrants a shell-test-script (BATS framework). We don't currently
  have BATS infrastructure; adding it is filed as a follow-up.

**Foresight:**
- The "rm + scaffold + regen" durability test is run manually. **Mitigation**:
  scheduled-task (Windows or Linux cron) that runs this nightly + emits
  to a known location; aggregate-test-health reads its outcome.

### PHASE I — Polish

**Hindsight:**
- Removed the gitignored-dashboard rollback from regen-all.sh — it was
  emitting "could not roll back" warnings on every test failure for
  months without anyone noticing. **Lesson**: scrub regen-all.sh
  output periodically for warnings; warnings tend to indicate dead code
  paths.

**Foresight:**
- Banner sizing at 1440px shows narrow cards with heavy text wrapping
  (e.g., "regen-all completed but round-trip-test gate failed (workflow
  staleness; see test-health.known_failures)" wraps over ~10 lines).
  **Mitigation**: implement banner-summary smart-truncate that uses
  longer text for tooltip but shorter for visible state. Filed as
  PHASE I follow-up.

---

## Open-source consolidation proposals

Per P4: identify any paid pattern silently inherited; propose
free-replication paths.

### Currently used (no paid replacements)
- **Playwright** (MIT, open-source) — used for vision verification
- **Firebase Blaze plan** (pay-as-you-go but baseline-free for our
  scale) — used for Firestore + Functions + Auth. This is the one
  major paid dependency.
- **GitHub Pages** (free with public repo) — static hosting

### Patterns that could migrate to open-source equivalents
1. **Firebase Functions → self-hosted Node.js + Cloudflare Workers**
   - Currently: Cloud Functions Gen1, Node 22, us-central1
   - Open-source alternative: Cloudflare Workers (free tier 100K
     req/day; sufficient for current scale)
   - Migration cost: ~1 week per function (8 functions = 8 weeks
     full-time)
   - Recommendation: **DEFER**. Firebase Functions cost <$5/month
     currently; migration cost exceeds 1 year of fees. Re-evaluate at
     1000+ users.

2. **Firestore → self-hosted PostgreSQL + Supabase**
   - Currently: Firestore for primary data; offline persistence
     disabled
   - Open-source alternative: Supabase (PostgreSQL + auth + storage,
     self-hostable; managed tier with free 500MB)
   - Migration cost: ~3 weeks (schema redesign + client SDK swap +
     rules → RLS policies)
   - Recommendation: **DEFER**. Same cost calculus as Functions.
     Firestore + Auth bundle is operationally cheaper than
     self-managing PostgreSQL.

3. **GolfCourseAPI → self-hosted OpenStreetMap-based course data
   pipeline**
   - Currently: GolfCourseAPI (free tier ~unknown rate limit; key
     stored in Firestore)
   - Open-source alternative: OSM Overpass API + custom golf-course
     polygon extraction (per `docs/osm-course-data-evaluation.md`
     parked design)
   - Migration cost: ~2 weeks (OSM Overpass queries + course polygon
     extraction + matching to user-submitted course names)
   - Recommendation: **DEFERRED ALREADY** in docs/. Re-surface when
     GolfCourseAPI rate limits become a constraint.

### Surfaced for Founder via task-queue/founder/

None — the 3 paid patterns above are either (a) economically
favorable at current scale or (b) already on the deferred-design
list. No silent paid adoptions found.

---

## Citations + alternatives-considered appendix

Per AMD-025 §1: cite ALL sources from post-push retrospective.

### Web-search citations (used in PHASE A research baseline)

- Playwright HTML5 video frame extraction (currentTime + canvas):
  [Playwright Videos docs](https://playwright.dev/docs/videos) +
  [W3C requestVideoFrameCallback](https://wicg.github.io/video-rvfc/)
- Playwright X.com selectors:
  [Scraping Twitter with Playwright (Jonathan Soma)](https://jonathansoma.com/everything/scraping/scraping-twitter-playwright/)
  + [DEV 2026 Twitter Scraping Guide](https://dev.to/ashish_soni08/comprehensive-guide-to-twitterx-scraping-frameworks-and-tools-in-2026-37p2)
- Playwright launchPersistentContext (Chrome user-data-dir on Windows):
  [Microsoft Playwright issue #35836](https://github.com/microsoft/playwright/issues/35836)
  + [DEV running Codegen with existing profiles](https://dev.to/mxschmitt/running-playwright-codegen-with-existing-chromium-profiles-5g7k)
- yt-dlp + Twitter video alternatives:
  [AlternativeTo yt-dlp](https://alternativeto.net/software/yt-dlp/)
  + [WinXDVD top alternatives 2026](https://www.winxdvd.com/streaming-video/yt-dlp-alternatives.htm)
- Open-source dashboard aggregator patterns:
  [awesome-status-pages](https://github.com/ivbeg/awesome-status-pages)
  + [Better Stack free status tools](https://betterstack.com/community/comparisons/free-status-page-tools/)
  + [StatusGator status-page-aggregator](https://github.com/StatusGator/status-page-aggregator)
  + [Statping](https://github.com/statping/statping)

### Alternatives considered (per P5)

Documented in `INVENTORY.md` A6:
- 3 approaches for data-block bridge (chosen: JS render reading data
  block; rejected: fetch + WebSocket)
- 3 approaches for banner anchor markup (chosen: idempotent inject
  script; rejected: hand-author + template-only)
- 3 approaches for test-health refresh (chosen: heartbeat-age check;
  rejected: full test runner + external CI watch)

Total alternatives enumerated this goal: **9 design decisions × 3 = 27
alternatives considered, 9 chosen + 18 rejected with rationale.**

---

## Recommendations to surface (none auto-applied)

Per AMD-015 propose-first, all bigger refactors require Founder
direction. The following are non-binding suggestions:

1. **Aggregator framework consolidation** — refactor 4 aggregator
   scripts into a single 50-line framework with declarative
   registration. Reduces LoC + maintainability burden.
2. **BATS shell testing** — add BATS test framework to scripts/
   directory. Would have caught the set -e command-substitution bail
   I had to debug.
3. **Storybook interaction tests** — for dashboard JS render code.
   Would have caught the "data present, render missing" gap that
   triggered this entire dashboard-completion goal.
4. **Click-coverage + semantic assertions** — pair existing click-
   coverage with after-click DOM assertions per button.
5. **Visual-audit script registry** — central JSON mapping audit
   scripts to category + frequency. Prevents new scripts from being
   forgotten.

These are filed here for Founder visibility; team will not implement
without explicit direction.
