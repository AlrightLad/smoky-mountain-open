/* ================================================
   PAGE: COSMETICS SHOP — Spend ParCoins on cosmetics
   Categories: Profile Borders, Banners, Card Themes
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

var COSMETICS_CATALOG = [
  // ── PROFILE RINGS — Basic: 100-200, Mid: 300-500, Premium: 750-1500, Ultra: 2000+ ──
  {id:"border_default_gold",cat:"border",name:"Classic Gold",      price:0,   desc:"The default Parbaugh gold, free for all members",  css:"2px solid #c9a84c",  preview:"#c9a84c"},
  {id:"border_bronze",     cat:"border", name:"Bronze Ring",       price:100, desc:"Subtle bronze glow",       css:"2px solid #CD7F32",          preview:"#CD7F32"},
  {id:"border_silver",     cat:"border", name:"Silver Ring",       price:150, desc:"Clean silver finish",       css:"2px solid #C0C0C0",          preview:"#C0C0C0"},
  {id:"border_birdie",     cat:"border", name:"Birdie Green",      price:150, desc:"Glowing green for under-par energy", css:"3px solid #4ade80",  preview:"#4ade80"},
  {id:"border_ice",        cat:"border", name:"Ice Blue",          price:150, desc:"Cool arctic blue edge",              css:"3px solid #38bdf8",    preview:"#38bdf8"},
  {id:"border_rose",       cat:"border", name:"Rose Gold",         price:200, desc:"Elegant rose gold tone",    css:"3px solid #e8a0bf",          preview:"#e8a0bf"},
  {id:"border_flame",      cat:"border", name:"Flame Ring",         price:200, desc:"Warm camo-paired flame glow",           css:"3px solid #d4943c",   preview:"#d4943c"},
  {id:"border_gold",       cat:"border", name:"Gold Ring",         price:300, desc:"Premium gold band",         css:"3px solid #c9a84c",          preview:"#c9a84c"},
  {id:"border_fire",       cat:"border", name:"Fire Ring",         price:300, desc:"Hot orange glow",           css:"3px solid #ff6b35",          preview:"#ff6b35"},
  {id:"border_emerald",    cat:"border", name:"Emerald Ring",      price:300, desc:"Deep green prestige",       css:"3px solid #50c878",          preview:"#50c878"},
  {id:"border_champ_red",  cat:"border", name:"Championship Red",  price:300, desc:"Bold crimson, champion vibes",      css:"3px solid #d4243c",   preview:"#d4243c"},
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
  {id:"banner_default",    cat:"banner", name:"Theme Default",     price:0,   desc:"Uses your active theme gradient, free for all",  css:"linear-gradient(180deg,var(--grad-hero),var(--bg))", preview:"var(--gold)"},
  {id:"banner_classic",    cat:"banner", name:"Classic Pinstripe", price:100, desc:"Charcoal with gold pinstripe, pairs with Classic",    css:"linear-gradient(180deg,#0e1118 0%,#1a1f2c 50%,#0e1118 100%)", preview:"#0e1118"},
  {id:"banner_flagstick",  cat:"banner", name:"Flagstick",        price:100, desc:"Silhouette gradient, works on any theme",               css:"linear-gradient(180deg,#1a2840,#0e1118,#1a2840)", preview:"#1a2840"},
  {id:"banner_sunset",     cat:"banner", name:"Sunset Fairway",    price:150, desc:"Warm orange-pink gradient", css:"linear-gradient(135deg,#ff6b35,#e8729a)", preview:"#ff6b35"},
  {id:"banner_ocean",      cat:"banner", name:"Ocean Drive",       price:150, desc:"Cool blue-teal sweep",      css:"linear-gradient(135deg,#2563eb,#06b6d4)", preview:"#2563eb"},
  {id:"banner_midnight",   cat:"banner", name:"Midnight Green",    price:150, desc:"Dark green Augusta vibe",   css:"linear-gradient(135deg,#064e3b,#059669)", preview:"#064e3b"},
  {id:"banner_arctic",     cat:"banner", name:"Arctic Dawn",      price:150, desc:"Icy white-blue morning",    css:"linear-gradient(135deg,#e0f2fe,#7dd3fc)", preview:"#7dd3fc"},
  {id:"banner_pine",       cat:"banner", name:"Pine Forest",      price:150, desc:"Deep forest green fade",    css:"linear-gradient(135deg,#1a3a2a,#2d6a4f)", preview:"#1a3a2a"},
  {id:"banner_camo_pair",  cat:"banner", name:"Woodland Camo",    price:200, desc:"Olive and shadow, pairs with Camo",                   css:"linear-gradient(135deg,#12140e,#2e3122,#181a12)", preview:"#12140e"},
  {id:"banner_masters_pair",cat:"banner", name:"Augusta Green",   price:200, desc:"Deep green with yellow trim, pairs with Masters",      css:"linear-gradient(135deg,#071a10,#0c2218,#1a3a28)", preview:"#071a10"},
  {id:"banner_azalea_pair",cat:"banner", name:"Bloom Garden",     price:200, desc:"Dark with pink accents, pairs with Azalea",            css:"linear-gradient(135deg,#0e1118,#1a0e18,#0e1118)", preview:"#1a0e18"},
  {id:"banner_usga_pair",  cat:"banner", name:"Navy Stripe",      price:200, desc:"Institutional navy, pairs with USGA",                  css:"linear-gradient(135deg,#0a1628,#142640,#0a1628)", preview:"#0a1628"},
  {id:"banner_dark_pair",  cat:"banner", name:"Carbon Fiber",     price:200, desc:"Pure black with silver edge, pairs with Dark",          css:"linear-gradient(135deg,#000000,#141414,#000000)", preview:"#000000"},
  {id:"banner_light_pair", cat:"banner", name:"Linen & Gold",     price:200, desc:"Warm cream with gold accent, pairs with Light",         css:"linear-gradient(135deg,#f5f3ee,#eceae4,#f5f3ee)", preview:"#f5f3ee"},
  {id:"banner_storm",      cat:"banner", name:"Thunder Storm",     price:300, desc:"Deep purple-gray power",    css:"linear-gradient(135deg,#581c87,#374151)", preview:"#581c87"},
  {id:"banner_crimson",    cat:"banner", name:"Crimson Tide",     price:300, desc:"Bold red-to-black power",   css:"linear-gradient(135deg,#991b1b,#1f1f1f)", preview:"#991b1b"},
  {id:"banner_ember",      cat:"banner", name:"Ember Glow",       price:300, desc:"Warm amber to deep red",    css:"linear-gradient(135deg,#f59e0b,#b91c1c)", preview:"#f59e0b"},
  {id:"banner_champ_pair", cat:"banner", name:"Burgundy Leather", price:300, desc:"Championship leather, pairs with Sunday Red",           css:"linear-gradient(135deg,#10080a,#301c22,#10080a)", preview:"#10080a"},
  {id:"banner_mountain",   cat:"banner", name:"Mountain Range",   price:300, desc:"Golf trip mountain skyline vibes",                       css:"linear-gradient(180deg,#0f172a,#1e3a5f,#0f172a)", preview:"#0f172a"},
  {id:"banner_fairway",    cat:"banner", name:"Fairway Aerial",   price:300, desc:"Top-down fairway pattern",                               css:"linear-gradient(135deg,#064e3b,#0a7c5a,#064e3b)", preview:"#064e3b"},
  {id:"banner_gold_rush",  cat:"banner", name:"Gold Rush",         price:500, desc:"Rich gold gradient",        css:"linear-gradient(135deg,#92400e,#f59e0b)", preview:"#92400e"},
  {id:"banner_golden_hr",  cat:"banner", name:"Golden Hour",      price:500, desc:"Sunset gradient, warm amber to deep navy",              css:"linear-gradient(180deg,#f59e0b,#c2410c,#1e1b4b)", preview:"#f59e0b"},

  // ── CARD THEMES — Mid-tier: 300-500. Each DRAMATICALLY different from default. ──
  {id:"card_neon",         cat:"card", name:"Neon Glow",           price:300, desc:"Bright green edge that pops",             css:"border-left:4px solid #4ade80;background:linear-gradient(90deg,rgba(74,222,128,.06),transparent 40%)", preview:"#4ade80"},
  {id:"card_royal",        cat:"card", name:"Royal Purple",        price:300, desc:"Purple accent with regal tint",           css:"border-left:4px solid #a78bfa;background:linear-gradient(90deg,rgba(167,139,250,.06),transparent 40%)", preview:"#a78bfa"},
  {id:"card_birdie",       cat:"card", name:"Birdie Green",       price:300, desc:"Green energy for under-par rounds",        css:"border-left:4px solid #22c55e;background:linear-gradient(90deg,rgba(34,197,94,.06),transparent 40%)", preview:"#22c55e"},
  {id:"card_vintage",      cat:"card", name:"Vintage Parchment",  price:300, desc:"Old-school scorecard warmth",              css:"border-left:4px solid #c4a97d;background:linear-gradient(90deg,rgba(196,169,125,.08),transparent 40%)", preview:"#c4a97d"},
  {id:"card_fire",         cat:"card", name:"Hot Shot",            price:400, desc:"Red-orange fire edge with heat tint",      css:"border-left:4px solid #ef4444;background:linear-gradient(90deg,rgba(239,68,68,.07),transparent 40%)", preview:"#ef4444"},
  {id:"card_ice",          cat:"card", name:"Ice Cold",            price:400, desc:"Cool blue frost with icy tint",            css:"border-left:4px solid #38bdf8;background:linear-gradient(90deg,rgba(56,189,248,.06),transparent 40%)", preview:"#38bdf8"},
  {id:"card_stealth",      cat:"card", name:"Stealth Mode",       price:400, desc:"Dark charcoal, subtle but sharp",         css:"border-left:4px solid #374151;background:linear-gradient(90deg,rgba(55,65,81,.1),transparent 40%)", preview:"#555555"},
  {id:"card_sunset",       cat:"card", name:"Sunset Strip",       price:400, desc:"Warm amber glow on your rounds",           css:"border-left:4px solid #f97316;background:linear-gradient(90deg,rgba(249,115,22,.07),transparent 40%)", preview:"#f97316"},
  {id:"card_birdie_streak",cat:"card", name:"Birdie Streak",      price:400, desc:"Electric green for under-par runs",        css:"border-left:4px solid #22d65e;background:linear-gradient(90deg,rgba(34,214,94,.07),transparent 40%)", preview:"#22d65e"},
  {id:"card_neon_night",   cat:"card", name:"Neon Night",         price:400, desc:"Hot pink neon glow on dark",               css:"border-left:4px solid #ff00ff;background:linear-gradient(90deg,rgba(255,0,255,.06),transparent 40%)", preview:"#ff00ff"},
  {id:"card_dark_carbon",  cat:"card", name:"Dark Carbon",        price:500, desc:"Matte carbon fiber edge, ultimate stealth",css:"border-left:4px solid #1a1a1a;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent 30%)", preview:"#444444"},
  {id:"card_augusta",      cat:"card", name:"Augusta Green",      price:500, desc:"Deep Masters green prestige",              css:"border-left:4px solid #006633;background:linear-gradient(90deg,rgba(0,102,51,.08),transparent 40%)", preview:"#006633"},
  {id:"card_gold_foil",    cat:"card", name:"Gold Foil",          price:500, desc:"Luxe metallic gold edge with shimmer, the ultimate flex", css:"border-left:4px solid #c9a84c;background:linear-gradient(90deg,rgba(201,168,76,.12),rgba(223,192,106,.05) 50%,transparent)", preview:"#c9a84c"},

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
  {id:"title_road_warrior",  cat:"title", name:"Road Warrior",        price:300, desc:"Plays everywhere, never the same course twice",  css:"", preview:"var(--gold)"},
  {id:"title_iron_will",     cat:"title", name:"Iron Will",           price:300, desc:"Bounces back from every bad hole",                css:"", preview:"#6b7280"},
  {id:"title_sharpshooter",  cat:"title", name:"Sharpshooter",       price:400, desc:"Precision approach game, deadly accurate",       css:"", preview:"var(--gold)"},
  {id:"title_hot_streak",    cat:"title", name:"Hot Streak",          price:400, desc:"On fire lately, rounds keep getting better",     css:"", preview:"#ef4444"},
  {id:"title_sandbagger",    cat:"title", name:"Sandbagger",          price:500, desc:"Handicap says 25, plays like a 15. We see you.", css:"", preview:"var(--gold)"},
  {id:"title_course_legend", cat:"title", name:"Course Legend",       price:500, desc:"Owns a course, everyone knows your name there", css:"", preview:"var(--gold)"},
  {id:"title_big_spender",   cat:"title", name:"Big Spender",         price:750, desc:"ParCoins flow like water from your wallet",       css:"", preview:"var(--gold)"},
  {id:"title_the_ace",       cat:"title", name:"The Ace",             price:0,   desc:"Reserved, awarded for a hole-in-one",            css:"", preview:"#FFD700", reserved:true},
  {id:"title_founding_four", cat:"title", name:"The Original Four",   price:0,   desc:"Reserved, founding members only",                css:"", preview:"var(--gold)", reserved:true},
  {id:"title_commissioner",  cat:"title", name:"The Commissioner",    price:0,   desc:"Reserved, league commissioner only",             css:"", preview:"var(--gold)", reserved:true}
];

// ══ THE PRO SHOP CATALOG (v8.24.50, founder-approved PC-01..PC-25) ══════
// Objects with stories, not paint. tier: range|proshop|locker|cabinet|commem.
// arriving:true = on the shelf, visibly desired, not yet purchasable (its
// render surface ships next; we never sell what doesn't render — P9).
// earnedBy = Trophy Cabinet (never for sale). PC-23 Crest Foundry ships with
// its editor (deferred — not listed until it works).
var PRO_SHOP_CATALOG = [
  // A · Avatar rings — ornamental, render via ringClass (live now)
  {id:"pc01_gallery_rope", cat:"border", tier:"proshop", name:"The Gallery Rope", price:400, ringClass:"ring-gallery-rope", preview:"#b8a87e", desc:"Braided cream rope with brass stanchions at the compass points. You're the one they came to watch."},
  {id:"pc02_fescue",       cat:"border", tier:"locker",  name:"Fescue",          price:600, ringClass:"ring-fescue", preview:"#b9a04b", desc:"Wispy golden fescue grows around the bottom arc, swaying slow. Links golf, in a circle."},
  {id:"pc03_fried_egg",    cat:"border", tier:"proshop", name:"Fried Egg",       price:300, ringClass:"ring-fried-egg", preview:"#d9c389", desc:"Half-buried in bunker sand, a lip of splash frozen mid-blast. Own your lies."},
  {id:"pc04_claret",       cat:"border", tier:"cabinet", name:"The Claret",      price:1500, ringClass:"ring-claret", preview:"#cfd2d6", desc:"Engraved trophy silver with a jug-handle flourish; a light sweep crosses the engraving."},
  // B · Nameplates — NEW surface, arriving (renders next ship)
  {id:"pc05_locker_brass", cat:"nameplate", tier:"locker", name:"Locker Brass", price:500, preview:"#caa75c", desc:"Brushed brass behind your name, engraved serif, two screw heads. Your locker, everywhere."},
  {id:"pc06_yardage_book", cat:"nameplate", tier:"proshop", name:"The Yardage Book", price:350, preview:"#d8d2c0", desc:"Graph paper, a hand-sketched green contour, a penciled carry number fading behind your name."},
  {id:"pc07_leaderboard_sunday", cat:"nameplate", tier:"locker", name:"Leaderboard Sunday", price:750, preview:"#1d3a2a", desc:"Hand-set white letters on deep green, straight off the manual board. Sunday at a major, every day."},
  // C · Scorecard skins — render via getPlayerCardCss (live now)
  {id:"pc08_pencil_parchment", cat:"card", tier:"proshop", name:"Pencil & Parchment", price:400, preview:"#cabd98", css:"border:1px solid #c2b48c;border-left:4px solid #b3a378;background:linear-gradient(0deg,rgba(202,189,152,.12),rgba(232,224,196,.16)),repeating-linear-gradient(0deg,transparent 0 7px,rgba(150,135,95,.07) 7px 8px)", desc:"Vintage paper stock, dot-grid rules, your numbers in pencil grey."},
  {id:"pc09_member_guest", cat:"card", tier:"locker", name:"The Member-Guest", price:500, preview:"#e9dfc4", css:"border-top:3px double rgba(180,137,62,.85);border-bottom:3px double rgba(180,137,62,.85);background:linear-gradient(180deg,rgba(244,238,220,.16),rgba(233,223,196,.1))", desc:"Cream card, double brass rules, your league's name as a pale watermark."},
  {id:"pc10_major_sunday", cat:"card", tier:"locker", name:"Major Sunday", price:900, preview:"#0d2818", css:"border-left:6px solid #0d2818;background:linear-gradient(90deg,rgba(13,40,24,.2),rgba(13,40,24,.05) 55%,transparent)", desc:"Broadcast lower-third styling: deep-green chyron bars. Your 92 never looked so televised."},
  // D · Feed flair — NEW surface, arriving
  {id:"pc11_tap_in_tip",   cat:"flair", tier:"proshop", name:"Tap-In Tip", price:300, arriving:true, preview:"#caa75c", desc:"Your reactions land as a brass ball-marker stamp with a tiny press."},
  {id:"pc12_birdie_drop",  cat:"flair", tier:"locker", name:"Birdie Drop", price:600, arriving:true, preview:"#3f7d4e", desc:"Under-par rounds: a ball drops into the cup on your feed card. One bounce, rattle, done."},
  {id:"pc13_gallery_roar", cat:"flair", tier:"locker", name:"The Gallery Roar", price:750, arriving:true, preview:"#b4893e", desc:"Personal bests: a hat-tip ripple and a short polite-applause burst on first view."},
  // E · Titles + the Engraving (plate renders live now)
  {id:"pc14_engraving",    cat:"title", tier:"proshop", name:"The Engraving", price:400, plate:true, preview:"#caa75c", desc:"Your equipped title renders as a small engraved brass plate instead of italic text. Applies to any title you own."},
  {id:"pc15_cart_path",    cat:"title", tier:"range", name:"Cart Path Only", price:250, preview:"#8a8674", desc:"For the member whose ball has seen more concrete than fairway. Worn with pride or not at all."},
  {id:"pc16_postman",      cat:"title", tier:"proshop", name:"The Postman", price:400, preview:"#b4893e", desc:"Posts every round. Rain, shame, or triple bogey — always delivers."},
  // F · Tee markers — NEW surface, arriving
  {id:"pc17_brass_acorn",  cat:"teemarker", tier:"range", name:"Brass Acorn", price:200, preview:"#caa75c", desc:"The classic club tee marker, polished. Says you've been here a while."},
  {id:"pc18_rubber_duck",  cat:"teemarker", tier:"proshop", name:"Rubber Duck", price:350, preview:"#e8c84a", desc:"A small yellow duck. For the member with a documented relationship with water."},
  {id:"pc19_persimmon",    cat:"teemarker", tier:"proshop", name:"Persimmon", price:350, preview:"#7a4a28", desc:"A tiny persimmon driver head, brass sole plate, whipping and all. Feel player."},
  {id:"pc20_parbaugh_marker", cat:"teemarker", tier:"locker", name:"The Parbaugh", price:500, preview:"#b4893e", desc:"The league crest cast as a founding-gold marker. Fly the flag."},
  // G · Caddy voice packs — NEW, arriving
  {id:"pc21_old_tom",      cat:"voice", tier:"locker", name:"Old Tom", price:800, arriving:true, preview:"#6f6a5b", desc:"Gruff links wisdom. \"Aye. Intae the wind, that's a three-club day. Swing easy.\""},
  {id:"pc22_bag_room",     cat:"voice", tier:"locker", name:"Bag Room Guy", price:800, arriving:true, preview:"#6f6a5b", desc:"The heckling friend. \"Big number brewing on 14? Prove me wrong, I'd love that.\""},
  // I · Trophy Cabinet — commemorative, never for sale
  {id:"pc24_green_jacket", cat:"border", tier:"commem", name:"The Green Jacket", price:0, earnedBy:"Season champion only", ringClass:"", preview:"#1d3a2a", desc:"Deep-green wool ring, three small brass buttons, your championship year engraved at six o'clock."},
  {id:"pc25_ace_marker",   cat:"teemarker", tier:"commem", name:"Ace Marker", price:0, earnedBy:"Hole-in-one only", preview:"#e9d9ae", desc:"A gold ball on a brass pedestal, date engraved. There is no second way to get this, and everyone knows it."},

  // ══ NEXT WAVE (v8.24.57, PC-26..43) — prestige register: brass, leather,
  // parchment, engraving + in-group golf humor. Research: proshop-nextwave-
  // 2026-06-11.md. Ball-marker is the one new surface (rides teemarker-style
  // render on the name). Flair items stay arriving (render surface pending).
  // J · BALL MARKERS — new surface, the most-coveted real pro-shop object
  {id:"pc26_found_coin",   cat:"ball", tier:"range",   name:"Found Coin",     price:200, preview:"#b58a3a", desc:"A weathered brass penny you marked with on a whim and never stopped. Milled-edge, worn smooth."},
  {id:"pc27_pitch_mark",   cat:"ball", tier:"proshop", name:"Pitch-Mark",     price:350, preview:"#cfd2d6", desc:"Milled silver, a crosshair engraved dead center. Reads your line for you. Allegedly."},
  {id:"pc43_ctp_marker",   cat:"ball", tier:"commem",  name:"Closest to the Pin", price:0, earnedBy:"Season closest-to-pin leader", preview:"#b58a3a", desc:"Brass disc, a flagstick struck clean through it. Earned on the green, never in the shop."},
  // A · RINGS (live)
  {id:"pc39_wax_seal",     cat:"border", tier:"locker", name:"The Wax Seal",   price:900, ringClass:"ring-wax-seal", preview:"#7a2e2e", desc:"A claret wax seal pressed at six o'clock, a ribbon tail beneath. Correspondence from the committee."},
  {id:"pc40_hickory_brass",cat:"border", tier:"locker", name:"Hickory & Brass",price:700, ringClass:"ring-hickory", preview:"#7a4a28", desc:"Hickory-grain wood ringed in brass ferrule. The shaft they played before steel was legal."},
  {id:"pc42_founders_crest",cat:"border",tier:"cabinet",name:"The Founders' Crest",price:1500, ringClass:"ring-claret", preview:"#cfd2d6", desc:"The crest in relief inside an engraved-silver bezel, a slow light sweeping across it. The priciest ring money can buy — the Green Jacket it is not."},
  // C · SCORECARD SKINS (live)
  {id:"pc28_the_sleeve",   cat:"card", tier:"proshop", retired:true, name:"The Sleeve",      price:300, preview:"#cabd98", css:"border:1px solid #c2b48c;border-left:4px solid #b3a378;background:linear-gradient(160deg,rgba(202,189,152,.16),rgba(232,224,196,.1))", desc:"Kraft three-ball sleeve stock, the flap torn open. Smells like a fresh dozen."},  // v8.25.49 retired — redundant kraft with pc08 Parchment; owned copies still resolve/equip forever
  {id:"pc41_trophy_room",  cat:"card", tier:"locker",  name:"The Trophy Room", price:900, preview:"#5a4632", css:"border-left:5px solid #5a4632;background:linear-gradient(90deg,rgba(90,70,50,.22),rgba(90,70,50,.05) 55%,transparent)", desc:"Walnut-panel ground with an engraved-brass plaque header. The room where the silver lives."},
  // E · TITLES + bag-tag plate (live)
  {id:"pc36_member_tag",   cat:"title", tier:"proshop", name:"Member No. __",  price:500, plate:true, preview:"#7a4a28", desc:"Renders your title as a leather bag tag with a brass rivet. Quietly states you were here early."},
  {id:"pc37_sandbagger",   cat:"title", tier:"range",   name:"The Sandbagger's Confession", price:250, preview:"#8a8674", desc:"\"Said it was a practice round.\" Wears the truth so you don't have to."},
  {id:"pc38_mulligan",     cat:"title", tier:"range",   name:"Mulligan Club",  price:250, preview:"#8a8674", desc:"\"Plays it as it lies. Usually.\" Membership has its privileges, and its breakfast balls."},
  // B · NAMEPLATES (live)
  {id:"pc29_stimp_13",     cat:"nameplate", tier:"proshop", name:"Stimp 13",   price:500, preview:"#1d3a2a", desc:"Bentgrass felt behind your name with a single mown light-stripe. Fast. Don't be above the hole."},
  // D · FEED FLAIR (arriving — render surface pending)
  {id:"pc31_halved",       cat:"flair", tier:"range",   name:"Halved",         price:250, arriving:true, preview:"#b58a3a", desc:"A tied result clinks two crossed flagsticks on the feed card. Nobody lost. Nobody won. Golf."},
  {id:"pc32_sandy",        cat:"flair", tier:"proshop", name:"Sandy",          price:350, arriving:true, preview:"#d9c389", desc:"An up-and-down from the bunker throws a little sand-splash and a one-putt tick. Hardest par in golf."},
  {id:"pc33_snowman",      cat:"flair", tier:"range",   name:"The Snowman",    price:200, arriving:true, preview:"#cfe2d4", desc:"An honest 8 slumps a melting snowman onto the card with a wry 'noted.' Own the blow-up."},
  // F · TEE MARKERS (live)
  {id:"pc34_whipping",     cat:"teemarker", tier:"range", name:"Whipping & Glue", price:250, preview:"#7a4a28", desc:"A hickory butt wrapped in red whipping thread. Old-world, like your short game."},
  // — Founder batch 2026-06-13: 7 new on-brand cosmetics across categories. Ring/
  //   card/nameplate carry worn-render classes (preview==worn); ball/tee/flair use
  //   the existing preview pattern (their categories render off preview/glyph). —
  {id:"pc44_iron_blade",      cat:"border",    tier:"proshop", name:"The Iron Blade", price:450, ringClass:"ring-iron-blade", preview:"#7a6a5c", desc:"Raw iron filed smooth, a single brass rivet at twelve. Duffer or scratch, you earned your swings."},
  {id:"pc45_ledger",          cat:"card",      tier:"range",   name:"The Ledger",     price:200, preview:"#f5f3ee", css:"border:1px solid #e8e4d8;border-left:4px solid #d4cec0;background:linear-gradient(180deg,#faf8f3,#f5f3ee)", desc:"Blank cream ledger stock, a single blue pencil rule up top. No frills. Just score."},
  {id:"pc46_clubhouse_crest", cat:"nameplate", tier:"locker",  name:"The Clubhouse Crest", price:650, preview:"#6b4a28", desc:"Embossed saddle leather, two crossed clubs at the shaft. Founding wood-grain beneath."},
  {id:"pc51_chalk_board",     cat:"nameplate", tier:"range",   name:"The Chalk Board", price:250, preview:"#2a2a2a", desc:"Deep-slate manual-scoreboard chalk, your name in white. Raw honest scoring, no paint."},
  {id:"pc47_quartered_leather", cat:"ball",    tier:"proshop", name:"The Quartered Leather", price:400, preview:"#8a6f55", desc:"A scrap of rich saddle leather, quartered on a brass ring. Hit it straight; mark it well."},
  {id:"pc49_wooden_peg",      cat:"teemarker", tier:"range",   name:"The Wooden Peg", price:150, preview:"#6b4a28", desc:"A hickory dowel snapped clean, branded with a single burn-mark. From the bag on Granddad's cart."},
  {id:"pc50_eagle_soar",      cat:"flair",     tier:"locker",  name:"The Eagle Soar", price:700, arriving:true, preview:"#4a7cb8", desc:"Two-under and a bird bursts off your card with a sharp whistle. Gone in a flash."},
  // — Founder batch 2026-06-13: premium quality-leap pieces (enamel/medallion/
  //   cloisonne/pairing-sheet/sterling). Rings + plate carry worn-render classes
  //   (preview==worn); ball reuses pbMarkerGlyph (56px shop / 12px worn). —
  {id:"pc52_crest_pin",    cat:"border",    tier:"locker",  name:"The Club Pin",     price:850,  ringClass:"ring-crest-pin", preview:"#1f5135", desc:"Hard-enamel cloisonne: crossed clubs on deep clubhouse green, struck in a polished brass bezel. The lapel pin they hand you when you join."},
  {id:"pc53_medallion",    cat:"border",    tier:"cabinet", name:"The Medallion",    price:1400, ringClass:"ring-medallion", preview:"#caa75c", desc:"A struck championship medallion, laurel in relief around the rim, a slow gleam crossing the strike. Heavy in the hand."},
  {id:"pc54_calfskin_tag", cat:"nameplate", tier:"locker",  name:"The Calfskin Tag", price:700,  preview:"#7a4a28", desc:"Pebbled saddle leather, a hard-enamel green roundel riveted at the left, your name embossed deep. The bag tag the caddymaster knows by sight."},
  {id:"pc55_pairing_sheet",cat:"card",      tier:"proshop", name:"The Pairing Sheet",price:450,  preview:"#f2ecda", css:"border:1px solid #d8cfa8;border-left:4px solid #1f5135;background:linear-gradient(0deg,rgba(244,238,214,.18),rgba(252,248,232,.2)),repeating-linear-gradient(0deg,transparent 0 8px,rgba(31,81,53,.06) 8px 9px)", desc:"Tournament-issue pairing sheet: cream stock, a green committee rule down the spine, tee-time grid faint behind your score."},
  {id:"pc56_sterling",     cat:"ball",      tier:"locker",  name:"The Sterling",     price:600,  preview:"#dfe2e6", desc:"A hand-hammered sterling silver marker, a single small sapphire-enamel dot at center. Heirloom weight; you'd mark a six-footer to win with this."}
];
// Legacy items kept ON SALE in the Paint Locker (the best ~15); every other
// legacy item is retired from sale. Owned items are grandfathered forever —
// ownership and equip are untouched by retirement.
var PAINT_LOCKER_KEEP = ["border_pulse_gold","border_shimmer","border_rainbow_shift","border_neon_green","border_crimson_ember","banner_classic","banner_camo_pair","banner_masters_pair","banner_azalea_pair","banner_usga_pair","banner_dark_pair","banner_light_pair","banner_champ_pair","card_gold_foil","card_vintage"];
var PRO_SHOP_TIERS = {
  range:   {label:"Range Bucket"},
  proshop: {label:"Pro Shop"},
  locker:  {label:"Member's Locker"},
  cabinet: {label:"Champion's Cabinet"},
  commem:  {label:"Commemorative"}
};
var PRO_SHOP_SHELVES = [
  {cat:"border",    title:"Rings",          meta:"Worn on your avatar, everywhere"},
  {cat:"nameplate", title:"Nameplates",     meta:"Behind your name, everywhere it appears"},
  {cat:"card",      title:"Scorecard Skins",meta:"Real materials on your round cards"},
  {cat:"flair",     title:"Feed Flair",     meta:"Moments of glory, once per card — arriving"},
  {cat:"title",     title:"Titles",         meta:"Under your name, in your voice"},
  {cat:"ball",      title:"Ball Markers",    meta:"What you mark with on the green"},
  {cat:"teemarker", title:"Tee Markers",    meta:"Your totem, planted beside your name"},
  {cat:"voice",     title:"The Caddy",      meta:"His tone, your pick — arriving"}
];

var COSMETIC_CATS = {
  border: {label: "Rings",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>'},
  banner: {label: "Banners",  icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/></svg>'},
  card:   {label: "Cards",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>'},
  name:   {label: "Names",    icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>'},
  title:  {label: "Titles",   icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 15l-2 5h4l-2-5z"/><path d="M6.5 10L12 3l5.5 7h-11z"/></svg>'}
};

// Retirement pass (v8.24.50): legacy items off the sale floor unless kept in
// the Paint Locker. Owned items stay owned + equippable forever (grandfathered).
COSMETICS_CATALOG.forEach(function(c) {
  if (c.price > 0 && !c.reserved && PAINT_LOCKER_KEEP.indexOf(c.id) === -1) c.retired = true;
});
// Purchase/equip share one lookup across both catalogs.
function shopFindItem(id) {
  return COSMETICS_CATALOG.find(function(c) { return c.id === id; })
      || PRO_SHOP_CATALOG.find(function(c) { return c.id === id; });
}

var _shopCat = "border";

// Economy entry cards — route to existing, live feature pages (P10: real destinations).
var _shopEconomy = [
  {route:"wagers",     name:"Wagers",     desc:"Back yourself against a friend.", icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>'},
  {route:"bounties",   name:"Bounties",   desc:"Post a prize, best round wins.",  icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>'},
  {route:"challenges", name:"Challenges", desc:"Head to head, your terms.",       icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/></svg>'},
  {route:"richlist",   name:"Rich List",  desc:"Who is holding the most.",        icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 18h16"/><path d="M4 18L3 7l5 4 4-7 4 7 5-4-1 11"/></svg>'}
];

// Small inline coin glyph for buy buttons.
var _shopCoinSvg = '<svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" style="flex-shrink:0"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7.5 7.5h4a1.8 1.8 0 010 3.6H7.5"/></svg>';

Router.register("shop", function() {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);
  var lifetime = getParCoinLifetime(uid);
  var owned = (currentProfile && currentProfile.ownedCosmetics) || [];

  // Skip link + editorial masthead (matches roster/HQ pattern)
  var h = '<button type="button" class="roster-skip" onclick="var el=document.getElementById(\'shopCosmetics\');if(el){el.focus();el.scrollIntoView();}">Skip to cosmetics</button>';
  h += '<div class="shop-wrap">';
  h += '<div class="roster-masthead">';
  // v8.24.40 — ParCoin is a platform wallet, not a league ledger; name the
  // platform, not the founding league (wrong label for every other league).
  h += '<div class="roster-eyebrow">THE PRO SHOP · PARBAUGHS</div>';
  h += '<h1 class="roster-headline">Spend it like you earned it.</h1>';
  h += '</div>';

  // 3m.A Wallet hero — brass double-rule balance card
  h += '<section class="shop-wallet" aria-label="Your wallet">';
  h += '<div class="shop-wallet__eyebrow">Your balance</div>';
  h += '<div class="shop-wallet__balance" aria-live="polite" aria-label="Your Parcoin balance, ' + balance + '">' + balance.toLocaleString() + '</div>';
  h += '<div class="shop-wallet__sub">Parcoin' + (lifetime ? ' · ' + lifetime.toLocaleString() + ' earned all-time' : '') + '</div>';
  h += '</section>';

  // 3m.A.2 Recent activity ledger (async, truthful grouped render)
  h += '<section class="shop-ledger" aria-label="Recent activity">';
  h += '<div class="shop-sec-head"><h2 class="shop-sec-title">Recent activity</h2>';
  if (uid) h += '<button type="button" class="shop-sec-link" onclick="Router.go(\'members\',{id:\'' + uid + '\'})">Full history</button>';
  h += '</div>';
  h += '<div id="shopLedger" class="shop-ledger__body"><div class="shop-ledger__loading">Loading activity</div></div>';
  h += '</section>';

  // 3m.A.3 Ways to earn (v8.24.84) — Founder ask: surface HOW to earn ParCoins
  // (incentives), each with its real rate + a destination (P10 actionable). Pure
  // play earns; never real money. Rates mirror PARCOIN_RATES (parcoins.js).
  var _earn = [
    { label: 'Log an 18-hole round', coins: '+50', route: 'rounds' },
    { label: 'Log a 9-hole round', coins: '+25', route: 'rounds' },
    { label: 'Get a round attested', coins: '+25', route: 'rounds' },
    { label: 'Set a new personal best', coins: '+100', route: 'rounds' },
    { label: 'Hit the range (30+ min)', coins: '+10', route: 'activity' },
    { label: 'Win a wager or bounty', coins: 'the pot', route: 'wagers' },
    { label: 'Sign in each day', coins: '+1', route: 'home' }
  ];
  h += '<section class="shop-earn" aria-label="Ways to earn ParCoins">';
  // v8.25.20 — bind "real money" with a non-breaking space so the note never
  // wraps a lone "money" orphan onto a ragged tight second line at the right
  // margin. The phrase wraps as a unit if space is tight (vs nowrap, which
  // could overflow on narrow mobile beside the 30px serif title). A proper
  // width/min-width tightening of .shop-earn__note belongs in shared CSS.
  h += '<div class="shop-sec-head"><h2 class="shop-sec-title">Ways to earn</h2><span class="shop-earn__note">Play earns it — never real money</span></div>';
  h += '<div class="shop-earn__grid">';
  _earn.forEach(function(e) {
    h += '<button type="button" class="shop-earn__row" onclick="Router.go(\'' + e.route + '\')">' +
      '<span class="shop-earn__label">' + escHtml(e.label) + '</span>' +
      '<span class="shop-earn__coins">' + escHtml(e.coins) + '</span></button>';
  });
  h += '</div>';
  h += '<div class="shop-earn__cabinet">Some pieces can’t be bought at all — a hole-in-one, the season crown, closest-to-the-pin. Earn those on the course; they live in the Champion’s Cabinet below.</div>';
  h += '</section>';

  // ══ THE PRO SHOP floor (v8.24.50) ══
  h += '<section class="shop-cosmetics" id="shopCosmetics" tabindex="-1" aria-label="The Pro Shop">';

  var _myAvatar = currentProfile ? Router.getAvatar(currentProfile) : '';
  var _myName = currentProfile ? (currentProfile.username || currentProfile.name || 'You') : 'You';
  var equippedMap = (currentProfile && currentProfile.equippedCosmetics) || {};

  // Distinct golf-moment icon per feed-flair item (24-grid, stroke art).
  function _flairGlyph(id) {
    var p = '';
    switch (id) {
      case 'pc11_tap_in_tip':  p = '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/>'; break; // ball-marker stamp
      case 'pc12_birdie_drop': p = '<path d="M5 9a7 4 0 0014 0"/><circle cx="12" cy="6" r="3"/><path d="M12 9v3"/>'; break; // ball dropping into cup
      case 'pc13_gallery_roar':p = '<path d="M4 14c0-4 3.5-7 8-7s8 3 8 7"/><path d="M7 17l-1.5 2M17 17l1.5 2M12 18v2.5"/>'; break; // applause ripple
      case 'pc31_halved':      p = '<path d="M7 3v18M17 3v18"/><path d="M7 5l5 1.5L7 8M17 9l-5 1.5 5 1.5"/>'; break; // two crossed flagsticks
      case 'pc32_sandy':       p = '<circle cx="12" cy="9" r="3"/><path d="M4 16c2-2 4 1 6-1s4 1 6-1 3 1 4 0"/><path d="M9 5l-1-2M15 5l1-2M6 8L4 7M18 8l2-1"/>'; break; // ball + sand splash
      case 'pc33_snowman':     p = '<circle cx="12" cy="8" r="3.2"/><circle cx="12" cy="15.5" r="4.3"/>'; break; // the honest 8
      default:                 p = '<circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>';
    }
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  // One item card — shared by Front Table, shelves, and the Paint Locker.
  function _proShopCard(item, big) {
    var isOwned = owned.indexOf(item.id) !== -1 || (item.price === 0 && !item.earnedBy);
    var canAfford = balance >= item.price;
    var equipped = equippedMap[item.cat] === item.id || (item.plate && equippedMap.titleplate === item.id);
    var tier = item.tier || (item.price >= 1200 ? 'cabinet' : item.price >= 600 ? 'locker' : item.price >= 300 ? 'proshop' : 'range');
    var c = '<div class="shop-item shop-item--' + tier + (equipped ? ' shop-item--equipped' : '') + '"' + (big ? ' style="grid-row:span 1"' : '') + '>';
    c += '<div class="shop-tier-chip shop-tier-chip--' + tier + '">' + (PRO_SHOP_TIERS[tier] ? PRO_SHOP_TIERS[tier].label : tier) + '</div>';
    // v8.24.86 — NEW badge on the latest-wave pieces (pc26+), an honest
    // curation/freshness cue (they ARE the newest in the catalog).
    var _pcNum = (/^pc(\d+)_/.exec(item.id) || [])[1];
    if (_pcNum && +_pcNum >= 26 && !item.earnedBy) c += '<div class="shop-item__new">NEW</div>';
    // preview
    if (item.cat === 'border') {
      var ringCss = item.ringClass ? '' : 'border:' + (item.css || '3px solid ' + item.preview);
      // v8.25.42 — showcase the ring as a real object: 104px (was a cramped 56px
      // that hid the rope studs / fescue / claret sweep) on a clean brass-tinted
      // ground, the SAME worn .ring-* class so the preview matches what you equip.
      c += '<div class="shop-ring-stage"><div class="' + (item.ringClass || '') + '" style="width:104px;height:104px;border-radius:50%;' + ringCss + ';display:flex;align-items:center;justify-content:center;position:relative">' + (_myAvatar ? '<div style="width:82px;height:82px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center">' + _myAvatar + '</div>' : '<div class="shop-ring-core"></div>') + '</div></div>';
    } else if (item.cat === 'nameplate') {
      // v8.25.43 — reuse the WORN .plate-* class (preview == worn), centered on a
      // clean surface stage, instead of a hardcoded inline approximation.
      var _npCls = { pc05_locker_brass: 'plate-locker-brass', pc06_yardage_book: 'plate-yardage', pc07_leaderboard_sunday: 'plate-sunday', pc29_stimp_13: 'plate-stimp', pc46_clubhouse_crest: 'plate-clubhouse-crest', pc51_chalk_board: 'plate-chalk-board', pc54_calfskin_tag: 'plate-calfskin-tag' }[item.id] || 'plate-locker-brass';
      c += '<div class="shop-surface-stage"><span class="shop-plate-name ' + _npCls + '">' + escHtml(_myName) + '</span></div>';
    } else if (item.cat === 'card') {
      c += '<div style="border-radius:var(--radius);background:var(--bg3);margin-bottom:8px;padding:8px 10px;text-align:left;' + (item.css || '') + '"><div style="font-size:9px;font-weight:600;color:var(--cream)">' + escHtml(_myName) + '</div><div style="font-size:8px;color:var(--muted);margin-top:1px">Honey Run · 92</div></div>';
    } else if (item.cat === 'flair') {
      // v8.24.68 — distinct golf-moment icon per flair (was one generic
      // sparkle for all). Flair stays "arriving" until its feed-card render
      // ships, but the shelf shouldn't look like six copies of one item.
      c += '<div class="shop-surface-stage"><span style="display:flex;align-items:center;justify-content:center;color:' + item.preview + ';font-size:30px">' + _flairGlyph(item.id) + '</span></div>';
    } else if (item.cat === 'teemarker' || item.cat === 'ball') {
      // v8.24.68 — render the real golf-art glyph (shared with the worn-on-
      // name render via pbMarkerGlyph), not a generic tinted dot. Falls back
      // to the dot only if an item has no art yet.
      var _mg = (typeof pbMarkerGlyph === 'function') ? pbMarkerGlyph(item.id, 56) : '';
      c += '<div class="shop-surface-stage">' + (_mg || '<span style="width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,' + item.preview + ',rgba(0,0,0,.35));box-shadow:0 3px 4px -2px rgba(0,0,0,.5)"></span>') + '</div>';
    } else if (item.cat === 'voice') {
      c += '<div style="height:34px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:16px">⛳</div>';
    } else if (item.cat === 'title') {
      // v8.24.76 — pc36 previews as its leather bag tag (was the same brass
      // plate as pc14, so the two priciest title plates looked identical).
      var _plateCls = item.id === 'pc36_member_tag' ? 'title-tag-leather' : 'title-engraved';
      var _plateText = item.id === 'pc36_member_tag' ? 'Member No. 7' : 'Grinder';
      // v8.24.77 — plain titles now render as a struck engraved chip (was flat
      // italic text — identical for every title). pc15/37/38 get a glyph.
      var _tMod = item.id === 'pc15_cart_path' ? ' title-plain--road' : item.id === 'pc37_sandbagger' ? ' title-plain--wax' : item.id === 'pc38_mulligan' ? ' title-plain--coin' : '';
      var _titleEl = item.plate
        ? '<span class="' + _plateCls + '">' + _plateText + '</span>'
        : '<span class="title-plain' + _tMod + '" style="--ti:' + item.preview + '">' + escHtml(item.name) + '</span>';
      c += '<div style="padding:4px 0 8px;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="font-size:12px;font-weight:700;color:var(--cream)">' + escHtml(_myName) + '</div>' + _titleEl + '</div>';
    }
    c += '<div class="shop-item__name">' + item.name + '</div>';
    c += '<div class="shop-item__desc">' + item.desc + '</div>';
    // v8.25.8 — "Try it on" (Founder: "shop should allow for preview as well").
    // Opens a full-size preview of the piece applied to the member's own avatar /
    // name / card before any coins are spent. Shown for everything with a real
    // preview (skip earned-only honors — they're not browseable purchases).
    if (!item.earnedBy) {
      c += '<button type="button" class="shop-item__tryon" onclick="shopPreviewCosmetic(\'' + item.id + '\')" aria-label="Preview ' + escHtml(item.name) + ' on your profile" style="background:none;border:none;color:var(--cb-brass,var(--gold));font-size:10px;font-weight:600;letter-spacing:.4px;cursor:pointer;padding:0 0 6px;text-decoration:underline;text-underline-offset:2px">Try it on</button>';
    }
    if (item.earnedBy) {
      c += '<div class="shop-cabinet__earn">' + item.earnedBy + '. Not for sale.</div>';
    } else if (item.arriving) {
      c += '<div class="shop-item__state shop-item__state--arriving">Arriving</div>';
    } else if (isOwned && equipped) {
      c += '<div class="shop-item__state shop-item__state--equipped">Equipped</div>';
    } else if (isOwned) {
      c += '<button class="shop-item__equip" onclick="equipCosmetic(\'' + item.id + '\',\'' + (item.plate ? 'titleplate' : item.cat) + '\')">Equip</button>';
    } else if (canAfford) {
      c += '<button class="shop-item__buy" onclick="purchaseCosmetic(\'' + item.id + '\')">' + _shopCoinSvg + ' ' + item.price + '</button>';
    } else {
      c += '<div class="shop-item__state shop-item__state--locked">' + item.price + ' · need ' + (item.price - balance) + ' more</div>';
    }
    c += '</div>';
    return c;
  }

  // ── The Front Table — deterministic weekly rotation (ISO week) over the
  //    purchasable new catalog; same table for every member all week.
  var _sellable = PRO_SHOP_CATALOG.filter(function(i) { return !i.arriving && !i.earnedBy; });
  var _now = new Date();
  var _week = Math.floor((_now - new Date(_now.getFullYear(), 0, 1)) / 604800000);
  var _heroIdx = _week % _sellable.length;
  h += '<div class="shop-front-table"><div class="shop-front-table__eyebrow">The Front Table · this week</div><div class="shop-front-table__grid">';
  h += _proShopCard(_sellable[_heroIdx], true);
  h += '<div style="display:grid;gap:10px">';
  for (var fp = 1; fp <= 2; fp++) h += _proShopCard(_sellable[(_heroIdx + fp) % _sellable.length]);
  h += '</div></div></div>';

  // v8.25.45 — rarity legend so the tier chips read as a ladder (Founder: "what's
  // the difference between Pro Shop / Member's Locker / Champion's Cabinet / Range
  // Bucket — they're the rarities"). Each shelf is now sorted to match this order.
  h += '<div class="shop-rarity-legend">Rarity climbs left → right: <b>Range Bucket</b> → <b>Pro Shop</b> → <b>Member’s Locker</b> → <b>Champion’s Cabinet</b></div>';

  // ── Category shelves ──
  PRO_SHOP_SHELVES.forEach(function(shelf) {
    // v8.25.46 — Caddies render from the SAME source as Settings (window.pbCaddies)
    // so the shop matches Settings exactly (Founder: "caddies in shop the same as
    // settings — currently they don't match"). 3 are free/included; Bag Room Guy is
    // the one unlockable. Selection/unlock happens in Settings where the picker is.
    if (shelf.cat === 'voice') {
      var caddies = (typeof window !== 'undefined' && window.pbCaddies) ? window.pbCaddies : [];
      if (!caddies.length) return;
      h += '<div class="shop-shelf"><div class="shop-shelf__head"><span class="shop-shelf__title">Caddies</span><span class="shop-shelf__meta">Your voice on the course — choose in Settings</span></div>';
      h += '<div class="shop-shelf__rail">';
      caddies.forEach(function(cd) {
        var skuItem = cd.sku ? PRO_SHOP_CATALOG.filter(function(i) { return i.id === cd.sku; })[0] : null;
        var c = '<div class="shop-item shop-item--proshop">';
        c += '<div class="shop-tier-chip shop-tier-chip--proshop">Caddy</div>';
        c += '<div class="shop-surface-stage"><span style="font-size:30px" aria-hidden="true">⛳</span></div>';
        c += '<div class="shop-item__name">' + escHtml(cd.name) + '</div>';
        c += '<div class="shop-item__desc">' + escHtml(cd.blurb || '') + '</div>';
        if (!cd.locked) c += '<button class="shop-item__equip" onclick="Router.go(\'settings\')">Included · choose in Settings</button>';
        else c += '<button class="shop-item__buy" onclick="Router.go(\'settings\')">' + (skuItem && skuItem.price ? 'Unlock · ' + skuItem.price + ' coins' : 'Unlock in Settings') + '</button>';
        c += '</div>';
        h += c;
      });
      h += '</div></div>';
      return;
    }
    var items = PRO_SHOP_CATALOG.filter(function(i) { return i.cat === shelf.cat && !i.earnedBy && !i.retired; });
    if (!items.length) return;
    // v8.25.45 — sort each shelf LOWEST→HIGHEST rarity (Founder: the tiers ARE the
    // rarity ladder — show the progression). range < proshop < locker < cabinet;
    // ties break by price so cheaper pieces of a tier come first.
    var _tr = { range: 0, proshop: 1, locker: 2, cabinet: 3, commem: 4 };
    items.sort(function(a, b) { return (_tr[a.tier] == null ? 1 : _tr[a.tier]) - (_tr[b.tier] == null ? 1 : _tr[b.tier]) || (a.price || 0) - (b.price || 0); });
    h += '<div class="shop-shelf"><div class="shop-shelf__head"><span class="shop-shelf__title">' + shelf.title + '</span><span class="shop-shelf__meta">' + shelf.meta + '</span></div>';
    h += '<div class="shop-shelf__rail">';
    items.forEach(function(item) { h += _proShopCard(item); });
    // Titles shelf also carries the legacy purchasable titles (never retired from concept)
    if (shelf.cat === 'title') {
      COSMETICS_CATALOG.filter(function(c) { return c.cat === 'title' && !c.reserved && !c.retired; }).forEach(function(item) { h += _proShopCard(item); });
    }
    h += '</div></div>';
  });

  // ── The Trophy Cabinet — earned-only, glass front, the earn condition is
  //    the whole point (P10: every item states exactly how it's earned).
  h += '<div class="shop-cabinet"><div class="shop-cabinet__eyebrow">The Trophy Cabinet</div><div class="shop-cabinet__title">Cannot be bought. That\'s the point.</div>';
  h += '<div class="shop-shelf__rail">';
  PRO_SHOP_CATALOG.filter(function(i) { return !!i.earnedBy; }).forEach(function(item) {
    h += _proShopCard(item).replace('shop-item--commem', 'shop-item--commem');
  });
  // Reserved legacy titles live here now (they were always earned things)
  COSMETICS_CATALOG.filter(function(c) { return c.reserved; }).forEach(function(item) {
    h += '<div class="shop-item shop-item--commem"><div class="shop-tier-chip shop-tier-chip--commem">Commemorative</div>';
    h += '<div style="padding:8px 0;font-size:11px;color:#cfe2d4;font-style:italic">' + item.name + '</div>';
    h += '<div class="shop-item__name">' + item.name + '</div><div class="shop-item__desc">' + item.desc + '</div>';
    h += '<div class="shop-cabinet__earn">' + item.desc.replace(/^Reserved, /, '') + '. Not for sale.</div></div>';
  });
  h += '</div></div>';

  // ── The Paint Locker — the best of the old catalog, still on sale ──
  var _paint = COSMETICS_CATALOG.filter(function(c) { return !c.retired && !c.reserved && c.price > 0 && c.cat !== 'title'; });
  if (_paint.length) {
    h += '<div class="shop-shelf"><div class="shop-shelf__head"><span class="shop-shelf__title">The Paint Locker</span><span class="shop-shelf__meta">The classics that earned their hooks</span></div>';
    h += '<div class="shop-shelf__rail">';
    _paint.forEach(function(item) { h += _proShopCard(item); });
    h += '</div></div>';
  }

  // ── Your Locker — owned items, equip management in one place ──
  var _ownedItems = owned.map(shopFindItem).filter(Boolean);
  if (_ownedItems.length) {
    h += '<div class="shop-shelf"><div class="shop-shelf__head"><span class="shop-shelf__title">Your Locker</span><span class="shop-shelf__meta">' + _ownedItems.length + ' owned · grandfathered forever</span></div>';
    h += '<div class="shop-shelf__rail">';
    _ownedItems.forEach(function(item) { h += _proShopCard(item); });
    h += '</div></div>';
  }

  h += '</section>';

  // 3m.D The Economy — entry cards to live feature pages
  h += '<section class="shop-economy" aria-label="The economy">';
  h += '<div class="shop-sec-head"><h2 class="shop-sec-title">Put them to work.</h2></div>';
  h += '<div class="shop-econ-grid">';
  _shopEconomy.forEach(function(e) {
    h += '<button type="button" class="shop-econ-card" onclick="Router.go(\'' + e.route + '\')">';
    h += '<span class="shop-econ-card__icon">' + e.icon + '</span>';
    h += '<span class="shop-econ-card__name">' + e.name + '</span>';
    h += '<span class="shop-econ-card__desc">' + e.desc + '</span>';
    h += '</button>';
  });
  h += '</div>';
  h += '</section>';

  // Cosmetic-only disclaimer (legal posture — not gambling)
  h += '<p class="shop-disclaimer">Parcoin is cosmetic-only with zero real-world cash value. Earn it by playing rounds, practicing, and competing.</p>';

  h += '</div>'; // .shop-wrap

  document.querySelector('[data-page="shop"]').innerHTML = h;
  _renderShopLedger(uid);
});

/* Recent-activity ledger. Reuses the truthful grouped-digest pattern from the
   profile earnings list: consecutive same-label runs collapse into one row with
   a count and summed amount, so a week of daily logins reads as "Daily login x7"
   rather than seven identical rows. Chip + sign derive from the transaction's
   own reason/amount so nothing is fabricated (P9). */
function _renderShopLedger(uid) {
  var el = document.getElementById("shopLedger");
  if (!el) return;
  if (!uid) { el.innerHTML = '<div class="shop-ledger__empty">Sign in to see your activity.</div>'; return; }
  loadTransactionHistory(uid, 20).then(function(txns) {
    if (!txns.length) {
      el.innerHTML = '<div class="shop-ledger__empty">No activity yet. Your first round bonus, wager, or bounty will start the ledger.</div>';
      return;
    }
    function fmtDate(t) {
      if (t && t.createdAt && t.createdAt.toDate) {
        var d = t.createdAt.toDate();
        return (d.getMonth() + 1) + "/" + d.getDate();
      }
      return "";
    }
    function cleanLabel(s) {
      return String(s || "").replace(/ at (null|undefined)(?=\s*\(|$)/i, "");
    }
    function chipFor(t) {
      var amt = t.amount || 0;
      var r = String(t.reason || "").toLowerCase();
      if (r.indexOf("purchase") >= 0) return { txt: "Purchased", out: true };
      if (r.indexOf("gift") >= 0) return { txt: "Gifted", out: amt < 0 };
      if (r.indexOf("wager") >= 0 || r.indexOf("bet") >= 0 || r.indexOf("bounty") >= 0) return amt >= 0 ? { txt: "Won", out: false } : { txt: "Lost", out: true };
      return amt >= 0 ? { txt: "Earned", out: false } : { txt: "Spent", out: true };
    }
    var groups = [];
    txns.forEach(function(t) {
      var label = cleanLabel(t.label || t.reason || "Activity");
      var last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.count += 1; last.amount += (t.amount || 0); last.earliest = t;
      } else {
        groups.push({ label: label, count: 1, amount: (t.amount || 0), latest: t, earliest: t });
      }
    });
    var html = '';
    groups.forEach(function(g) {
      var chip = chipFor(g.latest);
      var lateStr = fmtDate(g.latest), earlyStr = fmtDate(g.earliest);
      var dateStr = (g.count > 1 && earlyStr && lateStr && earlyStr !== lateStr) ? (earlyStr + " – " + lateStr) : lateStr;
      var countTxt = g.count > 1 ? ' x' + g.count : '';
      var amtClass = g.amount >= 0 ? 'shop-txn__amt--in' : 'shop-txn__amt--out';
      var amtStr = (g.amount >= 0 ? '+' : '') + g.amount.toLocaleString();
      html += '<div class="shop-txn">';
      html += '<span class="shop-txn__chip ' + (chip.out ? 'shop-txn__chip--out' : 'shop-txn__chip--in') + '">' + chip.txt + '</span>';
      html += '<div class="shop-txn__main"><div class="shop-txn__label">' + escHtml(g.label) + countTxt + '</div>' + (dateStr ? '<div class="shop-txn__date">' + dateStr + '</div>' : '') + '</div>';
      html += '<div class="shop-txn__amt ' + amtClass + '">' + amtStr + '</div>';
      html += '</div>';
    });
    el.innerHTML = html;
  });
}

function purchaseCosmetic(itemId) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  if (!requireVerified("buy cosmetics")) return;
  var item = shopFindItem(itemId);
  if (!item) return;
  // v8.24.50 — never sell what doesn't render yet, never sell the earned.
  if (item.arriving) { Router.toast("Arriving soon — not on sale yet"); return; }
  if (item.earnedBy) { Router.toast(item.earnedBy + ". Not for sale."); return; }

  var balance = getParCoinBalance(currentUser.uid);
  if (balance < item.price) { Router.toast("Not enough ParCoins"); return; }

  // v8.25.26 — two-click buy: the click that reaches here SELECTS the item; the
  // branded confirm below is the second, deliberate click that actually spends
  // ParCoins. "See-before-you-spend" — never deduct on a single tap. The ParCoin
  // pack purchase (when its IAP UI ships) routes through the same confirm pattern.
  pbConfirm({
    title: "Buy " + item.name + "?",
    message: "Spends " + item.price + " ParCoins — you'll have " + (balance - item.price) + " left.",
    confirmLabel: "Buy · " + item.price,
    cancelLabel: "Not yet"
  }).then(function(ok) { if (ok) _doPurchaseCosmetic(item); });
}

// Actual ParCoin deduction + ownership grant. Reached only after the buyer
// confirms in purchaseCosmetic()'s dialog (the second, deliberate click).
function _doPurchaseCosmetic(item) {
  var itemId = item.id;
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
  }).catch(function(err) { Router.toast(pbErrMsg(err, "Purchase failed. Please try again.")); });
}

function equipCosmetic(itemId, cat) {
  if (!currentUser || !db) return;
  var equipped = (currentProfile && currentProfile.equippedCosmetics) || {};
  var item = shopFindItem(itemId);
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

// ── Try-it-on preview (v8.25.8) ─────────────────────────────────────────────
// Founder: "shop should allow for preview as well." A full-size, branded
// preview of a cosmetic applied to the member's OWN avatar / name / card, with
// the Buy or Equip action inline — see-before-you-spend. Appends a dismissable
// overlay to <body> (above the shop page, like pbConfirm).
function shopClosePreview() {
  var ov = document.getElementById("shopPreviewOverlay");
  if (ov) ov.remove();
}
function shopPreviewCosmetic(itemId) {
  var item = (typeof shopFindItem === "function") ? shopFindItem(itemId) : null;
  if (!item) return;
  var prof = (typeof currentProfile !== "undefined") ? currentProfile : null;
  var myAvatar = (prof && typeof Router !== "undefined" && Router.getAvatar) ? Router.getAvatar(prof) : '';
  var myName = prof ? (prof.username || prof.name || "You") : "You";
  var uid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
  var balance = (uid && typeof getParCoinBalance === "function") ? getParCoinBalance(uid) : 0;
  var owned = (prof && prof.ownedCosmetics) || [];
  var isOwned = owned.indexOf(item.id) !== -1 || (item.price === 0 && !item.earnedBy);
  var equippedMap = (prof && prof.equippedCosmetics) || {};
  var equipped = equippedMap[item.cat] === item.id || (item.plate && equippedMap.titleplate === item.id);

  // Full-size stage, per category — applied to the member's own identity.
  var stage = '';
  if (item.cat === 'border') {
    var ring = item.css || ('3px solid ' + (item.preview || 'var(--cb-brass)'));
    stage = '<div class="' + (item.ringClass || '') + '" style="width:118px;height:118px;border-radius:50%;border:' + ring + ';margin:0 auto;display:flex;align-items:center;justify-content:center;background:var(--bg3,var(--cb-canvas))">' + myAvatar + '</div>';
  } else if (item.cat === 'banner') {
    stage = '<div style="border-radius:14px;overflow:hidden;border:1px solid var(--cb-mute-3)">'
      + '<div style="height:92px;background:' + (item.css || 'var(--gold)') + '"></div>'
      + '<div style="padding:0 14px 14px;margin-top:-30px;text-align:center"><div style="width:60px;height:60px;border-radius:50%;margin:0 auto;border:2px solid var(--cb-paper);background:var(--bg3);overflow:hidden">' + myAvatar + '</div>'
      + '<div style="font-weight:700;font-size:14px;color:var(--cb-ink);margin-top:7px">' + escHtml(myName) + '</div></div></div>';
  } else if (item.cat === 'card') {
    stage = '<div style="border-radius:var(--radius,12px);background:var(--bg3,var(--cb-canvas));padding:14px 16px;text-align:left;' + (item.css || '') + '"><div style="font-size:13px;font-weight:700;color:var(--cream,var(--cb-ink))">' + escHtml(myName) + '</div><div style="font-size:11px;color:var(--muted,var(--cb-mute));margin-top:3px">Honey Run Golf Club · 92</div></div>';
  } else if (item.cat === 'voice') {
    var cad = (window.pbCaddies || []).filter(function (c) { return c.sku === item.id; })[0];
    var line = (cad && window.pbVoices) ? window.pbVoices.line('frame', cad.id) : '';
    stage = '<div style="text-align:center"><div style="font-size:34px">⛳</div><div style="font-weight:700;font-size:15px;color:var(--cb-ink);margin-top:6px">' + escHtml(cad ? cad.name : item.name) + '</div>'
      + (line ? '<div style="font-family:var(--font-display);font-style:italic;font-size:14px;color:var(--cb-ink);background:var(--cb-chalk-2);border-radius:10px;padding:10px 12px;margin-top:10px;line-height:1.4">“' + escHtml(line) + '”</div>' : '') + '</div>';
  } else if (item.cat === 'title' || item.cat === 'nameplate') {
    var titleEl = item.plate
      ? '<span class="' + (item.id === 'pc36_member_tag' ? 'title-tag-leather' : 'title-engraved') + '">' + escHtml(item.id === 'pc36_member_tag' ? 'Member No. 7' : 'Grinder') + '</span>'
      : '<span class="title-plain" style="--ti:' + (item.preview || 'var(--cb-brass)') + '">' + escHtml(item.name) + '</span>';
    stage = '<div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px"><div style="font-size:16px;font-weight:700;color:var(--cb-ink)">' + escHtml(myName) + '</div>' + titleEl + '</div>';
  } else {
    var glyph = (typeof pbMarkerGlyph === 'function') ? pbMarkerGlyph(item.id, 72) : '';
    stage = '<div style="text-align:center;color:' + (item.preview || 'var(--cb-brass)') + '">' + (glyph || '<div style="width:52px;height:52px;border-radius:50%;margin:0 auto;background:' + (item.preview || 'var(--cb-brass)') + '"></div>') + '</div>';
  }

  // Inline action — buy / equip / state — mirroring the card's logic.
  var esc2 = function (s) { return String(s).replace(/'/g, "\\'"); };
  var action;
  if (item.arriving) {
    action = '<div style="text-align:center;font-size:12px;color:var(--cb-mute);font-weight:600">Arriving soon</div>';
  } else if (isOwned && equipped) {
    action = '<div style="text-align:center;font-size:12px;color:var(--cb-felt,var(--success));font-weight:700">Equipped</div>';
  } else if (isOwned) {
    action = '<button type="button" onclick="equipCosmetic(\'' + esc2(item.id) + '\',\'' + (item.plate ? 'titleplate' : item.cat) + '\');shopClosePreview()" style="width:100%;min-height:46px;background:var(--cb-felt);border:none;border-radius:10px;color:var(--cb-chalk);font-weight:700;font-size:14px;cursor:pointer">Equip it</button>';
  } else if (balance >= item.price) {
    action = '<button type="button" onclick="purchaseCosmetic(\'' + esc2(item.id) + '\');shopClosePreview()" style="width:100%;min-height:46px;background:var(--cb-brass,var(--gold));border:none;border-radius:10px;color:#2A2822;font-weight:700;font-size:14px;cursor:pointer">Buy · ' + item.price + ' ParCoins</button>';
  } else {
    action = '<div style="text-align:center;font-size:12px;color:var(--cb-mute);font-weight:600">' + item.price + ' ParCoins · you need ' + (item.price - balance) + ' more</div>';
  }

  var ov = document.createElement('div');
  ov.id = "shopPreviewOverlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Preview " + item.name);
  ov.style.cssText = "position:fixed;inset:0;z-index:10000;background:var(--scrim, rgba(20,19,15,.42));display:flex;align-items:center;justify-content:center;padding:24px";
  ov.innerHTML = '<div style="background:var(--cb-paper);border:1px solid var(--cb-mute-3);border-radius:16px;max-width:330px;width:100%;padding:20px 18px;box-shadow:var(--el-4,0 12px 32px rgba(0,0,0,.18))">'
    + '<div style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-brass,var(--gold));text-align:center;margin-bottom:14px">Try it on</div>'
    + '<div style="margin-bottom:14px">' + stage + '</div>'
    + '<div style="text-align:center;font-weight:700;font-size:15px;color:var(--cb-ink)">' + escHtml(item.name) + '</div>'
    + '<div style="text-align:center;font-size:11.5px;color:var(--cb-mute);line-height:1.45;margin:4px 0 16px">' + escHtml(item.desc || '') + '</div>'
    + action
    + '<button type="button" id="shopPreviewClose" style="width:100%;min-height:40px;margin-top:8px;background:none;border:none;color:var(--cb-mute);font-size:12px;font-weight:600;cursor:pointer">Close</button>'
    + '</div>';
  function onKey(e) { if (e.key === "Escape") shopClosePreview(); }
  ov.addEventListener("click", function (e) { if (e.target === ov) shopClosePreview(); });
  document.addEventListener("keydown", onKey, { once: true });
  document.body.appendChild(ov);
  var closeBtn = document.getElementById("shopPreviewClose");
  if (closeBtn) closeBtn.onclick = shopClosePreview;
}
