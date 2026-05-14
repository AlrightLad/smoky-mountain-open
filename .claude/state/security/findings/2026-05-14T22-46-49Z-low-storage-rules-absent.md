---
severity: LOW
class: configuration-gap
detected_at: 2026-05-14T22:46:49Z
head_sha: fac33105a9aefc824dd9f48a6881bcd05e6125db
status: open
owner: Founder (decision needed)
---

# storage.rules file absent from repo

## Summary

The repository contains `firestore.rules` (693 lines, v8.0.0-rc1) but no `storage.rules`. If Firebase Storage is in use anywhere in the app, default Storage security rules apply.

## Default Firebase Storage rules behavior

By default, Firebase Storage uses these rules until a custom rules file is deployed:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Translation: **any authenticated user can read or write anywhere in the Storage bucket**. This is permissive enough that a malicious authenticated member could upload arbitrary content, overwrite other members' assets, or read all stored data.

## Is Firebase Storage in use?

Quick repo grep needed. The audit cycle did not yet determine actual usage:
- Photo gallery feature exists per CLAUDE.md ("Photo gallery with self-only delete")
- Avatar uploads likely use Storage
- Share card image generation uses html2canvas, but those may be in-memory only

## Recommended action

Owner: Founder + main agent.

1. Determine if Firebase Storage is in active use:
   - Search `src/` for `storage()`, `firebase/storage`, `getStorage`, `uploadBytes`, `ref(`
2. If in use: author `storage.rules` with explicit per-path gates (avatars, photos, etc.) matching the pattern firestore.rules uses
3. If NOT in use: confirm bucket is not provisioned, or deploy a deny-all `storage.rules` as defense in depth
4. Either way: declare baseline in `.claude/state/security/baseline.json` after action

## Why this is LOW not MEDIUM

- Default rules require authentication (not anonymous)
- League is invite-only with curated 20-member roster — no anonymous attacker can register
- Risk is internal misuse, not external breach
- Firestore is the source of truth per CLAUDE.md; Storage usage may be incidental

## Re-scan trigger

Cleared when storage.rules is added to repo, OR when explicit baseline entry confirms no Storage usage.
