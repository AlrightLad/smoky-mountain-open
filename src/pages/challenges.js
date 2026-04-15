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
    h += '<div class="card"><div class="empty" style="padding:28px"><div class="empty-text">No challenges yet</div>';
    h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Challenge a member to a H2H match</div></div></div>';
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
