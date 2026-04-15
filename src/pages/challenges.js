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

  var h = '<div class="sh"><h2>Challenges</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'records\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'challenges\',{create:true})">+ New</button></div></div>';

  if (challenges.length) {
    challenges.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
    challenges.forEach(function(c) {
      var from = PB.getPlayer(c.from);
      var to = PB.getPlayer(c.to);
      var statusColor = c.status === "pending" ? "var(--gold)" : c.status === "accepted" ? "var(--birdie)" : c.status === "completed" ? "var(--cream)" : "var(--red)";
      h += '<div class="card"><div style="padding:14px 16px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:13px;font-weight:600">' + (from?from.username||from.name:"?") + ' vs ' + (to?to.username||to.name:"?") + '</div>';
      if (c.course) h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + c.course + '</div>';
      if (c.stakes) h += '<div style="font-size:11px;color:var(--gold2);margin-top:2px;font-style:italic">' + c.stakes + '</div>';
      h += '<div style="font-size:9px;color:var(--muted2);margin-top:3px">' + (c.created || "") + '</div>';
      h += '</div>';
      h += '<div style="font-size:10px;font-weight:600;color:' + statusColor + ';text-transform:uppercase;letter-spacing:.5px">' + c.status + '</div>';
      h += '</div></div></div>';
    });
  } else {
    h += '<div style="text-align:center;padding:32px 16px">';
    h += '<div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><path d="M14 34l10-10 10 10"/><path d="M14 24l10-10 10 10"/><circle cx="14" cy="14" r="4"/><circle cx="34" cy="14" r="4"/></svg></div>';
    h += '<div style="font-size:16px;font-weight:700;color:var(--cream)">No Active Challenges</div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Challenge a friend to a head-to-head match. Bet coins on who shoots lower, who hits more fairways, or who survives the back nine.</div>';
    h += '<button class="btn full green" style="margin-top:16px;max-width:220px" onclick="Router.go(\'challenges\',{create:true})">Start a Challenge</button>';
    h += '<div style="margin-top:20px;text-align:left;max-width:280px;margin-left:auto;margin-right:auto">';
    h += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Challenge ideas</div>';
    var examples = [
      "Beat Kayvan\'s 107 at Connestee \u2014 50 coins",
      "Most pars this weekend \u2014 Mr Parbaugh vs Nick \u2014 75 coins",
      "Nassau at Honey Run \u2014 100 coins"
    ];
    examples.forEach(function(ex) {
      h += '<div style="padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:4px;font-size:11px;color:var(--muted);font-style:italic">' + ex + '</div>';
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
  h += '<div class="ff"><label class="ff-label">From</label><select class="ff-input" id="ch-from">';
  players.forEach(function(p) { h += '<option value="' + p.id + '"' + (p.id === myUid ? ' selected' : '') + '>' + (p.username||p.name) + '</option>'; });
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Challenge</label><select class="ff-input" id="ch-to">';
  players.forEach(function(p) {
    if (p.id === myUid) return; // Can't challenge yourself
    h += '<option value="' + p.id + '"' + (p.id === presetOpponent ? ' selected' : '') + '>' + (p.username||p.name) + '</option>';
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
    h += '<div class="search-item" onclick="document.getElementById(\'ch-course\').value=\'' + c.name.replace(/'/g, "\\'") + '\';document.getElementById(\'search-ch-course\').innerHTML=\'\'">' + c.name + ' <span style="color:var(--muted);font-size:11px">' + c.loc + '</span></div>';
  });
  container.innerHTML = h;
}

function submitChallenge() {
  var from = document.getElementById("ch-from").value;
  var to = document.getElementById("ch-to").value;
  if (from === to) { Router.toast("Pick two different players"); return; }
  var course = document.getElementById("ch-course").value;
  var stakes = document.getElementById("ch-stakes").value;
  PB.createChallenge(from, to, course, stakes);
  Router.toast("Challenge sent!");
  Router.go("challenges");
}
