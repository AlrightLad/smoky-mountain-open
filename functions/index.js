/**
 * Firebase Cloud Functions for The Parbaughs
 * Gen1, Node20, us-central1
 *
 * Functions:
 *   1. sendPushNotification — triggers on pendingPush doc creation,
 *      looks up member's fcmToken, sends via FCM, deletes the doc.
 *   2. searchCourses — existing course search proxy (not included here,
 *      deployed separately).
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * sendPushNotification
 *
 * Triggered when a new document is created in the pendingPush collection.
 * Reads the target member's FCM token from their member doc and sends
 * a push notification via Firebase Cloud Messaging.
 *
 * Document schema (pendingPush):
 *   { toUserId: string, title: string, body: string,
 *     data: { type: string, page: string }, createdAt: timestamp }
 *
 * After sending (or if no token), the pendingPush doc is deleted.
 * This keeps the collection clean — it's a transient queue, not a log.
 */
exports.sendPushNotification = functions
  .region("us-central1")
  .firestore.document("pendingPush/{pushId}")
  .onCreate(async (snap, context) => {
    const push = snap.data();
    if (!push || !push.toUserId) {
      // Invalid doc — clean up and exit
      await snap.ref.delete();
      return null;
    }

    const toUserId = push.toUserId;
    const title = push.title || "The Parbaughs";
    const body = push.body || "";
    const data = push.data || {};

    try {
      // Look up the target member's FCM token
      const memberDoc = await db.collection("members").doc(toUserId).get();
      if (!memberDoc.exists) {
        console.log(`[Push] Member ${toUserId} not found — deleting push`);
        await snap.ref.delete();
        return null;
      }

      const member = memberDoc.data();
      const fcmToken = member.fcmToken;

      if (!fcmToken) {
        // Member hasn't opted into push notifications — skip silently
        console.log(`[Push] No FCM token for ${toUserId} (${member.name || "member"}) — notifications not enabled`);
        await snap.ref.delete();
        return null;
      }

      // Build the FCM message
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

      // Send via FCM
      await messaging.send(message);
      console.log(`[Push] Sent to ${member.name || toUserId}: "${title}" — "${body}"`);
    } catch (error) {
      if (error.code === "messaging/registration-token-not-registered" ||
          error.code === "messaging/invalid-registration-token") {
        // Token is stale — clear it from the member doc
        console.log(`[Push] Stale token for ${toUserId} — clearing`);
        await db.collection("members").doc(toUserId).update({
          fcmToken: admin.firestore.FieldValue.delete(),
        });
      } else {
        console.error(`[Push] Error sending to ${toUserId}:`, error.message);
      }
    }

    // Always delete the pendingPush doc (it's a queue, not a log)
    await snap.ref.delete();
    return null;
  });
