// ========== TOURNAMENT ENGINE ==========
// Free, deterministic, stats-based tournament generation. No external API.
// Pure functions only — no DOM, no routing, no network. The builder UI
// (trips/tournament pages) and the tournament view consume these.
//
// Replaced the orphaned router-ai-tournament.js (dead api.anthropic.com path)
// per the commissioner-only tournament builder spec
// (docs/superpowers/specs/2026-05-29-tournament-builder-design.md).

// ---- Catalog ----
// Formats — what game is played each round.
var TOURNAMENT_FORMATS = [
  { id: "stableford", name: "Stableford", team: false, desc: "Points per hole versus par. Rewards going for it." },
  { id: "net", name: "Net (Parbaugh)", team: false, desc: "Handicap-adjusted strokes. Levels the field." },
  { id: "stroke", name: "Stroke Play", team: false, desc: "Lowest total strokes wins. Pure and traditional." },
  { id: "scramble", name: "Scramble", team: true, desc: "Team plays the best shot each stroke. Social and fast." },
  { id: "bestball", name: "Best Ball", team: true, desc: "Everyone plays their own ball; team takes the low." },
  { id: "shamble", name: "Shamble", team: true, desc: "Best drive, then play your own in. A hybrid." },
  { id: "match", name: "Match Play", team: false, desc: "Head to head, hole by hole. Bracket drama." },
  { id: "skins", name: "Skins", team: false, desc: "Win a hole outright to take the skin. It carries over." }
];

// Team styles — how the field is shaped.
var TOURNAMENT_TEAM_STYLES = [
  { id: "individual", name: "Individual", minPlayers: 2, desc: "Every player for themselves." },
  { id: "pairs", name: "Pairs (2s)", minPlayers: 4, desc: "Two-player teams, balanced by handicap." },
  { id: "foursomes", name: "Foursomes (4s)", minPlayers: 4, desc: "Four-player teams, mixed skill." },
  { id: "ryder", name: "Ryder Cup", minPlayers: 4, desc: "Two squads, balanced by combined handicap." }
];

// Point systems — how a winner is decided across rounds.
var TOURNAMENT_POINT_SYSTEMS = [
  { id: "stableford", name: "Stableford Points", lowWins: false, desc: "Sum of Stableford points across rounds. High total wins." },
  { id: "strokes", name: "Cumulative Strokes", lowWins: true, desc: "Total gross strokes across rounds. Low total wins." },
  { id: "net", name: "Cumulative Net", lowWins: true, desc: "Total handicap-adjusted strokes. Low total wins." },
  { id: "position", name: "Position Points", lowWins: false, desc: "Per round: 1st 10, 2nd 7, 3rd 5, 4th 3, else 1. High total wins." },
  { id: "match", name: "Match Points", lowWins: false, desc: "Win a match 1, halve 0.5. High total wins." }
];

// Position-points ladder for the "position" point system.
var TOURNAMENT_POSITION_POINTS = [10, 7, 5, 3, 2, 1];

// Presets bundle format + team style + point system + round count.
// Smoky Mountain Open (Classic) is the namesake default.
var TOURNAMENT_PRESETS = [
  { id: "smoky", name: "Smoky Mountain Open (Classic)", format: "stableford", teamStyle: "individual", pointSystem: "stableford", rounds: 3, defaultTitle: "Smoky Mountain Open Champion", desc: "The namesake. Stableford every round, cumulative points, individual play." },
  { id: "parbaugh", name: "Parbaugh Championship", format: "net", teamStyle: "individual", pointSystem: "net", rounds: 3, defaultTitle: "Parbaugh Champion", desc: "Handicap-adjusted stroke play. Lowest net total takes it." },
  { id: "ryder", name: "Ryder Cup Weekend", format: "match", teamStyle: "ryder", pointSystem: "match", rounds: 3, defaultTitle: "Cup Holders", desc: "Two squads, match points, balanced by handicap." },
  { id: "skins", name: "Skins Shootout", format: "skins", teamStyle: "individual", pointSystem: "position", rounds: 2, defaultTitle: "Skins King", desc: "Every hole is a battle and the pot carries over." },
  { id: "scramble", name: "Scramble Showdown", format: "scramble", teamStyle: "foursomes", pointSystem: "strokes", rounds: 1, defaultTitle: "Scramble Champions", desc: "Balanced foursomes, best-shot golf, one decisive round." }
];

// ---- Catalog lookups ----
function tournamentFormat(id) {
  return TOURNAMENT_FORMATS.find(function (f) { return f.id === id; }) || TOURNAMENT_FORMATS[0];
}
function tournamentTeamStyle(id) {
  return TOURNAMENT_TEAM_STYLES.find(function (s) { return s.id === id; }) || TOURNAMENT_TEAM_STYLES[0];
}
function tournamentPointSystem(id) {
  return TOURNAMENT_POINT_SYSTEMS.find(function (p) { return p.id === id; }) || TOURNAMENT_POINT_SYSTEMS[0];
}
function tournamentPreset(id) {
  return TOURNAMENT_PRESETS.find(function (p) { return p.id === id; }) || null;
}

// ---- Player stats ----
// Returns { id, name, handicap }. Handicap from real round history; unestablished
// players default to 20 (same convention as the legacy trips generator).
function tournamentPlayerStat(uid) {
  var p = (typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(uid) : null;
  var handicap = 20;
  if (typeof PB !== "undefined" && PB.calcHandicap && PB.getPlayerRounds) {
    var h = PB.calcHandicap(PB.getPlayerRounds(uid));
    if (typeof h === "number" && !isNaN(h)) handicap = h;
  }
  return {
    id: uid,
    name: p ? (p.name || p.username || uid) : uid,
    handicap: Math.round(handicap * 10) / 10,
    established: !!(p)
  };
}

// Map a list of member ids to stat objects, sorted best-to-worst handicap.
function tournamentRankPlayers(memberIds) {
  return (memberIds || []).map(tournamentPlayerStat).sort(function (a, b) {
    return a.handicap - b.handicap;
  });
}

// ---- Team balancing (capacity-aware greedy) ----
// Split players into numTeams teams of near-equal size, minimizing the spread of
// combined handicap. Assign strongest-first to the eligible (non-full) team with
// the lowest running combined handicap. Beats a serpentine snake on odd counts and
// is deterministic for a given input order.
function tournamentBalanceTeams(memberIds, numTeams) {
  var players = tournamentRankPlayers(memberIds);
  var n = Math.max(1, numTeams || 2);
  var i;

  // Even-as-possible capacities: the first (players % n) teams get one extra.
  var base = Math.floor(players.length / n);
  var extra = players.length % n;
  var teams = [];
  for (i = 0; i < n; i++) {
    teams.push({ members: [], combined: 0, cap: base + (i < extra ? 1 : 0) });
  }

  // Strongest first so the high-handicap players land on the lighter teams last.
  players.slice().reverse().forEach(function (p) {
    var pick = null;
    teams.forEach(function (t) {
      if (t.members.length >= t.cap) return;
      if (pick === null || t.combined < pick.combined) pick = t;
    });
    if (!pick) pick = teams[0];
    pick.members.push(p);
    pick.combined += p.handicap;
  });

  var built = teams.map(function (t, idx) {
    return {
      name: "Team " + String.fromCharCode(65 + idx),
      members: t.members,
      combinedHandicap: Math.round(t.combined * 10) / 10
    };
  });

  // Fairness = spread between strongest and weakest team's combined handicap.
  var combinedVals = built.map(function (t) { return t.combinedHandicap; });
  var spread = combinedVals.length ? (Math.max.apply(null, combinedVals) - Math.min.apply(null, combinedVals)) : 0;
  var fairness = spread < 3 ? "Excellent balance" : spread < 6 ? "Good balance" : "Moderate imbalance";

  return { teams: built, spread: Math.round(spread * 10) / 10, fairness: fairness };
}

// ---- Tee groups ----
// Group an individual field into balanced foursomes (mix best and worst).
function tournamentTeeGroups(memberIds, groupSize) {
  var size = groupSize || 4;
  var players = tournamentRankPlayers(memberIds);
  if (players.length <= size) return [players];
  var groups = [];
  var remaining = players.slice();
  while (remaining.length > 0) {
    var group = [];
    while (group.length < size && remaining.length > 0) {
      // Alternate strongest / weakest so each group spans the skill range.
      group.push(group.length % 2 === 0 ? remaining.shift() : remaining.pop());
    }
    groups.push(group);
  }
  return groups;
}

// ---- Match-play bracket seeding ----
// Seed by handicap (1 vs N, 2 vs N-1 ...) with byes when the field is not a
// power of two. Top seeds receive the byes.
function tournamentSeedBracket(memberIds) {
  var players = tournamentRankPlayers(memberIds);
  var n = players.length;
  if (n < 2) return { size: 0, byes: 0, matches: [] };

  var bracketSize = 2;
  while (bracketSize < n) bracketSize *= 2;
  var byes = bracketSize - n;

  // Standard seeding order for a single-elimination bracket of bracketSize.
  var seeds = tournamentSeedOrder(bracketSize);
  var matches = [];
  for (var i = 0; i < bracketSize / 2; i++) {
    var aSeed = seeds[i * 2];
    var bSeed = seeds[i * 2 + 1];
    var a = aSeed <= n ? players[aSeed - 1] : null;
    var b = bSeed <= n ? players[bSeed - 1] : null;
    matches.push({
      seedA: aSeed, seedB: bSeed,
      playerA: a, playerB: b,
      bye: !a || !b
    });
  }
  return { size: bracketSize, byes: byes, matches: matches };
}

// Produce the seed pairing order for a bracket of the given power-of-two size.
// e.g. 4 -> [1,4,2,3]; 8 -> [1,8,4,5,2,7,3,6].
function tournamentSeedOrder(size) {
  var rounds = Math.log(size) / Math.log(2);
  var seeds = [1, 2];
  for (var r = 1; r < rounds; r++) {
    var next = [];
    var sum = seeds.length * 2 + 1;
    for (var i = 0; i < seeds.length; i++) {
      next.push(seeds[i]);
      next.push(sum - seeds[i]);
    }
    seeds = next;
  }
  return seeds;
}

// ---- Round schedule ----
// Build a per-round schedule. If the format is a single id, every round uses it;
// "mixed" rotates through a sensible variety.
function tournamentRoundSchedule(format, numRounds, teeTime) {
  var rounds = [];
  var tee = teeTime || "8:00 AM";
  var rotation = ["stableford", "bestball", "scramble", "skins", "net", "match", "stroke"];
  for (var i = 0; i < numRounds; i++) {
    var fmtId = format === "mixed" ? rotation[i % rotation.length] : format;
    var fmt = tournamentFormat(fmtId);
    rounds.push({
      round: i + 1,
      format: fmt.id,
      formatName: fmt.name,
      teeTime: tee,
      desc: fmt.desc
    });
  }
  return rounds;
}

// ---- Orchestrator ----
// config: { memberIds, format, teamStyle, pointSystem, rounds, teeTime }
// Returns a complete, serializable plan describing the field and schedule.
function tournamentGenerate(config) {
  config = config || {};
  var memberIds = config.memberIds || [];
  var format = config.format || "stableford";
  var teamStyle = config.teamStyle || "individual";
  var pointSystem = config.pointSystem || "stableford";
  var numRounds = Math.max(1, parseInt(config.rounds, 10) || 1);

  var field = tournamentBuildField(memberIds, teamStyle, format);

  return {
    format: format,
    teamStyle: teamStyle,
    pointSystem: pointSystem,
    numRounds: numRounds,
    schedule: tournamentRoundSchedule(format, numRounds, config.teeTime),
    field: field,
    generatedAt: Date.now()
  };
}

// Decide the field shape from team style + format.
function tournamentBuildField(memberIds, teamStyle, format) {
  switch (teamStyle) {
    case "ryder":
      return { kind: "teams", style: "ryder", result: tournamentBalanceTeams(memberIds, 2) };
    case "pairs":
      return { kind: "teams", style: "pairs", result: tournamentBalanceTeams(memberIds, Math.max(1, Math.round(memberIds.length / 2))) };
    case "foursomes":
      return { kind: "teams", style: "foursomes", result: tournamentBalanceTeams(memberIds, Math.max(1, Math.ceil(memberIds.length / 4))) };
    default:
      // Individual play.
      if (format === "match") {
        return { kind: "bracket", style: "individual", result: tournamentSeedBracket(memberIds) };
      }
      return { kind: "groups", style: "individual", result: tournamentTeeGroups(memberIds, 4) };
  }
}

// ---- Validation ----
// Returns { ok, errors:[] } for a builder config before it is committed.
function tournamentValidate(config) {
  var errors = [];
  config = config || {};
  if (!config.name || !String(config.name).trim()) errors.push("Give the tournament a name.");
  if (!config.winnerTitle || !String(config.winnerTitle).trim()) errors.push("Name the title the winner earns.");
  var members = config.memberIds || [];
  var style = tournamentTeamStyle(config.teamStyle);
  if (members.length < style.minPlayers) {
    errors.push("Need at least " + style.minPlayers + " players for " + style.name + ".");
  }
  if (!config.startAt) errors.push("Set a start date and time.");
  return { ok: errors.length === 0, errors: errors };
}
