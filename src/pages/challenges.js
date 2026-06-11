/* ================================================
   PAGE: H2H CHALLENGES
   ================================================ */

Router.register("challenges", function(params) {
  if (params && (params.create || params.opponent)) { renderCreateChallenge(params.opponent); return; }
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

  // v8.24.75 — header CTA is the single primary only when challenges exist; on
  // an empty board the in-body "Start a Challenge" is the primary, so the
  // header demotes to outline (no two competing brass primaries).
  var _newBtnClass = challenges.length ? 'btn-sm green' : 'btn-sm outline';
  var h = '<div class="sh"><h2>Challenges</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'records\')">← Back</button><button class="' + _newBtnClass + '" onclick="Router.go(\'challenges\',{create:true})">+ New</button></div></div>';

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
      h += '<div style="font-size:9px;color:var(--muted2);margin-top:3px">' + (c.created || "") + '</div>';
      h += '</div>';
      h += '<div style="font-size:10px;font-weight:600;color:' + statusColor + ';text-transform:uppercase;letter-spacing:.5px">' + c.status + '</div>';
      h += '</div></div></div>';
    });
  } else {
    h += '<div style="padding:24px 16px;text-align:center">';
    h += '<div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M14 34l10-10 10 10"/><path d="M14 24l10-10 10 10"/><circle cx="14" cy="14" r="4"/><circle cx="34" cy="14" r="4"/></svg></div>';
    h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold);margin-bottom:6px">No Active Challenges</div>';
    h += '<div style="font-size:12px;color:var(--muted);line-height:1.5;max-width:280px;margin:0 auto 16px">Challenge a friend to a head-to-head match. Bet coins on who shoots lower, who hits more fairways, or who survives the back nine.</div>';
    h += '<button class="btn full green" onclick="Router.go(\'challenges\',{create:true})" style="max-width:240px;margin:0 auto;font-size:13px;padding:14px">Start a Challenge</button>';
    h += '<div style="margin-top:20px;text-align:left">';
    h += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;text-align:center">Challenge Ideas</div>';
    // v8.24.75 \u2014 role-neutral examples (were hardcoded founding-league names
    // like "Beat Kayvan's 107" / "Mr Parbaugh vs Nick", which read as nonsense
    // to any other league \u2014 same legacy-data-leak class the trips filter fixed).
    var examples = [
      "Beat your buddy\'s best score \u00b7 50 coins",
      "Most pars this weekend \u00b7 75 coins",
      "Nassau, front vs back nine \u00b7 100 coins"
    ];
    examples.forEach(function(ex) {
      h += '<div style="display:flex;align-items:center;gap:9px;padding:11px 13px;margin-bottom:6px;background:var(--cb-paper);border:1px solid var(--border);border-radius:var(--r-2);font-size:12px;color:var(--cb-ink)"><span style="width:6px;height:6px;border-radius:50%;background:var(--gold);flex:none"></span><span>' + ex + '</span></div>';
    });
    h += '</div></div>';
  }

  document.querySelector('[data-page="challenges"]').innerHTML = h;
}

function renderCreateChallenge(presetOpponent) {
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
  h += '<div class="ff"><label class="ff-label">Stakes (optional)</label><input class="ff-input" id="ch-stakes" placeholder="e.g. Loser buys drinks"></div>';
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
