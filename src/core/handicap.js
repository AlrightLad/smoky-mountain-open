// ========== WHS HANDICAP SYSTEM ==========
// Single source of truth for all handicap math.
// Implements the World Handicap System (WHS) as used by GHIN/USGA.
// 9-hole rounds are treated as independent differentials (standard WHS).

// WHS sliding scale: how many differentials to use and what adjustment to apply
var WHS_SCALE = {
  3:  { count: 1, adjustment: -2.0 },
  4:  { count: 1, adjustment: -1.0 },
  5:  { count: 1, adjustment: 0 },
  6:  { count: 2, adjustment: -1.0 },
  7:  { count: 2, adjustment: 0 },
  8:  { count: 2, adjustment: 0 },
  9:  { count: 3, adjustment: 0 },
  10: { count: 3, adjustment: 0 },
  11: { count: 3, adjustment: 0 },
  12: { count: 4, adjustment: 0 },
  13: { count: 4, adjustment: 0 },
  14: { count: 4, adjustment: 0 },
  15: { count: 5, adjustment: 0 },
  16: { count: 5, adjustment: 0 },
  17: { count: 6, adjustment: 0 },
  18: { count: 6, adjustment: 0 },
  19: { count: 7, adjustment: 0 },
  20: { count: 8, adjustment: 0 }
};

// Calculate score differential for a single round.
// round fields: score (number), rating (number), slope (number)
// PCC (playing conditions calculation) defaults to 0.
function calculateScoreDifferential(round) {
  var score = round.score;
  var rating = parseFloat(round.rating);
  var slope = parseFloat(round.slope);
  if (!score || !rating || !slope || slope === 0) return null;
  return (113 / slope) * (score - rating);
}

// Calculate adjusted gross score with net double bogey cap.
// For players without an established handicap (< 3 rounds), no cap is applied.
// courseHandicap: the player's course handicap for this course (0 if unknown)
// holePars: array of par values per hole
// holeScores: array of scores per hole
// Returns the capped total score.
function adjustedGrossScore(holePars, holeScores, courseHandicap) {
  if (!holePars || !holeScores || !holePars.length) return null;
  var total = 0;
  var holesCount = Math.min(holePars.length, holeScores.length);
  // Distribute strokes across holes (simplified: even distribution)
  var baseStrokes = courseHandicap > 0 ? Math.floor(courseHandicap / holesCount) : 0;
  var extraStrokes = courseHandicap > 0 ? courseHandicap % holesCount : 0;
  for (var i = 0; i < holesCount; i++) {
    var par = parseInt(holePars[i]);
    var rawScore = parseInt(holeScores[i]);
    if (!par || isNaN(rawScore) || rawScore <= 0) continue;
    // Net double bogey = par + 2 + strokes received on this hole
    var strokesOnHole = baseStrokes + (i < extraStrokes ? 1 : 0);
    var maxScore = par + 2 + strokesOnHole;
    total += Math.min(rawScore, maxScore);
  }
  return total > 0 ? total : null;
}

// Main entry: calculate WHS Handicap Index from an array of rounds.
// rounds: array of round objects, sorted newest first.
// Each round needs: score, rating, slope, holesPlayed (optional: holePars, holeScores)
// 9-hole rounds are treated as independent differentials (standard WHS).
function calculateHandicapIndex(rounds) {
  if (!rounds || !rounds.length) return null;

  // Filter to eligible rounds: 18-hole, non-scramble, with score/rating/slope.
  // 9-hole rounds excluded until USGA Expected Score bootstrap is implemented.
  var eligible = [];
  for (var i = 0; i < rounds.length; i++) {
    var r = rounds[i];
    if (!r.score || !r.rating || !r.slope) continue;
    if (r.format === "scramble" || r.format === "scramble4") continue;
    if (r.holesPlayed && r.holesPlayed < 18) continue;
    eligible.push(r);
  }

  // Sort by date descending (most recent first), take most recent 20
  eligible.sort(function(a, b) {
    return (b.date || "").localeCompare(a.date || "");
  });
  var recent20 = eligible.slice(0, 20);
  var n = recent20.length;
  if (n < 3) return null;

  // Calculate differentials
  var differentials = [];
  for (var j = 0; j < recent20.length; j++) {
    var diff = calculateScoreDifferential(recent20[j]);
    if (diff !== null) differentials.push(diff);
  }
  differentials.sort(function(a, b) { return a - b; }); // ascending

  var dn = differentials.length;
  if (dn < 3) return null;

  // Use WHS sliding scale
  var scaleKey = Math.min(dn, 20);
  var rule = WHS_SCALE[scaleKey];
  if (!rule) return null;

  var lowest = differentials.slice(0, rule.count);
  var avg = lowest.reduce(function(a, b) { return a + b; }, 0) / lowest.length;
  var index = avg + rule.adjustment;

  // Cap at 54.0 (WHS maximum)
  index = Math.min(54.0, index);

  // Round to 1 decimal place
  return Math.round(index * 10) / 10;
}

// Calculate course handicap from handicap index.
// Course Handicap = Handicap Index * (Slope / 113) + (Course Rating - Par)
function calculateCourseHandicap(handicapIndex, slopeRating, courseRating, par) {
  if (handicapIndex === null || handicapIndex === undefined) return null;
  return Math.round(handicapIndex * ((slopeRating || 113) / 113) + ((courseRating || 72) - (par || 72)));
}

// Get details for display (differentials list, selection info)
function getHandicapDetails(rounds) {
  var eligible = [];
  for (var i = 0; i < rounds.length; i++) {
    var r = rounds[i];
    if (!r.score || !r.rating || !r.slope) continue;
    if (r.format === "scramble" || r.format === "scramble4") continue;
    if (r.holesPlayed && r.holesPlayed < 18) continue;
    eligible.push(r);
  }
  eligible.sort(function(a, b) { return (b.date || "").localeCompare(a.date || ""); });
  var recent20 = eligible.slice(0, 20);

  var differentials = [];
  for (var j = 0; j < recent20.length; j++) {
    var diff = calculateScoreDifferential(recent20[j]);
    if (diff !== null) {
      differentials.push({
        diff: Math.round(diff * 10) / 10,
        round: recent20[j],
        date: recent20[j].date,
        course: recent20[j].course,
        score: recent20[j].score,
        rating: recent20[j].rating,
        slope: recent20[j].slope,
        is9: recent20[j].holesPlayed && recent20[j].holesPlayed <= 9
      });
    }
  }
  differentials.sort(function(a, b) { return a.diff - b.diff; });

  var n = differentials.length;
  var rule = n >= 3 ? WHS_SCALE[Math.min(n, 20)] : null;
  var usedCount = rule ? rule.count : 0;

  return {
    differentials: differentials,
    eligibleCount: n,
    usedCount: usedCount,
    adjustment: rule ? rule.adjustment : 0,
    index: calculateHandicapIndex(rounds)
  };
}
