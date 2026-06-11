/* ═══════════════════════════════════════════════════════════════════════════
   CADDY VOICES — onboarding walkthrough (FTUE) voice deck + caddie roster

   The persona is ONE silhouette (caddy-figure.js) wearing different voices —
   the Duolingo Lily/Oscar/Eddy model. The Caddy + Old Tom are FREE, fully-
   capable guides that appear across EVERY beat equally; Bag Room Guy is a
   flavor-only cosmetic reskin (shop.js pc22_bag_room) — same guidance logic,
   different voice. Help is NEVER paywalled.

   HARD SILENCE RULE: a caddie voice attaches ONLY to positive beats (greeting,
   coaching, celebration, milestone). It NEVER appears on errors, permission-
   denied, validation, or punitive economy states — those render as neutral
   system UI with no bust and no in-character copy. Persona = reward signal,
   never a blame signal (the Clippy lesson).

   Lines authored + adversarially passed against over-praise, caricature, and
   harassment (see the design brief voice notes). All bodies <= 90 chars.

   Inert until walkthrough.js consumes it. window.pbVoices / window.pbCaddies.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  // Roster. cap/tell = silhouette differentiators (caddy-figure.js); accent =
  // token color for the bust ring. locked → cosmetic unlock (never gates help).
  var CADDIES = [
    { id: "caddy",   name: "The Caddy",     cap: "ball",      accent: "var(--cb-brass)",      locked: false },
    { id: "oldtom",  name: "Old Tom",       cap: "flat",      accent: "var(--cb-brass-deep)", locked: false, tell: "pipe" },
    { id: "bagroom", name: "Bag Room Guy",  cap: "backwards", accent: "var(--cb-copper)",     locked: true, sku: "pc22_bag_room", tell: "towel" }
  ];

  // Per-beat × per-persona lines. Keyed by beatId. Coachmarks use
  // "coachmark:<surfaceKey>". Each entry has caddy/oldtom/bagroom.
  var VOICE = {
    frame: {
      caddy:   "I won't nag you. Just here when you need me.",
      oldtom:  "I've caddied long enough to know when to hold my tongue.",
      bagroom: "Don't worry, I'll tell you when you're wrong."
    },
    calibrate: {
      caddy:   "Playing solo, or heading out with your crew?",
      oldtom:  "You a links walker or a league man?",
      bagroom: "Flying solo, or bringing the whole squad?"
    },
    demoHole: {
      caddy:   "Pick a score for this par-4. Just one tap.",
      oldtom:  "Give it a swing. Par's four. Show me what you shoot.",
      bagroom: "One tap. Don't overthink it, pal."
    },
    win: {
      caddy:   "That's your first card. Real rounds start here.",
      oldtom:  "Well struck. Now you know the way.",
      bagroom: "There it is. Welcome to the show."
    },
    "coachmark:standings": {
      caddy:   "Your crew's scores live here. Stay on top.",
      oldtom:  "This is where the ladder lives. Watch your spot.",
      bagroom: "Here's where you find out who's beating you."
    },
    "coachmark:feed": {
      caddy:   "Your crew's rounds appear here as they finish.",
      oldtom:  "You'll see every good shot your mates post here.",
      bagroom: "Scroll through the carnage. Your friends' worst days."
    },
    "coachmark:chat": {
      caddy:   "Talk trash here. Text your crew in real time.",
      oldtom:  "Keep the banter going when you're not on the course.",
      bagroom: "Where the real smack talk lives, friend."
    },
    "coachmark:teetimes": {
      caddy:   "Book tee times here. Rally the crew.",
      oldtom:  "Set your rounds up weeks in advance if you're organized.",
      bagroom: "Click here to get everyone on the same tee."
    },
    "coachmark:shop": {
      caddy:   "Unlock gear and customizations with ParCoins.",
      oldtom:  "Spend your coins on the things you've earned here.",
      bagroom: "Blow your coins on some style points."
    },
    "coachmark:wagers": {
      caddy:   "Stake some coins on a round. Raise the stakes.",
      oldtom:  "Put your money where your game is, if you dare.",
      bagroom: "Time to make it hurt a little."
    },
    "coachmark:bounties": {
      caddy:   "Crew challenges. Win ParCoins for big shots.",
      oldtom:  "Challenges your mates set. Claim the prize if you're game.",
      bagroom: "Earn coins by being the best on the course."
    },
    "coachmark:richlist": {
      caddy:   "See who's got the most ParCoins. The leaderboard.",
      oldtom:  "Check who's been winning and rolling in it.",
      bagroom: "The rich get richer. Where's your name?"
    },
    welcomeBack: {
      caddy:   "You've been away. Let me catch you up.",
      oldtom:  "Long time on the bench. Time to get back in the game.",
      bagroom: "Welcome back, stranger. Lot of catching up to do."
    },
    celebrate: {
      caddy:   "Nice. You're finding your rhythm out there.",
      oldtom:  "You're learning the game. Keep at it.",
      bagroom: "Not bad. Keep it up and I'll actually be impressed."
    }
  };

  // Resolve a line for a beat + chosen caddie (defaults to The Caddy). Falls
  // back to The Caddy's line if a persona is somehow missing one, then to "".
  function line(beatId, packId) {
    var beat = VOICE[beatId];
    if (!beat) return "";
    return beat[packId] || beat.caddy || "";
  }

  function caddie(packId) {
    for (var i = 0; i < CADDIES.length; i++) { if (CADDIES[i].id === packId) return CADDIES[i]; }
    return CADDIES[0];
  }

  window.pbCaddies = CADDIES;
  window.pbVoices = { line: line, caddie: caddie, BEATS: VOICE };
})();
