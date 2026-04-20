# v8.0 Governance — Resolved Decisions Log

Quick reference. For full reasoning, see `docs/v8.0-governance-design.md`.

All decisions resolved by Zach on 2026-04-17.

## Role Hierarchy

| ID | Topic | Decision |
|----|-------|----------|
| 2.1.a | Founder role storage | Explicit `platformRole` field. No hardcoded UID checks. |
| 2.2.a | Commissioner transferable | Yes — handshake flow. v8.1+ refinement: 24–48h cooling-off. |
| 2.2.b | Founder force-transfer commissioner | Yes, via documented escalation with visible audit trail. |
| 2.3.a | Minimum admins per league | No minimum. |
| 2.6.a | Split `role` into `platformRole` + league roles | Yes, immediately in v8.0.0. |

## Capability Matrix

| ID | Topic | Decision |
|----|-------|----------|
| 3.1.a | Suspension: read-only or full lockout | Read-only. DMs/private chat fully locked during suspension. |
| 3.2.a | Admins ban vs commissioner only | Admins ban, commissioners unban. Private-flag on reasons. |
| 3.3.a | Two-key approval for league rename | No. Account security is the right layer. |
| 3.4.a | Leagueless user DM access | Friends only, via explicit social graph (v9.0 design). |
| 3.5.a | Founder reads any league's data | Option C from day 1 — full read + audit log on private content. |

## Visibility Matrix

| ID | Topic | Decision |
|----|-------|----------|
| 4.2.a | Founder visual treatment | Modified Option C — title + ring + badge, no gold name color. |
| 4.2.b | Founder ring | Glowing opal diamond + prismatic refraction name effect; custom gated. |
| 4.3.a | Title vs. role in nameplate | Option D — role as badge, title as text. |
| 4.4.a | Commissioner on share cards | No. Visual cosmetics still show. |

## Leagueless Experience

| ID | Topic | Decision |
|----|-------|----------|
| 5.1.a | Leagueless users allowed | Modified Option B — full solo/social access; league features gated. |
| 5.2.a | Seed leagueless users with content | Yes — personal-and-actionable only. |
| 5.4.a | Sortable public league discovery | Minimal sort — recent activity + text search. |
| 5.5.a | Onboarding wizard | No wizard. Quiet home + graduated nudges (24h / 7d / stop at 14d). |

## Edge Cases

| ID | Topic | Decision |
|----|-------|----------|
| 6.1.a | Commissioner deletes account | Block deletion until transfer-or-delete-league, per-league. |
| 6.2.a | Sole member leaves league | Auto-delete with confirm; literal `memberUids.length === 1`. |
| 6.3.a | Founder retires | Transfer mechanism exists; successor identity is private. |
| 6.4.a | Retroactive standings recalc after removal | No — history frozen; "Former Member" label. |
| 6.5.a | Prevent banned re-registration | Email block + session invalidate. Revisit at ~1,000 users. |
| 6.6.a | "Flag as unofficial for this league" | Defer. Out of v8. |
| 6.7.a | Appeals rate-limited | Yes — one per 30-day cooldown. |
| 6.8.a | Founder role protected from removal | Yes. Gated transfer with 7-day cooling-off, revocable. |
| 6.9.g.1 | Auto-approve for viral leagues | Out of v8. Future = batch actions + optional rules. |

## Migration

| ID | Topic | Decision |
|----|-------|----------|
| 7.1.c.1 | Legacy `role` field retention | Two releases. v8.0 adds, v8.2 removes, explicit cleanup PR. |
| 7.3.a | Which releases need announcements | v8.0.0 and v8.2.0 only, via notification bell. |
| 7.4.a | Founding four get platform-admin powers | No. Social/narrative distinction only. |

## Open Questions

| ID | Topic | Decision |
|----|-------|----------|
| 8.1.a | Rename platform role vs per-league role | Platform = Founder. Per-league = Commissioner. |
| 8.2.a | League custom branding in v8 | Out of scope. Paid feature, own design doc. |
| 8.3.a | League-scoped audit logs in v8 | Minimal log (kicks + bans). Expanded views in v9. |
| 8.5.a | GDPR full erasure path | Anonymization flow — "Erase me completely". Pre-App-Store. |

## RC-era Additions (not in original technical design)

Decisions made during rc ship work that deviate from or extend `docs/v8.0-technical-design.md`. Backlog: fold these into the next revision of the technical design.

| ID | Topic | Decision |
|----|-------|----------|
| 8.1 | Platform-role audit log location | New `platform_audit_log/{logId}` collection added for `onMemberRoleChange` audit trail. `founder_access_logs` kept scoped to reads only per its original semantic (private-content reads by Founder), not overloaded for administrative role transitions. Schema: `{ timestamp, targetUid, action, before: {platformRole, suspension?, ban?}, after: {platformRole, suspension?, ban?}, issuedBy, reason? }`. Rules: writes denied to clients (Admin SDK only via Cloud Function); reads allowed only for `amIFounder()`. Decided during v8.0.0-rc2.3 scaffold of v8 Cloud Functions. |

---

## Parked for Future Design

Product direction decisions made during v8.0 governance review that require their own Stage 1 design documents before implementation. Stubs below; full design TBD.

- **v9.0 — Social System.** Mutual/explicit friendships added from profile pages; public friend lists; gates leagueless DMs. Stub: `docs/v9.0-social-system-design.md`.
- **v9.1 — Handle System.** Discord-style `username#discriminator` for search and disambiguation. Stub: `docs/v9.1-handle-system-design.md`.
- **League Custom Branding (Phase 4 paid feature).** Per-league logos and theme colors for paid-tier leagues. Stub: `docs/league-custom-branding-design.md`.
