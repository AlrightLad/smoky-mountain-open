# ADR-004 — PB.native.* uniform interface across Capacitor + web

**Status:** Accepted
**Date:** 2026-05-21 (M1 Capacitor harness ship)
**Deciders:** Orchestration team

## Context

PARBAUGHS Wave 3 ships an iOS Capacitor native app (TestFlight for founding 20 by end of wave). Native helpers (camera, GPS, haptics, share, device, storage, push) have completely different APIs in Capacitor vs the web (navigator.geolocation, navigator.vibrate, Web Share API, etc.).

If screen code in M2-M6 had to branch (`if (isNative) ... else ...`), every page would carry two paths and tests would need to mock both. Both runtime paths would drift apart over time.

## Decision

`PB.native.<module>` exposes a uniform interface. Each module's implementation file (`src/core/native/<name>.js`) handles runtime detection internally:

```js
PB.native.camera.capture(opts) // works the same on iOS native + web fallback
PB.native.gps.current(opts)     // works the same
PB.native.share.share(opts)     // ...
```

Screen code in M2-M6 imports these helpers WITHOUT conditional branches. The module decides at call time whether to use the Capacitor plugin (`window.Capacitor.Plugins.X`) or the web API.

## Rationale

- **Option A: Uniform interface with internal detection (chosen).** Screen code is testable + readable. New helpers added in one place.
- **Option B: Branch at every call site.** Drift + 2x test surface + visual noise in pages.
- **Option C: Capacitor-only (drop web fallback).** Means M1-M5 web emulation breaks; web production deploy breaks.

## Consequences

- New native helper = one file in `src/core/native/`. Wired via `vite.config.js` CORE_FILES extension (`native/<name>.js`).
- `PB.native.push._launchPhaseBActive` flag gates push activation — flipped to true when Apple Developer + APNs cert ready (Launch Phase B Founder workstream).
- Web fallback uses standard W3C APIs (geolocation, vibrate, Web Share, fetch, localStorage). Where W3C API missing on iOS Safari (e.g., navigator.vibrate is no-op), fallback gracefully degrades.

## Cross-reference

- `src/core/native/index.js` — runtime detection + namespace
- `src/core/native/{device,storage,gps,camera,haptics,share,push}.js` — 7 helper modules
- `capacitor.config.json` — bundle ID com.parbaughs.app
- M1 ship — `docs/agents/ships/M1.md` + `.claude/state/ship-progress/M1.json`
