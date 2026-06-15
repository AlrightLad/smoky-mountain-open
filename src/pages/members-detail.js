// Members — Member detail panel rendering. Extracted per W1.A5 (AMD-027).
// Function: renderMemberDetailWithData (renders the full member detail page —
// hero, stats, recent rounds, badges, achievements).

function renderMemberDetailWithData(p) {
  var pid = p.id;
  // v8.14.0 — Defense-in-depth: filter abandoned rounds before any member-page
  // render consumers iterate. Abandoned rounds are dev-test artifacts and never
  // surface publicly (Gate 8a memory rule). Filter at top so all downstream
  // consumers (round history, handicap, courses played, stats, etc.) see clean
  // data without per-iteration guards.
  var rounds = PB.getPlayerRounds(pid).filter(function(r){return r.status !== "abandoned";});
  var avg = PB.getPlayerAvg(pid);
  var best = PB.getPlayerBest(pid);
  // P4 H1 (iter 16, 2026-05-14): 9-hole best surfaces alongside 18-hole
  // best per CLAUDE.md Known Bug #4. records.js already inlines this
  // split; data.js getPlayerBest9 makes it a reusable accessor (commit
  // 7c3b5ba).
  var best9 = PB.getPlayerBest9(pid);
  var ghinHcap = PB.calcHandicap(rounds);
  var hcap = ghinHcap; // Only show GHIN-calculated handicap — manual handicap is for reference only
  var unique = PB.getUniqueCourses(pid);
  var clubLabels = {driver:"Driver",three_wood:"3 Wood",four_wood:"4 Wood",five_wood:"5 Wood",seven_wood:"7 Wood",nine_wood:"9 Wood",two_hybrid:"2 Hybrid",three_hybrid:"3 Hybrid",four_hybrid:"4 Hybrid",five_hybrid:"5 Hybrid",six_hybrid:"6 Hybrid",two_iron:"2 Iron",three_iron:"3 Iron",four_iron:"4 Iron",five_iron:"5 Iron",six_iron:"6 Iron",seven_iron:"7 Iron",eight_iron:"8 Iron",nine_iron:"9 Iron",pw:"PW",aw:"AW (48-50)",gw:"GW (50-52)",gap52:"52°",sw:"SW (54-56)",gap56:"56°",gap58:"58°",lw:"LW (60°)",gap64:"64°",putter:"Putter"};

  // Canonical sec-head rhythm (task #29 structural pass): mono brass eyebrow
  // over a display-serif title. Shared by the collapsible profSection heads
  // and the static chart-section heads so every section on the page reads
  // with one editorial voice (recipes in components.css, pf-sec__*).
  function secHeadInner(eyebrow, title) {
    return '<div>' + (eyebrow ? '<div class="pf-sec__eyebrow">' + eyebrow + '</div>' : '') + '<span class="sec-title pf-sec__title">' + title + '</span></div>';
  }
  function secHead(eyebrow, title) {
    return '<div class="sec-head">' + secHeadInner(eyebrow, title) + '</div>';
  }

  // One designed empty pattern (task #29) — replaces the 3x-duplicated inline
  // chart empty plus the per-section ad-hoc grey-text empties. Headline is
  // optional; body-only keeps short empties quiet.
  function pfEmpty(headline, body) {
    var s = '<div class="pf-empty">';
    if (headline) s += '<div class="pf-empty__h">' + headline + '</div>';
    if (body) s += '<div class="pf-empty__b">' + body + '</div>';
    return s + '</div>';
  }

  // Helper for collapsible profile sections
  function profSection(id, title, content, startOpen, eyebrow) {
    var chevronSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg>';
    return '<div class="section"><div class="sec-head pf-sec__head" onclick="toggleSection(\'ps-' + id + '\')">' + secHeadInner(eyebrow, title) + '<span class="sec-link" id="ps-' + id + '-toggle" style="display:inline-flex;transition:transform .2s' + (startOpen ? ';transform:rotate(90deg)' : '') + '">' + chevronSvg + '</span></div><div id="ps-' + id + '"' + (startOpen ? '' : ' style="display:none"') + '>' + content + '</div></div>';
  }

  // Singularize a stat label when the count is exactly 1 (regular -s plurals).
  function plur(n, singular) { return n === 1 ? singular : singular + "s"; }

  // Get achievements and level early for frame/title
  var achievements = [];
  try { achievements = PB.getAchievements(pid) || []; } catch(e) {}
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = {level:1,name:"Rookie",xp:0,currentLevelXp:0,nextLevelXp:500};
  try { lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid)) || lvl; } catch(e) {}
  var frameColor = playerFrameColor(p);
  var ringStyle = typeof playerRingStyle === "function" ? playerRingStyle(p) : "border:3px solid " + frameColor;
  var activeTitle = p.equippedTitle || p.title || "Member";
  // v8.24.50 — The Engraving (PC-14): owned+equipped, the title renders as a
  // brass plate (class title-engraved) instead of italic text.
  // v8.24.76 — pc36 (Member No., leather bag tag, 500 coins) was hardcoded
  // out here so it rendered nothing when equipped. Both plate titles now
  // render; pc14 = brass engraving, pc36 = leather tag.
  var _tp = p.equippedCosmetics && p.equippedCosmetics.titleplate;
  var titleIsPlate = _tp === "pc14_engraving" || _tp === "pc36_member_tag";
  var titlePlateClass = _tp === "pc36_member_tag" ? "title-tag-leather" : "title-engraved";
  var isBeta = PB.getPlayers().indexOf(p) < 30;
  var isOwnProfile = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));

  // ── EDITORIAL PORTRAIT MASTHEAD (CLUBHOUSE_SPEC-HQ-3o) ──
  // Mirrors the roster (3e) editorial language: mono eyebrow + Fraunces italic
  // headline, left-aligned, on chalk. The avatar carries the player's equipped
  // ring treatment; a purchased banner (if equipped) renders as a contained
  // signature strip so the shop cosmetic still has a home on the profile.
  var _profColor = playerFrameColor(p);
  var _profGlow = typeof playerRingShadow === "function" ? playerRingShadow(p) : "";
  var _profAnim = typeof playerRingClass === "function" ? playerRingClass(p) : "";
  var _profAnimMap = {'ring-pulse-gold':'ringPulse 2s ease-in-out infinite','ring-diamond-sparkle':'ringShimmer 2.5s ease-in-out infinite','ring-rainbow-shift':'ringRainbow 3s linear infinite','ring-neon-green':'ringNeonGreen 1.8s ease-in-out infinite','ring-crimson-ember':'ringEmber 1.5s ease-in-out infinite'};
  var _profAnimCss = _profAnim && _profAnimMap[_profAnim] ? ';animation:' + _profAnimMap[_profAnim] : '';
  var _profShadowCombined = (_profGlow ? _profGlow + ',' : '') + '0 4px 18px rgba(20,19,15,.14)';
  var bannerBg = getPlayerBannerCss(p);

  // Topbar: back + viewer actions (edit own / block+report other).
  // .pf-page caps the single-column profile at 680px inside the shared
  // [data-page="members"] container (which stays full-width for the roster
  // grid) — same self-wrapper pattern as .tr-wrap / .league-wrap.
  var h = '<div class="pf-page">';
  h += '<div class="pf-topbar">';
  // 44pt touch floor: .back already carries min-height:44px in components.css;
  // the old inline min-height:40px silently overrode it below the floor.
  h += '<button class="back" onclick="Router.go(\'members\')">← Members</button>';
  if (isOwnProfile) h += '<button class="btn-sm outline" onclick="Router.go(\'members\',{edit:\'' + pid + '\'})">Edit profile</button>';
  else if (currentUser && currentUser.uid !== pid) {
    var _isBlocked = typeof pbIsBlocked === "function" && pbIsBlocked(pid);
    h += '<div style="display:flex;gap:6px;align-items:center">';
    h += '<button class="btn-sm outline" style="font-size:9px" onclick="toggleBlockMember(\'' + pid + '\')">' + (_isBlocked ? 'Unblock' : 'Block') + '</button>';
    h += '<button class="btn-sm outline" style="font-size:9px" onclick="reportMember(\'' + pid + '\')">Report</button>';
    h += '</div>';
  }
  h += '</div>';

  // Purchased banner cosmetic (if equipped) → contained signature strip.
  if (bannerBg) h += '<div class="pf-band" style="background:' + bannerBg + '"></div>';

  // Editorial masthead: portrait row (avatar + identity column).
  h += '<div class="roster-masthead pf-masthead">';
  // #41 — identity FELT FOCAL HERO: only the portrait row (avatar + serif name +
  // eyebrow + meta) becomes the asymmetric felt focal peak. Badges/bio/actions/XP/
  // wallet stay on the paper canvas below — deliberately NOT swept into the felt
  // (the auto-spec over-scoped that and would have buried the action buttons in
  // dark felt). Text recolored to chalk/brass on felt via .pf-hero overrides.
  h += '<div class="pf-portrait pb-card pb-card--felt pf-hero">';
  // v8.25.172 (Founder 2026-06-14) — photo editing now lives ONLY in Edit profile
  // (single edit surface); the profile avatar is display-only (no floating pencil).
  // v8.25.18x — equipped raster DECORATION shows on the profile too (the pf-av
  // uses getAvatar directly, so it needs its own overlay). When present it IS the
  // frame: drop the color border + let it extend (overflow visible); the photo
  // stays circular via its own border-radius.
  var _pfDeco = (typeof playerDecoSrc === 'function') ? playerDecoSrc(p) : '';
  var _pfFrame = _pfDeco ? ('border:none;overflow:visible;--pf-deco-inset:' + ((typeof playerDecoPhotoInsetById === 'function') ? playerDecoPhotoInsetById(p && p.equippedCosmetics && p.equippedCosmetics.border) : 16) + '%') : ('border:3px solid ' + _profColor + ';box-shadow:' + _profShadowCombined + _profAnimCss);
  h += '<div class="pf-av pf-hero-av" style="width:104px;height:104px;font-size:40px;' + _pfFrame + '">' + Router.getAvatar(p);
  // v8.25.231 — frame the photo (don't crop it): overlay the deco across the full hero
  // box; the photo is inset into the hole via the .pf-av[--pf-deco-inset] CSS hook above.
  if (_pfDeco) h += '<img alt="" aria-hidden="true" src="' + _pfDeco + '" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3">';
  h += '<div class="pf-av__lvl">' + lvl.level + '</div>';
  h += '</div>';
  h += '<div class="pf-id">';
  // v8.24.50 — The Engraving: the title leaves the eyebrow and renders as a
  // brass plate under the name; the eyebrow keeps the member-since line.
  if (titleIsPlate) {
    h += '<div class="roster-eyebrow">MEMBER · SINCE ' + escHtml(String(p.joinDate || "2026")) + '</div>';
  } else {
    h += '<div class="roster-eyebrow">' + escHtml(String(activeTitle).toUpperCase()) + ' · SINCE ' + escHtml(String(p.joinDate || "2026")) + '</div>';
  }
  h += '<h1 class="roster-headline pf-headline">' + renderUsername(p, '', false) + '</h1>';
  if (titleIsPlate) h += '<div style="margin:4px 0 2px"><span class="' + titlePlateClass + '">' + escHtml(activeTitle) + '</span></div>';
  if (p.username && p.name && p.username !== p.name) h += '<div class="pf-realname">' + escHtml(p.name) + '</div>';
  var metaParts = [];
  if (p.homeCourse) metaParts.push(escHtml(p.homeCourse));
  if (p.range) metaParts.push(escHtml(p.range));
  if (metaParts.length) h += '<div class="pf-meta">' + metaParts.join(' · ') + '</div>';
  h += '</div>';
  h += '</div>';

  // Display badges (max 3, player-selected). Each badge carries a tone; the
  // chip recipe (.pf-chip / .pf-chip--{tone} in components.css) owns the
  // geometry + type + per-tone colors that used to live as per-badge inline
  // style triplets (task #29 structural pass).
  var allBadges = [];
  if (p.founding || p.isFoundingFour) allBadges.push({id:"og",label:"THE ORIGINAL FOUR",tone:"gold"});
  if (isBeta) allBadges.push({id:"beta",label:"BETA TESTER",tone:"birdie"});
  achievements.forEach(function(a) {
    if (a.id === "champion") allBadges.push({id:"champion",label:"CHAMPION",tone:"gold"});
    if (a.id === "sub80") allBadges.push({id:"sub80",label:"SUB-80 CLUB",tone:"birdie"});
    if (a.id === "sub90") allBadges.push({id:"sub90",label:"SUB-90 CLUB",tone:"cream"});
    if (a.id === "ace") allBadges.push({id:"ace",label:"ACE MAKER",tone:"gold"});
    if (a.id === "centurion") allBadges.push({id:"centurion",label:"CENTURION",tone:"gold"});
    if (a.id === "captain") allBadges.push({id:"captain",label:"CAPTAIN",tone:"cream"});
    if (a.id === "roadwarrior") allBadges.push({id:"roadwarrior",label:"ROAD WARRIOR",tone:"birdie"});
    if (a.id === "the_commish") allBadges.push({id:"the_commish",label:"COMMISSIONER",tone:"gold"});
    if (a.id === "boss_wife") allBadges.push({id:"boss_wife",label:"THE BOSS'S WIFE",tone:"gold"});
    if (a.id === "recruiter") allBadges.push({id:"recruiter",label:"RECRUITER",tone:"birdie"});
    if (a.id === "ambassador") allBadges.push({id:"ambassador",label:"AMBASSADOR",tone:"gold"});
    if (a.id === "beast_mode") allBadges.push({id:"beast_mode",label:"BEAST MODE",tone:"red"});
    if (a.id === "birdie_king") allBadges.push({id:"birdie_king",label:"BIRDIE KING",tone:"birdie"});
    if (a.id === "bogey_free") allBadges.push({id:"bogey_free",label:"BOGEY FREE",tone:"birdie"});
    if (a.id === "grip_rip") allBadges.push({id:"grip_rip",label:"GRIP IT & RIP IT",tone:"cream"});
    if (a.id === "hot_streak") allBadges.push({id:"hot_streak",label:"ON FIRE",tone:"red"});
  });
  // Add level badge
  if (lvl.level >= 10) allBadges.push({id:"lvl",label:"LEVEL " + lvl.level,tone:"gold"});

  var displayBadges = p.displayBadges || allBadges.slice(0, 3).map(function(b){return b.id});
  var shownBadges = allBadges.filter(function(b){return displayBadges.indexOf(b.id) !== -1}).slice(0, 3);

  // Badges row (player-selected, max 3).
  if (shownBadges.length) {
    h += '<div class="pf-badges">';
    shownBadges.forEach(function(b) {
      h += '<span class="pf-chip pf-chip--' + b.tone + '">' + b.label + '</span>';
    });
    h += '</div>';
  }

  // Bio (escaped — was rendered raw prior to 3o).
  if (p.bio) h += '<div class="pf-bio">' + escHtml(p.bio) + '</div>';

  // Actions: share profile card + social (Trash Talk).
  h += '<div class="pf-actions">';
  h += '<button class="btn-sm outline" onclick="shareProfileCard(\'' + pid + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle;margin-right:4px"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg>Share Profile Card</button>';
  if (typeof renderSocialActions === "function") h += renderSocialActions(pid);
  h += '</div>';

  h += '</div>'; // close .roster-masthead

  // ── XP LEVEL BAR (compact) ──
  var pct = Math.min(100, Math.round(((lvl.xp - lvl.currentLevelXp) / Math.max(1, lvl.nextLevelXp - lvl.currentLevelXp)) * 100));
  h += '<div class="pf-xp pf-reveal" onclick="Router.go(\'trophyroom\',{id:\'' + pid + '\'})">';
  h += '<div class="pf-xp__head">';
  h += '<div class="pf-xp__lvl">Lv. ' + lvl.level + ' · ' + lvl.name + '</div>';
  h += '<div class="pf-xp__xp">' + lvl.xp.toLocaleString() + ' XP <em>→ Trophies</em></div></div>';
  // NOTE: the fill div's inline linear-gradient + width are load-bearing —
  // tests/e2e/flows/04-ui-layout-regression.spec.js locates the profile XP
  // fill by exactly that inline style. Wrapper/labels/track → .pf-xp__* tokens.
  h += '<div class="pf-xp__track"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--gold2),var(--gold3));border-radius:var(--radius-sm);transition:width .4s"></div></div>';
  h += '</div>';

  // ── THE LOCKER — cosmetics showcase (v8.25.18x, #76): unlocked count + equipped
  //    decoration signal this member's tenure/dedication; tap drives to the Pro
  //    Shop (the come-back-and-unlock loop). Shows only when they own cosmetics
  //    or have a decoration equipped (no empty noise for brand-new members).
  var _ownedCount = (p.ownedCosmetics || []).length;
  var _lockerDeco = (typeof playerDecoSrc === 'function') ? playerDecoSrc(p) : '';
  if (_ownedCount > 0 || _lockerDeco) {
    h += '<div class="pf-reveal pb-card tappable" onclick="Router.go(\'shop\')" style="cursor:pointer;display:flex;align-items:center;gap:13px;padding:13px 15px;margin-top:12px">';
    if (_lockerDeco) {
      h += '<div style="width:52px;height:52px;position:relative;flex-shrink:0"><div style="position:absolute;inset:15%;border-radius:50%;overflow:hidden;background:var(--cb-chalk-2)">' + Router.getAvatar(p) + '</div><img src="' + _lockerDeco + '" alt="" aria-hidden="true" style="position:absolute;top:50%;left:50%;width:118%;height:118%;transform:translate(-50%,-50%);pointer-events:none"></div>';
    } else {
      h += '<div style="width:46px;height:46px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--cb-chalk-2);color:var(--cb-brass)"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg></div>';
    }
    h += '<div style="flex:1;min-width:0"><div class="pf-sec__eyebrow" style="margin:0">THE LOCKER</div><div style="font-family:var(--font-display);font-weight:700;font-size:15px;color:var(--cb-ink);line-height:1.15;margin-top:1px">' + _ownedCount + ' cosmetic' + (_ownedCount === 1 ? '' : 's') + ' unlocked</div><div style="font-size:11.5px;color:var(--cb-mute);margin-top:1px">' + (_lockerDeco ? 'Decoration equipped · ' : '') + 'browse the Pro Shop</div></div>';
    h += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cb-mute)" stroke-width="2" style="flex-shrink:0"><path d="M9 18l6-6-6-6"/></svg>';
    h += '</div>';
  }

  // ── PARCOIN WALLET ──
  var coinBalance = getParCoinBalance(pid);
  var coinLifetime = getParCoinLifetime(pid);
  h += '<div class="pf-wallet pf-reveal">';
  h += '<div class="pf-wallet__main">';
  h += '<div class="pf-wallet__icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="var(--gold)" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7M7 11.5h5a2 2 0 010 0"/></svg></div>';
  h += '<div><div class="pf-wallet__bal" data-count="' + coinBalance + '">' + coinBalance.toLocaleString() + '</div>';
  h += '<div class="pf-wallet__cap">PARCOINS</div></div>';
  h += '</div>';
  if (coinLifetime > coinBalance) {
    h += '<div class="pf-wallet__life">';
    h += '<div class="pf-wallet__life-val" data-count="' + coinLifetime + '">' + coinLifetime.toLocaleString() + '</div>';
    h += '<div class="pf-wallet__life-cap">LIFETIME</div></div>';
  }
  h += '</div>';

  // ── NEMESIS / TOP RIVAL (roadmap rank 1) ──
  // Promotes the H2H ledger out of the buried Social tab into a first-class
  // identity element: the auto-assigned nemesis (most shared rounds) + a mini
  // rivalries list. Pure read via computeRivalries (P9 — only real records).
  var rivData = (typeof computeRivalries === "function") ? computeRivalries(pid) : { nemesis: null, rivalries: [] };
  var profName = p.name || p.username || "This member";
  if (rivData.nemesis) {
    var nem = rivData.nemesis;
    var nemName = nem.opp.name || nem.opp.username || "a rival";
    // v8.24.14 — Founder: "why does it say I have a nemesis when I am 4-0
    // against all my opponents." A nemesis is someone who has YOUR number;
    // when you lead the series the label tells the truth instead.
    var nemLabel = isOwnProfile
      ? (nem.trailing ? "Your Nemesis" : nem.leading ? "Your Top Rivalry" : "Dead Even Rivalry")
      : "Top Rival";
    var recStr = nem.wins + "–" + nem.losses + (nem.ties ? "–" + nem.ties + "T" : "");
    var caddyLine = isOwnProfile
      ? (typeof rivalryCaddyLine === "function" ? rivalryCaddyLine(nem, nemName) : nemName + ": " + recStr)
      : (nem.leading ? profName + " owns " + nemName + ", " + recStr + "." : nem.trailing ? nemName + " has " + profName + "'s number, " + nem.losses + "–" + nem.wins + "." : profName + " and " + nemName + " are dead even, " + recStr + ".");
    var recClass = nem.leading ? "nemesis-card__rec--up" : nem.trailing ? "nemesis-card__rec--down" : "nemesis-card__rec--even";
    h += '<div class="nemesis-card pf-reveal" onclick="showRivalryDetail(\'' + pid + '\',\'' + nem.id + '\')" tabindex="0" role="button" aria-label="' + escHtml(nemLabel + ": " + nemName + ", record " + recStr) + '" onkeydown="if(event.key===\'Enter\'){showRivalryDetail(\'' + pid + '\',\'' + nem.id + '\')}">';
    h += '<div class="nemesis-card__eyebrow">' + escHtml(nemLabel) + '</div>';
    h += '<div class="nemesis-card__body">';
    h += '<div class="nemesis-card__av">' + renderAvatar(nem.opp, 52, false) + '</div>';
    h += '<div class="nemesis-card__main"><div class="nemesis-card__name">' + escHtml(nemName) + '</div><div class="nemesis-card__line">' + escHtml(caddyLine) + '</div></div>';
    h += '<div class="nemesis-card__rec ' + recClass + '"><span class="nemesis-card__rec-num">' + escHtml(recStr) + '</span><span class="nemesis-card__rec-cap">' + nem.total + ' played</span></div>';
    h += '</div>';
    var others = rivData.rivalries.slice(1, 4);
    if (others.length) {
      h += '<div class="nemesis-card__more">';
      others.forEach(function(r) {
        var rn = r.opp.name || r.opp.username || "Rival";
        var rc = r.leading ? "nemesis-mini--up" : r.trailing ? "nemesis-mini--down" : "nemesis-mini--even";
        h += '<button type="button" class="nemesis-mini ' + rc + '" onclick="event.stopPropagation();showRivalryDetail(\'' + pid + '\',\'' + r.id + '\')">' + escHtml(rn) + ' <em>' + r.wins + '–' + r.losses + '</em></button>';
      });
      h += '</div>';
    }
    h += '</div>';
  } else if (isOwnProfile) {
    h += '<div class="nemesis-card nemesis-card--empty pf-reveal"><div class="nemesis-card__eyebrow">Your Nemesis</div><div class="nemesis-card__line">No rival yet — play the same course, same day as another Parbaugh and the Caddy starts keeping count.</div></div>';
  }

  // ── STAT GRID ──
  // Geometry lives entirely on .stats-grid / .stat-box tokens (components.css);
  // the old inline grid-template-columns duplicated the class default.
  h += '<div class="stats-grid pf-reveal">';
  // P10: a missing handicap is not a dead dash. When null, the tile becomes a
  // tappable affordance that says WHAT (no WHS index yet) + ACTION (open the
  // tracker) instead of an inert "—". Keeps the .stat-box class so the
  // layout-regression spec's "exactly 6 .stat-box" assertion still holds.
  if (hcap !== null) {
    h += statBox(hcap, "Handicap");
  } else {
    h += '<div class="stat-box stat-box--link pf-hcap-empty" onclick="toggleSection(\'ps-hcap-' + pid + '\')"><div class="stat-val">—</div><div class="stat-label">Set up handicap <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div></div>';
  }
  h += statBox(avg || "—", "Avg Score");
  var bestScore = best ? best.score : "—";
  var bestRoundId = best ? best.roundId : null;
  // P4 H1: include 9-hole best as small secondary value if a 9-hole round
  // exists. Keeps the 3-column grid intact (visual rhythm); adds info density
  // only in the existing Best tile.
  var best9Score = best9 ? best9.score : null;
  var best9Suffix = best9Score !== null
    ? '<div class="stat-sub">9-hole · ' + best9Score + (best9 && best9.holesMode === "back9" ? " · B9" : " · F9") + '</div>'
    : '';
  if (bestRoundId) {
    h += '<div class="stat-box stat-box--link" onclick="Router.go(\'rounds\',{roundId:\'' + bestRoundId + '\'})"><div class="stat-val" data-count="' + bestScore + '" style="color:var(--birdie)">' + bestScore + '</div><div class="stat-label">Best 18 <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div>' + best9Suffix + '</div>';
  } else {
    h += '<div class="stat-box"><div class="stat-val"' + (bestScore !== "—" ? ' data-count="' + bestScore + '"' : '') + '>' + (bestScore !== "—" ? '0' : bestScore) + '</div><div class="stat-label">' + (best9Score !== null ? "Best 18" : "Best") + '</div>' + best9Suffix + '</div>';
  }
  // Render the Rounds stat-box inline so data-stat and data-count sit on the
  // .stat-val div (the count-up animation target). The prior <span> wrapper
  // was destroyed by initCountAnimations setting textContent on it, which
  // wiped the inner stat-box entirely — v7.8.4 regression of v7.8.0's hook.
  // v8.25.9 — the Rounds count navigates to the member's full round history
  // (Founder: "clicking rounds where it shows 8 should take me to all rounds,
  // not load all rounds under the Last 3 section"). Same scoped {player} view
  // the "View all rounds →" link uses; tappable only when there's history.
  if (rounds.length > 0) {
    h += '<div class="stat-box stat-box--link" onclick="Router.go(\'rounds\',{player:\'' + pid + '\'})"><div class="stat-val" data-stat="round-count" data-count="' + rounds.length + '">0</div><div class="stat-label">' + plur(rounds.length, "Round") + ' <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div></div>';
  } else {
    h += '<div class="stat-box"><div class="stat-val" data-stat="round-count" data-count="0">0</div><div class="stat-label">' + plur(0, "Round") + '</div></div>';
  }
  // Courses stat is clickable — drops to Our Courses view (best rounds per course).
  // Same pattern as M3 (standings Courses button).
  var coursesIsNum = !isNaN(parseFloat(unique)) && isFinite(unique) && unique !== "—";
  h += '<div class="stat-box stat-box--link" onclick="window._courseViewMode=\'ours\';Router.go(\'courses\')"><div class="stat-val"' + (coursesIsNum ? ' data-count="' + unique + '"' : '') + '>' + (coursesIsNum ? '0' : unique) + '</div><div class="stat-label">' + (coursesIsNum ? plur(parseFloat(unique), "Course") : "Courses") + ' <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div></div>';
  var ewIds = [pid]; if (p.claimedFrom) ewIds.push(p.claimedFrom);
  var eventWinsCount = PB.getTrips().filter(function(t){ return t.champion && ewIds.indexOf(t.champion) !== -1; }).length;
  var winsCount = eventWinsCount || p.wins || 0;
  h += statBox(winsCount, plur(winsCount, "Win"));
  h += '</div>';

  // ── PROFILE TABS ──
  h += '<div class="toggle-bar pf-reveal" id="profile-tabs">';
  h += '<button class="a" onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-overview\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Overview</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-stats\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Stats</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-gear\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Gear</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-social\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Social</button>';
  h += '</div>';

  // ═══ TAB: OVERVIEW (last rounds, courses, achievements) ═══
  h += '<div id="ptab-overview" data-ptab>';

  // Title picker (hidden by default)
  h += '<div id="title-picker" style="display:none;text-align:left;max-width:320px;margin:8px auto">';
  var allTitles = [
    {name:"Rookie",req:"Default",unlocked:true},
    {name:"Weekend Warrior",req:"Level 5",unlocked:lvl.level>=5},
    {name:"Range Rat",req:"Level 10",unlocked:lvl.level>=10},
    {name:"Fairway Finder",req:"Level 15",unlocked:lvl.level>=15},
    {name:"Club Member",req:"Level 20",unlocked:lvl.level>=20},
    {name:"Course Regular",req:"Level 25",unlocked:lvl.level>=25},
    {name:"Low Handicapper",req:"Level 30",unlocked:lvl.level>=30},
    {name:"Scratch Aspirant",req:"Level 35",unlocked:lvl.level>=35},
    {name:"Ironman",req:"Level 40",unlocked:lvl.level>=40},
    {name:"Birdie Hunter",req:"Level 45",unlocked:lvl.level>=45},
    {name:"Eagle Eye",req:"Level 50",unlocked:lvl.level>=50},
    {name:"Tour Wannabe",req:"Level 55",unlocked:lvl.level>=55},
    {name:"Golf Addict",req:"Level 60",unlocked:lvl.level>=60},
    {name:"Links Legend",req:"Level 65",unlocked:lvl.level>=65},
    {name:"Course Conqueror",req:"Level 70",unlocked:lvl.level>=70},
    {name:"The Professor",req:"Level 75",unlocked:lvl.level>=75},
    {name:"Hall of Famer",req:"Level 80",unlocked:lvl.level>=80},
    {name:"Living Legend",req:"Level 85",unlocked:lvl.level>=85},
    {name:"Immortal",req:"Level 90",unlocked:lvl.level>=90},
    {name:"Transcendent",req:"Level 95",unlocked:lvl.level>=95},
    {name:"G.O.A.T.",req:"Level 100",unlocked:lvl.level>=100}
  ];
  var aTitles = [
    {name:"Sharpshooter",req:"Shoot under 80",unlocked:achievements.some(function(a){return a.id==="sub80"})},
    {name:"Tour Ready",req:"Shoot under 70",unlocked:achievements.some(function(a){return a.id==="sub70"})},
    {name:"Ace Maker",req:"Hole-in-one",unlocked:achievements.some(function(a){return a.id==="ace"})},
    {name:"Champion",req:"Win an event",unlocked:achievements.some(function(a){return a.id==="champion"})},
    {name:"Dynasty Builder",req:"Win 3 events",unlocked:achievements.some(function(a){return a.id==="dynasty"})},
    {name:"The Dominator",req:"25 H2H wins",unlocked:achievements.some(function(a){return a.id==="dominator"})},
    {name:"Nemesis",req:"10 H2H wins",unlocked:achievements.some(function(a){return a.id==="nemesis"})},
    {name:"The Nomad",req:"25 courses",unlocked:achievements.some(function(a){return a.id==="nomad"})},
    {name:"Road Warrior",req:"5 states",unlocked:achievements.some(function(a){return a.id==="roadwarrior"})},
    {name:"Local Legend",req:"10 rounds same course",unlocked:achievements.some(function(a){return a.id==="local_legend"})},
    {name:"Centurion",req:"100 rounds",unlocked:achievements.some(function(a){return a.id==="centurion"})},
    {name:"Metamorphosis",req:"Average improved 15+",unlocked:achievements.some(function(a){return a.id==="metamorphosis"})}
  ];
  var sTitles = [
    {name:"The Original Four",req:"Founding member",unlocked:!!(p.founding || p.isFoundingFour || (p.badges && p.badges.indexOf("founder") !== -1))},
    {name:"The Original Four · Commissioner",req:"Be The Commissioner",unlocked:(p.founding || p.isFoundingFour) && (isFounderRole(p)||pid==="zach"||p.username==="TheCommissioner")},
    {name:"Beta Tester",req:"First 30 members",unlocked:isBeta}
  ];
  // Event-specific champion titles
  var eventTitles = [];
  PB.getTrips().forEach(function(t) {
    if (!t.champion) return;
    var isChamp = t.champion === pid || (p.claimedFrom && t.champion === p.claimedFrom);
    if (!isChamp) {
      // Check reverse — champion might be UID and pid is seed, or vice versa
      var champPlayer = PB.getPlayer(t.champion);
      if (champPlayer && (champPlayer.claimedFrom === pid || champPlayer.id === p.claimedFrom)) isChamp = true;
    }
    var funnyNames = {
      "smo": "King of the Smokies",
      "smoky": "King of the Smokies",
      "mountain": "King of the Smokies"
    };
    var eventTitle = null;
    var nameLower = (t.name || "").toLowerCase();
    Object.keys(funnyNames).forEach(function(k) { if (nameLower.indexOf(k) !== -1 && !eventTitle) eventTitle = funnyNames[k]; });
    if (!eventTitle) eventTitle = t.name + " Champion";
    eventTitles.push({name: eventTitle, req: "Win " + t.name, unlocked: isChamp});
  });
  var combined = allTitles.concat(aTitles).concat(sTitles).concat(eventTitles);
  h += '<div style="max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--card)">';
  combined.forEach(function(t) {
    var isEquipped = activeTitle === t.name;
    if (t.unlocked) {
      h += '<div onclick="equipTitle(\'' + pid + '\',\'' + t.name.replace(/'/g,"\\'") + '\')" style="padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:' + (isEquipped ? 'rgba(var(--gold-rgb),.08)' : 'transparent') + '">';
      h += '<div><div style="font-size:12px;font-weight:600;color:' + (isEquipped ? 'var(--gold)' : 'var(--cream)') + '">' + escHtml(t.name) + '</div>';
      h += '<div style="font-size:9px;color:var(--muted)">' + t.req + '</div></div>';
      if (isEquipped) h += '<div style="font-size:9px;color:var(--gold);font-weight:700;letter-spacing:.5px">EQUIPPED</div>';
      h += '</div>';
    } else {
      h += '<div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;opacity:.35">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--muted2)">' + escHtml(t.name) + '</div>';
      h += '<div style="font-size:9px;color:var(--muted2)">' + t.req + '</div></div>';
      h += '<div style="font-size:10px;color:var(--muted2)">Locked</div></div>';
    }
  });
  h += '</div></div>';

  // === HANDICAP TRACKER (collapsible, open by default) ===
  var hcapContent = '';
  var hcapDetails = PB.getHandicapDetails(rounds);
  var totalDiffs = hcapDetails.differentials.length;
  var hasData = totalDiffs > 0 || hcapDetails.unpaired9;
  
  // Current handicap hero
  if (hcap !== null) {
    hcapContent += '<div style="text-align:center;padding:16px 12px 12px">';
    hcapContent += '<div style="font-family:var(--font-display);font-size:42px;font-weight:700;color:var(--gold)">' + hcap + '</div>';
    hcapContent += '<div style="font-size:10px;color:var(--muted);letter-spacing:.5px;margin-top:2px">WHS HANDICAP INDEX</div>';
    hcapContent += '</div>';
  } else if (totalDiffs > 0) {
    hcapContent += '<div style="text-align:center;padding:14px 12px 10px">';
    hcapContent += '<div style="font-size:13px;color:var(--muted)">' + (3 - totalDiffs) + ' more qualifying round' + (3 - totalDiffs !== 1 ? 's' : '') + ' to establish handicap</div>';
    hcapContent += '</div>';
  }
  
  // Graph (only when 3+ differentials)
  if (totalDiffs >= 3) {
    hcapContent += buildHandicapGraph(rounds, pid);
  }
  
  // Differentials table (collapsible)
  if (totalDiffs > 0) {
    var diffToggleId = "diffTable_" + pid;
    hcapContent += '<div style="padding:8px 12px 4px"><div class="pf-subhead pf-subhead--toggle" onclick="var el=document.getElementById(\'' + diffToggleId + '\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">SCORE DIFFERENTIALS (' + hcapDetails.differentials.length + ')<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></div>';
    hcapContent += '<div id="' + diffToggleId + '" style="display:none">';
    // v8.13.4 — Schema simplification. getHandicapDetails (handicap.js:125-165)
    // returns differentials as flat objects {diff, round, date, course, score,
    // rating, slope, is9}. Legacy d.type/d.rounds/d.combinedScore branching
    // never fires against current data shape, leaving roundInfo empty. Format
    // mirrors the "LAST 3 ROUNDS" two-row pattern (course/score on row 1,
    // date on row 2) for visual consistency. 9-hole rounds are excluded by
    // handicap.js:131 so the 9+9 branch is dead code anyway.
    hcapDetails.differentials.forEach(function(d) {
      var diffColor = d.diff < 15 ? "var(--birdie)" : d.diff < 25 ? "var(--gold)" : "var(--red)";
      hcapContent += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px">';
      hcapContent += '<div style="min-width:0;flex:1;overflow:hidden">';
      hcapContent += '<div style="color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(d.course || "") + ' · ' + d.score + '</div>';
      hcapContent += '<div style="font-size:9px;color:var(--muted)">' + escHtml(d.date || "") + '</div>';
      hcapContent += '</div>';
      hcapContent += '<div style="flex-shrink:0;font-weight:600;color:' + diffColor + ';min-width:40px;text-align:right">' + d.diff.toFixed(1) + '</div>';
      hcapContent += '</div>';
    });
    hcapContent += '</div></div>';
  }
  
  // Unpaired 9-hole round (always visible)
  if (hcapDetails.unpaired9) {
    var u = hcapDetails.unpaired9;
    var uMode = u.holesMode === "back9" ? "Back 9" : "Front 9";
    hcapContent += '<div style="padding:8px 12px 12px;border-top:1px solid var(--border)">';
    hcapContent += '<div style="display:flex;justify-content:space-between;align-items:center">';
    hcapContent += '<div style="font-size:11px;color:var(--muted)">' + escHtml(u.course || "9 holes") + ' · ' + uMode + ' · ' + u.score + '</div>';
    hcapContent += '<span style="font-size:9px;font-weight:600;color:var(--gold);background:rgba(var(--gold-rgb),.1);padding:3px 8px;border-radius:var(--radius-full);white-space:nowrap">Awaiting pairing</span>';
    hcapContent += '</div>';
    hcapContent += '<div style="font-size:9px;color:var(--muted2);margin-top:3px">Per WHS rules, two 9-hole rounds combine into one differential</div>';
    hcapContent += '</div>';
  }
  
  // Empty state
  if (!hasData) {
    var indivCount = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"}).length;
    hcapContent += pfEmpty(null, 'Log ' + Math.max(1, 3 - indivCount) + ' more individual round' + (3 - indivCount !== 1 ? 's' : '') + ' to start tracking your handicap');
  }
  
  h += profSection("hcap-" + pid, "Handicap tracker", hcapContent, hasData, "WHS Index");

  // === LAST 3 ROUNDS (collapsible, open by default) ===
  var last3Content = '';
  if (rounds.length) {
    var last3 = rounds.slice().sort(function(a,b){ return (b.date||"") > (a.date||"") ? 1 : (b.date||"") < (a.date||"") ? -1 : 0; }).slice(0, 3);
    last3.forEach(function(r) {
      var c = PB.generateRoundCommentary(r);
      var quip = c.roasts.length ? c.roasts[0] : (c.highlights.length ? c.highlights[0] : "");
      // Par-relative tag, matching the rounds-list card this mirrors: score minus the
      // canonical par total (handicap.js; 9-hole rounds sum only the holes played).
      // Under reads quiet green; even and over stay neutral, never alarm-red on a
      // member's own round. Replaces an old score-minus-rating decimal never rendered.
      var mdPar = roundParTotal(r);
      var mdVsPar = (r.score && r.score > 0) ? (r.score - mdPar) : null;
      var mdVsParStr = "";
      var mdVsParColor = "var(--cb-mute, var(--muted))";
      if (mdVsPar !== null) {
        if (mdVsPar < 0)      { mdVsParStr = mdVsPar + ""; mdVsParColor = "var(--cb-moss, var(--success, #4ea669))"; }
        else if (mdVsPar === 0) { mdVsParStr = "E"; }
        else                  { mdVsParStr = "+" + mdVsPar; }
      }
      var safeCourse = (r.course||"").replace(/'/g,"\\'");
      var safeName = (r.playerName||"").replace(/'/g,"\\'");
      var safeTee = (r.tee||"").replace(/'/g,"\\'");
      var safeYards = r.yards || 0;
      last3Content += '<div class="card"><div class="round-card"><div class="rc-top"><div onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})" style="cursor:pointer;flex:1"><div class="rc-course">' + escHtml(r.course) + '</div><div class="rc-date">' + r.date + (r.format && r.format !== "stroke" ? ' · ' + r.format : '') + '</div></div>';
      last3Content += '<div style="display:flex;align-items:center;gap:8px"><div style="text-align:right"><div class="rc-score">' + r.score + '</div>';
      if (mdVsParStr) last3Content += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:' + mdVsParColor + ';letter-spacing:0.5px;margin-top:2px;line-height:1">' + mdVsParStr + ' to par</div>';
      last3Content += '</div>';
      last3Content += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px;flex-shrink:0" onclick="event.stopPropagation();showRoundShareCard(\'' + r.id + '\')">Share</button>';
      last3Content += '</div></div>';
      if (quip) last3Content += '<div class="rc-quip">' + quip + '</div>';
      last3Content += '</div></div>';
    });
    // v8.25.44 — Founder: "Recent play should only show the last 3 rounds, not
    // have a button to show all rounds." The full ledger stays reachable by
    // tapping the Rounds count stat above (stat-box--link → scoped rounds view,
    // v8.25.9), so the show-all button here is redundant and removed.
  } else {
    last3Content = pfEmpty(null, "No rounds logged yet");
  }
  h += profSection("last3-" + pid, "Last 3 rounds", last3Content, true, "Recent play");

  // === COURSES PLAYED (collapsible, open by default) ===
  var coursesContent = '';
  if (rounds.length) {
    var courseMap = {};
    rounds.forEach(function(r) {
      if (!r.course) return;
      if (!courseMap[r.course]) courseMap[r.course] = { name: r.course, best18: null, best9: null, best9mode: null, bestScramble: null, count: 0, bestRoundId: null, best9RoundId: null };
      courseMap[r.course].count++;
      var isScramble = r.format === "scramble" || r.format === "scramble4";
      var is9 = r.holesPlayed && r.holesPlayed <= 9;
      if (isScramble) {
        if (courseMap[r.course].bestScramble === null || r.score < courseMap[r.course].bestScramble) courseMap[r.course].bestScramble = r.score;
      } else if (is9) {
        if (courseMap[r.course].best9 === null || r.score < courseMap[r.course].best9) {
          courseMap[r.course].best9 = r.score;
          courseMap[r.course].best9mode = r.holesMode === "back9" ? "Back 9" : "Front 9";
          courseMap[r.course].best9RoundId = r.id;
        }
      } else {
        if (courseMap[r.course].best18 === null || r.score < courseMap[r.course].best18) {
          courseMap[r.course].best18 = r.score;
          courseMap[r.course].bestRoundId = r.id;
        }
      }
    });
    var courseList = Object.values(courseMap).sort(function(a, b) { return b.count - a.count; });
    courseList.forEach(function(c) {
      var lines = [];
      if (c.best18 !== null) {
        var click18 = c.bestRoundId ? ' style="cursor:pointer;color:var(--gold)" onclick="Router.go(\'rounds\',{roundId:\'' + c.bestRoundId + '\'})"' : ' style="color:var(--gold)"';
        lines.push('<span' + click18 + '>Best: ' + c.best18 + '</span>');
      }
      if (c.best9 !== null) {
        var click9 = c.best9RoundId ? ' style="cursor:pointer;color:var(--gold)" onclick="Router.go(\'rounds\',{roundId:\'' + c.best9RoundId + '\'})"' : ' style="color:var(--gold)"';
        lines.push('<span' + click9 + '>Best: ' + c.best9 + ' <span style="color:var(--muted);font-size:9px">(' + (c.best9mode || '9h') + ')</span></span>');
      }
      if (c.bestScramble !== null) {
        lines.push('<span style="color:var(--muted)">Scramble: ' + c.bestScramble + '</span>');
      }
      if (!lines.length) lines.push('<span style="color:var(--muted)">—</span>');
      coursesContent += '<div class="club-row" style="flex-wrap:wrap;gap:2px"><span class="club-name">' + escHtml(c.name) + ' <span style="color:var(--muted);font-size:9px">(' + c.count + 'x)</span></span><span class="club-yd" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:11px">' + lines.join('') + '</span></div>';
    });
  } else {
    coursesContent = pfEmpty(null, "No courses played yet");
  }
  h += profSection("courses-" + pid, "Courses played", coursesContent, true, "Course log");

  // === RECENT PARCOINS (async load) ===
  // Self-only: parcoin_transactions are private-to-owner per firestore.rules:372-377
  // (allow read: if isAuth() && resource.data.uid == uid()). Skipping the section
  // entirely for non-self profiles avoids both the empty placeholder and the
  // rules-denied query firing on every re-render. (v8.9.2)
  if (isOwnProfile) {
    h += '<div class="section">' + secHead("ParCoins", "Recent earnings");
    h += '<div id="parcoin-history-' + pid + '"><div class="loading"><div class="spinner"></div>Loading…</div></div>';
    h += '</div>';
  }

  h += '</div>'; // close ptab-overview

  // ═══ TAB: GEAR (bag, clubs, known for) ═══
  h += '<div id="ptab-gear" data-ptab style="display:none">';

  // === WHAT'S IN THE BAG (collapsible) ===
  var bagContent = '';
  if (p.bagPhoto) bagContent += '<div style="border-radius:var(--radius);overflow:hidden;margin-bottom:8px"><img alt="" src="' + escHtml(p.bagPhoto) + '" style="width:100%;display:block"></div>';
  if (p.bag) {
    var bagLabels = {driver:"Driver",irons:"Irons",wedges:"Wedges",putter:"Putter",bag_brand:"Bag",accessories:"Accessories",fav_ball:"Favorite Ball"};
    Object.keys(bagLabels).forEach(function(k) {
      if (p.bag && p.bag[k]) bagContent += '<div class="club-row"><span class="club-name">' + bagLabels[k] + '</span><span class="club-yd" style="max-width:200px;text-align:right">' + escHtml(p.bag[k]) + '</span></div>';
    });
  }
  if (!bagContent) bagContent = pfEmpty(null, "No equipment listed yet");
  h += profSection("bag-" + pid, "What\'s in the bag", bagContent, false, "Equipment");

  // === CLUB DISTANCES (collapsible) ===
  var clubContent = '';
  if (p.clubs && Object.keys(p.clubs).some(function(k) { return p.clubs[k]; })) {
    Object.keys(clubLabels).forEach(function(k) {
      if (p.clubs[k]) clubContent += '<div class="club-row"><span class="club-name">' + clubLabels[k] + '</span><span class="club-yd">' + p.clubs[k] + ' yds</span></div>';
    });
  } else {
    clubContent = pfEmpty(null, "No distances logged yet");
  }
  h += profSection("clubs-" + pid, "Club distances", clubContent, false, "Yardages");

  // === KNOWN FOR (collapsible) ===
  if (p.funnyFacts && p.funnyFacts.length) {
    var factsContent = '';
    p.funnyFacts.forEach(function(f) { factsContent += '<div class="fact-item">• ' + escHtml(f) + '</div>'; });
    h += profSection("facts-" + pid, "Known for", factsContent, false, "Clubhouse lore");
  }
  h += '</div>'; // close ptab-gear

  // ═══ TAB: STATS (achievements, accolades, all rounds) ═══
  h += '<div id="ptab-stats" data-ptab style="display:none">';

  // ═══ ANALYTICS DASHBOARD ═══
  if (typeof calcScoringTrends === "function" && rounds.length >= 3) {
    // Scoring Trends — v8.14.4 adds 30D/SEASON/ANNUAL toggle (P17 pattern).
    // Toggle inside .card per F2 ruling. Filter rounds before calc; if filter
    // is too aggressive (<3 rounds) chart shows empty-state but toggle stays
    // visible so user can switch range.
    var scoringRange = PB.getChartRange('scoring_trend', '30D');
    var scoringFiltered = PB.filterRoundsByRange(rounds, scoringRange);
    var trends = calcScoringTrends(scoringFiltered);
    h += '<div class="section">' + secHead("Form", "Scoring Trend");
    h += '<div class="card"><div style="padding:14px 16px">';
    h += _renderChartRangeToggle('scoring_trend', scoringRange, pid);
    h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Rolling 5-round average</div>';
    h += '<div class="chart-container" data-chart-id="scoring_trend">';
    if (trends && trends.rolling5.length >= 3) {
      h += svgLineChart(trends.rolling5, {width:310, height:120, color:'var(--gold)'});
    } else {
      h += pfEmpty("Not enough rounds in this range", "Try a wider window.");
    }
    h += '</div></div></div></div>';

    // Scoring Zones (par type)
    var zones = calcScoringZones(rounds);
    if (zones) {
      var zoneData = [];
      [3,4,5].forEach(function(p) { if (zones[p]) zoneData.push({label:"Par "+p, value:zones[p].avg, color:zones[p].avg<=0.5?"var(--birdie)":zones[p].avg<=1.5?"var(--gold)":"var(--red)"}); });
      if (zoneData.length >= 2) {
        h += '<div class="section">' + secHead("Par 3 · 4 · 5", "Scoring by Par Type");
        h += '<div class="card"><div style="padding:14px 16px">';
        h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Average strokes over par</div>';
        h += svgBarChart(zoneData, {width:200, height:120, showLabels:true, showValues:true});
        zoneData.forEach(function(z) {
          var label = z.value <= 0.5 ? "Strong" : z.value <= 1.0 ? "Solid" : z.value <= 1.5 ? "Average" : z.value <= 2.0 ? "Needs work" : "Bleeding strokes";
          h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">' + z.label + 's: <span style="color:' + z.color + ';font-weight:600">+' + z.value + '</span>, ' + label + '</div>';
        });
        h += '</div></div></div>';
      }
    }

    // Strokes Gained
    var sg = calcStrokesGained(rounds);
    if (sg) {
      var sgData = [
        {label:"Tee", value:sg.tee, color:sg.tee>=0?"var(--birdie)":"var(--red)"},
        {label:"Approach", value:sg.approach, color:sg.approach>=0?"var(--birdie)":"var(--red)"},
        {label:"Short", value:sg.shortGame, color:sg.shortGame>=0?"var(--birdie)":"var(--red)"},
        {label:"Putting", value:sg.putting, color:sg.putting>=0?"var(--birdie)":"var(--red)"}
      ];
      h += '<div class="section">' + secHead("Vs baseline", "Strokes Gained");
      h += '<div class="card"><div style="padding:14px 16px">';
      h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Per round vs baseline (from ' + sg.rounds + ' rounds)</div>';
      h += svgBarChart(sgData, {width:280, height:130, showLabels:true, showValues:true});
      h += '</div></div></div>';
    }

    // Stat Trends (FIR, GIR, Putts) — v8.14.4 GIR + Putts get their own
    // independent toggles (separate localStorage keys; user can view different
    // ranges per chart). Section always renders if calcStatTrends has data
    // for ALL rounds (not filtered yet); per-chart filter happens below.
    if (typeof calcStatTrends === "function") {
      // GIR % Trend
      var girRange = PB.getChartRange('gir_trend', '30D');
      var girFiltered = PB.filterRoundsByRange(rounds, girRange);
      var statTrGir = calcStatTrends(girFiltered);
      if (statTrGir || calcStatTrends(rounds)) {
        h += '<div class="section">' + secHead("Greens", "GIR % Trend");
        h += '<div class="card"><div style="padding:14px 16px">';
        h += _renderChartRangeToggle('gir_trend', girRange, pid);
        h += '<div class="chart-container" data-chart-id="gir_trend">';
        if (statTrGir && statTrGir.gir.length >= 3) {
          h += svgLineChart(statTrGir.gir, {width:310, height:100, color:'var(--gold)', yMin:0, yMax:100});
        } else {
          h += pfEmpty("Not enough rounds in this range", "Try a wider window.");
        }
        h += '</div></div></div></div>';
      }

      // Putts Per Hole Trend
      var puttsRange = PB.getChartRange('putts_trend', '30D');
      var puttsFiltered = PB.filterRoundsByRange(rounds, puttsRange);
      var statTrPutts = calcStatTrends(puttsFiltered);
      if (statTrPutts || calcStatTrends(rounds)) {
        h += '<div class="section">' + secHead("Putting", "Putts Per Hole Trend");
        h += '<div class="card"><div style="padding:14px 16px">';
        h += _renderChartRangeToggle('putts_trend', puttsRange, pid);
        h += '<div class="chart-container" data-chart-id="putts_trend">';
        if (statTrPutts && statTrPutts.putts.length >= 3) {
          h += svgLineChart(statTrPutts.putts, {width:310, height:100, color:'var(--pink)'});
        } else {
          h += pfEmpty("Not enough rounds in this range", "Try a wider window.");
        }
        h += '</div></div></div></div>';
      }
    }

    // Course Breakdown (most-played course)
    var courseCounts = {};
    rounds.filter(function(r){return r.course}).forEach(function(r){courseCounts[r.course]=(courseCounts[r.course]||0)+1});
    var topCourse = Object.entries(courseCounts).sort(function(a,b){return b[1]-a[1]})[0];
    if (topCourse && topCourse[1] >= 3) {
      var breakdown = calcCourseBreakdown(topCourse[0], rounds);
      if (breakdown && breakdown.holes.length >= 9) {
        h += '<div class="section">' + secHead("Most-played course", "Hole-by-Hole");
        h += '<div class="card"><div style="padding:16px">';
        h += renderHeatMap(breakdown, { linkRounds: isOwnProfile });
        h += '</div></div></div>';
      }
    }
  } else if (rounds.length < 3) {
    h += '<div class="section">' + pfEmpty("Analytics locked", "Log 3+ rounds to unlock analytics dashboard") + '</div>';
  }

  // === ACHIEVEMENTS (collapsible) ===
  var achieveContent = '';
  if (achievements.length) {
    achieveContent += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    var cats = {milestone:"Milestones",score:"Scoring",explore:"Exploration",compete:"Competitive",growth:"Improvement",special:"Special",range:"Range Practice",level:"Level"};
    var grouped = {};
    achievements.forEach(function(a) { if (!grouped[a.cat]) grouped[a.cat] = []; grouped[a.cat].push(a); });
    Object.keys(cats).forEach(function(cat) {
      if (!grouped[cat]) return;
      achieveContent += '<div class="pf-subhead pf-subhead--cat">' + cats[cat] + '</div>';
      grouped[cat].forEach(function(a) {
        var _eStr = "";
        if (a.earnedAt) {
          var _eD2 = new Date(a.earnedAt + "T12:00:00");
          var _eMn2 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          _eStr = ' · ' + _eMn2[_eD2.getMonth()] + ' ' + _eD2.getDate() + ', ' + _eD2.getFullYear();
        }
        achieveContent += '<div style="padding:6px 10px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius);cursor:default">';
        achieveContent += '<div style="font-size:11px;font-weight:700;color:var(--gold)">' + a.icon + ' ' + a.name + '</div>';
        achieveContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + a.desc + (_eStr ? '<span style="color:var(--muted2)">' + _eStr + '</span>' : '') + '</div></div>';
      });
    });
    achieveContent += '</div>';
  } else {
    achieveContent = pfEmpty("No achievements yet", "Log rounds to unlock.");
  }
  h += profSection("achieve-" + pid, "Achievements (" + achievements.length + ")", achieveContent, false, "Trophy case");
  var teams = PB.getScrambleTeams();
  // Match team membership by UID, claimedFrom seed ID, or username
  var pClaimedFrom = p.claimedFrom || null;
  var pUsername = p.username || null;
  var playerTeams = teams.filter(function(t) {
    if (!t.members) return false;
    return t.members.indexOf(pid) !== -1 ||
           (pClaimedFrom && t.members.indexOf(pClaimedFrom) !== -1) ||
           (pUsername && t.members.indexOf(pUsername) !== -1);
  });
  var teamContent = '';
  if (playerTeams.length) {
    playerTeams.forEach(function(t) {
      var matches = (t.matches || []).slice();
      // v8.25.9 — derive founding scramble rounds (logged as individual scramble
      // round docs, never as a team match) using the SHARED all-members-present
      // rule, unified with the team detail / list / league-records surfaces. The
      // prior any-member merge here could bleed a scramble onto a team where only
      // one member happened to play it; requiring every member share the
      // course+date uniquely identifies a real team scramble.
      if (typeof _deriveTeamScrambleRounds === "function") {
        _deriveTeamScrambleRounds(t).forEach(function(dr){ if (!matches.some(function(m){return m.course===dr.course && m.date===dr.date;})) matches.push(dr); });
      }
      // Deduplicate by course+date (a team scramble counts as one team round)
      var uniqueRounds = {};
      matches.forEach(function(m) { if (m.course && m.date) uniqueRounds[(m.course||"") + "|" + (m.date||"")] = m; });
      var teamRoundCount = Object.keys(uniqueRounds).length;
      
      var bestScore = null;
      matches.forEach(function(m){ if (m.score && (bestScore === null || m.score < bestScore)) bestScore = m.score; });
      var h2hMatches = matches.filter(function(m){ return m.result === "win" || m.result === "loss" || m.result === "tie"; });
      var wins = h2hMatches.filter(function(m){ return m.result === "win"; }).length;
      var losses = h2hMatches.filter(function(m){ return m.result === "loss"; }).length;
      var mates = t.members.filter(function(id){return id !== pid && id !== pClaimedFrom}).map(function(id){var p=PB.getPlayer(id);return p?p.name:id}).join(", ");
      
      var rightHTML = '';
      if (h2hMatches.length) {
        rightHTML = '';
        if (bestScore) rightHTML += '<div style="font-size:16px;font-weight:700;color:var(--gold)">' + bestScore + '</div>';
        rightHTML += '<div style="font-size:10px;color:var(--muted)">' + wins + '-' + losses + ' W-L</div>';
      } else if (bestScore) {
        rightHTML = '<div style="font-size:13px;font-weight:600;color:var(--gold)">Best: ' + bestScore + '</div>';
      } else {
        rightHTML = '<div style="font-size:10px;color:var(--muted2)">' + teamRoundCount + ' rd' + (teamRoundCount !== 1 ? 's' : '') + '</div>';
      }
      teamContent += '<div class="h2h-row" onclick="Router.go(\'scramble\',{id:\'' + t.id + '\'})" style="cursor:pointer"><div><div style="font-size:13px;font-weight:600">' + escHtml(t.name) + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">w/ ' + mates + '</div></div><div style="text-align:right">' + rightHTML + '</div></div>';
    });
  } else {
    teamContent = pfEmpty(null, "Not on any teams yet");
  }
  h += profSection("teams-" + pid, "Teams (" + playerTeams.length + ")", teamContent, false, "Scramble squads");

  // === ACCOLADES (collapsible) ===
  var accoladeContent = '';
  var accolades = [];
  // Event wins — check all player ID aliases against champion
  var myAccIds = [pid];
  if (p.claimedFrom && myAccIds.indexOf(p.claimedFrom) === -1) myAccIds.push(p.claimedFrom);
  PB.getPlayers().forEach(function(pl) { if (pl.claimedFrom === pid && myAccIds.indexOf(pl.id) === -1) myAccIds.push(pl.id); });
  if (typeof fbMemberCache !== "undefined") {
    Object.keys(fbMemberCache).forEach(function(k) {
      var m = fbMemberCache[k];
      if ((m.claimedFrom === pid || k === pid) && myAccIds.indexOf(k) === -1) myAccIds.push(k);
      if (k === pid && m.claimedFrom && myAccIds.indexOf(m.claimedFrom) === -1) myAccIds.push(m.claimedFrom);
    });
  }
  PB.getTrips().forEach(function(t) {
    if (t.champion && myAccIds.indexOf(t.champion) !== -1) accolades.push({type:"Event champion", detail: t.name});
  });
  // Records held
  var rec = PB.getRecords();
  if (rec.longestDrive && rec.longestDrive.by === p.name) accolades.push({type:"Record holder", detail:"Longest drive: " + rec.longestDrive.distance + " yds"});
  if (rec.longestPutt && rec.longestPutt.by === p.name) accolades.push({type:"Record holder", detail:"Longest putt: " + rec.longestPutt.distance + " ft"});
  if (rec.longestHoleOut && rec.longestHoleOut.by === p.name) accolades.push({type:"Record holder", detail:"Longest hole out: " + rec.longestHoleOut.distance + " yds"});
  // Aces
  if (rec.holeInOnes) {
    rec.holeInOnes.forEach(function(a) {
      if (a.by === p.name) accolades.push({type:"Hole-in-one", detail: a.course + " hole " + (a.hole||"?")});
    });
  }
  if (accolades.length) {
    accolades.forEach(function(a) {
      accoladeContent += '<div class="club-row"><span class="club-name" style="color:var(--gold)">' + a.type + '</span><span class="club-yd" style="max-width:200px;text-align:right;font-weight:500">' + a.detail + '</span></div>';
    });
  } else {
    accoladeContent = pfEmpty(null, "No accolades yet");
  }
  h += profSection("accolades-" + pid, "Accolades" + (accolades.length ? " (" + accolades.length + ")" : ""), accoladeContent, false, "Honors");
  h += '</div>'; // close ptab-stats

  // ═══ TAB: SOCIAL (H2H, all rounds) ═══
  h += '<div id="ptab-social" data-ptab style="display:none">';

  // === HEAD TO HEAD (collapsible) ===
  var h2hContent = '';
  var h2hHasMatches = false;
  // Build set of all IDs that refer to this player (to skip self)
  var myIds = [pid];
  var myPlayer = PB.getPlayer(pid);
  if (myPlayer && myPlayer.claimedFrom && myIds.indexOf(myPlayer.claimedFrom) === -1) myIds.push(myPlayer.claimedFrom);
  PB.getPlayers().forEach(function(pl) { if (pl.claimedFrom === pid && myIds.indexOf(pl.id) === -1) myIds.push(pl.id); });
  if (typeof fbMemberCache !== "undefined") {
    Object.keys(fbMemberCache).forEach(function(k) {
      var m = fbMemberCache[k];
      if ((m.claimedFrom === pid || m.id === pid || k === pid) && myIds.indexOf(k) === -1) myIds.push(k);
      if (k === pid && m.claimedFrom && myIds.indexOf(m.claimedFrom) === -1) myIds.push(m.claimedFrom);
    });
  }
  PB.getPlayers().forEach(function(opp) {
    if (myIds.indexOf(opp.id) !== -1) return; // Skip self (all aliases)
    var h2h = calcH2H(pid, opp.id);
    var total = h2h.p1wins + h2h.p2wins + h2h.ties;
    if (total === 0) return; // Skip opponents with no shared rounds
    h2hHasMatches = true;
    var record = h2h.p1wins + ' – ' + h2h.p2wins + (h2h.ties ? ' – ' + h2h.ties + 'T' : '');
    var color = h2h.p1wins > h2h.p2wins ? 'var(--birdie)' : h2h.p2wins > h2h.p1wins ? 'var(--red)' : 'var(--gold)';
    h2hContent += '<div class="h2h-row" style="cursor:pointer" onclick="showRivalryDetail(\'' + pid + '\',\'' + opp.id + '\')"><div class="h2h-left">' + renderAvatar(opp, 28, false) + '<span class="h2h-name">' + renderUsername(opp, '', false) + '</span></div><span class="h2h-record" style="color:' + color + '">' + record + '</span></div>';
  });
  if (!h2hHasMatches) {
    h2hContent = pfEmpty("No head-to-head matches yet", "Play the same course on the same day as another member!");
  }
  h += profSection("h2h-" + pid, "Head to head", h2hContent, h2hHasMatches, "Rivalries");

  // === ALL ROUNDS (collapsible) ===
  if (rounds.length > 3) {
    var allContent = '<div style="max-height:500px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    rounds.slice().sort(function(a,b){ return (b.date||"") > (a.date||"") ? 1 : (b.date||"") < (a.date||"") ? -1 : 0; }).forEach(function(r) {
      var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
      allContent += '<div class="club-row" style="padding:10px 12px;cursor:pointer" onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})"><span class="club-name">' + escHtml(r.course) + ' · ' + r.date + fmtLabel + '</span><span class="club-yd">' + r.score + '</span></div>';
    });
    allContent += '</div>';
    h += profSection("allrounds-" + pid, "All rounds (" + rounds.length + ")", allContent, false, "The ledger");
  }
  h += '</div>'; // close ptab-social

  h += '</div>'; // close .pf-page
  document.querySelector('[data-page="members"]').innerHTML = h;
  setTimeout(initCountAnimations, 50);
  // v8.25.74 — entrance cascade on the hero blocks below the masthead (XP bar →
  // wallet → nemesis → stat grid → tabs). The masthead stays instant as the
  // page anchor (no reveal class). transform/opacity only, reduced-motion
  // no-ops inside staggeredReveal. Does not alter .stats-grid children (the
  // layout-regression spec asserts exactly 6 .stat-box) or the XP fill style.
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="members"] .pf-reveal'), { gap: 55, duration: 340 });

  // Async load ParCoin transaction history (self-only — private per rules)
  var histEl = isOwnProfile ? document.getElementById("parcoin-history-" + pid) : null;
  if (histEl) {
    loadTransactionHistory(pid, 30).then(function(txns) {
      if (!txns.length) {
        histEl.innerHTML = pfEmpty("No earnings yet", "Play a round to start earning!");
        return;
      }
      // Collapse consecutive runs of the same earning into one digest row. A
      // week of daily logins reads as "Daily login ×7 · +7" rather than seven
      // identical rows, so the varied earnings (round bonuses, achievements)
      // actually surface. txns are newest-first, so the first in a run is the
      // latest and each subsequent one is older. Count + summed amount keep it
      // truthful (P9) — nothing is hidden, just condensed.
      function fmtDate(t) {
        if (t && t.createdAt && t.createdAt.toDate) {
          var d = t.createdAt.toDate();
          return (d.getMonth()+1) + "/" + d.getDate();
        }
        return "";
      }
      // Strip a baked-in "at null"/"at undefined" course fragment from older
      // round-bonus labels (the course name was unresolved when the ledger row
      // was written). Showing "Completed 18H round (98)" is more truthful than
      // surfacing the literal word "null" (P9).
      function cleanLabel(s) {
        return String(s || "").replace(/ at (null|undefined)(?=\s*\(|$)/i, "");
      }
      var groups = [];
      txns.forEach(function(t) {
        var label = cleanLabel(t.label || t.reason || "Earned");
        var last = groups[groups.length - 1];
        if (last && last.label === label) {
          last.count += 1;
          last.amount += (t.amount || 0);
          last.earliest = t;
        } else {
          groups.push({ label: label, count: 1, amount: (t.amount || 0), latest: t, earliest: t });
        }
      });
      var th = '';
      groups.forEach(function(g) {
        var lateStr = fmtDate(g.latest), earlyStr = fmtDate(g.earliest);
        var dateStr = (g.count > 1 && earlyStr && lateStr && earlyStr !== lateStr) ? (earlyStr + " – " + lateStr) : lateStr;
        var countBadge = g.count > 1 ? ' <span style="font-size:9px;font-weight:700;color:var(--muted2)">×' + g.count + '</span>' : '';
        th += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
        th += '<div style="flex:1;min-width:0"><div style="font-size:11px;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(g.label) + countBadge + '</div>';
        if (dateStr) th += '<div style="font-size:9px;color:var(--muted2)">' + dateStr + '</div>';
        th += '</div>';
        th += '<div style="font-size:13px;font-weight:700;color:var(--gold);flex-shrink:0;margin-left:8px">+' + g.amount + '</div>';
        th += '</div>';
      });
      histEl.innerHTML = '<div class="card"><div class="card-body" style="padding:10px 14px">' + th + '</div></div>';
    });
  }
}

/* Handicap graph builder */

// App Store 1.2 — block/unblock a member from their profile. Unblocking is
// immediate; blocking shows a branded confirm sheet first. The block list lives
// on the viewer's own member doc (see pbSetBlocked) so no rules change is
// needed. After either action, re-render the profile so the button flips.
function toggleBlockMember(pid) {
  if (!pid || typeof pbSetBlocked !== "function") return;
  var player = PB.getPlayer(pid);
  var name = player ? (player.name || player.username || "this member") : "this member";
  if (typeof pbIsBlocked === "function" && pbIsBlocked(pid)) {
    pbSetBlocked(pid, false).then(function() {
      Router.toast("Unblocked " + name);
      renderMemberDetail(pid);
    }).catch(function(e) {
      Router.toast(typeof pbErrMsg === "function" ? pbErrMsg(e, "Couldn't unblock. Try again.") : "Couldn't unblock. Try again.");
    });
    return;
  }
  var sheetId = openBottomSheet({
    size: "compact",
    title: "Block " + name + "?",
    content:
      '<div style="font-size:14px;color:var(--cb-charcoal);line-height:1.5;padding-top:8px">You will no longer see their posts, comments, or messages anywhere in the app. You can unblock them anytime from Settings.</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
        '<button id="pbBlockCancel" class="tappable" style="flex:1;padding:12px;background:transparent;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;color:var(--cb-ink);cursor:pointer">Cancel</button>' +
        '<button id="pbBlockConfirm" class="tappable tappable--primary" style="flex:1;padding:12px;background:var(--cb-brass);border:none;border-radius:8px;font-size:14px;font-weight:600;color:var(--cb-ink);cursor:pointer">Block</button>' +
      '</div>'
  });
  setTimeout(function() {
    var cancelBtn = document.getElementById("pbBlockCancel");
    var confirmBtn = document.getElementById("pbBlockConfirm");
    if (cancelBtn) cancelBtn.onclick = function() { closeBottomSheet(sheetId); };
    if (confirmBtn) confirmBtn.onclick = function() {
      closeBottomSheet(sheetId);
      pbSetBlocked(pid, true).then(function() {
        Router.toast("Blocked " + name);
        renderMemberDetail(pid);
      }).catch(function(e) {
        Router.toast(typeof pbErrMsg === "function" ? pbErrMsg(e, "Couldn't block. Try again.") : "Couldn't block. Try again.");
      });
    };
  }, 50);
}
