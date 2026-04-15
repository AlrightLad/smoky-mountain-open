/* ═══════════════════════════════════════════════════════════════════════════
   PARCOINS — In-game currency system (earn only, no spending yet)
   Coins are cosmetic-only with zero real-world cash value.
   Balance stored on members/{uid}.parcoins via FieldValue.increment.
   Transaction log in parcoin_transactions collection.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Earn rates (v5.37.10 — matches CLAUDE.md ParCoin Economy Design) ──
// PRINCIPLE: PLAYING GOLF is the primary earning method. Period.
// Casual (~2 rounds/month, 1 range): ~175/month. Active: ~300/month. Dedicated: ~550/month.
var PARCOIN_RATES = {
  round_18h_base:          50,   // 18-hole round base
  round_18h_attested:      25,   // bonus if round is attested
  round_9h_base:           25,   // 9-hole round base
  round_9h_attested:       10,   // bonus if 9-hole round attested
  range_session:           10,   // 30+ min range session (1 per day cap)
  attest_round:            5,    // attesting someone else's scores
  tee_time_filled:         15,   // posting a tee time that fills 3+ spots
  daily_login:             1,    // 1 per day, no streak bonus
  achievement_play:        25,   // play-based achievements (25-50 based on XP)
  achievement_play_max:    50,   // major play achievements
  achievement_social:      10,   // social/misc achievements (capped at 10)
  event_win:               500,  // winning a trip/event
  season_champion:         1000, // season champion bonus
  personal_best_18h:       100,  // new personal best 18-hole score
  personal_best_9h:        50,   // new personal best 9-hole score
  invite_joined:           200,  // invitee completes registration
  new_member_welcome:      25    // one-time welcome bonus for new members
};

// ── Dedup cache (prevents double-awarding in same session) ──
var _parcoinAwarded = {};

/**
 * Award ParCoins to a user.
 * @param {string} uid - Firestore user ID
 * @param {number} amount - coins to award (positive integer)
 * @param {string} reason - machine-readable reason key (e.g. "round_complete")
 * @param {string} label - human-readable description for transaction log
 * @param {string} [dedupKey] - optional dedup key to prevent double-award
 */
function awardCoins(uid, amount, reason, label, dedupKey) {
  if (!uid || !amount || amount <= 0 || !db) return;
  amount = Math.round(amount);

  // Dedup: if this exact award was already given this session, skip
  if (dedupKey) {
    var dk = uid + ":" + dedupKey;
    if (_parcoinAwarded[dk]) { pbLog("[ParCoin] Dedup skip:", dk); return; }
    _parcoinAwarded[dk] = true;
  }

  // Increment balance atomically (prevents minting — only increment, never set)
  db.collection("members").doc(uid).update({
    parcoins: firebase.firestore.FieldValue.increment(amount),
    parcoinsLifetime: firebase.firestore.FieldValue.increment(amount)
  }).catch(function(err) { pbWarn("[ParCoin] Balance update failed:", err.message); });

  // Write transaction log
  db.collection("parcoin_transactions").add({
    uid: uid,
    amount: amount,
    reason: reason,
    label: label,
    createdAt: fsTimestamp()
  }).catch(function(err) { pbWarn("[ParCoin] Transaction log failed:", err.message); });

  // Update local profile cache
  if (currentProfile && (uid === (currentUser ? currentUser.uid : null))) {
    currentProfile.parcoins = (currentProfile.parcoins || 0) + amount;
    currentProfile.parcoinsLifetime = (currentProfile.parcoinsLifetime || 0) + amount;
  }

  pbLog("[ParCoin] Awarded", amount, "to", uid, "for", reason);
}

/**
 * Calculate coins earned for completing a round.
 * 18H: 50 base (+25 if attested). 9H: 25 base (+10 if attested).
 * Simple flat rate — every round earns the same base. Attestation is the bonus.
 */
function calcRoundCoins(is9hole, isAttested) {
  if (is9hole) {
    return PARCOIN_RATES.round_9h_base + (isAttested ? PARCOIN_RATES.round_9h_attested : 0);
  }
  return PARCOIN_RATES.round_18h_base + (isAttested ? PARCOIN_RATES.round_18h_attested : 0);
}

/**
 * Calculate coins earned for a range session.
 * Flat 10 coins for 30+ minutes. Capped at 1 per day (enforced by caller).
 */
function calcRangeCoins(durationMinutes) {
  if ((durationMinutes || 0) < 30) return 0; // must be 30+ min
  return PARCOIN_RATES.range_session;
}

/**
 * Daily login coins. Flat 1 coin per day, no streak bonus.
 * Playing a single round earns 50x more than a daily login.
 */
function calcStreakCoins() {
  return PARCOIN_RATES.daily_login;
}

/**
 * Achievement coins: play-based 25-50, social/misc capped at 10.
 * @param {number} achievementXP - XP value of the achievement
 * @param {boolean} isSocial - true for social/misc achievements
 */
function calcAchievementCoins(achievementXP, isSocial) {
  if (isSocial) return PARCOIN_RATES.achievement_social;
  if (!achievementXP || achievementXP <= 50) return PARCOIN_RATES.achievement_play;
  if (achievementXP >= 200) return PARCOIN_RATES.achievement_play_max;
  return Math.round(25 + (achievementXP - 50) * (25 / 150)); // linear 25-50 over 50-200 XP
}

/**
 * Get a user's ParCoin balance (from local cache or Firestore).
 */
function getParCoinBalance(uid) {
  if (!uid) return 0;
  // Check local cache first
  if (currentUser && uid === currentUser.uid && currentProfile) {
    return currentProfile.parcoins || 0;
  }
  if (typeof fbMemberCache !== "undefined" && fbMemberCache[uid]) {
    return fbMemberCache[uid].parcoins || 0;
  }
  return 0;
}

/**
 * Get lifetime coins earned.
 */
function getParCoinLifetime(uid) {
  if (!uid) return 0;
  if (currentUser && uid === currentUser.uid && currentProfile) {
    return currentProfile.parcoinsLifetime || 0;
  }
  if (typeof fbMemberCache !== "undefined" && fbMemberCache[uid]) {
    return fbMemberCache[uid].parcoinsLifetime || 0;
  }
  return 0;
}

/**
 * Award daily login coins. Called from enterApp. Uses Firestore to track last login date.
 */
function awardDailyLogin() {
  if (!db || !currentUser) return;
  var today = localDateStr();
  var uid = currentUser.uid;

  db.collection("members").doc(uid).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var lastLogin = data.lastLoginDate || "";
    if (lastLogin === today) return; // already awarded today

    // Flat 1 coin per day, no streak bonus
    db.collection("members").doc(uid).update({
      lastLoginDate: today
    }).catch(function(){});

    awardCoins(uid, PARCOIN_RATES.daily_login, "daily_login", "Daily login", "login_" + today);
  }).catch(function(){});
}

/**
 * Load recent transaction history for a user.
 * Returns a Promise resolving to an array of transaction objects.
 */
function loadTransactionHistory(uid, limit) {
  if (!db || !uid) return Promise.resolve([]);
  return db.collection("parcoin_transactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit || 20)
    .get()
    .then(function(snap) {
      var txns = [];
      snap.forEach(function(doc) { txns.push(Object.assign({_id: doc.id}, doc.data())); });
      return txns;
    })
    .catch(function(err) {
      pbWarn("[ParCoin] Failed to load history:", err.message);
      return [];
    });
}
