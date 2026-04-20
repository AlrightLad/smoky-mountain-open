/**
 * Firebase Cloud Functions for The Parbaughs
 * Gen1, Node20, us-central1
 *
 * Functions:
 *   1. searchCourses — proxies GolfCourseAPI for course search.
 *   2. validateInvite — validates FOUNDING-FOUR and regular invite codes.
 *   3. sendPushNotification — triggers on pendingPush doc creation,
 *      looks up member's fcmToken, sends via FCM, deletes the doc.
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const https = require('https');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const ALLOWED_ORIGINS = ['https://alrightlad.github.io', 'http://localhost', 'file://'];
const FOUNDING_CODE = 'FOUNDING-FOUR';
const FOUNDING_CODE_MAX_USES = 4;

exports.searchCourses = functions.https.onRequest((req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = ALLOWED_ORIGINS.some(a => origin.startsWith(a));
  if (!isAllowed && origin) { res.status(403).json({ error: 'Not authorized' }); return; }
  res.set('Access-Control-Allow-Origin', 'https://alrightlad.github.io');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const query = req.query.q;
  const apiKey = req.query.key;
  if (!query || !apiKey) { res.status(400).json({ error: 'Missing q or key' }); return; }
  const url = `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(query)}`;
  https.get(url, { headers: { 'Authorization': 'Key ' + apiKey } }, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => { res.status(apiRes.statusCode).set('Content-Type', 'application/json').send(data); });
  }).on('error', (err) => { res.status(500).json({ error: err.message }); });
});

exports.validateInvite = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isAllowed = ALLOWED_ORIGINS.some(a => origin.startsWith(a));
  if (!isAllowed && origin) { res.status(403).json({ valid: false, reason: 'Not authorized' }); return; }
  res.set('Access-Control-Allow-Origin', 'https://alrightlad.github.io');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ valid: false, reason: 'Method not allowed' }); return; }
  const { code } = req.body;
  if (!code || typeof code !== 'string') { res.status(400).json({ valid: false, reason: 'Invite code required' }); return; }
  const upperCode = code.trim().toUpperCase();
  try {
    if (upperCode === FOUNDING_CODE) {
      const snap = await db.collection('members').where('isFoundingFour', '==', true).get();
      if (snap.size >= FOUNDING_CODE_MAX_USES) { res.json({ valid: false, reason: 'FOUNDING-FOUR fully used (4/4)' }); }
      else { res.json({ valid: true, founding: true }); }
      return;
    }
    const doc = await db.collection('invites').doc(upperCode).get();
    if (!doc.exists) { res.json({ valid: false, reason: 'Invite code not found' }); return; }
    const d = doc.data();
    if (d.status === 'used') { res.json({ valid: false, reason: 'Invite already used' }); return; }
    if (d.status === 'revoked') { res.json({ valid: false, reason: 'Invite revoked' }); return; }
    if (d.expiresAt) {
      const exp = d.expiresAt.toDate ? d.expiresAt.toDate() : new Date(d.expiresAt);
      if (new Date() > exp) { res.json({ valid: false, reason: 'Invite code has expired. Ask for a new one.' }); return; }
    }
    res.json({ valid: true, createdBy: d.createdBy || null });
  } catch (err) {
    console.error('validateInvite error:', err);
    res.status(500).json({ valid: false, reason: 'Could not validate invite. Try again.' });
  }
});

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
          fcmToken: admin.firestore.FieldValue.delete(),
        });
      } else {
        console.error(`[Push] Error sending to ${toUserId}:`, error.message);
      }
    }

    await snap.ref.delete();
    return null;
  });
