// ============================================================
// onFeedbackEmail — emails the Commissioner when a member files a bug
// report or feature request (anything written to feature_requests).
//
// This is a NOTIFICATION LAYER over the in-app triage board. The
// Firestore doc is the source of truth (stored regardless of email
// outcome); this trigger just pushes a heads-up to an inbox the Founder
// controls so triage doesn't require opening the app. Provider-agnostic
// over Resend's REST API — Node 22 ships global fetch, so no new npm
// dependency is required.
//
// Config (functions/.env — gitignored, Founder-provided per AMD-018
// gate 6; the function deploy itself is AMD-018 gate 1):
//   RESEND_API_KEY   secret API key from resend.com
//   FEEDBACK_TO      destination inbox   (e.g. feedback@parbaughs.com)
//   FEEDBACK_FROM    verified sender     (e.g. "Parbaughs Feedback <feedback@parbaughs.com>")
// If any are unset the function no-ops gracefully (stored-only), so it
// stays inert + safe until the Founder configures + deploys it.
//
// Abuse mitigation: wiring email creates an inbox-bombing vector, so each
// submitter is throttled to FEEDBACK_EMAIL_CAP emails per rolling hour via
// a windowed counter doc (feedback_email_throttle/{uid}, Admin-SDK-only).
// Over-cap items are still STORED — the board shows them — only the email
// is suppressed. Throttle errors fail OPEN (better to email than to drop).
// ============================================================

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

var FEEDBACK_EMAIL_CAP = 12;                  // emails per submitter per window
var FEEDBACK_EMAIL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

var TYPE_LABELS = {
  bug: 'Bug',
  ux: 'UX issue',
  feature: 'Feature request',
  content: 'Content fix',
};

// HTML-escape user-supplied text before it lands in an email body. Email
// HTML isn't an XSS sink the way the DOM is, but escaping prevents broken
// layout + keeps angle-bracketed text intact, and is cheap insurance.
function escEmail(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Atomic per-submitter hourly cap. Returns true if still under cap (and
// increments the counter). Resets the window after FEEDBACK_EMAIL_WINDOW_MS.
async function underCap(uid) {
  if (!uid) return true;
  var ref = admin.firestore().collection('feedback_email_throttle').doc(uid);
  try {
    return await admin.firestore().runTransaction(async function (tx) {
      var snap = await tx.get(ref);
      var now = Date.now();
      var windowStart = now;
      var count = 0;
      if (snap.exists) {
        var d = snap.data() || {};
        windowStart = d.windowStart || now;
        count = d.count || 0;
        if (now - windowStart >= FEEDBACK_EMAIL_WINDOW_MS) { windowStart = now; count = 0; }
      }
      if (count >= FEEDBACK_EMAIL_CAP) return false;
      tx.set(ref, { windowStart: windowStart, count: count + 1, updatedAt: Timestamp.now() }, { merge: true });
      return true;
    });
  } catch (e) {
    console.error('[onFeedbackEmail] throttle check failed (failing open):', (e && e.message) || e);
    return true;
  }
}

function buildEmail(d, reqId) {
  // Normalize the two writer shapes: bugreport.js uses
  // {submittedBy, submitterName, description, type, severity, page, steps,
  // appVersion, userAgent, viewport}; faq.js uses {from, fromName, request}.
  var name = d.submitterName || d.fromName || 'A member';
  var body = d.description || d.request || '(no description provided)';
  var type = d.type || 'feature';
  var severity = d.severity || '';
  var page = d.page || '';
  var steps = d.steps || '';
  var appVersion = d.appVersion || '';
  var ua = d.userAgent || '';
  var viewport = d.viewport || '';
  var typeLabel = TYPE_LABELS[type] || type;

  var subject = '[Parbaughs ' + typeLabel + (severity ? ' · ' + severity : '') + '] ' +
    body.slice(0, 60).replace(/\s+/g, ' ').trim();

  function row(label, val) {
    if (!val) return '';
    return '<tr><td style="padding:4px 14px 4px 0;color:#8a8a8a;vertical-align:top;white-space:nowrap">' +
      escEmail(label) + '</td><td style="padding:4px 0;color:#1a1a1a">' + escEmail(val) + '</td></tr>';
  }
  var rows = row('Type', typeLabel) + row('Severity', severity) + row('From', name) +
    row('Page', page) + row('App version', appVersion) +
    row('Device', [viewport, ua].filter(Boolean).join(' · '));

  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">' +
      '<div style="background:#0d3b2e;color:#f4ecd8;padding:16px 20px;border-radius:8px 8px 0 0">' +
        '<div style="font-size:12px;letter-spacing:.09em;text-transform:uppercase;opacity:.82">Parbaughs · Member Feedback</div>' +
        '<div style="font-size:18px;font-weight:600;margin-top:4px">' + escEmail(typeLabel) +
          (severity ? ' <span style="font-weight:400;opacity:.75;font-size:14px">· ' + escEmail(severity) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div style="border:1px solid #e3e3e3;border-top:none;border-radius:0 0 8px 8px;padding:20px">' +
        '<div style="font-size:15px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;margin-bottom:16px">' + escEmail(body) + '</div>' +
        (steps ? '<div style="font-size:13px;color:#555;background:#f6f4ee;border-radius:6px;padding:10px 12px;margin-bottom:16px;white-space:pre-wrap"><strong>Steps to reproduce</strong>\n' + escEmail(steps) + '</div>' : '') +
        '<table style="font-size:13px;border-collapse:collapse;width:100%">' + rows + '</table>' +
        '<div style="margin-top:18px;font-size:12px;color:#8a8a8a;border-top:1px solid #eee;padding-top:12px">Triage in the app: <strong>More → Admin → Feedback</strong> · ref ' + escEmail(reqId) + '</div>' +
      '</div>' +
    '</div>';

  var text = typeLabel + (severity ? ' (' + severity + ')' : '') + ' from ' + name + '\n\n' + body +
    (steps ? '\n\nSteps to reproduce:\n' + steps : '') +
    '\n\n' + [page && ('Page: ' + page), appVersion && ('App: ' + appVersion), viewport && ('Device: ' + viewport)].filter(Boolean).join('\n') +
    '\n\nTriage: More → Admin → Feedback · ref ' + reqId;

  return { subject: subject, html: html, text: text };
}

exports.onFeedbackEmail = functions
  .region('us-central1')
  .firestore.document('feature_requests/{reqId}')
  .onCreate(async function (snap, context) {
    var apiKey = process.env.RESEND_API_KEY;
    var to = process.env.FEEDBACK_TO;
    var from = process.env.FEEDBACK_FROM;
    if (!apiKey || !to || !from) {
      console.log('[onFeedbackEmail] email not configured (stored only) — set RESEND_API_KEY / FEEDBACK_TO / FEEDBACK_FROM in functions/.env.');
      return null;
    }

    var d = snap.data() || {};
    var uid = d.submittedBy || d.from || '';
    var reqId = context.params.reqId;

    if (!(await underCap(uid))) {
      console.log('[onFeedbackEmail] submitter ' + uid + ' over hourly cap — email suppressed (item still stored at feature_requests/' + reqId + ').');
      return null;
    }

    var mail = buildEmail(d, reqId);

    try {
      var resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: from,
          to: [to],
          reply_to: to,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (!resp.ok) {
        var errTxt = await resp.text().catch(function () { return ''; });
        console.error('[onFeedbackEmail] Resend ' + resp.status + ': ' + String(errTxt).slice(0, 300));
      } else {
        console.log('[onFeedbackEmail] sent feedback ' + reqId + ' to ' + to);
      }
    } catch (e) {
      console.error('[onFeedbackEmail] send error:', (e && e.message) || e);
    }
    // Never throw: a thrown error retries the trigger, which would send
    // duplicate emails for the same submission.
    return null;
  });
