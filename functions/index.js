/**
 * Firebase Cloud Functions for The Parbaughs
 * Gen1, Node22, us-central1
 *
 * Functions:
 *   Existing (pre-v8):
 *     - searchCourses           HTTP      GolfCourseAPI proxy.
 *     - validateInvite          HTTP      Invite-code validation.
 *     - sendPushNotification    Firestore onCreate(pendingPush).
 *
 *   v8.0.0 additions (rc2.3 scaffold):
 *     - onMemberRoleChange      Firestore onWrite(members/{uid}).
 *     - onLeagueDelete          Firestore onDelete(leagues/{id}).
 *     - joinLeague              HTTPS callable.
 *     - onFounderAccessLog      Firestore onCreate(founder_access_logs/{id}).
 *     - expireSuspensionsAndTransfers  Scheduled, every 1 hour.
 *
 * Design references:
 *   - docs/v8.0-technical-design.md Section 5 (Cloud Functions)
 *   - docs/v8-decisions-log.md decision 8.1 (platform_audit_log)
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const https = require('https');
const crypto = require('crypto');

// Goal 2 A7 (zod input validation) + A3 (rate limiting).
// Both are code-only — production behavior unchanged until firebase deploy
// is approved per AMD-018 gate 1.
const {
  validateInviteRequestSchema,
  joinLeagueRequestSchema,
  searchCoursesQuerySchema,
} = require('./lib/validators');
const rateLimit = require('./lib/rate-limit');

// NOTE on FieldValue / Timestamp imports:
// Under firebase-admin v13 + firebase-functions v7, the legacy namespace
// access `admin.firestore.FieldValue` is not reliably available inside
// the functions emulator runtime sandbox (works at module load, fails
// inside handler invocations). Using the modular subpath import is the
// stable v13 pattern. Confirmed against the emulator during rc2.3 smoke.

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// v8.11.2 — origin check hardened. Old startsWith pattern matched
// 'https://alrightlad.github.io.evil.com' against 'https://alrightlad.github.io'.
// New helper parses URLs and exact-matches hostname; file:// is allow-listed
// for the Capacitor mobile shell (no hostname).
const ALLOWED_HOSTNAMES = [
  'alrightlad.github.io',          // production (GitHub Pages)
  'parbaughs-staging.web.app',     // staging (Firebase Hosting)
  'parbaughs-staging.firebaseapp.com',
  'localhost',                     // local dev (Vite)
  '127.0.0.1',                     // local dev (loopback)
];
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin.startsWith('file://')) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return ALLOWED_HOSTNAMES.indexOf(host) !== -1;
  } catch (e) { return false; }
}
const FOUNDING_CODE = 'FOUNDING-FOUR';
const FOUNDING_CODE_MAX_USES = 4;

// ══════════════════════════════════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════════════════════════════════

// Normalize + hash email for banned_emails/{emailHash}. Lowercase + trim
// before hashing so "User@X.com " and "user@x.com" collide.
function hashEmail(email) {
  return crypto.createHash('sha256')
    .update(String(email || '').toLowerCase().trim())
    .digest('hex');
}

// Append an audit entry to platform_audit_log. Writes via Admin SDK,
// bypassing firestore rules (which deny client writes to this collection).
async function writePlatformAuditLog(entry) {
  return db.collection('platform_audit_log').add({
    timestamp: FieldValue.serverTimestamp(),
    targetUid: entry.targetUid || null,
    action: entry.action || null,
    before: entry.before || null,
    after: entry.after || null,
    issuedBy: entry.issuedBy || null,
    reason: entry.reason || null,
  });
}

// Invite-code validation, shared between validateInvite (HTTP) and
// joinLeague (callable). Zero behavior change vs. the pre-refactor
// validateInvite — same collection reads, same status checks, same
// return shape. No email-blocklist check here (that's layered in at
// validateInvite for registration; joinLeague is for existing users).
async function validateInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, reason: 'Invite code required' };
  }
  const upperCode = code.trim().toUpperCase();

  if (upperCode === FOUNDING_CODE) {
    const snap = await db.collection('members')
      .where('isFoundingFour', '==', true).get();
    if (snap.size >= FOUNDING_CODE_MAX_USES) {
      return { valid: false, reason: 'FOUNDING-FOUR fully used (4/4)' };
    }
    return { valid: true, founding: true, code: upperCode };
  }

  const doc = await db.collection('invites').doc(upperCode).get();
  if (!doc.exists) return { valid: false, reason: 'Invite code not found' };
  const d = doc.data();
  if (d.status === 'used') return { valid: false, reason: 'Invite already used' };
  if (d.status === 'revoked') return { valid: false, reason: 'Invite revoked' };
  if (d.expiresAt) {
    const exp = d.expiresAt.toDate ? d.expiresAt.toDate() : new Date(d.expiresAt);
    if (new Date() > exp) {
      return { valid: false, reason: 'Invite code has expired. Ask for a new one.' };
    }
  }
  // P2 fix (iter 16, 2026-05-14, Founder directive — "invite link auto-apply"):
  // return the invite's leagueId so the client can set the new member's
  // leagues[] + activeLeague to the league the invite was created for.
  // Without this, the client fell back to "the-parbaughs" for every
  // non-founding invite — users joining other leagues got dropped into
  // the founding league instead. d.leagueId is null for legacy invites
  // created before iter 16; the client handles null via fallback to
  // "the-parbaughs" (preserves prior behavior for legacy codes).
  return { valid: true, createdBy: d.createdBy || null, leagueId: d.leagueId || null, code: upperCode };
}

// ══════════════════════════════════════════════════════════════════════
// searchCourses — HTTP, GolfCourseAPI proxy (unchanged from prod baseline)
// ══════════════════════════════════════════════════════════════════════

exports.searchCourses = functions.https.onRequest((req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = isAllowedOrigin(origin);
  if (!isAllowed && origin) { res.status(403).json({ error: 'Not authorized' }); return; }
  res.set('Access-Control-Allow-Origin', 'https://alrightlad.github.io');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  // Rate limit by client IP (60/min) — cost-amplification defense.
  const ip = rateLimit.clientIp(req);
  const limit = rateLimit.check('searchCourses', ip, rateLimit.LIMITS.searchCourses);
  if (!limit.allowed) {
    res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
    return;
  }

  // Zod input validation. Replaces the prior ad-hoc check.
  const parsed = searchCoursesQuerySchema.safeParse({ q: req.query.q, key: req.query.key });
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', detail: parsed.error.issues[0].message });
    return;
  }
  // v8.24.42 — server-held key fallback (course auto-create). A member
  // device without a personal key can still search; the platform key lives
  // in the function's env (GOLFCOURSE_API_KEY), never in the bundle.
  const { q: query, key: clientKey } = parsed.data;
  const apiKey = clientKey || process.env.GOLFCOURSE_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Course search not configured' });
    return;
  }

  const url = `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(query)}`;
  https.get(url, { headers: { 'Authorization': 'Key ' + apiKey } }, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => { res.status(apiRes.statusCode).set('Content-Type', 'application/json').send(data); });
  }).on('error', (err) => { res.status(500).json({ error: err.message }); });
});

// ══════════════════════════════════════════════════════════════════════
// validateInvite — HTTP. Thin adapter over validateInviteCode helper.
// ══════════════════════════════════════════════════════════════════════

exports.validateInvite = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = isAllowedOrigin(origin);
  if (!isAllowed && origin) { res.status(403).json({ valid: false, reason: 'Not authorized' }); return; }
  res.set('Access-Control-Allow-Origin', 'https://alrightlad.github.io');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ valid: false, reason: 'Method not allowed' }); return; }

  // Rate limit by IP (30/min) — invite-code brute-force defense.
  const ip = rateLimit.clientIp(req);
  const limit = rateLimit.check('validateInvite', ip, rateLimit.LIMITS.validateInvite);
  if (!limit.allowed) {
    res.status(429).json({ valid: false, reason: 'Too many attempts. Try again in a minute.' });
    return;
  }

  // Zod validation. Email is optional; older clients without email still work.
  const parsed = validateInviteRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.json({ valid: false, reason: parsed.error.issues[0].message });
    return;
  }
  const { code, email } = parsed.data;

  // Email blocklist (layered before invite-code validation). Populated
  // by onMemberRoleChange when a member is banned. Email is optional
  // on the request — older clients that don't send it get invite-code
  // validation only. Fails open on lookup errors: invite-code check is
  // the primary security layer, and a blocklist infra outage should not
  // block legitimate registrations.
  if (email && typeof email === 'string') {
    try {
      const emailHash = hashEmail(email);
      const blocked = await db.collection('banned_emails').doc(emailHash).get();
      if (blocked.exists) {
        res.json({
          valid: false,
          reason: 'This email cannot be used to register. Contact support if you believe this is an error.',
        });
        return;
      }
    } catch (err) {
      console.error('validateInvite blocklist check failed:', err);
      // Fall through to invite-code validation.
    }
  }

  try {
    const result = await validateInviteCode(code);
    if (!result.valid) { res.json({ valid: false, reason: result.reason }); return; }
    if (result.founding) { res.json({ valid: true, founding: true }); return; }
    res.json({ valid: true, createdBy: result.createdBy || null });
  } catch (err) {
    console.error('validateInvite error:', err);
    res.status(500).json({ valid: false, reason: 'Could not validate invite. Try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════
// deleteMyAccount — HTTP. App Store 5.1.1(v) / GDPR Art. 17 self-erasure.
//
// The client re-authenticates the user (password) in the app, mints a
// FRESH ID token via getIdToken(true), and POSTs here with
// `Authorization: Bearer <idToken>`. Firestore rules forbid a client from
// deleting its own member doc (members allow delete: if amIFounder()), so
// erasure runs here under the Admin SDK, which bypasses rules. Scope
// matches the in-app copy exactly: the member doc, the member's photos,
// and the Firebase Auth account.
//
// Defense-in-depth: we require auth_time within the last 5 minutes. Reauth
// updates auth_time and the forced token refresh carries it, so a real
// request always satisfies this while a replayed stale token does not.
//
// Partial-failure safety: the auth account is deleted LAST. If Firestore
// cleanup throws, the user's sign-in still works so they can retry;
// deleting auth first would strand orphaned docs with no retry path.
//
// AMD-018 gate 1: deploy requires Founder pre-authorization. Until deployed
// the endpoint 404s and the client routes the user to support (nothing is
// deleted), which is the correct fail-closed behavior.
// ══════════════════════════════════════════════════════════════════════

const ACCOUNT_DELETE_MAX_AUTH_AGE_MS = 5 * 60 * 1000;

exports.deleteMyAccount = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = isAllowedOrigin(origin);
  if (!isAllowed && origin) { res.status(403).json({ deleted: false, reason: 'Not authorized' }); return; }
  // Reflect the validated origin so production + staging hosting both work.
  res.set('Access-Control-Allow-Origin', isAllowed ? origin : 'https://alrightlad.github.io');
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ deleted: false, reason: 'Method not allowed' }); return; }

  // Verify the bearer token. checkRevoked=true rejects tokens revoked since issue.
  const authHeader = req.headers.authorization || '';
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) { res.status(401).json({ deleted: false, reason: 'Missing credentials' }); return; }
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(m[1], true);
  } catch (err) {
    res.status(401).json({ deleted: false, reason: 'Invalid or expired session' });
    return;
  }
  const uid = decoded.uid;

  // Rate limit per uid (5/min) — deletion is rare and reauth already gates it.
  const limit = rateLimit.check('deleteMyAccount', uid, rateLimit.LIMITS.deleteMyAccount);
  if (!limit.allowed) {
    res.status(429).json({ deleted: false, reason: 'Too many attempts. Try again in a minute.' });
    return;
  }

  // Require a recently-minted token (reauth within 5 min). auth_time is in
  // seconds since epoch; reject stale/replayed tokens.
  const authTimeMs = (decoded.auth_time || 0) * 1000;
  if (!authTimeMs || (Date.now() - authTimeMs) > ACCOUNT_DELETE_MAX_AUTH_AGE_MS) {
    res.status(401).json({ deleted: false, reason: 'Please re-enter your password and try again' });
    return;
  }

  try {
    // 1. Member doc.
    await db.collection('members').doc(uid).delete();

    // 2. Photos uploaded by this member (paginated batched delete, 500/batch).
    let photosDeleted = 0;
    while (true) {
      const snap = await db.collection('photos')
        .where('uploadedBy', '==', uid).limit(500).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      photosDeleted += snap.size;
      if (snap.size < 500) break;
    }

    // 3. Compliance audit trail (no PII — uid + action only). Written before
    //    auth deletion so it always lands.
    try {
      await writePlatformAuditLog({
        targetUid: uid,
        action: 'account_self_deleted',
        issuedBy: uid,
        reason: 'App Store 5.1.1(v) / GDPR Art. 17 self-service erasure',
        after: { photosDeleted: photosDeleted },
      });
    } catch (logErr) {
      console.error('[DeleteAccount] audit log failed (non-fatal):', logErr.message);
    }

    // 4. Auth account LAST so Firestore failures above stay retryable.
    await admin.auth().deleteUser(uid);

    console.log(`[DeleteAccount] Erased ${uid} (photos: ${photosDeleted})`);
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('[DeleteAccount] error:', err.message);
    res.status(500).json({ deleted: false, reason: 'Could not complete deletion. Try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════
// sendPushNotification — Firestore trigger (unchanged from prod baseline)
// ══════════════════════════════════════════════════════════════════════

exports.sendPushNotification = functions
  .region("us-central1")
  .firestore.document("pendingPush/{pushId}")
  .onCreate(async (snap, context) => {
    const push = snap.data();
    if (!push || !push.toUserId) {
      await snap.ref.delete();
      return null;
    }

    const toUserId = push.toUserId;
    const title = push.title || "The Parbaughs";
    const body = push.body || "";
    const data = push.data || {};

    try {
      const memberDoc = await db.collection("members").doc(toUserId).get();
      if (!memberDoc.exists) {
        console.log(`[Push] Member ${toUserId} not found — deleting push`);
        await snap.ref.delete();
        return null;
      }

      const member = memberDoc.data();
      const fcmToken = member.fcmToken;

      if (!fcmToken) {
        console.log(`[Push] No FCM token for ${toUserId} (${member.name || "member"}) — notifications not enabled`);
        await snap.ref.delete();
        return null;
      }

      const message = {
        token: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: data.type || "general",
          page: data.page || "",
          click_action: "https://alrightlad.github.io/smoky-mountain-open/",
        },
        webpush: {
          notification: {
            icon: "https://alrightlad.github.io/smoky-mountain-open/watermark.jpg",
            badge: "https://alrightlad.github.io/smoky-mountain-open/watermark.jpg",
          },
          fcmOptions: {
            link: "https://alrightlad.github.io/smoky-mountain-open/",
          },
        },
      };

      await messaging.send(message);
      console.log(`[Push] Sent to ${member.name || toUserId}: "${title}" — "${body}"`);
    } catch (error) {
      if (error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token") {
        console.log(`[Push] Stale token for ${toUserId} — clearing`);
        await db.collection("members").doc(toUserId).update({
          fcmToken: FieldValue.delete(),
        });
      } else {
        console.error(`[Push] Error sending to ${toUserId}:`, error.message);
      }
    }

    await snap.ref.delete();
    return null;
  });

// ══════════════════════════════════════════════════════════════════════
// onMemberRoleChange — Firestore onWrite(members/{uid}).
// Observes platformRole transitions. Performs side effects: revoke
// sessions on ban, manage banned_emails blocklist, notify user, write
// platform_audit_log entry. No-op if platformRole is unchanged.
//
// Per tech design Section 5.2.a + decision 8.1 (audit log).
// ══════════════════════════════════════════════════════════════════════

exports.onMemberRoleChange = functions
  .region("us-central1")
  .firestore.document("members/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    // Deletion: handled by separate flow (account erasure). Skip.
    if (!after) return null;

    const oldRole = before ? (before.platformRole || null) : null;
    const newRole = after.platformRole || null;

    if (oldRole === newRole) return null; // not a role change

    console.log(`[RoleChange] ${uid}: ${oldRole || '∅'} → ${newRole || '∅'}`);

    // ─── Transition: any → banned ───────────────────────────────────
    if (newRole === 'banned' && oldRole !== 'banned') {
      try {
        await admin.auth().revokeRefreshTokens(uid);
        console.log(`[RoleChange] Revoked refresh tokens for ${uid}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`[RoleChange] No auth record for ${uid}; skipping token revoke`);
        } else {
          console.error(`[RoleChange] Token revoke failed for ${uid}:`, err.message);
        }
      }
      if (after.email) {
        const emailHash = hashEmail(after.email);
        await db.collection('banned_emails').doc(emailHash).set({
          bannedAt: FieldValue.serverTimestamp(),
          bannedUid: uid,
        });
        console.log(`[RoleChange] Added ${emailHash.slice(0, 8)}… to banned_emails`);
      }
      const banReason = after.ban && after.ban.reason;
      const banPrivate = after.ban && after.ban.reasonPrivate;
      await db.collection('notifications').add({
        toUid: uid,
        type: 'ban',
        title: 'Your account has been banned',
        body: banPrivate || !banReason
          ? 'Contact support if you would like to appeal.'
          : `Reason: ${banReason}. Contact support to appeal.`,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });
    }

    // ─── Transition: any → suspended ────────────────────────────────
    if (newRole === 'suspended' && oldRole !== 'suspended') {
      const susReason = after.suspension && after.suspension.reason;
      const susPrivate = after.suspension && after.suspension.reasonPrivate;
      const susUntil = after.suspension && after.suspension.until;
      let bodyParts = [];
      if (!susPrivate && susReason) bodyParts.push(`Reason: ${susReason}.`);
      if (susUntil) {
        const untilDate = susUntil.toDate ? susUntil.toDate() : new Date(susUntil);
        bodyParts.push(`Ends ${untilDate.toISOString().split('T')[0]}.`);
      }
      await db.collection('notifications').add({
        toUid: uid,
        type: 'suspension',
        title: 'Your account has been suspended',
        body: bodyParts.join(' ') || 'Contact support for details.',
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });
    }

    // ─── Transition: banned → user (reinstatement) ──────────────────
    if (oldRole === 'banned' && newRole === 'user') {
      if (after.email) {
        const emailHash = hashEmail(after.email);
        await db.collection('banned_emails').doc(emailHash).delete().catch(() => {});
        console.log(`[RoleChange] Removed ${emailHash.slice(0, 8)}… from banned_emails (unban)`);
      }
      await db.collection('notifications').add({
        toUid: uid,
        type: 'reinstatement',
        title: 'Your account has been reinstated',
        body: 'Full access has been restored. Welcome back.',
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });
    }

    // ─── Transition: suspended → user ───────────────────────────────
    if (oldRole === 'suspended' && newRole === 'user') {
      await db.collection('notifications').add({
        toUid: uid,
        type: 'reinstatement',
        title: 'Your suspension has ended',
        body: 'Full access has been restored.',
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      });
    }

    // ─── Audit log entry (every role transition) ────────────────────
    // Resolve issuedBy + reason from whichever sidecar object is relevant
    // to the new state. For unban/unsuspend there's no sidecar object
    // with an issuer; leave null.
    let issuedBy = null;
    let reason = null;
    if (newRole === 'banned' && after.ban) {
      issuedBy = after.ban.issuedBy || null;
      reason = after.ban.reason || null;
    } else if (newRole === 'suspended' && after.suspension) {
      issuedBy = after.suspension.issuedBy || null;
      reason = after.suspension.reason || null;
    }

    try {
      await writePlatformAuditLog({
        targetUid: uid,
        action: `role_change:${oldRole || 'none'}→${newRole || 'none'}`,
        before: {
          platformRole: oldRole,
          suspension: (before && before.suspension) || null,
          ban: (before && before.ban) || null,
        },
        after: {
          platformRole: newRole,
          suspension: after.suspension || null,
          ban: after.ban || null,
        },
        issuedBy: issuedBy,
        reason: reason,
      });
    } catch (err) {
      console.error(`[RoleChange] Audit log write failed for ${uid}:`, err.message);
      // Do not rethrow — audit failure should not roll back the role transition.
    }

    return null;
  });

// ══════════════════════════════════════════════════════════════════════
// onLeagueDelete — Firestore onDelete(leagues/{leagueId}).
// Cascade cleanup when a league is deleted. Deletes league-scoped
// content (rounds, chat, wagers, etc.), deletes joinRequests subcollection,
// orphans moderation_log subcollection (preserves audit history),
// removes the leagueId from every affected member's leagues[] array,
// reassigns activeLeague where the deleted league was the active one.
//
// Defense in depth: refuses to cascade if the deleted league had
// badge === "founding" (rules should already block the delete; this is
// a safety belt).
//
// Per tech design Section 5.2.c + resolved DESIGN NEEDED 5.2.c.1
// (cascade most, orphan moderation_log).
// ══════════════════════════════════════════════════════════════════════

const CASCADE_DELETE_COLLECTIONS = [
  'rounds', 'chat', 'teetimes', 'wagers', 'bounties',
  'scrambleTeams', 'calendar_events', 'scheduling_chat',
  'trips', 'tripscores', 'partygames', 'social_actions',
  'syncrounds', 'liverounds', 'rangeSessions',
];

async function deleteByLeagueId(collName, leagueId) {
  let total = 0;
  // Paginated batched delete, 500 per batch (Firestore hard cap).
  while (true) {
    const snapshot = await db.collection(collName)
      .where('leagueId', '==', leagueId)
      .limit(500).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    total += snapshot.size;
    if (snapshot.size < 500) break;
  }
  return total;
}

exports.onLeagueDelete = functions
  .region("us-central1")
  .firestore.document("leagues/{leagueId}")
  .onDelete(async (snap, context) => {
    const leagueId = context.params.leagueId;
    const league = snap.data() || {};

    // Defense-in-depth: never cascade on the founding league.
    if (league.badge === 'founding') {
      console.error(`[LeagueDelete] REFUSING cascade on founding league ${leagueId}`);
      return null;
    }

    console.log(`[LeagueDelete] Cascading cleanup for ${leagueId} ("${league.name || ''}")`);

    // 1. Delete league-scoped docs across CASCADE_DELETE_COLLECTIONS.
    for (const collName of CASCADE_DELETE_COLLECTIONS) {
      try {
        const n = await deleteByLeagueId(collName, leagueId);
        if (n > 0) console.log(`[LeagueDelete]   ${collName}: ${n} docs`);
      } catch (err) {
        console.error(`[LeagueDelete] Failed sweeping ${collName}:`, err.message);
        // Keep going — other collections may still be cleanable.
      }
    }

    // 2. Delete joinRequests subcollection (ephemeral, no audit value).
    try {
      const joinReqs = await db.collection('leagues').doc(leagueId)
        .collection('joinRequests').limit(500).get();
      if (!joinReqs.empty) {
        const batch = db.batch();
        joinReqs.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`[LeagueDelete]   joinRequests: ${joinReqs.size} docs`);
      }
    } catch (err) {
      console.error(`[LeagueDelete] Failed sweeping joinRequests:`, err.message);
    }

    // 3. moderation_log: intentionally NOT deleted. Orphaned subcollection
    //    docs retain their existing rules (readable by target user + Founder)
    //    per decision 8.3.a + tech design 5.2.c.1 recommendation.

    // 4. Remove leagueId from every affected member's leagues[] and
    //    reassign activeLeague if it pointed at the deleted league.
    try {
      const affected = await db.collection('members')
        .where('leagues', 'array-contains', leagueId).get();
      const writes = [];
      affected.docs.forEach(m => {
        const data = m.data();
        const remaining = (data.leagues || []).filter(l => l !== leagueId);
        const update = {
          leagues: FieldValue.arrayRemove(leagueId),
        };
        if (data.activeLeague === leagueId) {
          update.activeLeague = remaining.length > 0 ? remaining[0] : null;
        }
        writes.push(m.ref.update(update));
      });
      await Promise.all(writes);
      console.log(`[LeagueDelete]   members updated: ${affected.size}`);
    } catch (err) {
      console.error(`[LeagueDelete] Failed updating members:`, err.message);
    }

    return null;
  });

// ══════════════════════════════════════════════════════════════════════
// joinLeague — HTTPS callable.
// Validates invite code, validates member doc exists, validates the
// user isn't per-league-banned or already a member, atomically adds
// the user to league.memberUids + increments memberCount + appends
// leagueId to member.leagues[]. Marks single-use invites as used.
//
// Per tech design Section 5.2.f + Section 3.7.f.1 Option B (callable
// bypass of rules via Admin SDK).
// ══════════════════════════════════════════════════════════════════════

exports.joinLeague = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const uid = context.auth.uid;

    // Rate limit by uid (10/min) — anti-spam.
    const limit = rateLimit.check('joinLeague', uid, rateLimit.LIMITS.joinLeague);
    if (!limit.allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted', 'Too many join attempts. Wait a minute and try again.');
    }

    // Zod input validation.
    const parsed = joinLeagueRequestSchema.safeParse(data || {});
    if (!parsed.success) {
      throw new functions.https.HttpsError(
        'invalid-argument', parsed.error.issues[0].message);
    }
    const { leagueId, inviteCode } = parsed.data;

    // Validate invite.
    const result = await validateInviteCode(inviteCode);
    if (!result.valid) {
      throw new functions.https.HttpsError('failed-precondition',
        result.reason || 'Invalid invite code');
    }
    if (result.founding) {
      throw new functions.https.HttpsError('failed-precondition',
        'FOUNDING-FOUR is registration-only, not usable for joining leagues');
    }
    // v8.24.54 (sec #23) — bind the invite to its league. A league-scoped
    // invite can only join the league it was cut for; otherwise a member
    // holding any valid code could substitute an arbitrary target leagueId
    // and join leagues they were never invited to. Legacy null-leagueId
    // invites keep the prior open behavior. (Ships on the next functions deploy.)
    if (result.leagueId && result.leagueId !== leagueId) {
      throw new functions.https.HttpsError('failed-precondition',
        'This invite is not for that league.');
    }

    // Member doc must exist (registration is separate).
    const memberRef = db.collection('members').doc(uid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition',
        'Member profile not found — complete registration first');
    }
    const member = memberSnap.data();

    // Platform state gates (suspended/banned can't join anything).
    if (member.platformRole === 'banned') {
      throw new functions.https.HttpsError('permission-denied',
        'Banned accounts cannot join leagues');
    }
    if (member.platformRole === 'suspended') {
      throw new functions.https.HttpsError('permission-denied',
        'Suspended accounts cannot join leagues');
    }

    // League must exist.
    const leagueRef = db.collection('leagues').doc(leagueId);
    const leagueSnap = await leagueRef.get();
    if (!leagueSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'League not found');
    }
    const league = leagueSnap.data();

    // Per-league ban.
    if (Array.isArray(league.bans) && league.bans.indexOf(uid) !== -1) {
      throw new functions.https.HttpsError('permission-denied',
        'You are banned from this league');
    }

    // Already a member.
    if (Array.isArray(league.memberUids) && league.memberUids.indexOf(uid) !== -1) {
      throw new functions.https.HttpsError('already-exists',
        'You are already a member of this league');
    }

    // Race-safe write: transaction re-reads league doc to guard against
    // memberCount double-increment if joinLeague is called twice in
    // quick succession (network retry, client double-click). arrayUnion
    // is idempotent; increment is not. Invite consumption also moves
    // inside the transaction so single-use marking is race-safe.
    //
    // Pre-transaction checks above remain for fast-fail UX (clear error
    // messages before we pay for a transaction round-trip). The
    // transaction is the safety net, not the primary validator.
    const inviteRef = db.collection('invites').doc(result.code);

    await db.runTransaction(async (tx) => {
      // All reads must precede writes in a Firestore transaction.
      const leagueFresh = await tx.get(leagueRef);
      const inviteFresh = await tx.get(inviteRef);

      if (!leagueFresh.exists) {
        throw new functions.https.HttpsError('not-found', 'League not found');
      }
      const freshData = leagueFresh.data();
      const freshMemberUids = Array.isArray(freshData.memberUids)
        ? freshData.memberUids : [];

      if (freshMemberUids.indexOf(uid) !== -1) {
        // Already a member per the fresh read — idempotent no-op. The
        // pre-transaction check already returned a user-facing error
        // when applicable; this path handles the race where a parallel
        // invocation won the slot between our pre-check and the tx.
        return;
      }

      tx.update(leagueRef, {
        memberUids: FieldValue.arrayUnion(uid),
        memberCount: FieldValue.increment(1),
      });
      tx.update(memberRef, {
        leagues: FieldValue.arrayUnion(leagueId),
      });

      // TODO v8.x: multi-use invite quota semantics — currently
      // multi-use invites (maxUses > 1) stay open with no partial-use
      // tracking. Product decision needed on invite quota model.
      if (inviteFresh.exists) {
        const inv = inviteFresh.data();
        const maxUses = inv.maxUses || 1;
        if (maxUses <= 1) {
          tx.update(inviteRef, {
            status: 'used',
            usedBy: uid,
            usedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    });

    console.log(`[JoinLeague] ${uid} joined ${leagueId}`);
    return { success: true, leagueId: leagueId };
  });

// ══════════════════════════════════════════════════════════════════════
// onFounderAccessLog — Firestore onCreate(founder_access_logs/{logId}).
// When an audit entry lands (written by the Founder admin UI via its
// own code path — not this function), fan out a notification to every
// member of the affected league so they can see the read occurred.
//
// Per tech design Section 5.2.b.
// ══════════════════════════════════════════════════════════════════════

exports.onFounderAccessLog = functions
  .region("us-central1")
  .firestore.document("founder_access_logs/{logId}")
  .onCreate(async (snap, context) => {
    const log = snap.data() || {};
    if (!log.leagueId) {
      console.log(`[FounderAccessLog] ${context.params.logId} missing leagueId; skipping notify`);
      return null;
    }

    const leagueSnap = await db.collection('leagues').doc(log.leagueId).get();
    if (!leagueSnap.exists) {
      console.log(`[FounderAccessLog] League ${log.leagueId} not found`);
      return null;
    }
    const league = leagueSnap.data();
    const memberUids = Array.isArray(league.memberUids) ? league.memberUids : [];

    // Exclude the issuer from their own fan-out. The Founder knows what
    // they did; the notification is for the rest of the league.
    // Tolerate either issuedBy or founderUid as the field name — tech
    // design Section 2.4 names it founderUid, but earlier scaffolds
    // wrote issuedBy. Accept both.
    const issuerUid = log.issuedBy || log.founderUid || null;
    const notifyUids = issuerUid
      ? memberUids.filter(u => u !== issuerUid)
      : memberUids;

    const reasonText = log.reason ? `Reason: ${log.reason}.` : 'No reason provided.';
    const dataText = log.dataType ? `private ${log.dataType}` : 'private content';
    const leagueName = league.name || log.leagueId;
    const body = `The Founder accessed ${dataText} in ${leagueName}. ${reasonText}`;

    const writes = notifyUids.map(memberUid => db.collection('notifications').add({
      toUid: memberUid,
      type: 'founder_access',
      title: 'Founder accessed private content',
      body: body,
      leagueId: log.leagueId,
      linkedLogId: context.params.logId,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    }));
    await Promise.all(writes);
    const issuerSuffix = issuerUid
      ? ` (excluded issuer ${issuerUid.slice(0, 8)}…)`
      : ' (no issuer field, notified all)';
    console.log(`[FounderAccessLog] Notified ${notifyUids.length} of ${memberUids.length} members in ${log.leagueId}${issuerSuffix}`);
    return null;
  });

// ══════════════════════════════════════════════════════════════════════
// expireSuspensionsAndTransfers — Scheduled, every 1 hour.
//   1. Flip platformRole: "suspended" → "user" when suspension.until < now.
//   2. Finalize accepted founder transfers past coolingOffEndsAt.
//   3. Mark pending transfers expired when expiresAt < now.
//
// Founder transfer finalization checks nominee is not banned before
// swapping platformConfig.founderUid; if banned, the transfer is
// auto-cancelled (per tech design Section 4.5 edge cases).
//
// Commissioner transfers in v8.0.0 have no cooling-off (immediate on
// accept, handled elsewhere). This function's accepted-transfer
// processing still selects on type === "commissioner" so future
// cooling-off refinements are picked up automatically.
// ══════════════════════════════════════════════════════════════════════

exports.expireSuspensionsAndTransfers = functions
  .region("us-central1")
  .pubsub.schedule('every 1 hours')
  .onRun(async (context) => {
    const now = Timestamp.now();
    console.log(`[Expire] Running at ${now.toDate().toISOString()}`);

    // ── 1. Expire suspensions. ──────────────────────────────────────
    try {
      const expiringSuspensions = await db.collection('members')
        .where('platformRole', '==', 'suspended')
        .where('suspension.until', '<', now)
        .get();
      if (!expiringSuspensions.empty) {
        const batch = db.batch();
        expiringSuspensions.docs.forEach(m => {
          batch.update(m.ref, {
            platformRole: 'user',
            suspension: FieldValue.delete(),
          });
        });
        await batch.commit();
        console.log(`[Expire] Restored ${expiringSuspensions.size} suspended members`);
      }
    } catch (err) {
      console.error(`[Expire] Suspension sweep failed:`, err.message);
    }

    // ── 2. Finalize accepted transfers past cooling-off. ────────────
    try {
      const finalizable = await db.collection('transfer_requests')
        .where('status', '==', 'accepted')
        .where('coolingOffEndsAt', '<', now)
        .get();

      for (const t of finalizable.docs) {
        const tx = t.data();

        if (tx.type === 'founder') {
          // Nominee-ban safety check per Section 4.5 edge case.
          const nomineeSnap = await db.collection('members').doc(tx.toUid).get();
          if (!nomineeSnap.exists || nomineeSnap.data().platformRole === 'banned') {
            await t.ref.update({
              status: 'cancelled',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledReason: 'nominee_banned_before_finalization',
            });
            console.log(`[Expire] Cancelled founder transfer ${t.id}: nominee banned`);
            continue;
          }

          // Atomic swap: platformRole flips + platformConfig update + transfer completion.
          //
          // Note: each of the two platformRole flips below will trigger
          // onMemberRoleChange and produce its own platform_audit_log
          // entry. Two entries per completion is intentional — both role
          // changes need independent paper trails. Do not dedupe.
          const batch = db.batch();
          batch.update(db.collection('members').doc(tx.fromUid), { platformRole: 'user' });
          batch.update(db.collection('members').doc(tx.toUid),   { platformRole: 'founder' });
          batch.update(db.collection('platformConfig').doc('singleton'), {
            founderUid: tx.toUid,
            lockedAt: FieldValue.serverTimestamp(),
          });
          batch.update(t.ref, {
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
          });
          await batch.commit();

          // Notifications.
          await Promise.all([
            db.collection('notifications').add({
              toUid: tx.fromUid,
              type: 'founder_transfer_completed',
              title: 'Founder transfer completed',
              body: 'The transfer to your nominee has finalized.',
              createdAt: FieldValue.serverTimestamp(),
              read: false,
            }),
            db.collection('notifications').add({
              toUid: tx.toUid,
              type: 'founder_transfer_completed',
              title: 'You are now the Platform Founder',
              body: 'The cooling-off period has ended. Full authority is active.',
              createdAt: FieldValue.serverTimestamp(),
              read: false,
            }),
          ]);

          console.log(`[Expire] Completed founder transfer ${t.id}`);
        }
        // type === "commissioner" with cooling-off is v8.1+ refinement; no code path yet.
      }
    } catch (err) {
      console.error(`[Expire] Transfer-finalization sweep failed:`, err.message);
    }

    // ── 3. Expire pending transfers past their deadline. ────────────
    try {
      const expired = await db.collection('transfer_requests')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now)
        .get();
      if (!expired.empty) {
        const batch = db.batch();
        expired.docs.forEach(t => batch.update(t.ref, {
          status: 'expired',
          expiredAt: FieldValue.serverTimestamp(),
        }));
        await batch.commit();
        console.log(`[Expire] Expired ${expired.size} pending transfers`);
      }
    } catch (err) {
      console.error(`[Expire] Pending-expiry sweep failed:`, err.message);
    }

    return null;
  });

// ══════════════════════════════════════════════════════════════════════
// purchaseCosmetic (callable) — v8.24.59, parcoin hardening (sec #17,
// founder-approved "harden parcoin"). Server-authoritative cosmetic
// purchase: the ONLY path that may add to members/{uid}.ownedCosmetics or
// deduct parcoins for a purchase. Reads the price from the world-readable,
// founder-written shop_catalog/{itemId} doc (seeded by
// scripts/seed-shop-catalog.mjs), so the client cannot dictate price or
// grant itself items for free. Idempotent on (uid,itemId): re-buying an
// owned item is a no-op success, never a double-charge.
//
// NOT YET DEPLOYED — ships on the coordinated deploy that also flips the
// rules to lock ownedCosmetics/parcoins to function-only (gate 1).
// The earn side (grantCoins, server-derived award amounts) is the larger
// staged follow-on; see task-queue/founder/parcoin-hardening.md.
// ══════════════════════════════════════════════════════════════════════
exports.purchaseCosmetic = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    const uid = context.auth.uid;
    const itemId = (data && typeof data.itemId === 'string') ? data.itemId.slice(0, 64) : '';
    if (!/^[a-z0-9_]+$/i.test(itemId)) throw new functions.https.HttpsError('invalid-argument', 'Bad item id');

    // Rate limit (anti-spam): 30 purchases/min/uid.
    const limit = rateLimit.check('purchaseCosmetic', uid, rateLimit.LIMITS.purchaseCosmetic);
    if (!limit.allowed) throw new functions.https.HttpsError('resource-exhausted', 'Slow down a moment.');

    const catSnap = await db.collection('shop_catalog').doc(itemId).get();
    if (!catSnap.exists) throw new functions.https.HttpsError('not-found', 'No such item');
    const item = catSnap.data();
    if (item.reserved || item.arriving || item.earnedBy) throw new functions.https.HttpsError('failed-precondition', 'This item is not for sale.');
    const price = typeof item.price === 'number' ? item.price : NaN;
    if (!(price >= 0)) throw new functions.https.HttpsError('failed-precondition', 'Item has no price');

    const memberRef = db.collection('members').doc(uid);
    const result = await db.runTransaction(async (tx) => {
      const m = await tx.get(memberRef);
      if (!m.exists) throw new functions.https.HttpsError('failed-precondition', 'No member profile');
      const md = m.data();
      const owned = Array.isArray(md.ownedCosmetics) ? md.ownedCosmetics : [];
      if (owned.indexOf(itemId) !== -1) return { ok: true, alreadyOwned: true, balance: md.parcoins || 0 };
      const bal = md.parcoins || 0;
      if (bal < price) throw new functions.https.HttpsError('failed-precondition', 'Not enough ParCoins');
      tx.update(memberRef, {
        parcoins: FieldValue.increment(-price),
        ownedCosmetics: FieldValue.arrayUnion(itemId),
      });
      tx.set(db.collection('parcoin_transactions').doc(), {
        uid, amount: -price, reason: 'purchase', label: 'Purchased: ' + (item.name || itemId),
        itemId, createdAt: FieldValue.serverTimestamp(), server: true,
      });
      return { ok: true, alreadyOwned: false, balance: bal - price };
    });
    return result;
  });

// ══════════════════════════════════════════════════════════════════════
// grantCoins — ParCoin Stage 2 server-authoritative EARN (closes pentest
// #16: client-written balances). HTTP + Bearer (NOT onCall — the client
// bundle has no functions SDK; every call is a raw fetch, like
// deleteMyAccount). NEVER trusts a client amount: a REASON_HANDLERS map
// re-derives the award from the authoritative doc named by sourceId.
// Idempotent via a deterministic parcoin_grants ledger id, so the same
// round/session/day can never double-pay. INERT until the gated deploy.
// ══════════════════════════════════════════════════════════════════════
const { grantCoinsRequestSchema } = require('./lib/validators');
const PCR = require('./lib/parcoin-rates');

// Mint `amount` to uid for (reason, sourceId), idempotently. grantId is the
// dedup anchor; a pre-read inside the txn makes a repeat a no-op success.
async function mintTo(uid, amount, reason, grantId, label, extraMemberFields) {
  amount = Math.round(amount || 0);
  if (amount <= 0) return { ok: true, granted: 0, dedup: false };
  const grantRef = db.collection('parcoin_grants').doc(grantId);
  const memberRef = db.collection('members').doc(uid);
  return db.runTransaction(async (tx) => {
    const g = await tx.get(grantRef);
    if (g.exists) return { ok: true, granted: 0, dedup: true };
    const m = await tx.get(memberRef);
    if (!m.exists) throw { code: 412, msg: 'No member profile' };
    const update = {
      parcoins: FieldValue.increment(amount),
      parcoinsLifetime: FieldValue.increment(amount),
    };
    if (extraMemberFields) Object.assign(update, extraMemberFields);
    tx.update(memberRef, update);
    tx.set(grantRef, { uid: uid, reason: reason, amount: amount, createdAt: FieldValue.serverTimestamp(), server: true });
    tx.set(db.collection('parcoin_transactions').doc(), {
      uid: uid, amount: amount, reason: reason, label: label || reason, createdAt: FieldValue.serverTimestamp(), server: true,
    });
    return { ok: true, granted: amount, dedup: false };
  });
}

function _todayUTC() { return new Date().toISOString().slice(0, 10); }
function _is9h(round) {
  if (round.holesPlayed && round.holesPlayed < 18) return true;
  if (Array.isArray(round.holeScores) && round.holeScores.length > 0 && round.holeScores.length < 18) return true;
  return false;
}
function _isScramble(round) { return round.format === 'scramble' || round.format === 'scramble4'; }

// Each handler re-derives {amount, grantId, label, member?} from the
// authoritative source, or returns {amount:0} to no-op. uid is the caller.
const REASON_HANDLERS = {
  async round_complete(uid, sourceId) {
    const snap = await db.collection('rounds').doc(sourceId).get();
    if (!snap.exists) return { amount: 0 };
    const r = snap.data() || {};
    if (r.player !== uid || _isScramble(r) || !(r.score > 0)) return { amount: 0 };
    return { amount: PCR.calcRoundCoins(_is9h(r), false), grantId: uid + '_round_complete_' + sourceId, label: 'Round complete' };
  },
  async round_attested_bonus(uid, sourceId) {
    const snap = await db.collection('rounds').doc(sourceId).get();
    if (!snap.exists) return { amount: 0 };
    const r = snap.data() || {};
    if (r.player !== uid || _isScramble(r) || !r.attestedBy) return { amount: 0 };
    const bonus = _is9h(r) ? PCR.PARCOIN_RATES.round_9h_attested : PCR.PARCOIN_RATES.round_18h_attested;
    return { amount: bonus, grantId: uid + '_round_attested_' + sourceId, label: 'Attested-round bonus' };
  },
  async personal_best_18h(uid, sourceId) {
    const snap = await db.collection('rounds').doc(sourceId).get();
    if (!snap.exists) return { amount: 0 };
    const r = snap.data() || {};
    if (r.player !== uid || _isScramble(r) || _is9h(r) || !(r.score > 0)) return { amount: 0 };
    const prior = await db.collection('rounds').where('player', '==', uid).get();
    let priorMin = Infinity;
    prior.forEach(function (d) { const x = d.data() || {}; if (d.id !== sourceId && !_isScramble(x) && !_is9h(x) && x.score > 0 && x.score < priorMin) priorMin = x.score; });
    if (!(r.score < priorMin)) return { amount: 0 };
    return { amount: PCR.PARCOIN_RATES.personal_best_18h, grantId: uid + '_pb18_' + sourceId, label: 'Personal best (18)' };
  },
  async personal_best_9h(uid, sourceId) {
    const snap = await db.collection('rounds').doc(sourceId).get();
    if (!snap.exists) return { amount: 0 };
    const r = snap.data() || {};
    if (r.player !== uid || _isScramble(r) || !_is9h(r) || !(r.score > 0)) return { amount: 0 };
    const prior = await db.collection('rounds').where('player', '==', uid).get();
    let priorMin = Infinity;
    prior.forEach(function (d) { const x = d.data() || {}; if (d.id !== sourceId && !_isScramble(x) && _is9h(x) && x.score > 0 && x.score < priorMin) priorMin = x.score; });
    if (!(r.score < priorMin)) return { amount: 0 };
    return { amount: PCR.PARCOIN_RATES.personal_best_9h, grantId: uid + '_pb9_' + sourceId, label: 'Personal best (9)' };
  },
  async range_session(uid, sourceId) {
    const snap = await db.collection('rangeSessions').doc(sourceId).get();
    if (!snap.exists) return { amount: 0 };
    const s = snap.data() || {};
    if (s.playerId !== uid || (s.durationMin || s.durationMinutes || 0) < 30 || s.isPrivate) return { amount: 0 };
    // 1/day cap (Founder-approved enforce): grant id keyed on the DAY, so a
    // second 30-min session the same day is a no-op.
    return { amount: PCR.PARCOIN_RATES.range_session, grantId: uid + '_range_day_' + _todayUTC(), label: 'Range session' };
  },
  async daily_login(uid, sourceId) {
    // The server uses its OWN date so a forged future/stale date cannot farm.
    const day = _todayUTC();
    return { amount: PCR.PARCOIN_RATES.daily_login, grantId: uid + '_daily_login_' + day, label: 'Daily login', member: { lastLoginDate: day } };
  },
  // achievement / scorecard_* need a server-trusted source (achievement_catalog
  // seed; course contributor-uid shape) — until those land they no-op rather
  // than mis-grant (P9 — never fabricate).
  async achievement(uid, sourceId) { return { amount: 0 }; },
  async scorecard_contribution(uid, sourceId) { return { amount: 0 }; },
  async scorecard_verify(uid, sourceId) { return { amount: 0 }; },
};

exports.grantCoins = functions.region('us-central1').https.onRequest(async function (req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = isAllowedOrigin(origin);
  if (!isAllowed && origin) { res.status(403).json({ ok: false, reason: 'Not authorized' }); return; }
  res.set('Access-Control-Allow-Origin', isAllowed ? origin : 'https://alrightlad.github.io');
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, reason: 'Method not allowed' }); return; }

  const authHeader = req.headers.authorization || '';
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) { res.status(401).json({ ok: false, reason: 'Missing credentials' }); return; }
  let decoded;
  try { decoded = await admin.auth().verifyIdToken(m[1], true); }
  catch (err) { res.status(401).json({ ok: false, reason: 'Invalid session' }); return; }
  const uid = decoded.uid;

  const limit = rateLimit.check('grantCoins', uid, rateLimit.LIMITS.grantCoins);
  if (!limit.allowed) { res.status(429).json({ ok: false, reason: 'Slow down a moment.' }); return; }

  const parsed = grantCoinsRequestSchema.safeParse(req.body || {});
  if (!parsed.success) { res.status(400).json({ ok: false, reason: 'Bad request' }); return; }
  const reason = parsed.data.reason, sourceId = parsed.data.sourceId;

  try {
    const handler = REASON_HANDLERS[reason];
    if (!handler) { res.status(400).json({ ok: false, reason: 'Unknown reason' }); return; }
    const d = await handler(uid, sourceId);
    if (!d || !(d.amount > 0)) { res.status(200).json({ ok: true, granted: 0 }); return; }
    const result = await mintTo(uid, d.amount, reason, d.grantId, d.label, d.member);
    res.status(200).json(result);
  } catch (err) {
    if (err && err.code === 412) { res.status(412).json({ ok: false, reason: err.msg }); return; }
    console.error('[grantCoins] error:', (err && err.message) || err);
    res.status(500).json({ ok: false, reason: 'Could not grant' });
  }
});

// onFeedbackEmail — emails the Commissioner on each new member bug report /
// feature request (feature_requests onCreate). Notification layer over the
// in-app triage board; provider-agnostic over Resend, fail-soft until the
// Founder configures functions/.env + deploys (AMD-018 gate 1). See
// functions/lib/feedback-email.js for the full implementation + config keys.
exports.onFeedbackEmail = require('./lib/feedback-email').onFeedbackEmail;
