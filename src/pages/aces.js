/* ================================================
   PAGE: HOLE-IN-ONES (ACE WALL)
   ================================================ */

Router.register("aces", function(params) {
  if (params.add) { renderAddAce(); return; }
  if (params.id) { renderAceDetail(params.id); return; }
  renderAceList();
});

function renderAceList() {
  var rec = PB.getRecords();
  var aces = rec.holeInOnes || [];
  var courses = PB.getCourses();

  var h = '<div class="sh"><h2>Ace wall</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'records\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'aces\',{add:true})">+ Log ace</button></div></div>';

  if (aces.length) {
    h += '<div style="text-align:center;padding:8px 16px 16px"><div style="font-size:48px;font-weight:800;color:var(--gold)">' + aces.length + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:2px">Parbaugh hole-in-one' + (aces.length !== 1 ? 's' : '') + '</div></div>';

    aces.slice().reverse().forEach(function(ace, idx) {
      var realIdx = aces.length - 1 - idx;
      var isDirectory = courses.some(function(c) { return c.name === ace.course; });

      h += '<div class="card" onclick="Router.go(\'aces\',{id:' + realIdx + '})" style="cursor:pointer">';
      if (ace.photo) {
        h += '<div style="height:180px;overflow:hidden"><img alt="" src="' + ace.photo + '" style="width:100%;height:100%;object-fit:cover"></div>';
      }
      h += '<div style="padding:14px 16px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      h += '<div><div style="font-size:17px;font-weight:700;color:var(--gold)">' + ace.by + '</div>';
      h += '<div style="font-size:13px;color:var(--cream);margin-top:2px">' + ace.course + (isDirectory ? ' <span style="color:var(--gold)" title="Parbaugh Directory Course"></span>' : '') + '</div>';
      h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">';
      if (ace.hole) h += 'Hole ' + ace.hole + ' · ';
      if (ace.distance) h += ace.distance + ' yds · ';
      if (ace.club) h += ace.club + ' · ';
      h += ace.date;
      h += '</div></div>';
      h += '<div style="font-size:14px;font-weight:700;color:var(--gold)">ACE</div>';
      h += '</div>';
      if (ace.description) h += '<div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.4;font-style:italic;border-left:2px solid var(--border);padding-left:10px">"' + ace.description + '"</div>';
      h += '</div></div>';
    });
  } else {
    h += '<div class="card"><div class="empty" style="padding:40px 20px">';
    h += '<div style="font-family:Playfair Display,serif;font-size:28px;color:var(--gold)">Ace Wall</div>';
    h += '<div style="font-size:16px;font-weight:700;color:var(--gold);margin-top:8px">No aces yet</div>';
    h += '<div class="empty-text" style="margin-top:4px">When a Parbaugh makes a hole-in-one, it gets immortalized here</div>';
    h += '<div style="margin-top:16px"><button class="btn green" onclick="Router.go(\'aces\',{add:true})">Log first ace</button></div>';
    h += '</div></div>';
  }

  // Fun stats if there are aces
  if (aces.length > 1) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Ace stats</span></div>';
    h += '<div class="hof-card" style="margin:0">';
    // Count by player
    var byPlayer = {};
    aces.forEach(function(a) { byPlayer[a.by] = (byPlayer[a.by] || 0) + 1; });
    var mostAces = Object.keys(byPlayer).sort(function(a, b) { return byPlayer[b] - byPlayer[a]; })[0];
    h += '<div class="hof-row"><span class="hof-label">Most aces</span><span class="hof-val">' + mostAces + ' (' + byPlayer[mostAces] + ')</span></div>';
    // Unique courses
    var uniqueAceCourses = {};
    aces.forEach(function(a) { uniqueAceCourses[a.course] = 1; });
    h += '<div class="hof-row"><span class="hof-label">Courses aced</span><span class="hof-val">' + Object.keys(uniqueAceCourses).length + '</span></div>';
    h += '</div></div>';
  }

  h += '<div style="padding:16px;text-align:center;font-size:10px;color:var(--muted2)">Parbaugh Directory course</div>';

  document.querySelector('[data-page="aces"]').innerHTML = h;
}

function renderAceDetail(idx) {
  var rec = PB.getRecords();
  var aces = rec.holeInOnes || [];
  var ace = aces[idx];
  if (!ace) { Router.go("aces"); return; }
  var courses = PB.getCourses();
  var isDirectory = courses.some(function(c) { return c.name === ace.course; });
  var player = PB.getPlayers().find(function(p) { return p.name === ace.by; });

  var h = '<div class="sh"><h2>Hole-in-one</h2><button class="back" onclick="Router.back(\'aces\')">← Ace wall</button></div>';

  // Hero photo
  if (ace.photo) {
    h += '<div style="margin:0 16px;border-radius:var(--radius);overflow:hidden;max-height:300px"><img alt="" src="' + ace.photo + '" style="width:100%;display:block"></div>';
  }

  // Player and details
  h += '<div class="pd-banner">';
  if (player) h += '<div class="pd-av" style="width:70px;height:70px;font-size:28px;border-width:3px;border-color:var(--gold)">' + Router.getAvatar(player) + '</div>';
  h += '<div style="font-size:24px;font-weight:800;color:var(--gold);margin-top:4px">' + ace.by + '</div>';
  h += '<div style="font-size:15px;color:var(--cream);margin-top:4px">' + ace.course + (isDirectory ? ' <span style="color:var(--gold)"></span>' : '') + '</div>';
  h += '<div style="font-size:13px;color:var(--muted);margin-top:4px">' + ace.date + '</div>';
  h += '</div>';

  // Stats
  h += '<div class="stats-grid">';
  if (ace.hole) h += statBox(ace.hole, "Hole");
  if (ace.distance) h += statBox(ace.distance, "Yards");
  if (ace.club) h += statBox(ace.club, "Club");
  h += '</div>';

  // Player's story
  if (ace.description) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">The story</span></div>';
    h += '<div class="card"><div class="card-body"><div style="font-size:14px;color:var(--cream);line-height:1.6;font-style:italic">"' + ace.description + '"</div></div></div>';
    h += '</div>';
  }

  // Witnesses
  if (ace.witnesses) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Witnesses</span></div>';
    h += '<div class="card"><div class="card-body" style="font-size:13px;color:var(--muted)">' + ace.witnesses + '</div></div>';
    h += '</div>';
  }

  // Delete
  h += '<div class="section">';
  h += '<div id="ace-del-confirm" style="display:none;margin-bottom:8px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
  h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">Delete this hole-in-one?</div>';
  h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'ace-del-confirm\').style.display=\'none\'">Cancel</button>';
  h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="confirmDeleteAce(' + idx + ')">Delete</button></div></div>';
  h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red)" onclick="deleteAce(' + idx + ')">Delete this ace</button></div>';

  document.querySelector('[data-page="aces"]').innerHTML = h;
}

function renderAddAce() {
  var h = '<div class="sh"><h2>Log a hole-in-one</h2><button class="back" onclick="Router.back(\'aces\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="font-family:Playfair Display,serif;font-size:24px;color:var(--gold)">Hole in One</div><div style="font-size:14px;color:var(--gold);font-weight:600;margin-top:4px">Congratulations!</div></div>';

  h += '<div class="form-section"><div class="form-title">Ace details</div>';
  h += '<div class="ff"><label class="ff-label">Who made it?</label><select class="ff-input" id="ace-player">';
  PB.getPlayers().forEach(function(p) { h += '<option value="' + p.name + '">' + p.name + '</option>'; });
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="ace-course" placeholder="Start typing..." oninput="showRoundCourseSearch(this)"><div id="search-round-course" class="search-results"></div></div>';
  h += '<div class="ff-row">';
  h += formField("Hole #", "ace-hole", "", "number", "e.g. 7");
  h += formField("Distance (yds)", "ace-distance", "", "number", "e.g. 155");
  h += '</div>';
  h += formField("Club used", "ace-club", "", "text", "e.g. 7 iron");
  h += formField("Date", "ace-date", localDateStr(), "date");
  h += '</div>';

  h += '<div class="form-section"><div class="form-title">The story</div>';
  h += '<div class="ff"><label class="ff-label">Tell us what happened</label><textarea class="ff-input" id="ace-desc" placeholder="Describe the shot, the reaction, the celebration..." style="min-height:80px"></textarea></div>';
  h += formField("Witnesses", "ace-witnesses", "", "text", "Who saw it?");
  h += '<div class="ff"><label class="ff-label">Photo</label><input type="file" accept="image/*" id="ace-photo" style="color:var(--muted);font-size:12px"></div>';
  h += '</div>';

  h += '<div class="form-section"><button class="btn full green" onclick="submitAce()">Immortalize this ace</button></div>';

  document.querySelector('[data-page="aces"]').innerHTML = h;
}

function submitAce() {
  var player = document.getElementById("ace-player").value;
  var course = document.getElementById("ace-course").value;
  if (!player || !course) { Router.toast("Player and course required"); return; }

  var ace = {
    by: player,
    course: course,
    hole: document.getElementById("ace-hole").value,
    distance: document.getElementById("ace-distance").value,
    club: document.getElementById("ace-club").value,
    date: document.getElementById("ace-date").value,
    description: document.getElementById("ace-desc").value,
    witnesses: document.getElementById("ace-witnesses").value,
    photo: "",
    ts: Date.now()
  };

  var photoInput = document.getElementById("ace-photo");
  if (photoInput && photoInput.files && photoInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var maxW = 600, maxH = 400;
        var ratio = Math.min(maxW / img.width, maxH / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        ace.photo = canvas.toDataURL("image/jpeg", 0.7);
        saveAce(ace);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveAce(ace);
  }
}

function saveAce(ace) {
  var rec = PB.getRecords();
  if (!rec.holeInOnes) rec.holeInOnes = [];
  rec.holeInOnes.push(ace);
  PB.setRecord("holeInOnes", rec.holeInOnes);
  Router.toast("Ace immortalized");
  Router.go("aces");
}

function deleteAce(idx) {
  var el = document.getElementById("ace-del-confirm");
  if (el) { el.style.display = "block"; return; }
}

function confirmDeleteAce(idx) {
  var rec = PB.getRecords();
  if (rec.holeInOnes) {
    rec.holeInOnes.splice(idx, 1);
    PB.setRecord("holeInOnes", rec.holeInOnes);
  }
  Router.toast("Ace removed");
  Router.go("aces");
}

