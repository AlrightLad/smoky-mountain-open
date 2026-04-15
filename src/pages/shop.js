/* ================================================
   PAGE: COSMETICS SHOP — Spend ParCoins on cosmetics
   Categories: Profile Borders, Banners, Card Themes
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

var COSMETICS_CATALOG = [
  // ── PROFILE RINGS — Basic: 100-200, Mid: 300-500, Premium: 750-1500, Ultra: 2000+ ──
  {id:"border_default_gold",cat:"border",name:"Classic Gold",      price:0,   desc:"The default Parbaugh gold — free for all members",  css:"2px solid #c9a84c",  preview:"#c9a84c"},
  {id:"border_bronze",     cat:"border", name:"Bronze Ring",       price:100, desc:"Subtle bronze glow",       css:"2px solid #CD7F32",          preview:"#CD7F32"},
  {id:"border_silver",     cat:"border", name:"Silver Ring",       price:150, desc:"Clean silver finish",       css:"2px solid #C0C0C0",          preview:"#C0C0C0"},
  {id:"border_birdie",     cat:"border", name:"Birdie Green",      price:150, desc:"Glowing green for under-par energy", css:"3px solid #4ade80",  preview:"#4ade80"},
  {id:"border_ice",        cat:"border", name:"Ice Blue",          price:150, desc:"Cool arctic blue edge",              css:"3px solid #38bdf8",    preview:"#38bdf8"},
  {id:"border_rose",       cat:"border", name:"Rose Gold",         price:200, desc:"Elegant rose gold tone",    css:"3px solid #e8a0bf",          preview:"#e8a0bf"},
  {id:"border_flame",      cat:"border", name:"Flame Ring",         price:200, desc:"Warm camo-paired flame glow",           css:"3px solid #d4943c",   preview:"#d4943c"},
  {id:"border_gold",       cat:"border", name:"Gold Ring",         price:300, desc:"Premium gold band",         css:"3px solid #c9a84c",          preview:"#c9a84c"},
  {id:"border_fire",       cat:"border", name:"Fire Ring",         price:300, desc:"Hot orange glow",           css:"3px solid #ff6b35",          preview:"#ff6b35"},
  {id:"border_emerald",    cat:"border", name:"Emerald Ring",      price:300, desc:"Deep green prestige",       css:"3px solid #50c878",          preview:"#50c878"},
  {id:"border_champ_red",  cat:"border", name:"Championship Red",  price:300, desc:"Bold crimson — champion vibes",      css:"3px solid #d4243c",   preview:"#d4243c"},
  {id:"border_diamond",    cat:"border", name:"Diamond Ring",      price:400, desc:"Sparkling diamond edge",    css:"3px solid #b9f2ff",          preview:"#b9f2ff"},
  {id:"border_obsidian",   cat:"border", name:"Obsidian Edge",     price:400, desc:"Dark volcanic glass",       css:"3px solid #2d2d2d",          preview:"#555555"},
  {id:"border_platinum",   cat:"border", name:"Platinum Band",     price:500, desc:"Rare platinum finish",      css:"3px solid #e5e4e2",          preview:"#e5e4e2"},
  {id:"border_rainbow",    cat:"border", name:"Prismatic Ring",    price:500, desc:"Multicolor gradient ring",  css:"3px solid #ff6b6b",          preview:"#ff6b6b"},
  {id:"border_neon_green", cat:"border", name:"Neon Green",         price:750, desc:"Animated neon green pulse",             css:"3px solid #39ff14",   preview:"#39ff14"},
  {id:"border_crimson_ember",cat:"border",name:"Crimson Ember",     price:750, desc:"Animated smoldering ember ring",     css:"3px solid #cc3300",   preview:"#cc3300"},
  {id:"border_pulse_gold", cat:"border", name:"Pulse Gold",        price:1000,desc:"Animated golden pulse glow",            css:"3px solid #c9a84c",   preview:"#c9a84c"},
  {id:"border_rainbow_shift",cat:"border",name:"Rainbow Shift",    price:1500,desc:"Animated color-cycling ring",           css:"3px solid #ff6b6b",   preview:"#ff6b6b"},
  {id:"border_shimmer",    cat:"border", name:"Diamond Sparkle",   price:2500,desc:"Ultra-premium animated diamond ring",   css:"3px solid #b9f2ff",   preview:"#b9f2ff"},

  // ── PROFILE BANNERS — Basic: 100-200, Mid: 300-500, Premium: 750+ ──
  {id:"banner_default",    cat:"banner", name:"Theme Default",     price:0,   desc:"Uses your active theme gradient — free for all",  css:"linear-gradient(180deg,var(--grad-hero),var(--bg))", preview:"var(--gold)"},
  {id:"banner_classic",    cat:"banner", name:"Classic Pinstripe", price:100, desc:"Charcoal with gold pinstripe — pairs with Classic",    css:"linear-gradient(180deg,#0e1118 0%,#1a1f2c 50%,#0e1118 100%)", preview:"#0e1118"},
  {id:"banner_flagstick",  cat:"banner", name:"Flagstick",        price:100, desc:"Silhouette gradient — works on any theme",               css:"linear-gradient(180deg,#1a2840,#0e1118,#1a2840)", preview:"#1a2840"},
  {id:"banner_sunset",     cat:"banner", name:"Sunset Fairway",    price:150, desc:"Warm orange-pink gradient", css:"linear-gradient(135deg,#ff6b35,#e8729a)", preview:"#ff6b35"},
  {id:"banner_ocean",      cat:"banner", name:"Ocean Drive",       price:150, desc:"Cool blue-teal sweep",      css:"linear-gradient(135deg,#2563eb,#06b6d4)", preview:"#2563eb"},
  {id:"banner_midnight",   cat:"banner", name:"Midnight Green",    price:150, desc:"Dark green Augusta vibe",   css:"linear-gradient(135deg,#064e3b,#059669)", preview:"#064e3b"},
  {id:"banner_arctic",     cat:"banner", name:"Arctic Dawn",      price:150, desc:"Icy white-blue morning",    css:"linear-gradient(135deg,#e0f2fe,#7dd3fc)", preview:"#7dd3fc"},
  {id:"banner_pine",       cat:"banner", name:"Pine Forest",      price:150, desc:"Deep forest green fade",    css:"linear-gradient(135deg,#1a3a2a,#2d6a4f)", preview:"#1a3a2a"},
  {id:"banner_camo_pair",  cat:"banner", name:"Woodland Camo",    price:200, desc:"Olive and shadow — pairs with Camo",                   css:"linear-gradient(135deg,#12140e,#2e3122,#181a12)", preview:"#12140e"},
  {id:"banner_masters_pair",cat:"banner", name:"Augusta Green",   price:200, desc:"Deep green with yellow trim — pairs with Masters",      css:"linear-gradient(135deg,#071a10,#0c2218,#1a3a28)", preview:"#071a10"},
  {id:"banner_azalea_pair",cat:"banner", name:"Bloom Garden",     price:200, desc:"Dark with pink accents — pairs with Azalea",            css:"linear-gradient(135deg,#0e1118,#1a0e18,#0e1118)", preview:"#1a0e18"},
  {id:"banner_usga_pair",  cat:"banner", name:"Navy Stripe",      price:200, desc:"Institutional navy — pairs with USGA",                  css:"linear-gradient(135deg,#0a1628,#142640,#0a1628)", preview:"#0a1628"},
  {id:"banner_dark_pair",  cat:"banner", name:"Carbon Fiber",     price:200, desc:"Pure black with silver edge — pairs with Dark",          css:"linear-gradient(135deg,#000000,#141414,#000000)", preview:"#000000"},
  {id:"banner_light_pair", cat:"banner", name:"Linen & Gold",     price:200, desc:"Warm cream with gold accent — pairs with Light",         css:"linear-gradient(135deg,#f5f3ee,#eceae4,#f5f3ee)", preview:"#f5f3ee"},
  {id:"banner_storm",      cat:"banner", name:"Thunder Storm",     price:300, desc:"Deep purple-gray power",    css:"linear-gradient(135deg,#581c87,#374151)", preview:"#581c87"},
  {id:"banner_crimson",    cat:"banner", name:"Crimson Tide",     price:300, desc:"Bold red-to-black power",   css:"linear-gradient(135deg,#991b1b,#1f1f1f)", preview:"#991b1b"},
  {id:"banner_ember",      cat:"banner", name:"Ember Glow",       price:300, desc:"Warm amber to deep red",    css:"linear-gradient(135deg,#f59e0b,#b91c1c)", preview:"#f59e0b"},
  {id:"banner_champ_pair", cat:"banner", name:"Burgundy Leather", price:300, desc:"Championship leather — pairs with Sunday Red",           css:"linear-gradient(135deg,#10080a,#301c22,#10080a)", preview:"#10080a"},
  {id:"banner_mountain",   cat:"banner", name:"Mountain Range",   price:300, desc:"Golf trip mountain skyline vibes",                       css:"linear-gradient(180deg,#0f172a,#1e3a5f,#0f172a)", preview:"#0f172a"},
  {id:"banner_fairway",    cat:"banner", name:"Fairway Aerial",   price:300, desc:"Top-down fairway pattern",                               css:"linear-gradient(135deg,#064e3b,#0a7c5a,#064e3b)", preview:"#064e3b"},
  {id:"banner_gold_rush",  cat:"banner", name:"Gold Rush",         price:500, desc:"Rich gold gradient",        css:"linear-gradient(135deg,#92400e,#f59e0b)", preview:"#92400e"},
  {id:"banner_golden_hr",  cat:"banner", name:"Golden Hour",      price:500, desc:"Sunset gradient — warm amber to deep navy",              css:"linear-gradient(180deg,#f59e0b,#c2410c,#1e1b4b)", preview:"#f59e0b"},

  // ── CARD THEMES — Mid-tier: 300-500. Each DRAMATICALLY different from default. ──
  {id:"card_neon",         cat:"card", name:"Neon Glow",           price:300, desc:"Bright green edge that pops",             css:"border-left:4px solid #4ade80;background:linear-gradient(90deg,rgba(74,222,128,.06),transparent 40%)", preview:"#4ade80"},
  {id:"card_royal",        cat:"card", name:"Royal Purple",        price:300, desc:"Purple accent with regal tint",           css:"border-left:4px solid #a78bfa;background:linear-gradient(90deg,rgba(167,139,250,.06),transparent 40%)", preview:"#a78bfa"},
  {id:"card_birdie",       cat:"card", name:"Birdie Green",       price:300, desc:"Green energy for under-par rounds",        css:"border-left:4px solid #22c55e;background:linear-gradient(90deg,rgba(34,197,94,.06),transparent 40%)", preview:"#22c55e"},
  {id:"card_vintage",      cat:"card", name:"Vintage Parchment",  price:300, desc:"Old-school scorecard warmth",              css:"border-left:4px solid #c4a97d;background:linear-gradient(90deg,rgba(196,169,125,.08),transparent 40%)", preview:"#c4a97d"},
  {id:"card_fire",         cat:"card", name:"Hot Shot",            price:400, desc:"Red-orange fire edge with heat tint",      css:"border-left:4px solid #ef4444;background:linear-gradient(90deg,rgba(239,68,68,.07),transparent 40%)", preview:"#ef4444"},
  {id:"card_ice",          cat:"card", name:"Ice Cold",            price:400, desc:"Cool blue frost with icy tint",            css:"border-left:4px solid #38bdf8;background:linear-gradient(90deg,rgba(56,189,248,.06),transparent 40%)", preview:"#38bdf8"},
  {id:"card_stealth",      cat:"card", name:"Stealth Mode",       price:400, desc:"Dark charcoal — subtle but sharp",         css:"border-left:4px solid #374151;background:linear-gradient(90deg,rgba(55,65,81,.1),transparent 40%)", preview:"#555555"},
  {id:"card_sunset",       cat:"card", name:"Sunset Strip",       price:400, desc:"Warm amber glow on your rounds",           css:"border-left:4px solid #f97316;background:linear-gradient(90deg,rgba(249,115,22,.07),transparent 40%)", preview:"#f97316"},
  {id:"card_birdie_streak",cat:"card", name:"Birdie Streak",      price:400, desc:"Electric green for under-par runs",        css:"border-left:4px solid #22d65e;background:linear-gradient(90deg,rgba(34,214,94,.07),transparent 40%)", preview:"#22d65e"},
  {id:"card_neon_night",   cat:"card", name:"Neon Night",         price:400, desc:"Hot pink neon glow on dark",               css:"border-left:4px solid #ff00ff;background:linear-gradient(90deg,rgba(255,0,255,.06),transparent 40%)", preview:"#ff00ff"},
  {id:"card_dark_carbon",  cat:"card", name:"Dark Carbon",        price:500, desc:"Matte carbon fiber edge — ultimate stealth",css:"border-left:4px solid #1a1a1a;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent 30%)", preview:"#444444"},
  {id:"card_augusta",      cat:"card", name:"Augusta Green",      price:500, desc:"Deep Masters green prestige",              css:"border-left:4px solid #006633;background:linear-gradient(90deg,rgba(0,102,51,.08),transparent 40%)", preview:"#006633"},
  {id:"card_gold",         cat:"card", name:"Gold Standard",      price:500, desc:"Gold accent for the elite — unmistakable", css:"border-left:4px solid #c9a84c;background:linear-gradient(90deg,rgba(201,168,76,.08),transparent 40%)", preview:"#c9a84c"},
  {id:"card_gold_foil",    cat:"card", name:"Gold Foil",          price:500, desc:"Luxe metallic gold edge with shimmer",     css:"border-left:4px solid #c9a84c;background:linear-gradient(90deg,rgba(201,168,76,.1),rgba(223,192,106,.04) 50%,transparent)", preview:"#c9a84c"},

  // ── NAME EFFECTS — Mid-tier: 300-500 ──
  {id:"name_shadow_depth", cat:"name", name:"Shadow Depth",        price:300, desc:"Deep shadow for a 3D carved look",  css:"text-shadow:2px 2px 4px rgba(0,0,0,.5)", preview:"#666666"},
  {id:"name_gold_shimmer", cat:"name", name:"Gold Shimmer",        price:350, desc:"Animated gold gradient on your name",    css:"text-shadow:0 0 8px rgba(201,168,76,.6)", preview:"#c9a84c"},
  {id:"name_glow_green",   cat:"name", name:"Glowing Green",       price:350, desc:"Bright green aura that pulses",    css:"text-shadow:0 0 10px rgba(74,222,128,.7)", preview:"#4ade80"},
  {id:"name_fire_text",    cat:"name", name:"Fire Text",           price:400, desc:"Orange-red fire glow effect",       css:"text-shadow:0 0 8px rgba(239,68,68,.6),0 0 16px rgba(249,115,22,.3)", preview:"#ef4444"},
  {id:"name_ice_text",     cat:"name", name:"Ice Text",            price:400, desc:"Cool icy blue glow effect",         css:"text-shadow:0 0 8px rgba(56,189,248,.6),0 0 16px rgba(186,230,253,.3)", preview:"#38bdf8"},
  {id:"name_rainbow",      cat:"name", name:"Rainbow Gradient",    price:500, desc:"Multicolor animated gradient text",          css:"background:linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent", preview:"#ff6b6b"},

  // ── TITLES — Basic: 200, Mid: 300-500, Premium: 750 ──
  {id:"title_early_bird",    cat:"title", name:"Early Bird",          price:200, desc:"First tee time, every time",                     css:"", preview:"#fbbf24"},
  {id:"title_night_owl",     cat:"title", name:"Night Owl",           price:200, desc:"Twilight rounds are your specialty",              css:"", preview:"#818cf8"},
  {id:"title_grinder",       cat:"title", name:"Grinder",            price:300, desc:"For the player who never stops working",          css:"", preview:"var(--gold)"},
  {id:"title_road_warrior",  cat:"title", name:"Road Warrior",        price:300, desc:"Plays everywhere — never the same course twice",  css:"", preview:"var(--gold)"},
  {id:"title_iron_will",     cat:"title", name:"Iron Will",           price:300, desc:"Bounces back from every bad hole",                css:"", preview:"#6b7280"},
  {id:"title_sharpshooter",  cat:"title", name:"Sharpshooter",       price:400, desc:"Precision approach game — deadly accurate",       css:"", preview:"var(--gold)"},
  {id:"title_hot_streak",    cat:"title", name:"Hot Streak",          price:400, desc:"On fire lately — rounds keep getting better",     css:"", preview:"#ef4444"},
  {id:"title_sandbagger",    cat:"title", name:"Sandbagger",          price:500, desc:"Handicap says 25, plays like a 15. We see you.", css:"", preview:"var(--gold)"},
  {id:"title_course_legend", cat:"title", name:"Course Legend",       price:500, desc:"Owns a course — everyone knows your name there", css:"", preview:"var(--gold)"},
  {id:"title_big_spender",   cat:"title", name:"Big Spender",         price:750, desc:"ParCoins flow like water from your wallet",       css:"", preview:"var(--gold)"},
  {id:"title_the_ace",       cat:"title", name:"The Ace",             price:0,   desc:"Reserved — awarded for a hole-in-one",            css:"", preview:"#FFD700", reserved:true},
  {id:"title_founding_four", cat:"title", name:"The Original Four",   price:0,   desc:"Reserved — founding members only",                css:"", preview:"var(--gold)", reserved:true},
  {id:"title_commissioner",  cat:"title", name:"The Commissioner",    price:0,   desc:"Reserved — league commissioner only",             css:"", preview:"var(--gold)", reserved:true}
];

var COSMETIC_CATS = {
  border: {label: "Rings",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>'},
  banner: {label: "Banners",  icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/></svg>'},
  card:   {label: "Cards",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>'},
  name:   {label: "Names",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>'},
  title:  {label: "Titles",   icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 15l-2 5h4l-2-5z"/><path d="M6.5 10L12 3l5.5 7h-11z"/></svg>'}
};

var _shopCat = "border";

Router.register("shop", function() {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);
  var owned = (currentProfile && currentProfile.ownedCosmetics) || [];

  var h = '<div class="sh"><h2>Shop</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // Balance bar
  h += '<div style="padding:0 16px 12px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:28px;height:28px;border-radius:50%;background:rgba(var(--gold-rgb),.12);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="var(--gold)" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg></div>';
  h += '<div style="font-size:18px;font-weight:700;color:var(--gold)">' + balance.toLocaleString() + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);letter-spacing:.5px">PARCOINS</div>';
  h += '</div>';

  // Category tabs
  h += '<div class="toggle-bar" id="shop-tabs">';
  Object.keys(COSMETIC_CATS).forEach(function(catKey) {
    var cat = COSMETIC_CATS[catKey];
    var isActive = catKey === _shopCat;
    h += '<button' + (isActive ? ' class="a"' : '') + ' onclick="_shopCat=\'' + catKey + '\';Router.go(\'shop\',{},true)">' + cat.icon + ' ' + cat.label + '</button>';
  });
  h += '</div>';

  // Items grid
  var items = COSMETICS_CATALOG.filter(function(c) { return c.cat === _shopCat; });
  h += '<div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  items.forEach(function(item) {
    var isOwned = owned.indexOf(item.id) !== -1 || item.price === 0;
    var canAfford = balance >= item.price;
    var equipped = currentProfile && currentProfile.equippedCosmetics && currentProfile.equippedCosmetics[item.cat] === item.id;

    h += '<div style="background:var(--card);border:1px solid ' + (equipped ? 'var(--gold)' : 'var(--border)') + ';border-radius:var(--radius-lg);padding:14px;text-align:center;position:relative">';

    // Preview
    if (item.cat === "border") {
      h += '<div style="width:52px;height:52px;border-radius:50%;border:' + item.css + ';margin:0 auto 8px;display:flex;align-items:center;justify-content:center;background:var(--bg3)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>';
    } else if (item.cat === "banner") {
      h += '<div style="height:32px;border-radius:var(--radius);background:' + item.css + ';margin-bottom:8px"></div>';
    } else if (item.cat === "card") {
      h += '<div style="height:32px;border-radius:var(--radius);background:var(--bg3);margin-bottom:8px;' + item.css + '"></div>';
    } else if (item.cat === "name") {
      h += '<div style="padding:6px 0 8px;font-size:15px;font-weight:700;' + item.css + '">YourName</div>';
    } else if (item.cat === "title") {
      h += '<div style="padding:8px 0;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:13px;font-weight:700;color:var(--cream)">Player</div><div style="font-size:10px;color:' + item.preview + ';font-style:italic">' + item.name + '</div></div>';
    }

    h += '<div style="font-size:12px;font-weight:700;color:var(--cream)">' + item.name + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);margin-top:2px;line-height:1.3">' + item.desc + '</div>';

    if (item.reserved) {
      h += '<div style="margin-top:8px;font-size:9px;font-weight:600;color:var(--muted2);letter-spacing:.5px;padding:6px;background:var(--bg3);border-radius:var(--radius)">RESERVED</div>';
    } else if (isOwned && equipped) {
      h += '<div style="margin-top:8px;font-size:9px;font-weight:700;color:var(--gold);letter-spacing:.5px;padding:6px;background:rgba(var(--gold-rgb),.08);border-radius:var(--radius)">EQUIPPED</div>';
    } else if (isOwned) {
      h += '<button class="btn-sm green" onclick="equipCosmetic(\'' + item.id + '\',\'' + item.cat + '\')" style="margin-top:8px;width:100%;font-size:10px;padding:8px">Equip</button>';
    } else if (canAfford) {
      h += '<button class="btn-sm" onclick="purchaseCosmetic(\'' + item.id + '\')" style="margin-top:8px;width:100%;font-size:10px;padding:8px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.2);color:var(--gold)"><svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="10" cy="10" r="8"/></svg> ' + item.price + '</button>';
    } else {
      h += '<div style="margin-top:8px;font-size:10px;color:var(--muted2);padding:6px"><svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="10" cy="10" r="8"/></svg> ' + item.price + ' <span style="font-size:8px">(need ' + (item.price - balance) + ' more)</span></div>';
    }

    h += '</div>';
  });
  h += '</div>';

  h += '<div style="text-align:center;padding:16px;font-size:9px;color:var(--muted2);line-height:1.5">ParCoins are cosmetic-only with zero real-world cash value.<br>Earn coins by playing rounds, practicing, and competing.</div>';

  document.querySelector('[data-page="shop"]').innerHTML = h;
});

function purchaseCosmetic(itemId) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var item = COSMETICS_CATALOG.find(function(c) { return c.id === itemId; });
  if (!item) return;

  var balance = getParCoinBalance(currentUser.uid);
  if (balance < item.price) { Router.toast("Not enough ParCoins"); return; }

  // Deduct coins
  db.collection("members").doc(currentUser.uid).update({
    parcoins: firebase.firestore.FieldValue.increment(-item.price),
    ownedCosmetics: firebase.firestore.FieldValue.arrayUnion(itemId)
  }).then(function() {
    if (currentProfile) {
      currentProfile.parcoins = (currentProfile.parcoins || 0) - item.price;
      if (!currentProfile.ownedCosmetics) currentProfile.ownedCosmetics = [];
      currentProfile.ownedCosmetics.push(itemId);
    }
    // Log transaction (negative = spend)
    db.collection("parcoin_transactions").add({
      uid: currentUser.uid,
      amount: -item.price,
      reason: "purchase",
      label: "Purchased: " + item.name,
      createdAt: fsTimestamp()
    }).catch(function(){});
    Router.toast("Unlocked " + item.name + "!");
    Router.go("shop", {}, true);
  }).catch(function(err) { Router.toast("Purchase failed: " + err.message); });
}

function equipCosmetic(itemId, cat) {
  if (!currentUser || !db) return;
  var equipped = (currentProfile && currentProfile.equippedCosmetics) || {};
  var item = COSMETICS_CATALOG.find(function(c) { return c.id === itemId; });
  if (equipped[cat] === itemId) {
    // Unequip
    equipped[cat] = null;
  } else {
    equipped[cat] = itemId;
  }
  var updates = { equippedCosmetics: equipped };
  // For titles, also write to equippedTitle field for backward compat
  if (cat === "title" && item) {
    updates.equippedTitle = equipped[cat] ? item.name : (currentProfile.title || "Member");
  }
  db.collection("members").doc(currentUser.uid).set(updates, { merge: true }).catch(function(){});
  if (currentProfile) {
    currentProfile.equippedCosmetics = equipped;
    if (cat === "title" && item) currentProfile.equippedTitle = equipped[cat] ? item.name : (currentProfile.title || "Member");
  }
  Router.toast(equipped[cat] ? "Equipped!" : "Unequipped");
  updateProfileBar();
  Router.go("shop", {}, true);
}
