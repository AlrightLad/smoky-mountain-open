// Admin — Diagnostic + Data Recovery subsystem. Extracted per W1.A5 (AMD-027).
// Functions: runFullDiagnostic, copyDiagnosticText, runDataRecoveryScan,
// runDataRecoveryFix. All bound as window globals via PARBAUGHS vanilla-JS pattern.

function runFullDiagnostic() {
  if (!db || !isFounderRole(currentProfile)) return;
  var el = document.getElementById("diagnosticResult");
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Running full diagnostic (read-only)...</div>';

  var report = [];
  var promises = [];

  // Expected member fields from backup
  var EXPECTED_MEMBER_FIELDS = ["id","name","username","email","role","level","xp","parcoins","parcoinsLifetime","computedHandicap","computedAvg","computedBest","roundCount","totalRounds","avgScore","bestRound","earnedAchievements","equippedTitle","equippedCosmetics","displayBadges","badges","bio","homeCourse","theme","clubs","bag","funnyFacts","founding","isFoundingFour","invitesUsed","maxInvites","createdAt","leagues","activeLeague"];

  // 1. MEMBERS — full detail
  var memberPromise = db.collection("members").get().then(function(snap) {
    var members = [];
    snap.forEach(function(doc) { members.push({_docId: doc.id, data: doc.data()}); });

    var memberLines = [];
    memberLines.push("MEMBERS: " + members.length + " docs");
    memberLines.push("");

    members.forEach(function(m) {
      var d = m.data;
      var allKeys = Object.keys(d).sort();
      var ea = d.earnedAchievements || [];
      memberLines.push("  UID: " + m._docId);
      memberLines.push("  name: " + (d.name || "MISSING") + " | username: " + (d.username || "MISSING"));
      memberLines.push("  role: " + (d.role || "MISSING") + " | founding: " + (d.founding || false));
      memberLines.push("  level: " + (d.level !== undefined ? d.level : "MISSING") + " | xp: " + (d.xp !== undefined ? d.xp : "MISSING"));
      memberLines.push("  handicap: " + (d.computedHandicap || d.handicap || "null"));
      memberLines.push("  avgScore: " + (d.avgScore !== undefined ? d.avgScore : "MISSING") + " | bestRound: " + (d.bestRound !== undefined ? d.bestRound : "MISSING"));
      memberLines.push("  computedAvg: " + (d.computedAvg !== undefined ? d.computedAvg : "MISSING") + " | computedBest: " + (d.computedBest !== undefined ? d.computedBest : "MISSING"));
      memberLines.push("  roundCount: " + (d.roundCount !== undefined ? d.roundCount : "MISSING") + " | totalRounds: " + (d.totalRounds !== undefined ? d.totalRounds : "MISSING"));
      memberLines.push("  parcoins: " + (d.parcoins !== undefined ? d.parcoins : "MISSING") + " | lifetime: " + (d.parcoinsLifetime !== undefined ? d.parcoinsLifetime : "MISSING"));
      memberLines.push("  bio: " + (d.bio ? d.bio.substring(0, 50) : "(empty)"));
      memberLines.push("  homeCourse: " + (d.homeCourse || "null") + " | theme: " + (d.theme || "null"));
      memberLines.push("  photo: " + (d.photo ? "YES" : "null"));
      memberLines.push("  equippedCosmetics: " + JSON.stringify(d.equippedCosmetics || "MISSING"));
      memberLines.push("  equippedTitle: " + (d.equippedTitle || "null"));
      memberLines.push("  earnedAchievements: " + ea.length + " [" + ea.join(", ") + "]");
      memberLines.push("  displayBadges: " + JSON.stringify(d.displayBadges || []));
      memberLines.push("  badges: " + JSON.stringify(d.badges || "MISSING"));
      memberLines.push("  leagues[]: " + JSON.stringify(d.leagues || "MISSING"));
      memberLines.push("  activeLeague: " + (d.activeLeague || "MISSING"));
      memberLines.push("  invitesUsed: " + (d.invitesUsed !== undefined ? d.invitesUsed : "MISSING") + " | maxInvites: " + (d.maxInvites !== undefined ? d.maxInvites : "MISSING"));

      // Flag missing expected fields
      var missing = EXPECTED_MEMBER_FIELDS.filter(function(f) { return d[f] === undefined; });
      if (missing.length > 0) memberLines.push("  !! MISSING FIELDS: " + missing.join(", "));

      // Show ALL keys on doc
      memberLines.push("  ALL KEYS: " + allKeys.join(", "));
      memberLines.push("");
    });

    report.push({order: 1, text: memberLines.join("\n")});
  });
  promises.push(memberPromise);

  // 2. ROUNDS — full detail on first 5, summary for rest
  var roundsPromise = db.collection("rounds").get().then(function(snap) {
    var rounds = [];
    snap.forEach(function(doc) { rounds.push({_docId: doc.id, data: doc.data()}); });

    var lines = [];
    lines.push("ROUNDS: " + rounds.length + " total docs");
    var withLeague = rounds.filter(function(r){ return !!r.data.leagueId; });
    var withoutLeague = rounds.filter(function(r){ return !r.data.leagueId; });
    var parbaughsLeague = rounds.filter(function(r){ return r.data.leagueId === "the-parbaughs"; });
    var otherLeague = withLeague.filter(function(r){ return r.data.leagueId !== "the-parbaughs"; });
    lines.push("  leagueId='the-parbaughs': " + parbaughsLeague.length);
    lines.push("  leagueId=other: " + otherLeague.length + (otherLeague.length > 0 ? " [" + otherLeague.map(function(r){return r.data.leagueId}).filter(function(v,i,a){return a.indexOf(v)===i}).join(", ") + "]" : ""));
    lines.push("  NO leagueId: " + withoutLeague.length);
    lines.push("");

    // First 5 rounds with full detail
    rounds.slice(0, 5).forEach(function(r, i) {
      var d = r.data;
      lines.push("  Round " + (i+1) + " (doc: " + r._docId + "):");
      lines.push("    id: " + (d.id || "MISSING"));
      lines.push("    player: " + d.player + " | playerName: " + d.playerName);
      lines.push("    course: " + d.course + " | date: " + d.date);
      lines.push("    score: " + d.score + " | holesPlayed: " + d.holesPlayed);
      lines.push("    holeScores: " + (d.holeScores ? "[" + d.holeScores.length + " entries]" : "MISSING"));
      lines.push("    holePars: " + (d.holePars ? "[" + d.holePars.length + " entries]" : "MISSING"));
      lines.push("    leagueId: " + (d.leagueId || "MISSING"));
      lines.push("    ALL KEYS: " + Object.keys(d).sort().join(", "));
      lines.push("");
    });

    if (rounds.length > 5) lines.push("  ...(" + (rounds.length - 5) + " more rounds)");
    report.push({order: 2, text: lines.join("\n")});
  });
  promises.push(roundsPromise);

  // 3. League-scoped collections summary
  var leagueColls = ["chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions"];
  leagueColls.forEach(function(col, idx) {
    var p = db.collection(col).get().then(function(snap) {
      var docs = [];
      snap.forEach(function(doc) { docs.push(doc.data()); });
      var withLid = docs.filter(function(d){ return !!d.leagueId; }).length;
      var noLid = docs.filter(function(d){ return !d.leagueId; }).length;
      var parbaughsLid = docs.filter(function(d){ return d.leagueId === "the-parbaughs"; }).length;
      var line = col.toUpperCase() + ": " + docs.length + " docs | leagueId=parbaughs: " + parbaughsLid + " | other: " + (withLid - parbaughsLid) + " | missing: " + noLid;
      report.push({order: 10 + idx, text: line});
    }).catch(function(e) {
      report.push({order: 10 + idx, text: col.toUpperCase() + ": ERROR — " + e.message});
    });
    promises.push(p);
  });

  // 4. Global collections
  var globalColls = ["courses","course_reviews","photos","parcoin_transactions","notifications","presence","errors","feature_requests","dms"];
  globalColls.forEach(function(col, idx) {
    var p = db.collection(col).get().then(function(snap) {
      report.push({order: 30 + idx, text: col.toUpperCase() + " (global): " + snap.size + " docs"});
    }).catch(function(e) {
      report.push({order: 30 + idx, text: col.toUpperCase() + " (global): ERROR — " + e.message});
    });
    promises.push(p);
  });

  // 5. Leagues collection
  var leaguesPromise = db.collection("leagues").get().then(function(snap) {
    var lines = [];
    lines.push("LEAGUES COLLECTION: " + snap.size + " docs");
    snap.forEach(function(doc) {
      var d = doc.data();
      lines.push("  doc id: " + doc.id);
      lines.push("    name: " + d.name + " | slug: " + d.slug);
      lines.push("    badge: " + (d.badge || "none") + " | commissioner: " + d.commissioner);
      lines.push("    memberUids: " + (d.memberUids ? d.memberUids.length + " UIDs" : "MISSING"));
      lines.push("    memberCount: " + d.memberCount);
      lines.push("    visibility: " + d.visibility + " | tier: " + d.tier);
      lines.push("    ALL KEYS: " + Object.keys(d).sort().join(", "));
      lines.push("");
    });
    report.push({order: 5, text: lines.join("\n")});
  });
  promises.push(leaguesPromise);

  // 6. Config
  var configPromise = db.collection("config").get().then(function(snap) {
    var lines = ["CONFIG: " + snap.size + " docs"];
    snap.forEach(function(doc) {
      lines.push("  " + doc.id + ": keys = " + Object.keys(doc.data()).join(", "));
    });
    report.push({order: 6, text: lines.join("\n")});
  });
  promises.push(configPromise);

  Promise.all(promises).then(function() {
    report.sort(function(a,b){ return a.order - b.order; });
    var fullText = report.map(function(r){ return r.text; }).join("\n\n");

    var h = '<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:10px">Full Diagnostic (READ ONLY)</div>';
    h += '<pre style="font-size:9px;line-height:1.5;color:var(--cream);background:var(--bg2);padding:12px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;max-height:600px;overflow-y:auto;border:1px solid var(--border)">' + escHtml(fullText) + '</pre>';
    h += '<button class="btn full outline" style="margin-top:8px;font-size:10px" onclick="copyDiagnosticText()">Copy to clipboard</button>';
    el.innerHTML = h;

    // Store for clipboard
    window._diagnosticText = fullText;
  }).catch(function(e) {
    el.innerHTML = '<div style="color:var(--red);font-size:11px">Diagnostic error: ' + escHtml(e.message) + '</div>';
  });
}

function copyDiagnosticText() {
  if (!window._diagnosticText) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(window._diagnosticText).then(function() {
      Router.toast("Diagnostic copied to clipboard");
    }).catch(function() {
      Router.toast("Could not copy, check browser permissions");
    });
  } else {
    // Fallback
    var ta = document.createElement("textarea");
    ta.value = window._diagnosticText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    Router.toast("Diagnostic copied");
  }
}

// ========== DATA RECOVERY TOOL (Commissioner only) ==========
// Scans Firestore for docs missing leagueId and tags them "the-parbaughs".
// Also fixes member docs missing leagues[] / activeLeague.

var _recoveryCollections = ["rounds","chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions","course_reviews","photos"];

function runDataRecoveryScan() {
  if (!db || !isFounderRole(currentProfile)) return;
  var el = document.getElementById("recoveryResult");
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Scanning Firestore...</div>';

  var report = {};
  var promises = [];
  var totalMissing = 0;
  var totalDocs = 0;

  _recoveryCollections.forEach(function(col) {
    var p = db.collection(col).get().then(function(snap) {
      var missing = 0;
      var wrongId = 0;
      var correct = 0;
      var total = snap.size;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.leagueId) missing++;
        else if (d.leagueId === "the-parbaughs") correct++;
        else wrongId++;
      });
      report[col] = { total: total, missing: missing, wrongId: wrongId, correct: correct };
      totalMissing += missing;
      totalDocs += total;
    }).catch(function(e) {
      report[col] = { total: 0, missing: 0, wrongId: 0, correct: 0, error: e.message };
    });
    promises.push(p);
  });

  // Also check members
  var memberPromise = db.collection("members").get().then(function(snap) {
    var membersNoLeague = 0;
    var membersTotal = snap.size;
    snap.forEach(function(doc) {
      var d = doc.data();
      if (!d.leagues || !d.leagues.length || !d.activeLeague) membersNoLeague++;
    });
    report["_members"] = { total: membersTotal, missing: membersNoLeague };
  });
  promises.push(memberPromise);

  // Check if founding league doc exists
  var leagueDocPromise = db.collection("leagues").doc("the-parbaughs").get().then(function(doc) {
    report["_leagueDoc"] = { exists: doc.exists, data: doc.exists ? doc.data() : null };
  });
  promises.push(leagueDocPromise);

  Promise.all(promises).then(function() {
    var h = '<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:10px">Scan Complete</div>';
    h += '<div style="font-size:11px;color:var(--cream);margin-bottom:6px">Total docs scanned: <b>' + totalDocs + '</b> · Missing leagueId: <b style="color:var(--red)">' + totalMissing + '</b></div>';

    // League doc status
    if (report["_leagueDoc"]) {
      var ld = report["_leagueDoc"];
      h += '<div style="font-size:11px;margin-bottom:6px;color:' + (ld.exists ? 'var(--birdie)' : 'var(--red)') + '">Founding league doc: ' + (ld.exists ? 'EXISTS' : 'MISSING') + '</div>';
    }

    // Members status
    if (report["_members"]) {
      var mm = report["_members"];
      h += '<div style="font-size:11px;margin-bottom:10px;color:' + (mm.missing > 0 ? 'var(--red)' : 'var(--birdie)') + '">Members without leagues[]: ' + mm.missing + ' / ' + mm.total + '</div>';
    }

    h += '<table style="width:100%;font-size:10px;border-collapse:collapse">';
    h += '<tr style="border-bottom:1px solid var(--border);color:var(--muted)"><th style="text-align:left;padding:4px">Collection</th><th>Total</th><th>Missing</th><th>Wrong</th><th>OK</th></tr>';
    _recoveryCollections.forEach(function(col) {
      var r = report[col] || {};
      var rowColor = r.missing > 0 ? "var(--red)" : r.error ? "var(--muted2)" : "var(--birdie)";
      h += '<tr style="border-bottom:1px solid var(--border2)">';
      h += '<td style="padding:4px;color:var(--cream)">' + col + '</td>';
      h += '<td style="text-align:center;padding:4px">' + (r.total || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:' + (r.missing > 0 ? 'var(--red);font-weight:700' : 'var(--birdie)') + '">' + (r.missing || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:' + (r.wrongId > 0 ? 'var(--gold)' : 'var(--muted)') + '">' + (r.wrongId || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:var(--birdie)">' + (r.correct || 0) + '</td>';
      h += '</tr>';
    });
    h += '</table>';

    if (totalMissing > 0 || (report["_members"] && report["_members"].missing > 0) || (report["_leagueDoc"] && !report["_leagueDoc"].exists)) {
      h += '<button class="btn full green" style="margin-top:12px" onclick="runDataRecoveryFix()">Fix All (' + totalMissing + ' docs + members + league doc)</button>';
    } else {
      h += '<div style="margin-top:10px;font-size:11px;color:var(--birdie);text-align:center;font-weight:600">All data properly tagged. No recovery needed.</div>';
    }

    el.innerHTML = h;
    window._recoveryReport = report;
  });
}

function runDataRecoveryFix() {
  if (!db || !isFounderRole(currentProfile)) return;
  var el = document.getElementById("recoveryResult");
  if (!el) return;
  if (!confirm("This will tag all untagged docs with leagueId:'the-parbaughs' and fix member profiles. Proceed?")) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Fixing data...</div>';

  var fixPromises = [];
  var fixCount = 0;

  // 1. Fix league-scoped collections — tag missing leagueId
  _recoveryCollections.forEach(function(col) {
    var p = db.collection(col).get().then(function(snap) {
      var batch = db.batch();
      var batchCount = 0;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.leagueId) {
          batch.update(doc.ref, { leagueId: "the-parbaughs" });
          batchCount++;
        }
      });
      if (batchCount > 0) {
        fixCount += batchCount;
        return batch.commit();
      }
    }).catch(function(e) { pbWarn("[Recovery] Error fixing " + col + ":", e); });
    fixPromises.push(p);
  });

  // 2. Fix members — add leagues[] and activeLeague
  var memberFix = db.collection("members").get().then(function(snap) {
    var batch = db.batch();
    var batchCount = 0;
    snap.forEach(function(doc) {
      var d = doc.data();
      var updates = {};
      if (!d.leagues || !d.leagues.length) {
        updates.leagues = ["the-parbaughs"];
      }
      if (!d.activeLeague) {
        updates.activeLeague = "the-parbaughs";
      }
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        batchCount++;
      }
    });
    if (batchCount > 0) {
      fixCount += batchCount;
      return batch.commit();
    }
  }).catch(function(e) { pbWarn("[Recovery] Error fixing members:", e); });
  fixPromises.push(memberFix);

  // 3. Ensure founding league doc exists
  var leagueDocFix = db.collection("leagues").doc("the-parbaughs").get().then(function(doc) {
    if (!doc.exists) {
      // Collect all current member UIDs
      return db.collection("members").get().then(function(mSnap) {
        var allUids = [];
        mSnap.forEach(function(mDoc) { allUids.push(mDoc.id); });
        return db.collection("leagues").doc("the-parbaughs").set({
          name: "The Parbaughs",
          slug: "the-parbaughs",
          location: "York, PA",
          description: "The original. The founding league. Est. 2026.",
          founded: "2026-04-05",
          badge: "founding",
          tier: "crew",
          visibility: "private",
          commissioner: "1GE683EauXO8TVhcStKfWiCCcRl2",
          admins: ["1GE683EauXO8TVhcStKfWiCCcRl2"],
          memberCount: allUids.length,
          memberUids: allUids,
          inviteCode: "PB-FOUNDING",
          theme: "classic",
          createdAt: fsTimestamp(),
          settings: { seasons: true, parcoins: true, wagers: true, bounties: true, trashTalk: true }
        });
      });
    } else {
      // League doc exists — make sure memberUids is up to date
      return db.collection("members").get().then(function(mSnap) {
        var allUids = [];
        mSnap.forEach(function(mDoc) {
          var d = mDoc.data();
          if (d.leagues && d.leagues.indexOf("the-parbaughs") !== -1) {
            allUids.push(mDoc.id);
          }
        });
        if (allUids.length > 0) {
          return db.collection("leagues").doc("the-parbaughs").update({
            memberUids: allUids,
            memberCount: allUids.length
          });
        }
      });
    }
  }).catch(function(e) { pbWarn("[Recovery] Error fixing league doc:", e); });
  fixPromises.push(leagueDocFix);

  Promise.all(fixPromises).then(function() {
    el.innerHTML = '<div style="text-align:center;padding:16px">'
      + '<div style="font-size:14px;font-weight:700;color:var(--birdie);margin-bottom:8px">Recovery Complete</div>'
      + '<div style="font-size:11px;color:var(--cream)">Fixed ' + fixCount + ' documents</div>'
      + '<div style="font-size:10px;color:var(--muted);margin-top:4px">Founding league doc ensured. Member profiles updated.</div>'
      + '<button class="btn full outline" style="margin-top:12px" onclick="runDataRecoveryScan()">Run scan again to verify</button>'
      + '</div>';
    Router.toast("Recovery complete! " + fixCount + " docs fixed");
  }).catch(function(e) {
    el.innerHTML = '<div style="color:var(--red);font-size:11px;padding:12px">Recovery error: ' + escHtml(e.message) + '</div>';
  });
}
