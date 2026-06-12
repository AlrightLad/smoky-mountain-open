/* ================================================
   PAGE: H2H CHALLENGES
   ================================================ */

Router.register("challenges", function(params) {
  if (params && (params.create || params.opponent)) { renderCreateChallenge(params.opponent, params.stakes); return; }
  renderChallengeList();
});

function renderChallengeList() {
  var challenges = [];
  try {
    PB.getPlayers().forEach(function(p) {
      var pc = PB.getChallenges(p.id);
      pc.forEach(function(c) {
        if (!challenges.find(function(x){return x.id===c.id})) challenges.push(c);
      });
    });
  } catch(e) {}

  // v8.24.89 — the header "+ New" only appears when challenges already exist.
  // On an empty board the in-body "Start a Challenge" is the sole primary, so
  // the header CTA is dropped entirely (was a competing brass/outline button —
  // two create affordances on one screen). One screen, one primary.
  var _newBtn = challenges.length
    ? '<button class="btn-sm green" onclick="Router.go(\'challenges\',{create:true})">+ New</button>'
    : '';
  var h = '<div class="sh"><h2>Challenges</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'records\')">← Back</button>' + _newBtn + '</div></div>';

  if (challenges.length) {
    challenges.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
    challenges.forEach(function(c) {
      var from = PB.getPlayer(c.from);
      var to = PB.getPlayer(c.to);
      var statusColor = c.status === "pending" ? "var(--gold)" : c.status === "accepted" ? "var(--birdie)" : c.status === "completed" ? "var(--cream)" : "var(--red)";
      h += '<div class="card"><div style="padding:14px 16px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:13px;font-weight:600">' + escHtml(from?(from.username||from.name):"Unknown player") + ' vs ' + escHtml(to?(to.username||to.name):"Unknown player") + '</div>';
      if (c.course) h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(c.course) + '</div>';
      if (c.stakes) h += '<div style="font-size:11px;color:var(--gold2);margin-top:2px;font-style:italic">' + escHtml(c.stakes) + '</div>';
      h += '<div style="font-size:9px;color:var(--cb-mute);margin-top:3px">' + escHtml(c.created || "") + '</div>';
      h += '</div>';
      h += '<div style="font-size:10px;font-weight:600;color:' + statusColor + ';text-transform:uppercase;letter-spacing:.5px">' + c.status + '</div>';
      h += '</div></div></div>';
    });
  } else {
    h += '<div style="padding:24px 16px;text-align:center">';
    h += '<div style="margin-bottom:14px"><svg viewBox="0 0 48 48" width="60" height="60" fill="none" stroke="var(--gold)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M14 34l10-10 10 10"/><path d="M14 24l10-10 10 10"/><circle cx="14" cy="14" r="4"/><circle cx="34" cy="14" r="4"/></svg></div>';
    h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold);margin-bottom:6px">No Active Challenges</div>';
    h += '<div style="font-size:12px;color:var(--cb-ink-faint);line-height:1.5;max-width:280px;margin:0 auto 16px">Challenge a friend to a head-to-head match. Bet coins on who shoots lower, who hits more fairways, or who survives the back nine.</div>';
    h += '<button class="btn full green" onclick="Router.go(\'challenges\',{create:true})" style="max-width:240px;margin:0 auto;font-size:13px;padding:14px">Start a Challenge</button>';
    h += '<div style="margin-top:20px;text-align:left">';
    h += '<div style="font-size:9px;color:var(--cb-eyebrow);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;text-align:center">Challenge Ideas \u00b7 tap to start</div>';
    // v8.24.89 \u2014 the idea chips are real actions, not decorative text. Each one
    // routes into the create flow and pre-fills the Stakes field (page-sweep:
    // they looked tappable as paper cards but were inert \u2014 an affordance lie).
    // `stakes` is the wager pre-fill; `label` is the human-readable chip text.
    // v8.24.75 \u2014 role-neutral examples (were hardcoded founding-league names
    // like "Beat Kayvan's 107" / "Mr Parbaugh vs Nick", which read as nonsense
    // to any other league \u2014 same legacy-data-leak class the trips filter fixed).
    var examples = [
      { label: "Beat your buddy's best score \u00b7 50 coins", stakes: "Beat your buddy's best score \u00b7 50 coins" },
      { label: "Most pars this weekend \u00b7 75 coins", stakes: "Most pars this weekend \u00b7 75 coins" },
      { label: "Nassau, front vs back nine \u00b7 100 coins", stakes: "Nassau, front vs back nine \u00b7 100 coins" }
    ];
    examples.forEach(function(ex) {
      // JSON-encode the stakes for a safe inline onclick string literal (handles
      // the apostrophe in "buddy's" and any future punctuation without breaking
      // out of the attribute). escHtml then guards the resulting attribute value.
      var _arg = escHtml(JSON.stringify(ex.stakes));
      // v8.25.20 — chips are deliberately SECONDARY to the filled-brass "Start a
      // Challenge" CTA above (page-critique MED #1: a bright paper fill + filled
      // CTA read as two competing primaries). Transparent ground + hairline border
      // = quiet outline affordance; hover warms to paper so they still feel tappable.
      h += '<button type="button" class="ch-idea" onclick=\'Router.go("challenges",{create:true,stakes:' + _arg + '})\' style="display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:13px;margin-bottom:6px;background:transparent;border:1px solid var(--border);border-radius:var(--r-2);font-size:12px;color:var(--cb-ink-faint);min-height:44px;cursor:pointer;font-family:inherit;transition:border-color .15s ease,background .15s ease,color .15s ease" onmouseover="this.style.borderColor=\'var(--gold)\';this.style.background=\'var(--cb-paper)\';this.style.color=\'var(--cb-ink)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'transparent\';this.style.color=\'var(--cb-ink-faint)\'"><span style="width:6px;height:6px;border-radius:50%;background:var(--gold);flex:none"></span><span style="flex:1">' + escHtml(ex.label) + '</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--cb-mute)" stroke-width="2" style="flex:none"><path d="M9 6l6 6-6 6"/></svg></button>';
    });
    h += '</div></div>';
  }

  document.querySelector('[data-page="challenges"]').innerHTML = h;
}

function renderCreateChallenge(presetOpponent, presetStakes) {
  var players = PB.getPlayers();
  var myUid = currentUser ? currentUser.uid : null;
  var h = '<div class="sh"><h2>New challenge</h2><button class="back" onclick="Router.back(\'challenges\')">← Back</button></div>';

  h += '<div class="form-section"><div class="form-title">Challenge details</div>';
  // v8.24.88 — the challenger is always YOU. Was an editable <select> over all
  // players, which let a member create a challenge attributed to someone else
  // (impersonation, page-sweep #15). Fixed, read-only display.
  var _meName = currentProfile ? (currentProfile.username || currentProfile.name || 'You') : 'You';
  h += '<div class="ff"><label class="ff-label">From</label><div class="ff-input" style="display:flex;align-items:center;color:var(--cb-ink);background:var(--cb-paper)">' + escHtml(_meName) + '</div></div>';
  h += '<div class="ff"><label class="ff-label">Challenge</label><select class="ff-input" id="ch-to">';
  players.forEach(function(p) {
    if (p.id === myUid) return; // Can't challenge yourself
    h += '<option value="' + escHtml(p.id) + '"' + (p.id === presetOpponent ? ' selected' : '') + '>' + escHtml(p.username||p.name) + '</option>';
  });
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="ch-course" placeholder="Start typing..." oninput="showChallengeCourseSearch(this)"><div id="search-ch-course" class="search-results"></div></div>';
  // v8.24.89 — Stakes can arrive pre-filled from a "Challenge Ideas" chip on the
  // empty state. escHtml guards the value attribute (it can carry apostrophes /
  // free text), and it stays fully editable.
  var _stakesVal = presetStakes ? escHtml(String(presetStakes)) : '';
  h += '<div class="ff"><label class="ff-label">Stakes (optional)</label><input class="ff-input" id="ch-stakes" placeholder="e.g. Loser buys drinks" value="' + _stakesVal + '"></div>';
  h += '<button class="btn full green" onclick="submitChallenge()">Send challenge</button></div>';

  document.querySelector('[data-page="challenges"]').innerHTML = h;
}

function showChallengeCourseSearch(input) {
  var results = PB.searchCourses(input.value);
  var container = document.getElementById("search-ch-course");
  if (!results.length) { container.innerHTML = ""; return; }
  var h = '';
  results.forEach(function(c) {
    h += '<div class="search-item" onclick="document.getElementById(\'ch-course\').value=\'' + escHtml(c.name.replace(/'/g, "\\'")) + '\';document.getElementById(\'search-ch-course\').innerHTML=\'\'">' + escHtml(c.name) + ' <span style="color:var(--muted);font-size:11px">' + escHtml(c.loc||'') + '</span></div>';
  });
  container.innerHTML = h;
}

function submitChallenge() {
  // v8.24.88 — the challenger is always the signed-in user (server-of-record),
  // never a client-chosen 'from' (impersonation fix, page-sweep #15).
  var from = currentUser ? currentUser.uid : (currentProfile ? currentProfile.id : null);
  var to = document.getElementById("ch-to").value;
  if (!from) { Router.toast("Sign in to send a challenge"); return; }
  if (from === to) { Router.toast("Pick a different opponent"); return; }
  var course = document.getElementById("ch-course").value;
  var stakes = document.getElementById("ch-stakes").value;
  PB.createChallenge(from, to, course, stakes);
  Router.toast("Challenge sent!");
  Router.go("challenges");
}
