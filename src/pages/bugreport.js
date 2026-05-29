// ========== W1.I1 — MEMBER BUG REPORT FORM ==========
//
// Members file bug reports + feature requests via this page. Backed by the
// existing `feature_requests` Firestore collection (rules: member-create,
// Founder-read). Bug Triage Listener agent ingests these on schedule.
//
// Per CLAUDE.md: image attachment via reusable upload pipeline is a follow-on
// once the pipeline ships (depends on W1.I1 first — chicken-and-egg dance
// resolved by shipping the text-only form first, image upload as later
// enhancement).
//
// Surface this from More / Settings menus + an inline link from any "report
// issue" affordance on member-facing pages.

Router.register("bugreport", function() {
  var h = '<div class="sh"><h2>Report a Bug</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="padding:16px;font-size:12px;color:var(--muted);line-height:1.6">';
  h += 'Saw something broken? Send a quick note. Anonymous to other members; only the Commissioner reads these.';
  h += '</div>';

  h += '<div class="section">';
  h += '<div class="card"><div class="card-body" style="padding:14px">';

  // Form
  h += '<form id="bugReportForm" onsubmit="event.preventDefault(); submitBugReport(); return false;">';

  // Type selector
  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Type</label>';
  h += '<select id="brType" style="width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:13px;min-height:44px">';
  h += '<option value="bug">Bug: something is broken</option>';
  h += '<option value="ux">UX: confusing or hard to use</option>';
  h += '<option value="feature">Feature request: new idea</option>';
  h += '<option value="content">Content: typo or wrong info</option>';
  h += '</select>';
  h += '</div>';

  // Severity
  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">How bad?</label>';
  h += '<select id="brSeverity" style="width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:13px;min-height:44px">';
  h += '<option value="minor">Minor: annoying but workaround exists</option>';
  h += '<option value="moderate" selected>Moderate: affects my round / game</option>';
  h += '<option value="critical">Critical: app unusable / data lost</option>';
  h += '</select>';
  h += '</div>';

  // Page (auto-detected)
  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Where did you see it?</label>';
  h += '<input id="brPage" type="text" placeholder="e.g. Home, Scorecard, Settings" style="width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:13px;min-height:44px">';
  h += '</div>';

  // Description
  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">What happened? (required)</label>';
  h += '<textarea id="brDescription" rows="5" required placeholder="Describe what went wrong, what you expected to happen, and how to reproduce it." style="width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:13px;font-family:inherit;line-height:1.5;resize:vertical"></textarea>';
  h += '</div>';

  // Steps to reproduce
  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Steps to reproduce (optional)</label>';
  h += '<textarea id="brSteps" rows="3" placeholder="1. Go to ... 2. Tap ... 3. Saw ..." style="width:100%;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:13px;font-family:inherit;line-height:1.5;resize:vertical"></textarea>';
  h += '</div>';

  // Submit
  h += '<button type="submit" id="brSubmitBtn" style="width:100%;padding:14px;background:var(--gold);color:var(--bg);border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;min-height:48px">Send to the Commissioner</button>';

  h += '</form>';
  h += '</div></div></div>';

  // Footer
  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Anonymous to other members · You\'ll get a notification when the Commissioner responds.</div>';

  document.querySelector('[data-page="bugreport"]').innerHTML = h;

  // Auto-fill "page where seen" with the previous page if we have it.
  try {
    var prev = Router.history && Router.history.length > 1 ? Router.history[Router.history.length - 2] : null;
    if (prev && prev.page) {
      var pageInput = document.getElementById('brPage');
      if (pageInput && !pageInput.value) pageInput.value = prev.page;
    }
  } catch (e) { /* tolerate */ }
});

// Submit handler — writes to `feature_requests` collection (which has
// permissive create + Founder-only read per firestore.rules).
function submitBugReport() {
  if (!db || !currentUser) {
    Router.toast('Not signed in');
    return;
  }
  var type = document.getElementById('brType').value;
  var severity = document.getElementById('brSeverity').value;
  var page = (document.getElementById('brPage').value || '').trim().slice(0, 100);
  var description = (document.getElementById('brDescription').value || '').trim();
  var steps = (document.getElementById('brSteps').value || '').trim().slice(0, 1000);

  if (!description || description.length < 10) {
    Router.toast('Description must be at least 10 characters');
    return;
  }
  if (description.length > 2000) {
    Router.toast('Description too long (max 2000 chars)');
    return;
  }

  var btn = document.getElementById('brSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  db.collection('feature_requests').add({
    submittedBy: currentUser.uid,
    submitterName: (currentProfile && currentProfile.name) || 'Anonymous',
    type: type,
    severity: severity,
    page: page,
    description: description.slice(0, 2000),
    steps: steps,
    status: 'new',
    appVersion: APP_VERSION,
    userAgent: (navigator && navigator.userAgent) || '',
    viewport: window.innerWidth + 'x' + window.innerHeight,
    createdAt: fsTimestamp()
  }).then(function() {
    btn.textContent = 'Sent';
    Router.toast('Thanks, the Commissioner has it.');
    setTimeout(function() { Router.go('home'); }, 1200);
  }).catch(function(err) {
    btn.disabled = false;
    btn.textContent = 'Send to the Commissioner';
    if (typeof pbWarn === 'function') pbWarn('[bugreport] submit failed:', err.message);
    Router.toast('Couldn\'t send, try again.');
  });
}
