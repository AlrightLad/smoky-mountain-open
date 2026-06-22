# Login security audit + the "auto-signin" question (2026-06-22)

You said the phone auto-signing you in after the first sign-in feels insecure, and asked
for a pen test of the login. Here's the honest result.

## The "auto-signin" is normal and secure — here's exactly why
When you sign in, Firebase Auth stores a **session refresh token** (NOT your password) in
the browser's secure storage, so you stay logged in across app opens. This is the **same
behavior as Gmail, Instagram, your bank app** — every "stay logged in" experience works
this way. Specifically:
- **Your password is never stored** anywhere on the device or in our code — the Firebase
  SDK exchanges it for a short-lived token at sign-in and immediately discards it.
- The token auto-expires and is refreshed by Google's servers; it can be **revoked
  instantly** by signing out (Settings → Sign out), which clears it from the device.
- If we *removed* persistence, you'd have to type your password every single app open —
  worse UX and it wouldn't be any more secure (the token is what's stored either way).

So nothing is leaking — it's the standard, expected secure session.

## Pen test of the login — findings
| Check | Result |
|---|---|
| Password handling | ✅ Handled entirely by the Firebase SDK; never stored or logged by us. |
| XSS via the email/username field | ✅ Safe — error messages render via `textContent` (escaped), not innerHTML. Confirmed in code + the built bundle. |
| Secrets in the app bundle | ✅ Clean — scanned `dist/` for private keys / service accounts / API secrets: **none**. (The `apiKey` visible in the code is a *public* Firebase project identifier, not a secret — security is enforced by Firestore rules + Auth, not by hiding it. This is by Google's design.) |
| Brute-force | ✅ Two layers: our own client-side rate-limit (`checkLoginRateLimit`) **plus** Firebase's server-side `auth/too-many-requests` throttling. |
| Password-error enumeration | ✅ Wrong-password and unknown-email now both return the **same** "Invalid email or password" (v8.25.235 hardening), so an attacker can't probe which emails are registered. |
| Account-deletion safety | ✅ Requires password re-authentication first; nothing is deleted if reauth fails. |
| Sign-out | ✅ `auth.signOut()` clears the session token + local state. |

## What I changed (v8.25.235)
- Removed email enumeration on the password path (user-not-found and wrong-password now
  return one generic message).

## Bottom line
The login is sound. The auto-signin is the normal, secure "keep me logged in" session —
not a leak. If you ever want a stricter mode (e.g., require password every open, or a
biometric lock on app open), that's a deliberate UX trade-off I can add — just say the word
and I'll wire it (it's a real feature, gated on your call since it adds friction for the
whole league).
