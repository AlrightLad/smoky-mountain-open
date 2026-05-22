// AI Tournament Generator. Extracted per W1.A5.

// ========== AI TOURNAMENT GENERATOR ==========
function showAITournamentGenerator() {
  var members = PB.getPlayers();
  var h = '<div class="sh"><h2>AI Tournament Builder</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:20px 16px">';
  h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">AI Tournament Generator</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">Describe what you want and the AI builds it</div></div>';
  
  h += '<div class="form-section"><div class="form-title">Tell the AI what you want</div>';
  h += '<textarea class="ff-input" id="ai-prompt" rows="4" placeholder="e.g. A 3-day trip for 8 players with mixed formats, championship feel on the final day, balanced teams for scramble rounds..."></textarea>';
  
  h += '<div style="margin-top:12px"><div class="form-title">Players (' + members.length + ' available)</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Select who\'s playing</div>';
  h += '<div id="ai-players" style="display:flex;flex-wrap:wrap;gap:6px">';
  members.forEach(function(m) {
    h += '<div class="badge" style="cursor:pointer;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius)" id="aip-' + m.id + '" onclick="toggleAIPlayer(\'' + m.id + '\')">' + escHtml(m.name||m.username) + '</div>';
  });
  h += '</div></div>';
  
  h += '<div style="margin-top:12px"><div class="form-title">Number of rounds</div>';
  h += '<select class="ff-input" id="ai-rounds"><option value="1">1 round</option><option value="2">2 rounds</option><option value="3" selected>3 rounds</option><option value="4">4 rounds</option><option value="5">5 rounds</option></select></div>';
  
  h += '<button class="btn full green" onclick="generateAITournament()" style="margin-top:16px" id="ai-gen-btn">Generate Tournament</button>';
  h += '<div id="ai-result" style="margin-top:16px"></div>';
  h += '</div>';
  
  return h;
}

var aiSelectedPlayers = [];

function toggleAIPlayer(pid) {
  var idx = aiSelectedPlayers.indexOf(pid);
  if (idx === -1) aiSelectedPlayers.push(pid); else aiSelectedPlayers.splice(idx, 1);
  var el = document.getElementById("aip-" + pid);
  if (el) {
    el.style.background = aiSelectedPlayers.indexOf(pid) !== -1 ? "rgba(var(--gold-rgb),.15)" : "transparent";
    el.style.borderColor = aiSelectedPlayers.indexOf(pid) !== -1 ? "var(--gold)" : "var(--border)";
    el.style.color = aiSelectedPlayers.indexOf(pid) !== -1 ? "var(--gold)" : "var(--cream)";
  }
}

function generateAITournament() {
  var prompt = document.getElementById("ai-prompt").value.trim();
  var numRounds = parseInt(document.getElementById("ai-rounds").value) || 3;
  var btn = document.getElementById("ai-gen-btn");
  var resultEl = document.getElementById("ai-result");
  
  if (!aiSelectedPlayers.length) { Router.toast("Select at least 2 players"); return; }
  if (aiSelectedPlayers.length < 2) { Router.toast("Need at least 2 players"); return; }
  
  // Build player info string
  var playerInfo = aiSelectedPlayers.map(function(pid) {
    var p = PB.getPlayer(pid);
    if (!p) return pid;
    var hcap = PB.calcHandicap(PB.getPlayerRounds(pid)) || "unknown";
    return (p.name||p.username) + " (HCP: " + hcap + ")";
  }).join(", ");
  
  var formats = ["Stroke Play", "Stableford", "Scramble", "Best Ball", "Match Play", "Skins", "Parbaugh Stroke Play (handicap-adjusted)", "Shamble", "Chapman/Pinehurst"];
  
  var systemPrompt = "You are a golf tournament organizer for The Parbaughs, a private golf group. Generate a tournament format as JSON only. No markdown, no preamble. Return ONLY valid JSON with this structure: {title: string, description: string, rounds: [{day: number, format: string, description: string, teeTime: string, pairings: [[string, string], ...] or null, teams: [{name: string, members: [string]}] or null, notes: string}], specialRules: [string]}. Available formats: " + formats.join(", ") + ". Players: " + playerInfo + ". Number of rounds: " + numRounds + ".";
  
  var userPrompt = prompt || "Create a fun, competitive " + numRounds + "-round tournament with varied formats. Balance teams by handicap for team events. Make the final round the most dramatic.";
  
  btn.disabled = true;
  btn.textContent = "Generating...";
  resultEl.innerHTML = '<div class="loading"><div class="spinner"></div>The AI is building your tournament...</div>';
  
  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        { role: "user", content: systemPrompt + "\n\nUser request: " + userPrompt }
      ]
    })
  }).then(function(resp) { return resp.json(); })
  .then(function(data) {
    btn.disabled = false;
    btn.textContent = "Generate Tournament";
    
    var text = "";
    if (data.content) {
      data.content.forEach(function(block) { if (block.type === "text") text += block.text; });
    }
    
    try {
      var clean = text.replace(/```json|```/g, "").trim();
      var tournament = JSON.parse(clean);
      renderAITournamentResult(tournament, resultEl);
    } catch(e) {
      resultEl.innerHTML = '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.6">' + escHtml(text || "No response received") + '</div></div>';
    }
  }).catch(function(err) {
    btn.disabled = false;
    btn.textContent = "Generate Tournament";
    resultEl.innerHTML = '<div class="card"><div class="card-body" style="color:var(--red);font-size:12px">Failed to generate: ' + escHtml(err.message||"Network error") + '</div></div>';
  });
}

function renderAITournamentResult(t, el) {
  var h = '<div class="card" style="border-color:rgba(var(--gold-rgb),.2)">';
  h += '<div style="padding:16px;background:linear-gradient(135deg,var(--grad-card),var(--card));border-radius:var(--radius) var(--radius) 0 0">';
  h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold);font-weight:700">' + escHtml(t.title||"AI Tournament") + '</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5">' + escHtml(t.description||"") + '</div></div>';
  
  if (t.rounds && t.rounds.length) {
    t.rounds.forEach(function(r) {
      h += '<div style="padding:14px 16px;border-top:1px solid var(--border)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="font-size:14px;font-weight:700;color:var(--cream)">Round ' + (r.day||"") + '</div>';
      h += '<div style="font-size:10px;color:var(--gold);font-weight:600">' + escHtml(r.format||"") + '</div></div>';
      h += '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">' + escHtml(r.description||"") + '</div>';
      if (r.teeTime) h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Tee time: ' + escHtml(r.teeTime) + '</div>';
      
      if (r.pairings && r.pairings.length) {
        h += '<div style="margin-top:8px"><div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Pairings</div>';
        r.pairings.forEach(function(pair, i) {
          h += '<div style="font-size:11px;color:var(--cream);padding:2px 0">Group ' + (i+1) + ': ' + pair.join(" · ") + '</div>';
        });
        h += '</div>';
      }
      
      if (r.teams && r.teams.length) {
        h += '<div style="margin-top:8px"><div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Teams</div>';
        r.teams.forEach(function(team) {
          h += '<div style="font-size:11px;color:var(--cream);padding:2px 0"><span style="color:var(--gold)">' + escHtml(team.name) + ':</span> ' + team.members.join(" · ") + '</div>';
        });
        h += '</div>';
      }
      
      if (r.notes) h += '<div style="font-size:10px;color:var(--muted2);margin-top:6px;font-style:italic">' + escHtml(r.notes) + '</div>';
      h += '</div>';
    });
  }
  
  if (t.specialRules && t.specialRules.length) {
    h += '<div style="padding:14px 16px;border-top:1px solid var(--border);background:rgba(var(--gold-rgb),.03)">';
    h += '<div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Special Rules</div>';
    t.specialRules.forEach(function(rule) {
      h += '<div style="font-size:11px;color:var(--muted);padding:2px 0;display:flex;gap:6px"><span style="color:var(--gold)">•</span> ' + escHtml(rule) + '</div>';
    });
    h += '</div>';
  }
  
  h += '</div>';
  h += '<button class="btn full outline" onclick="generateAITournament()" style="margin-top:12px">Regenerate</button>';
  el.innerHTML = h;
}


