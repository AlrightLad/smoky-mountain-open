var Router = (function() {
  var current = { page: "home", params: {} };
  var pages = {};
  var _skipHistoryPush = false;
  // Back-nav flag — set by back() and popstate so go() can pick the inverted
  // entrance motion (pt-lift-in-back) instead of the forward lift.
  var _isBack = false;
  // Explicit nav stack — always knows exactly where back() should go
  // Scales to any depth: Home→Members→Profile→EditProfile→back→back→back works correctly
  var _navStack = [];

  // Browser back/forward button — keep our stack in sync
  window.addEventListener("popstate", function(e) {
    if (_navStack.length > 0) _navStack.pop();
    var state = e.state;
    _skipHistoryPush = true;
    _isBack = true;
    if (state && state.page) {
      go(state.page, state.params || {});
    } else {
      _navStack = [];
      go("home", {});
    }
    _skipHistoryPush = false;
    _isBack = false;
  });

  function register(name, renderFn) {
    pages[name] = renderFn;
  }

  function go(page, params, replaceState) {
    // v8.24.41 — unknown-route fallback. A typo'd deep link or a retired
    // page name used to hide every page container and strand the member on
    // a blank void (no header, no empty state, no way out). Land on home
    // instead. Checked against the DOM container (not the pages registry)
    // because the render below requires the container to exist.
    if (!document.querySelector('#mainApp [data-page="' + page + '"]')) {
      console.warn("[Router] unknown page '" + page + "' — falling back to home");
      page = "home";
      params = {};
    }
    var prev = current.page;
    var prevParams = current.params;
    current = { page: page, params: params || {} };

    // Push/replace browser history. URL stays fixed — hash changes caused PWA reloads on iOS.
    if (!_skipHistoryPush) {
      var state = { page: page, params: params || {} };
      if (replaceState || prev === page) {
        history.replaceState(state, "", window.location.pathname);
      } else {
        // Push previous location onto our explicit stack before navigating forward
        _navStack.push({ page: prev, params: prevParams });
        history.pushState(state, "", window.location.pathname);
      }
    }

    renderNav();
    var containers = document.querySelectorAll("#mainApp [data-page]");
    containers.forEach(function(el) { el.classList.add("hidden"); });
    var target = document.querySelector('#mainApp [data-page="' + page + '"]');
    if (target) {
      target.classList.remove("hidden");
      if (pages[page]) pages[page](current.params);
      // Entrance motion — fluid page transitions (pt-lift / pt-masthead).
      // Keyframes + reduced-motion guard live in components.css; the tier
      // is computed in transitions.js. Clear + force a reflow before
      // applying so the animation replays on every navigation — re-setting
      // an identical data-transition attribute alone will not restart a
      // CSS animation. The "in" rules use fill-mode:backwards so no
      // transform lingers afterward (a retained translateY would create a
      // containing block and break position:fixed descendants).
      if (typeof applyTransition === "function" && typeof getTransitionTier === "function") {
        _clearTransition(target);
        void target.offsetWidth;
        applyTransition(target, getTransitionTier(prev, page), "in", _isBack);
      }
    }
    window.scrollTo(0, 0);
    // Hide footer on pages with sticky input (chat, DMs)
    var footer = document.querySelector(".footer");
    if (footer) footer.style.display = (page === "chat" || page === "dms" || page === "dm-thread") ? "none" : "";
  }

  function getPage() { return current.page; }
  function getParams() { return current.params; }

  function renderNav() {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    // Hide the global tab bar during an active live round on Play Now. The live
    // scoring screen renders its own fixed #liveBottomNav (Prev / Next / Finish).
    // Both bars are position:fixed;bottom:0;z-index:100; the global bar is later
    // in the DOM, so without this it paints over the round controls and steals
    // every tap (a stray tap navigates out of the round). Re-evaluated on every
    // navigation, so it restores when the round ends or the user steps away.
    var inLiveRound = typeof liveState !== "undefined" && liveState && liveState.active && current.page === "playnow";
    // v8.25.209 (Founder: DM composer "slightly cut off") — also hide the global
    // tab bar on the sticky-composer pages so the message bar + Send own the bottom
    // edge (the fixed nav was overlapping/squeezing it, worst with a home-indicator
    // safe-area). A body class zeroes #mainApp's nav-padding on these pages too.
    var stickyComposer = current.page === "dm-thread" || current.page === "chat";
    nav.style.display = (inLiveRound || stickyComposer) ? "none" : "";
    if (typeof document !== "undefined" && document.body) document.body.classList.toggle("on-sticky-composer", stickyComposer);
    // v8.25.216 — the desktop immersive showcase DIVERGES from the app: hide the
    // Reading Room sidebar + drop #mainApp's left reservation so the bands go
    // full-bleed (CSS under body.on-showcase). The mobile PWA never routes here.
    if (typeof document !== "undefined" && document.body) document.body.classList.toggle("on-showcase", current.page === "showcase");
    var tabs = [
      { match: ["home","round","standings","seasonrecap","awards","feed"] },
      { match: ["activity","rounds","playnow","range","scramble-live","syncround"] },
      { match: ["courses"] },
      { match: ["trips","scorecard","teetimes","tee-create","partygames"] },
      // v8.24.13 — baseline IA fix: every page whose entry point is the More
      // menu now lights the More tab (wagers/bounties/leagues/chat/shop/etc.
      // previously lit nothing, so the bottom nav looked broken there).
      { match: ["more","members","profile","profile-edit","records","aces","scramble","challenges","trophyroom","rules","wagers","bounties","leagues","findplayers","drills","chat","shop","richlist","faq","caddynotes","caddynotes-archive","bugreport"] }
    ];
    var buttons = nav.querySelectorAll("button");
    tabs.forEach(function(t, i) {
      if (buttons[i]) {
        if (t.match.indexOf(current.page) !== -1) buttons[i].classList.add("a");
        else buttons[i].classList.remove("a");
      }
    });
  }

  // v8.24.18 — Router.toast now DELEGATES to PB.toast (the richer, stacked,
  // severity-aware system from Ship 3a). One change upgrades all ~400 legacy
  // call sites at once: consistent styling, 4s readable duration, aria-live
  // stacking instead of the single overwriting #toast element. Falls back to
  // the legacy element only if PB.toast isn't loaded yet (early boot).
  function toast(msg) {
    if (typeof PB !== "undefined" && PB && typeof PB.toast === "function") {
      PB.toast({ type: "info", message: String(msg) });
      return;
    }
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 2200);
  }

  // Per-member default avatar — when a member has NO uploaded photo (and hasn't
  // explicitly picked a stock avatar), render a distinct initial-on-disc instead
  // of a name-hashed stock JPG. The old stock-JPG default produced "rows of
  // identical dark discs" across feed/members/rosters/home (critique 2026-06-12).
  // Disc tint is hashed to one of five on-brand solid tokens so adjacent members
  // never read identically; the cream initial stays AA on every tint + theme.
  var AVATAR_DISCS = ['var(--cb-felt)', 'var(--cb-brass-deep)', 'var(--cb-moss)', 'var(--cb-claret)', 'var(--cb-charcoal)'];

  function getAvatar(player, fallback) {
    // The Caddy ALWAYS draws its single branded mark — never a member photo,
    // initial disc, or stock avatar (the reserved "the-caddy" id can't collide
    // with a real 28-char Firebase UID). isCaddyPlayer + caddyAvatarMark are
    // top-level globals (defined below) so renderAvatar shares the same logic.
    if (typeof isCaddyPlayer === "function" && isCaddyPlayer(player)) return caddyAvatarMark();
    var imgSrc = '';
    // Check Firestore photo cache — try by id, claimedFrom, and username
    var cached = photoCache["member:" + player.id];
    if (!cached && player.claimedFrom) cached = photoCache["member:" + player.claimedFrom];
    if (!cached && player.username) cached = photoCache["member:" + player.username];
    if (cached) {
      imgSrc = cached;
    } else if (player.photoUrl) {
      imgSrc = player.photoUrl;
    } else if (player.photo) {
      imgSrc = player.photo;
    } else if (player.stockAvatar) {
      imgSrc = player.stockAvatar;
    }
    // (no else) — no photo on file falls through to a DEFAULT avatar below.
    var nm = player.username || player.name || '?';
    var initial = nm.charAt(0).toUpperCase();
    // Deterministic by uid (stable per member) so a default never changes between
    // renders. Falls back to name when no id.
    var hashKey = String(player.id || player.claimedFrom || nm);
    var hash = 0;
    for (var i = 0; i < hashKey.length; i++) hash = ((hash << 5) - hash) + hashKey.charCodeAt(i);
    var disc = AVATAR_DISCS[Math.abs(hash) % AVATAR_DISCS.length];
    // v8.25.125 (Founder) — members without a custom photo get one of 4 unique
    // rubber-hose character avatars instead of a letter initial. The initial disc
    // is kept ONLY as the final onerror fallback if the default image fails.
    if (!imgSrc) {
      var _b = (typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/";
      imgSrc = _b + "img/avatars/default-" + (Math.abs(hash) % 4 + 1) + ".jpg";
    }
    var discDiv = '<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--cb-chalk);font-weight:700;font-size:18px;background:' + disc + ';border-radius:inherit">' + initial + '</div>';
    return '<img alt="" src="' + imgSrc + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' + discDiv;
  }

  function handlePhotoUpload(callback, maxW, maxH, quality) {
    maxW = maxW || 200;
    maxH = maxH || 200;
    quality = quality || 0.7;
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = function() {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement("canvas");
          if (maxW === maxH) {
            canvas.width = maxW; canvas.height = maxH;
            var ctx = canvas.getContext("2d");
            var min = Math.min(img.width, img.height);
            var sx = (img.width - min) / 2, sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, maxW, maxH);
          } else {
            canvas.width = maxW; canvas.height = maxH;
            var ctx = canvas.getContext("2d");
            var ratio = Math.max(maxW / img.width, maxH / img.height);
            var w = img.width * ratio, h = img.height * ratio;
            ctx.drawImage(img, (maxW - w) / 2, (maxH - h) / 2, w, h);
          }
          callback(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function back(fallback) {
    // Pop our explicit stack — always goes to the exact page we came from
    if (_navStack.length > 0) {
      var prev = _navStack.pop();
      // Keep browser history in sync without adding a new entry
      _skipHistoryPush = true;
      _isBack = true;
      history.back();
      go(prev.page, prev.params);
      _skipHistoryPush = false;
      _isBack = false;
    } else {
      go(fallback || "home", {});
    }
  }

  return {
    register: register,
    go: go,
    back: back,
    getPage: getPage,
    getParams: getParams,
    toast: toast,
    getAvatar: getAvatar,
    handlePhotoUpload: handlePhotoUpload
  };
})();

// ── THE CADDY branded identity (v8.25.x bot consolidation) ──────────────────
// ONE Parbaughs-branded mark + ONE bot badge for the single canonical bot
// identity (PB_CADDY in utils.js), drawn IDENTICALLY in every avatar slot and
// every league. isCaddyPlayer matches the canonical id OR any legacy bot shape
// so already-stored bot docs normalize at render time (no Firestore migration).
// Top-level (not inside the Router IIFE) so renderAvatar/renderUsername — which
// are themselves top-level — can share the exact same logic as Router.getAvatar.
function isCaddyPlayer(p) {
  if (!p) return false;
  // Match the canonical id/bot flag OR either bot NAME — legacy docs were authored
  // "The Caddy"; new docs "The Caddies" (v8.25.157 rename). Both normalize here.
  return p.id === "the-caddy" || p.authorId === "the-caddy" || p.bot === true ||
         p.name === "The Caddy" || p.username === "The Caddy" || p.authorName === "The Caddy" || p.author === "The Caddy" ||
         p.name === "The Caddies" || p.username === "The Caddies" || p.authorName === "The Caddies" || p.author === "The Caddies";
}
// v8.25.157 (#73, Founder) — "The Caddies" now wears a CREW portrait: the four
// caddies (Murphy, Old Tom, Birdie, Bag Room Guy) in a 2x2 quad on aged paper,
// circle-cropped by the inherited slot. Falls back to a felt disc + brass flag
// if the image can't load (offline / cache miss), so the bot always has a mark.
function caddyAvatarMark() {
  var src = ((typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/") + "img/avatars/caddy-crew.jpg";
  return '<div style="width:100%;height:100%;background:var(--cb-felt);border-radius:inherit;overflow:hidden">' +
    '<img src="' + src + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display=\'none\'">' +
    '</div>';
}
// The bot badge: a small brass mono "BOT" chip that trails The Caddy's name so
// humans-vs-bot is legible at a glance. Identical across leagues.
function caddyBotBadge() {
  return '<span class="pb-bot-badge" aria-label="Automated post by The Caddies">BOT</span>';
}

// ── GLOBAL UTILITY: profile border color ────────────────────────────────────
// Single source of truth for avatar frame colors. Call anywhere you render
// a player avatar. Default ring is Clubhouse brass for all users; shop-
// purchased cosmetic rings (equippedCosmetics.border) override the default.
// Tier-specific rings (commissioner, Mr. Parbaugh, Founding Four) come in v8.1.4.

// v8.24.73 — the avatar ring now ENCODES status instead of painting every
// member brass. Brass used to be the default for everyone, which drowned the
// Founding-Four signal (the whole point of the Find Players hierarchy) and
// diluted brass app-wide (FIX-QUEUE #4). Now: equipped cosmetic > founder
// brass > a quiet neutral hairline for regular members. The founder ring +
// the founder star reinforce each other; cosmetics are the other brass cue.
function _isFounderRing(p) { return !!(p && (p.founding || p.isFoundingFour)); }
function playerFrameColor(p) {
  if (!p) return 'var(--cb-mute-3)';
  // Cosmetic ring override (from shop purchase)
  if (p.equippedCosmetics && p.equippedCosmetics.border && p.equippedCosmetics.border !== "theme-default") {
    var equipped = (typeof shopFindItem === "function") ? shopFindItem(p.equippedCosmetics.border)
      : (typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : []).find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return equipped.preview;
  }
  // Founders wear the Clubhouse brass; everyone else a quiet hairline.
  return _isFounderRing(p) ? '#B4893E' : 'var(--cb-mute-3)';
}

function playerRingShadow(p) {
  if (!p) return '';
  // Animated rings handle their own shadows via keyframes
  if (p.equippedCosmetics && p.equippedCosmetics.border) {
    var animatedRings = ['border_pulse_gold','border_shimmer','border_rainbow_shift','border_neon_green','border_crimson_ember'];
    if (animatedRings.indexOf(p.equippedCosmetics.border) !== -1) return '';
    // Standard cosmetic rings get a bold glow matching their color
    var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
    var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return '0 0 8px ' + equipped.preview + '50, 0 0 16px ' + equipped.preview + '20';
  }
  // Founders keep the brass glow; regular members get none (quiet hairline).
  return _isFounderRing(p) ? '0 0 8px rgba(180,137,62,.5), 0 0 16px rgba(180,137,62,.25)' : '';
}

// Returns full inline style for avatar ring (border + shadow + animation)
function playerRingStyle(p) {
  var color = playerFrameColor(p);
  var shadow = playerRingShadow(p);
  var cls = playerRingClass(p);
  var animMap = {
    'ring-pulse-gold': 'ringPulse 2s ease-in-out infinite',
    'ring-diamond-sparkle': 'ringShimmer 2.5s ease-in-out infinite',
    'ring-rainbow-shift': 'ringRainbow 3s linear infinite',
    'ring-neon-green': 'ringNeonGreen 1.8s ease-in-out infinite',
    'ring-crimson-ember': 'ringEmber 1.5s ease-in-out infinite'
  };
  var anim = cls && animMap[cls] ? animMap[cls] : '';
  // v8.24.76 — when an ornamental .ring-* class is present it owns the border
  // (via !important) AND draws its ::before/::after art; the inline border just
  // fought its box model, so suppress it. Plain rings (founder/cosmetic/default)
  // keep the inline border.
  return (cls ? '' : 'border:3px solid ' + color) + (shadow ? (cls ? '' : ';box-shadow:' + shadow) : '') + (anim ? ';animation:' + anim : '');
}

function playerRingClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.border) return '';
  var b = p.equippedCosmetics.border;
  if (b === 'border_pulse_gold') return 'ring-pulse-gold';
  if (b === 'border_shimmer') return 'ring-diamond-sparkle';
  if (b === 'border_rainbow_shift') return 'ring-rainbow-shift';
  if (b === 'border_neon_green') return 'ring-neon-green';
  if (b === 'border_crimson_ember') return 'ring-crimson-ember';
  // #76 cosmetics overhaul (v8.25.170) — the common metal rings were flat colored
  // borders; promote to struck-metal border-box gradient decorations (static).
  if (b === 'border_bronze') return 'ring-bronze-struck';
  if (b === 'border_silver') return 'ring-silver-struck';
  if (b === 'border_gold' || b === 'border_default_gold') return 'ring-gold-struck';
  // #76 — remaining flat colored rings → glossy-enamel / gem material (no flat borders).
  if (b === 'border_birdie') return 'ring-birdie-enamel';
  if (b === 'border_rose') return 'ring-rose-enamel';
  if (b === 'border_emerald') return 'ring-emerald-enamel';
  if (b === 'border_champ_red') return 'ring-champ-enamel';
  if (b === 'border_ice') return 'ring-bluebird-enamel'; // re-themed "Bluebird"
  if (b === 'border_diamond') return 'ring-diamond-gem';
  if (b === 'border_platinum') return 'ring-platinum-struck';
  if (b === 'border_obsidian') return 'ring-obsidian-struck';
  // v8.24.50 — Pro Shop ornamental rings (class-drawn, not border colors)
  if (b === 'pc01_gallery_rope') return 'ring-gallery-rope';
  if (b === 'pc02_fescue') return 'ring-fescue';
  if (b === 'pc03_fried_egg') return 'ring-fried-egg';
  if (b === 'pc04_claret') return 'ring-claret';
  // v8.24.76 — these were sold (up to 1500 coins) but UNMAPPED, so they
  // rendered nothing ornamental when worn. pc42 reuses the claret art for now
  // (distinct crest art is a follow-up polish item).
  if (b === 'pc39_wax_seal') return 'ring-wax-seal';
  if (b === 'pc40_hickory_brass') return 'ring-hickory';
  // v8.25.116 — pc42 was a byte-identical dupe of ring-claret (two 3000c SKUs
  // rendered the same); now its own ornate double-bezel + rose-P crest medallion.
  if (b === 'pc42_founders_crest') return 'ring-founders-crest';
  // v8.25.116 — pc24 champion ring was ringClass:"" (flat default border). Now
  // a felt-wool band + brass buttons. (Earned, not bought — renders when equipped.)
  if (b === 'pc24_green_jacket') return 'ring-green-jacket';
  if (b === 'pc44_iron_blade') return 'ring-iron-blade'; // v8.25.49 Founder-batch
  if (b === 'pc52_crest_pin') return 'ring-crest-pin';   // v8.25.54 premium batch
  if (b === 'pc53_medallion') return 'ring-medallion';
  return '';
}
// v8.25.18x (Founder 2026-06-14) — AWARD-WINNING raster avatar DECORATIONS.
// Unlike the CSS .ring-* art, these are full-colour rubber-hose illustrated
// frames (Discord-decoration pattern) generated via the parbaughs-image-gen
// skill + finishing pipeline, committed under public/img/cosmetics/. When a
// member equips one, renderAvatar overlays the transparent PNG (~1.3x, centred,
// pointer-events:none) AROUND the photo — the hollow centre frames the face,
// never covers it ([[feedback_rings_frame_not_cover_photo]]). Returns '' for
// every non-deco border so the existing CSS-ring path is untouched (no-op-safe).
function playerDecoSrc(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.border) return '';
  var map = {
    'border_deco_caddy': 'deco-caddy-companion.png',
    'border_deco_holeinone': 'deco-hole-in-one.png',
    'border_deco_champion': 'deco-champion.png',
    'border_deco_azalea': 'deco-masters-azalea.png',
    'border_deco_frost': 'deco-frost-delay.png',
    'border_deco_eagle': 'deco-eagle.png',
    'border_deco_bramble': 'deco-bramble-rose.png',
    'border_deco_autumn': 'deco-autumn.png'
  };
  var f = map[p.equippedCosmetics.border];
  if (!f) return '';
  var base = (typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/";
  return base + 'img/cosmetics/' + f;
}
// v8.25.207 — PER-DECO overlay %. The raster decoration frames have DIFFERENT
// transparent-hole sizes, so ONE overlay % can't fit them: the old 140% floated
// the sparse frames (photo small in the middle, Founder-flagged 2026-06-15 "caddie
// companion floats instead of sitting flush like Discord") AND would crop the dense
// ones. Visually tuned per-deco (the photo FILLS the hole + the frame hugs + extends
// just beyond). Evidence: .claude/state/deco-fit/confirm.png. Default 110 for any
// future deco. Used wherever a deco overlays a photo-filled circle.
function playerDecoPctById(borderId) {
  var m = { border_deco_caddy: 110, border_deco_holeinone: 106, border_deco_champion: 110, border_deco_azalea: 108, border_deco_frost: 112, border_deco_eagle: 110, border_deco_bramble: 112, border_deco_autumn: 120 };
  return m[borderId] || 110;
}
function playerDecoPct(p) { return playerDecoPctById(p && p.equippedCosmetics && p.equippedCosmetics.border); }
// ── Cosmetic helpers ──
function getPlayerNameClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.name) return '';
  var nameMap = {
    'name_gold_shimmer': 'name-gold-shimmer',
    'name_rainbow': 'name-rainbow',
    'name_glow_green': 'name-glow-green',
    'name_fire_text': 'name-fire',
    'name_ice_text': 'name-ice',
    'name_shadow_depth': 'name-shadow-depth'
  };
  return nameMap[p.equippedCosmetics.name] || '';
}
function getPlayerBannerCss(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.banner) return '';
  var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
  var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.banner; });
  return equipped ? equipped.css : '';
}
function getPlayerCardCss(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.card) return '';
  var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
  var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.card; });
  return equipped ? equipped.css : '';
}
// v8.24.76 — Pro Shop scorecard skins (pc*) live in PRO_SHOP_CATALOG, which
// getPlayerCardCss above does NOT search and which isn't loaded until shop.js
// is — so equipping a 300-900 coin card used to render NOTHING (P9 no-op).
// Map them to core CSS classes (always available) instead, mirroring
// playerRingClass. Legacy COSMETICS_CATALOG cards keep the inline-css path.
function getPlayerCardClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.card) return '';
  var m = {
    'pc08_pencil_parchment': 'card-skin-parchment',
    'pc09_member_guest': 'card-skin-member-guest',
    'pc10_major_sunday': 'card-skin-major-sunday',
    'pc28_the_sleeve': 'card-skin-sleeve',
    'pc41_trophy_room': 'card-skin-trophy-room',
    'pc45_ledger': 'card-skin-ledger',
    // v8.25.114 — pc55 (900c) had NO worn class + no mapping, so equipping the
    // pairing sheet rendered NOTHING (dead purchase, P9 no-op). Worn class
    // .card-skin-pairing-sheet authored in components.css; wire it.
    'pc55_pairing_sheet': 'card-skin-pairing-sheet'
  };
  return m[p.equippedCosmetics.card] || '';
}
// ── SHARED RENDERING: renderAvatar + renderUsername ────────────────────────
// Use these EVERYWHERE instead of raw HTML to guarantee ring + name effect consistency.

// renderAvatar(player, size, clickToProfile) → HTML string
// Renders a circular avatar with the player's photo, theme ring, and animated ring class.
// If clickToProfile is true, wraps in an onclick that navigates to their profile.
function renderAvatar(p, size, clickToProfile) {
  size = size || 36;
  // The Caddy: ONE branded mark, ONE consistent brass-hairline ring, no member
  // cosmetics, never click-to-profile (the bot has no profile page). Identical
  // everywhere, every league.
  if (isCaddyPlayer(p)) {
    return '<div class="pb-caddy-avatar" style="width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;border-radius:50%;position:relative;border:2px solid var(--cb-brass);flex-shrink:0">' +
      '<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">' + caddyAvatarMark() + '</div></div>';
  }
  var ringStyle = p ? playerRingStyle(p) : 'border:2px solid var(--gold)';
  // v8.24.76 — apply the ornamental ring CLASS (was never applied), so the
  // .ring-* ::before/::after art (rope studs, fescue grass, fried-egg splash,
  // claret sweep, wax seal, hickory ferrule) actually renders when worn. The
  // art is absolutely-positioned, so the outer div needs position:relative.
  var ringCls = p ? playerRingClass(p) : '';
  // v8.25.18x — a raster decoration, when equipped, IS the frame: it suppresses
  // the CSS ring (border + class) and overlays the transparent PNG around the
  // photo. Gated at size>=40 so tiny inline avatars skip it (no clipping in
  // dense rows); profile/cards/feed/roster (>=40px) all show it.
  var decoSrc = p ? playerDecoSrc(p) : '';
  var useDeco = !!decoSrc && size >= 40;
  if (useDeco) { ringCls = ''; ringStyle = ''; }
  var avatarInner = p ? Router.getAvatar(p) : '<div style="width:100%;height:100%;background:var(--bg3);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:' + Math.round(size * 0.4) + 'px">?</div>';
  var pid = p ? (p.id || '') : '';
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';
  // The decoration overlay: centred, ~1.32x so its hollow opening frames the
  // photo edge and the ornament extends just beyond; pointer-events:none so it
  // never eats taps; aria-hidden (decorative).
  // v8.25.18x (Founder PL2): 140% (was 132%) — a thicker-ring decoration's hollow
  // opening at 132% sat smaller than the photo and CUT IT OFF; 140% sizes the
  // opening to ~the photo so it frames cleanly, not crops. Standardised across
  // every surface (renderAvatar + profile + shop preview + try-it-on) so the fit
  // is consistent everywhere.
  var _dpct = useDeco ? playerDecoPct(p) : 110;
  var decoOverlay = useDeco ? '<img alt="" aria-hidden="true" src="' + decoSrc + '" style="position:absolute;top:50%;left:50%;width:' + _dpct + '%;height:' + _dpct + '%;transform:translate(-50%,-50%);pointer-events:none;z-index:2">' : '';
  // Outer div: border + shadow + animation + ring class (NO overflow:hidden so glow/art/deco renders)
  // Inner div: overflow:hidden clips the image/fallback content to the circle
  return '<div' + (ringCls ? ' class="' + ringCls + '"' : '') + ' style="width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;border-radius:50%;position:relative;' + ringStyle + (ringStyle ? ';' : '') + cursor + 'flex-shrink:0"' + click + '><div style="width:100%;height:100%;border-radius:50%;overflow:hidden">' + avatarInner + '</div>' + decoOverlay + '</div>';
}

// renderUsername(player, extraStyle) → HTML string
// Renders the player's display name with their equipped name effect class.
// If clickToProfile, wraps in an onclick span.
//
// W4.I1 display rules (2026-05-24): when the username carries a Discord-style
// discriminator (base#XXXX), render the base at full opacity + the
// #discriminator tag muted. Member identity reads cleanly without the tag
// dominating; disambiguation context is still visible. When username has no
// discriminator (legacy single-name members) the render is unchanged.
// ── Pro Shop ship B (v8.24.51): nameplates + tee markers ────────────────
// Nameplates render BEHIND the name (Discord-nameplate pattern); tee markers
// are a small totem AFTER it. Both ride renderUsername, so every surface
// that uses the central helper (feed, rosters, scramble, trips, tournament,
// home, profiles) gets them at once.
function pbNameplateClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.nameplate) return '';
  var n = p.equippedCosmetics.nameplate;
  if (n === 'pc05_locker_brass') return 'plate-locker-brass';
  if (n === 'pc06_yardage_book') return 'plate-yardage';
  if (n === 'pc07_leaderboard_sunday') return 'plate-sunday';
  // v8.24.76 — pc29 was sold (500 coins) + fully described but UNMAPPED with no
  // CSS, so equipping it changed nothing (dead purchase, P9 no-op). Now wired.
  if (n === 'pc29_stimp_13') return 'plate-stimp';
  if (n === 'pc46_clubhouse_crest') return 'plate-clubhouse-crest'; // v8.25.49 Founder-batch
  if (n === 'pc51_chalk_board') return 'plate-chalk-board';
  // v8.25.114 — pc54 (1400c) previewed via the shop map but was ABSENT here, so
  // equipping the calfskin tag rendered NOTHING on the name (dead purchase, P9
  // no-op — same bug class fixed for pc29). The .plate-calfskin-tag worn class
  // already exists (components.css). Wire it.
  if (n === 'pc54_calfskin_tag') return 'plate-calfskin-tag';
  return '';
}
// v8.24.68 — unified, golf-oriented marker art. ONE source of truth for both
// the worn-on-name render (11px, trailing the username) and the Pro Shop
// preview (large). Previously the shop drew every tee/ball marker as the same
// tinted dot — beautiful catalog copy, identical blobs (Founder: "they suck,
// no one would buy them"). Each marker now reads as the object it describes.
// On a 24-grid; NO <defs> gradients — the shop renders many at once and shared
// gradient ids would collide, so all art is layered solid shapes.
function pbMarkerGlyph(id, px) {
  px = px || 11;
  var s = '';
  switch (id) {
    // ── Tee markers ──
    case 'pc17_brass_acorn': // acorn: textured cap + nut + stem
      s = '<rect x="11.2" y="3" width="1.6" height="3" rx=".8" fill="#6e561f"/>'
        + '<path d="M5.5 10c0-2.7 2.9-4.3 6.5-4.3s6.5 1.6 6.5 4.3z" fill="#9a7634"/>'
        + '<path d="M9 6.7v3M12 6.3v3.6M15 6.7v3" stroke="#6e561f" stroke-width=".8"/>'
        + '<path d="M6.4 10h11.2c0 5.3-2.6 9.6-5.6 9.6S6.4 15.3 6.4 10z" fill="#c69a4e"/>'
        + '<path d="M9.3 11.2c0 3.4 1 6.3 2.1 7.6" stroke="#e2bd78" stroke-width="1" opacity=".6" fill="none"/>';
      break;
    case 'pc18_rubber_duck': // duck: body + head + beak + eye
      s = '<path d="M3.2 14l-2.2-1.4 2.2-1z" fill="#e0a92e"/>'
        + '<ellipse cx="12.5" cy="15" rx="8" ry="5" fill="#ecc94b"/>'
        + '<path d="M16 14.5c1.6-.8 3.2-.7 4.5.2" stroke="#e0a92e" stroke-width="1.2" fill="none"/>'
        + '<circle cx="8" cy="8.6" r="4.1" fill="#ecc94b"/>'
        + '<path d="M3.9 8.4l-3 .7 3 1.1z" fill="#e07b39"/>'
        + '<circle cx="7.2" cy="7.7" r=".95" fill="#2b2b2b"/>';
      break;
    case 'pc19_persimmon': // persimmon driver head + brass sole + shaft
      s = '<rect x="9.2" y="1.8" width="1.7" height="6.4" rx=".8" fill="#5a4632" transform="rotate(-13 10 5)"/>'
        + '<path d="M3 13c0-3.5 3-5.5 7.5-5.5S21 9.5 21 13c0 2.3-2.5 3.9-6.6 3.9S3 15.3 3 13z" fill="#7a4a28"/>'
        + '<path d="M3.3 14.3h17.4c-.5 1.6-3 2.6-6.3 2.6S3.8 15.9 3.3 14.3z" fill="#caa75c"/>'
        + '<path d="M7 11.5h2M10.5 11.2h2" stroke="#5a3418" stroke-width=".7" opacity=".7"/>';
      break;
    case 'pc20_parbaugh_marker': // founding-gold crest disc, engraved P
      // v8.24.85 — vector P (was a Georgia <text> 'P' that was illegible at the
      // worn 12px size) + a struck-metal gleam/shadow ramp for depth.
      s = '<circle cx="12" cy="12" r="9.5" fill="#b4893e"/>'
        + '<circle cx="12" cy="12" r="9.5" fill="none" stroke="#8a6526" stroke-width="1"/>'
        + '<path d="M4.2 9.2a9.5 9.5 0 0115.6 0" stroke="#ecca7e" stroke-width="1.2" opacity=".55" fill="none"/>'
        + '<path d="M4.2 14.8a9.5 9.5 0 0015.6 0" stroke="#6e5018" stroke-width="1.2" opacity=".5" fill="none"/>'
        + '<circle cx="12" cy="12" r="7" fill="none" stroke="#d8b15f" stroke-width=".8" opacity=".6"/>'
        + '<path d="M9 6.6h4.1a2.9 2.9 0 010 5.8H10.9V18H9z" fill="#3a2c10"/>'           // engraved P body
        + '<path d="M9 6.6h4.1a2.9 2.9 0 011.9.7 2.9 2.9 0 00-2.4-1.2H9z" fill="#e8c87a" opacity=".6"/>'; // top-lit bevel
      break;
    case 'pc25_ace_marker': // gold ball on a brass pedestal
      s = '<path d="M7 19.2h10l-1.4 2.4H8.4z" fill="#8a6a2e"/>'
        + '<rect x="6.4" y="18.4" width="11.2" height="1.7" rx=".85" fill="#a9853c"/>'
        + '<circle cx="12" cy="10" r="6.2" fill="#f2d89a"/>'
        + '<circle cx="9.8" cy="7.8" r="2" fill="#f8ecc6"/>'
        + '<circle cx="10.5" cy="11" r=".7" fill="#d8be84"/><circle cx="13" cy="9" r=".7" fill="#d8be84"/><circle cx="13.4" cy="12" r=".7" fill="#d8be84"/>';
      break;
    case 'pc34_whipping': // hickory shaft butt wrapped in red thread
      s = '<rect x="9.2" y="2.4" width="5.6" height="2" rx="1" fill="#caa75c"/>'
        + '<rect x="9.5" y="4" width="5" height="17" rx="2.3" fill="#7a4a28"/>'
        + '<path d="M11 5v15M13 5v15" stroke="#5a3418" stroke-width=".6" opacity=".55"/>'
        + '<path d="M9.5 13l5 1.5M9.5 15l5 1.5M9.5 17l5 1.5M9.5 19l5 1.5" stroke="#c0392b" stroke-width="1.3"/>';
      break;
    // ── Ball markers ──
    case 'pc26_found_coin': // milled-edge brass penny, worn smooth
      s = '<circle cx="12" cy="12" r="9.2" fill="#9a7430"/>'
        + '<circle cx="12" cy="12" r="9.2" fill="none" stroke="#7a5a24" stroke-width="1.8" stroke-dasharray="1.1 1.4"/>'
        + '<circle cx="12" cy="12" r="6.6" fill="#c99a45"/>'
        + '<circle cx="12" cy="12" r="6.6" fill="none" stroke="#8a6526" stroke-width=".8"/>'
        + '<path d="M7.6 8.6a6.6 6.6 0 019 0" stroke="#e2bd78" stroke-width="1" opacity=".5" fill="none"/>';
      break;
    case 'pc27_pitch_mark': // milled silver disc + crosshair
      s = '<circle cx="12" cy="12" r="9.2" fill="#cfd2d6"/>'
        + '<circle cx="12" cy="12" r="9.2" fill="none" stroke="#9aa0a8" stroke-width="1.1"/>'
        + '<path d="M12 3.4v17.2M3.4 12h17.2" stroke="#5a5f66" stroke-width="1.3"/>'
        + '<circle cx="12" cy="12" r="1.5" fill="#5a5f66"/>';
      break;
    case 'pc43_ctp_marker': // brass disc, flagstick struck clean through
      s = '<circle cx="12" cy="12" r="8.6" fill="#b58a3a"/>'
        + '<circle cx="12" cy="12" r="8.6" fill="none" stroke="#8a6526" stroke-width="1"/>'
        + '<path d="M12 2.2v19.6" stroke="#3a2a12" stroke-width="1.5"/>'
        + '<path d="M12.5 3.6l5.2 1.7-5.2 1.7z" fill="#c0392b"/>';
      break;
    case 'pc56_sterling': // v8.25.54 — hammered sterling marker, sapphire-enamel pip
      // NO <defs>: the function renders many markers per page (shelf + Front Table)
      // and a url(#id) gradient binds to the FIRST matching def in document order, so
      // two 66px instances collided. Fake the radial gleam with stacked solid discs
      // (light core -> mid -> shade rim), exactly like every other glyph here.
      s = '<circle cx="12" cy="12" r="9.5" fill="#a9aeb5" stroke="#9aa0a8" stroke-width="1"/>'
        + '<circle cx="12" cy="12" r="8.4" fill="#dfe2e6"/>'
        + '<circle cx="10.4" cy="9.6" r="5.2" fill="#eef1f4"/>'
        + '<circle cx="9.4" cy="8.6" r="2.6" fill="#f8fafc"/>'
        + '<circle cx="12" cy="12" r="7" fill="none" stroke="#b8bdc4" stroke-width=".8" opacity=".7"/>'
        + '<path d="M8 8.5l1.5 1M15 9l-1.3 1.2M9 15l1.2-1M15.5 14.5l-1.4-1" stroke="#8a9099" stroke-width=".7" opacity=".6"/>'
        + '<circle cx="12" cy="12" r="2" fill="#1f5fa0"/><circle cx="11.3" cy="11.3" r=".7" fill="#bcd6f2"/>';
      break;
    // v8.25.114 — pc47 + pc49 were sold LIVE but had NO glyph case, so they fell
    // to default:'' and rendered NOTHING when worn (dead purchase, P9 no-op —
    // same bug class fixed for pc08/pc29/pc36). Authored at the pc56 material bar.
    case 'pc47_quartered_leather': // scrap of saddle leather, quartered, on a brass ring
      s = '<circle cx="12" cy="12" r="9.4" fill="#b4893e"/>'
        + '<circle cx="12" cy="12" r="9.4" fill="none" stroke="#8a6526" stroke-width="1"/>'
        + '<path d="M5.2 9a9.4 9.4 0 0113.6 0" stroke="#e2bd78" stroke-width="1" opacity=".5" fill="none"/>'
        + '<rect x="6" y="6" width="12" height="12" rx="1.6" fill="#8a6f55"/>'
        + '<rect x="6" y="6" width="12" height="12" rx="1.6" fill="none" stroke="#5f4a38" stroke-width=".9"/>'
        + '<path d="M12 6.4v11.2M6.4 12h11.2" stroke="#4f3d2d" stroke-width=".7" stroke-dasharray="1 1.1" opacity=".75"/>'
        + '<path d="M7.4 7.6a8 8 0 016.8-.3" stroke="#a98a6a" stroke-width=".7" opacity=".5" fill="none"/>';
      break;
    case 'pc49_wooden_peg': // hickory dowel snapped clean, single burn-mark
      s = '<path d="M9.3 4.2h5.4l-.5 14.1c0 1.7-1 2.7-2.2 2.7s-2.2-1-2.2-2.7z" fill="#7a4a28"/>'
        + '<path d="M9.3 4.2h5.4l-.06 1.5-5.28 0z" fill="#caa75c" opacity=".55"/>'
        + '<path d="M10.6 7.5v10.2M12.6 7.5v10.6" stroke="#5a3418" stroke-width=".6" opacity=".5"/>'
        + '<ellipse cx="12" cy="12.4" rx="1.7" ry="2.2" fill="#3a2412"/>'
        + '<ellipse cx="12" cy="12.4" rx=".85" ry="1.15" fill="#1c1008"/>';
      break;
    default: return '';
  }
  return '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none">' + s + '</svg>';
}
function pbBallMarkerHtml(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.ball) return '';
  var g = pbMarkerGlyph(p.equippedCosmetics.ball, 12);
  if (!g) return '';
  return '<span class="pb-ballmarker" title="Ball marker" style="display:inline-flex;vertical-align:-1px;margin-left:4px">' + g + '</span>';
}
function pbTeeMarkerHtml(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.teemarker) return '';
  var g = pbMarkerGlyph(p.equippedCosmetics.teemarker, 12);
  if (!g) return '';
  return '<span class="pb-teemarker" title="Tee marker" style="display:inline-flex;vertical-align:-1px;margin-left:4px">' + g + '</span>';
}

function renderUsername(p, extraStyle, clickToProfile) {
  if (!p) return '<span style="' + (extraStyle || '') + '">Unknown</span>';
  // The Caddy: canonical name + brass BOT badge, no member cosmetics, never
  // click-to-profile. Identical across leagues so a bot post reads instantly.
  if (isCaddyPlayer(p)) {
    return '<span class="feed-card__name--caddy" style="' + (extraStyle || '') + '">' + escHtml("The Caddy") + '</span>' + caddyBotBadge();
  }
  var name = p.username || p.name || 'Member';
  var nameClass = getPlayerNameClass(p);
  var pid = p.id || '';
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';

  // Detect discriminator suffix #XXXX (4 digits) per W4.I1 schema. The
  // discriminator portion renders with reduced opacity + tighter weight so
  // the base username stays the primary read.
  var hashIdx = name.lastIndexOf('#');
  var inner;
  if (hashIdx > 0 && /^#\d{1,4}$/.test(name.slice(hashIdx))) {
    var base = name.slice(0, hashIdx);
    var tag  = name.slice(hashIdx);
    inner = escHtml(base) + '<span class="username-discriminator" style="opacity:0.55;font-weight:500;letter-spacing:0.5px">' + escHtml(tag) + '</span>';
  } else {
    inner = escHtml(name);
  }

  // v8.24.51 — nameplate wraps the name; tee marker trails it.
  var plateClass = pbNameplateClass(p);
  var marker = pbTeeMarkerHtml(p) + pbBallMarkerHtml(p);
  if (plateClass) {
    return '<span class="' + nameClass + ' ' + plateClass + '" style="' + cursor + (extraStyle || '') + '"' + click + '>' + inner + '</span>' + marker;
  }
  return '<span class="' + nameClass + '" style="' + cursor + (extraStyle || '') + '"' + click + '>' + inner + '</span>' + marker;
}

// renderAvatarUsername(player, avatarSize, nameStyle) → HTML string
// Convenience: avatar + username together in a flex row, both tappable to profile.
function renderAvatarUsername(p, avatarSize, nameStyle) {
  avatarSize = avatarSize || 36;
  var pid = p ? (p.id || '') : '';
  return '<div style="display:flex;align-items:center;gap:8px">' +
    renderAvatar(p, avatarSize, true) +
    renderUsername(p, (nameStyle || 'font-size:12px;font-weight:600;color:var(--cream);'), true) +
    '</div>';
}

// ────────────────────────────────────────────────────────────────────────────


// ========== NOTIFICATION SYSTEM ==========
var liveNotifications = [];

// ── FCM Push Notifications ──
var _fcmToken = null;
// VAPID key — get from Firebase Console → Cloud Messaging → Web push certificates
// Set this in Firestore config/push_config.vapidKey or replace this placeholder
var FCM_VAPID_KEY = null;

function initPushNotifications() {
  if (!firebase.messaging || !currentUser || !db) return;
  // Load VAPID key from Firestore config if not set
  if (!FCM_VAPID_KEY) {
    db.collection("config").doc("push_config").get().then(function(doc) {
      if (doc.exists && doc.data().vapidKey) {
        FCM_VAPID_KEY = doc.data().vapidKey;
        _requestFcmPermission();
      } else {
        pbLog("[FCM] No VAPID key configured — push notifications disabled. Set config/push_config.vapidKey in Firestore.");
      }
    }).catch(function() {});
    return;
  }
  _requestFcmPermission();
}

function _requestFcmPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    _getFcmToken();
  } else if (Notification.permission !== 'denied') {
    // Don't auto-prompt — let the user opt in from settings or onboarding
    pbLog("[FCM] Permission not yet requested — waiting for user opt-in");
  }
}

function requestPushPermission() {
  if (!('Notification' in window)) { Router.toast("Notifications not supported on this device"); return; }
  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      _getFcmToken();
      Router.toast("Notifications enabled!");
    } else {
      Router.toast("Notifications blocked, check browser settings");
    }
  });
}

function _getFcmToken() {
  if (!firebase.messaging || !FCM_VAPID_KEY) return;
  try {
    var messaging = firebase.messaging();
    messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: navigator.serviceWorker ? navigator.serviceWorker.ready : undefined })
      .then(function(token) {
        if (token && token !== _fcmToken) {
          _fcmToken = token;
          pbLog("[FCM] Token acquired");
          // Store token in member doc
          if (db && currentUser) {
            db.collection("members").doc(currentUser.uid).set({ fcmToken: token, fcmUpdatedAt: fsTimestamp() }, { merge: true }).catch(function(){});
          }
        }
      }).catch(function(err) { pbWarn("[FCM] Token error:", err.message); });

    // Foreground message handler — show as toast
    messaging.onMessage(function(payload) {
      var data = payload.notification || payload.data || {};
      Router.toast(data.body || data.title || "New notification");
    });
  } catch(e) { pbWarn("[FCM] Init error:", e.message); }
}

function sendNotification(toUserId, notif) {
  if (!db) return;
  notif.toUserId = toUserId;
  notif.read = false;
  notif.createdAt = fsTimestamp();
  // v8.24.54 (sec #14) — provenance stamp so rules can reject forged senders.
  notif.fromUserId = (window.currentUser && window.currentUser.uid) || (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) || '';
  // Optional leagueId on new writes — null when no active league context.
  // Existing reads ignore unknown fields; backward-compatible.
  var lid = (window.currentProfile && window.currentProfile.activeLeague) || null;
  if (lid) notif.leagueId = lid;
  db.collection("notifications").add(notif).catch(function(){});
  // pendingPush bridge — DO NOT modify shape; FCM Cloud Function reads it.
  db.collection("pendingPush").add({
    toUserId: toUserId,
    title: notif.title || (window._activeLeagueName || "Parbaughs"),
    body: notif.message || "",
    data: { type: notif.type || "general", page: notif.page || "" },
    createdAt: fsTimestamp()
  }).catch(function(){});
}

// ─────────────────────────────────────────────────────────────────────────
// Notification listener + click-handoff infrastructure (v8.17.0 / Ship 5+1)
// ─────────────────────────────────────────────────────────────────────────
// Schema: { toUserId, type, title, message, page?, params?, read, readAt?, leagueId?, createdAt }
// Legacy: { linkPage, linkParams, body } — read paths alias both shapes.
// Reader-side resolution at indexNotifInMap below establishes click destination
// + params for each notification; renderNotifPanel reads from the map only.

function indexNotifInMap(n) {
  if (!n || !n._id) return;
  var meta = window.NOTIFICATION_META && window.NOTIFICATION_META[n.type];
  var dest = n.page || n.linkPage || (meta && meta.page) || "home";
  var params = n.params || n.linkParams || {};
  if (!window._notifById) window._notifById = {};
  window._notifById[n._id] = { dest: dest, params: params, isRead: !!n.read };
}

function startNotificationListener() {
  if (!db || !currentUser) return;
  if (window._notifUnsub) window._notifUnsub();
  window._notifUnsub = db.collection("notifications")
    .where("toUserId","==",currentUser.uid)
    .where("read","==",false)
    .limit(30)
    .onSnapshot(function(snap) {
      liveNotifications = [];
      window._notifById = {};
      snap.forEach(function(doc) {
        var n = Object.assign({_id:doc.id}, doc.data());
        liveNotifications.push(n);
        indexNotifInMap(n);
      });
      // Re-merge readHistory entries — both share the same map for click handoff.
      (readHistory || []).forEach(indexNotifInMap);
      liveNotifications.sort(function(a,b) {
        var at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        var bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });
      updateNotifBadge();
      if (notifPanelOpen) renderNotifPanel();
    }, function(err) { pbWarn("[Notify] Listener error:", err.message); });
}

// ========== ROUND INTEGRITY ==========
var ROUND_GRACE_HOURS = 48;



/* ── Shared infrastructure: notifications, AI tournament, share cards, presence, feed, overrides ── */

// Extracted to src/core/router-notifications.js per W1.A5. Originally lines 452-720 of this file.
// Tournament generation lives in src/core/tournament-engine.js (free, algorithmic — no LLM API).
// Extracted to src/core/router-sharecard.js per W1.A5. Originally lines 876-1543 of this file.
// ========== PRESENCE / WHO'S ONLINE ==========
var onlineMembers = {};

function updatePresence() {
  if (!db || !currentUser) return;
  var presenceData = {
    uid: currentUser.uid,
    name: currentProfile ? (currentProfile.name || currentProfile.username) : "Member",
    lastSeen: fsTimestamp(),
    online: true
  };
  if (typeof liveState !== "undefined" && liveState && liveState.active) {
    var scored = liveState.scores.filter(function(s){return s!==""});
    presenceData.liveRound = {
      course: liveState.course || "",
      hole: (liveState.currentHole || 0) + 1,
      score: scored.reduce(function(a,b){return a+parseInt(b)},0),
      thru: scored.length,
      startTime: liveState.startTime || null,
      format: liveState.format || "stroke",
      tee: liveState.tee || "",
      holeScores: liveState.scores.slice(),
      holePars: liveState.holes && liveState.holes.length
        ? liveState.holes.map(function(h){return h.par||4;})
        : [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5]
    };
  } else {
    presenceData.liveRound = null;
  }
  // Skip redundant writes — only write if state changed or forced heartbeat
  var sig = (presenceData.name||"") + "|" + (liveState.active ? liveState.currentHole + ":" + liveState.scores.filter(function(s){return s!==""}).length + ":" + liveState.scores.filter(function(s){return s!==""}).reduce(function(a,b){return a+parseInt(b)},0) : "idle");
  if (updatePresence._lastSig === sig && !updatePresence._force) return;
  updatePresence._lastSig = sig;
  updatePresence._force = false;
  db.collection("presence").doc(currentUser.uid).set(presenceData, { merge: true }).catch(function(){});
}



function showAchievementCelebration(ach) {
  // Remove any existing celebration
  var existing = document.getElementById("achCelebration");
  if (existing) existing.remove();

  // Haptic unlock pattern (Ship 0b-iii) — fires alongside the visual celebration
  if (typeof hapticUnlock === "function") hapticUnlock();

  var el = document.createElement("div");
  el.id = "achCelebration";
  el.className = "ach-celebrate";
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
  el.innerHTML = '<div style="background:linear-gradient(135deg,rgba(var(--gold-rgb),.18),rgba(var(--gold-rgb),.08));border:1.5px solid rgba(var(--gold-rgb),.4);border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:14px;backdrop-filter:blur(8px)">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:rgba(var(--gold-rgb),.15);border:1.5px solid rgba(var(--gold-rgb),.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold)">' + ach.icon + '</div>'
    + '<div style="flex:1;min-width:0">'
    + '<div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:3px">Achievement Unlocked</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--cream)">' + escHtml(ach.name) + '</div>'
    + '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(ach.desc) + '</div>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:800;color:var(--gold);flex-shrink:0">+' + ach.xp + ' XP</div>'
    + '</div>';
  document.body.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 4200);
}

// Extracted to src/core/router-achievement.js per W1.A5. Originally lines 1609-1688 of this file.

// Extracted to src/core/router-activity-feed.js per W1.A5. Originally lines 1690-2157 of this file.
// ========== ROUND IN PROGRESS BANNER ==========
function renderRipBanner() {
  var existing = document.getElementById("ripBanner");
  if (existing) existing.remove();
  
  if (!liveState.active) return;
  
  var hole = liveState.currentHole + 1;
  var totalSoFar = 0, played = 0;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  liveState.scores.forEach(function(s, i) { if (s !== "") { totalSoFar += parseInt(s); played++; parSoFar += defaultPar[i]||4; } });
  var diff = totalSoFar - parSoFar;
  var diffStr = played > 0 ? (diff > 0 ? "+" + diff : diff === 0 ? "E" : diff) : "";
  
  var banner = document.createElement("div");
  banner.id = "ripBanner";
  banner.className = "rip-banner";
  banner.onclick = function() { Router.go("playnow"); };
  banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px">' +
    '<div class="rip-dot"></div>' +
    '<div><div style="font-size:11px;font-weight:600;color:var(--cream)">Round in progress</div>' +
    '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(liveState.course) + ' · Hole ' + hole + (diffStr ? ' · ' + diffStr : '') + '</div></div></div>' +
    '<div style="font-size:10px;color:var(--gold);font-weight:600">Resume →</div>';
  
  var nav = document.getElementById("nav");
  if (nav && nav.parentNode) {
    nav.parentNode.insertBefore(banner, nav.nextSibling);
  }
}

// Extracted to src/core/router-sidebar.js per W1.A5. Originally lines 2189-2628 of this file.
// Extracted to src/core/router-empty-states.js per W1.A5. Originally lines 2629-2786 of this file.
// ========== INIT FIREBASE LISTENERS ==========
function initFirebaseListeners() {
  // startTeeTimeListener (teetimes.js) + startRangeSessionListener (range.js) live
  // in the DEFERRED page bundle, which executes via <script defer> AFTER the inline
  // core block. A fast auth callback runs enterApp -> initFirebaseListeners before
  // that bundle loads, so an unguarded call throws ReferenceError and aborts the
  // rest of this function: none of the core listeners below start and the home
  // shell renders empty. Surfaced deterministically in v8.23.49 once deferred.js
  // became content-hashed (v8.23.48) — a fresh network fetch loads slower than the
  // previously-immutable disk-cached copy, so auth now resolves first. Retry the
  // deferred starters until the bundle is present (same pattern as enterApp's
  // _restoreLiveStateWhenReady); the core listeners run immediately regardless.
  (function _startDeferredListenersWhenReady(tries) {
    if (typeof startTeeTimeListener === "function" && typeof startRangeSessionListener === "function") {
      startTeeTimeListener();
      startRangeSessionListener();
      return;
    }
    if (tries >= 50) return; // ~6s ceiling
    setTimeout(function() { _startDeferredListenersWhenReady(tries + 1); }, 120);
  })(0);
  startNotificationListener();
  startDmUnreadListener();
  startPresenceSystem();
  initConnStatus();
  initPushNotifications();
  cleanupCorruptedProfiles();
  // Load shared API keys from Firestore
  if (db) {
    db.collection("config").doc("api_keys").get().then(function(doc) {
      if (doc.exists && doc.data().golfCourseApi) {
        localStorage.setItem("golfcourse_api_key", doc.data().golfCourseApi);
      }
    }).catch(function(){});
  }
}

// One-time cleanup: detect non-founding members who inherited founding data via claim bug
function cleanupCorruptedProfiles() {
  if (!db || !currentUser) return;
  // Only Commissioner can run this for all members
  if (!isFounderRole(currentProfile)) return;
  
  db.collection("members").get().then(function(snap) {
    snap.forEach(function(doc) {
      var m = doc.data();
      // Skip actual founding-four members (they used FOUNDING-FOUR code)
      if (m.isFoundingFour === true) return;
      
      var needsFix = false;
      var updates = {};
      
      // Check for inherited founding data
      if (m.founding === true) { updates.founding = false; needsFix = true; }
      if (m.title && m.title.indexOf("Original Four") !== -1) { updates.title = ""; updates.equippedTitle = ""; needsFix = true; }
      if (m.equippedTitle && m.equippedTitle.indexOf("Original Four") !== -1) { updates.equippedTitle = ""; needsFix = true; }
      if (isFounderRole(m) && doc.id !== currentUser.uid) {
        // Only the real platform founder should have this role. Demote
        // any stray commissioner via the legacy field (v8.0 rules still
        // allow writing to `role`; platformRole is immutable via client).
        updates.role = "member"; needsFix = true;
      }
      // Check for badges they shouldn't have
      if (m.badges && m.badges.indexOf("founder") !== -1 && !m.isFoundingFour) {
        updates.badges = m.badges.filter(function(b) { return b !== "founder"; });
        needsFix = true;
      }
      // If they have someone else's name (claimedFrom but name matches a default player exactly)
      if (m.claimedFrom && !m.isFoundingFour) {
        var defaultNames = ["Zach Parbaugh","Kayvan","Kiyan","Nick"];
        if (defaultNames.indexOf(m.name) !== -1) {
          updates.name = m.username || "Member";
          needsFix = true;
        }
      }
      // Clean inherited data from non-founding members who claimed profiles
      if (m.claimedFrom && !m.isFoundingFour) {
        // Non-founding members should never have claimedFrom — this was the bug
        updates.claimedFrom = firebase.firestore.FieldValue.delete();
        needsFix = true;
        if (m.bio) { updates.bio = ""; }
        if (m.nick) { updates.nick = ""; }
        if (m.manualHandicap) { updates.manualHandicap = null; }
        if (m.funnyFacts && m.funnyFacts.length) { updates.funnyFacts = []; }
        if (m.range) { updates.range = ""; }
        if (m.clubs && Object.keys(m.clubs).length) { updates.clubs = {}; }
        if (m.bag && Object.keys(m.bag).length) { updates.bag = {}; }
        if (m.homeCourse) { updates.homeCourse = ""; }
        if (m.favoriteCourse) { updates.favoriteCourse = ""; }
        if (m.bagPhoto) { updates.bagPhoto = ""; }
        if (m.wins) { updates.wins = 0; }
        if (m.trips) { updates.trips = 0; }
      }
      // Fallback: catch profiles where claimedFrom was already deleted but inherited data remains
      if (!m.claimedFrom && !m.isFoundingFour) {
        var founderBios = ["Founded the Parbaughs","Tracks stats like his life depends on it"];
        if (m.bio && founderBios.some(function(fb){return m.bio.indexOf(fb) !== -1})) {
          updates.bio = ""; needsFix = true;
        }
        if (m.funnyFacts && m.funnyFacts.length && !m.isFoundingFour) {
          // Check if funnyFacts match a founding member's
          var founderFacts = ["Bought custom-fit irons","Owns more golf trackers","Will quote his handicap"];
          if (m.funnyFacts.some(function(f){return founderFacts.some(function(ff){return f.indexOf(ff)!==-1})})) {
            updates.funnyFacts = []; needsFix = true;
          }
        }
        if (m.nick && !m.isFoundingFour) {
          var founderNicks = ["The Commissioner","Mr Parbaugh"];
          if (founderNicks.indexOf(m.nick) !== -1) { updates.nick = ""; needsFix = true; }
        }
      }
      
      if (needsFix) {
        pbLog("[Cleanup] Fixing corrupted profile:", doc.id, updates);
        db.collection("members").doc(doc.id).update(updates).catch(function(e) { pbWarn("[Cleanup] Failed:", doc.id, e); });
      }
    });
  }).catch(function(){});
}

// Override enterApp to include Firebase listeners
var _origEnterApp = enterApp;
enterApp = function() {
  _origEnterApp();
  initFirebaseListeners();
  // ── ParCoin: daily login streak coins ──
  setTimeout(awardDailyLogin, 2000);
  // Check profile completion — send one-time reminder notification.
  // Dedup is DURABLE: query Firestore for an existing profile_reminder before
  // sending. The in-memory flag alone reset every session, so an incomplete
  // profile spawned a fresh reminder on every app-open and flooded the panel.
  setTimeout(function() {
    if (!db || !currentUser || !currentProfile) return;
    var profComplete = currentProfile.bio && currentProfile.range && currentProfile.homeCourse;
    if (profComplete) return;
    if (window._sentProfileNotif) return; // same-session fast-path
    window._sentProfileNotif = true;
    var uid = currentUser.uid;
    db.collection("notifications")
      .where("toUserId", "==", uid)
      .where("type", "==", "profile_reminder")
      .limit(1)
      .get()
      .then(function(snap) {
        if (!snap.empty) return; // reminder already exists — never re-send
        sendNotification(uid, {
          type: "profile_reminder",
          title: "Complete Your Profile",
          message: "Add your bio, score range, and home course to earn XP and unlock the Getting Settled achievement!",
          page: "members",
          params: {edit: uid}
        });
      })
      .catch(function() {});
  }, 5000); // Delay 5s so it doesn't fire on initial load
};

// ========== FINAL INIT ==========
// Deferred: pages register after core loads, so wait for them
setTimeout(function() { Router.go("home"); }, 0);
