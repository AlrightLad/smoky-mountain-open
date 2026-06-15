/* ================================================
   PAGE: COSMETICS SHOP — Spend ParCoins on cosmetics
   Categories: Profile Borders, Banners, Card Themes
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

// v8.25.83 — brass golf-flag SVG replacing the ⛳ emoji placeholders (the
// no-emoji rule reserves ⛳ for The Caddy bot only; a raw emoji also rendered
// inconsistently across iPhone/Android). One source, sized per call site.
function _shopFlagSvg(px) {
  px = px || 28;
  return '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" aria-hidden="true">' +
    '<path d="M7 22V3l11 3.2L7 9.6" fill="rgba(var(--cb-brass-rgb),0.20)" stroke="var(--cb-brass)" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<line x1="7" y1="22" x2="7" y2="3" stroke="var(--cb-brass)" stroke-width="1.6" stroke-linecap="round"/>' +
    '<circle cx="7" cy="22" r="1.4" fill="var(--cb-brass)"/></svg>';
}

var COSMETICS_CATALOG = [
  // ── PROFILE RINGS — Basic: 100-200, Mid: 300-500, Premium: 750-1500, Ultra: 2000+ ──
  {id:"border_default_gold",cat:"border",name:"Classic Gold",      price:0,   desc:"The default Parbaugh gold, free for all members",  css:"2px solid #c9a84c",  preview:"#c9a84c"},
  {id:"border_bronze",     cat:"border", name:"Bronze Ring",       price:200, desc:"Subtle bronze glow",       css:"2px solid #CD7F32",          preview:"#CD7F32"},
  {id:"border_silver",     cat:"border", name:"Silver Ring",       price:300, desc:"Clean silver finish",       css:"2px solid #C0C0C0",          preview:"#C0C0C0"},
  {id:"border_birdie",     cat:"border", name:"Birdie Green",      price:300, desc:"Glowing green for under-par energy", css:"3px solid #4ade80",  preview:"#4ade80"},
  {id:"border_ice",        cat:"border", name:"Bluebird",          price:300, desc:"A crisp Bluebird-sky blue band",      css:"3px solid #4aa3e0",    preview:"#4aa3e0"},
  {id:"border_rose",       cat:"border", name:"Rose Gold",         price:400, desc:"Elegant rose gold tone",    css:"3px solid #e8a0bf",          preview:"#e8a0bf"},
  {id:"border_flame",      cat:"border", name:"Bunker Sand",        price:400, desc:"Sun-baked bunker sand",                 css:"3px solid #d4943c",   preview:"#d4943c"},
  {id:"border_gold",       cat:"border", name:"Gold Ring",         price:600, desc:"Premium gold band",         css:"3px solid #c9a84c",          preview:"#c9a84c"},
  {id:"border_fire",       cat:"border", name:"Sunset Nine",       price:600, desc:"The amber glow of a twilight nine", css:"3px solid #db7a3c",          preview:"#db7a3c"},
  {id:"border_emerald",    cat:"border", name:"Emerald Ring",      price:600, desc:"Deep green prestige",       css:"3px solid #50c878",          preview:"#50c878"},
  {id:"border_champ_red",  cat:"border", name:"Championship Red",  price:600, desc:"Bold crimson, champion vibes",      css:"3px solid #d4243c",   preview:"#d4243c"},
  {id:"border_diamond",    cat:"border", name:"Diamond Ring",      price:800, desc:"Sparkling diamond edge",    css:"3px solid #b9f2ff",          preview:"#b9f2ff"},
  {id:"border_obsidian",   cat:"border", name:"Obsidian Edge",     price:800, desc:"Dark volcanic glass",       css:"3px solid #2d2d2d",          preview:"#555555"},
  {id:"border_platinum",   cat:"border", name:"Platinum Band",     price:1000, desc:"Rare platinum finish",      css:"3px solid #e5e4e2",          preview:"#e5e4e2"},
  {id:"border_rainbow",    cat:"border", name:"Magnolia Row",      price:1000, desc:"Augusta magnolia blush",    css:"3px solid #d99fb0",          preview:"#d99fb0"},
  {id:"border_neon_green",lvl:5,  cat:"border", name:"Fairway Pulse",      price:1500, desc:"A pulsing fairway-green glow",          css:"3px solid #5fbf52",   preview:"#5fbf52"},
  {id:"border_crimson_ember",lvl:5, cat:"border",name:"Sunday Ember",      price:1500, desc:"A smoldering Sunday-red ember",      css:"3px solid #a8243a",   preview:"#a8243a"},
  {id:"border_pulse_gold",lvl:10,  cat:"border", name:"Pulse Gold",        price:2000,desc:"Animated golden pulse glow",            css:"3px solid #c9a84c",   preview:"#c9a84c"},
  {id:"border_rainbow_shift",lvl:12, cat:"border",name:"Major Season",     price:3000,desc:"Cycles the colours of the four majors",   css:"3px solid #1e7a4a",   preview:"#1e7a4a"},
  {id:"border_shimmer",lvl:15,     cat:"border", name:"Diamond Sparkle",   price:5000,desc:"Ultra-premium animated diamond ring",   css:"3px solid #b9f2ff",   preview:"#b9f2ff"},

  // ── PROFILE BANNERS — Basic: 100-200, Mid: 300-500, Premium: 750+ ──
  {id:"banner_default",    cat:"banner", name:"Theme Default",     price:0,   desc:"Uses your active theme gradient, free for all",  css:"linear-gradient(180deg,var(--grad-hero),var(--bg))", preview:"var(--gold)"},
  {id:"banner_classic",    cat:"banner", name:"Classic Pinstripe", price:200, desc:"Charcoal with gold pinstripe, pairs with Classic",    css:"linear-gradient(180deg,#0e1118 0%,#1a1f2c 50%,#0e1118 100%)", preview:"#0e1118"},
  {id:"banner_flagstick",  cat:"banner", name:"Flagstick",        price:200, desc:"Silhouette gradient, works on any theme",               css:"linear-gradient(180deg,#1a2840,#0e1118,#1a2840)", preview:"#1a2840"},
  {id:"banner_sunset",     cat:"banner", name:"Sunset Fairway",    price:300, desc:"Warm orange-pink gradient", css:"linear-gradient(135deg,#ff6b35,#e8729a)", preview:"#ff6b35"},
  {id:"banner_ocean",      cat:"banner", name:"Coastal Links",     price:300, desc:"The blue-teal sweep of a links by the sea", css:"linear-gradient(135deg,#2563eb,#06b6d4)", preview:"#2563eb"},
  {id:"banner_midnight",   cat:"banner", name:"Midnight Green",    price:300, desc:"Dark green Augusta vibe",   css:"linear-gradient(135deg,#064e3b,#059669)", preview:"#064e3b"},
  {id:"banner_arctic",     cat:"banner", name:"Frost Delay",      price:300, desc:"The icy hush of a frost-delay morning", css:"linear-gradient(135deg,#e0f2fe,#7dd3fc)", preview:"#7dd3fc"},
  {id:"banner_pine",       cat:"banner", name:"Pine Forest",      price:300, desc:"Deep forest green fade",    css:"linear-gradient(135deg,#1a3a2a,#2d6a4f)", preview:"#1a3a2a"},
  {id:"banner_camo_pair",  cat:"banner", name:"Woodland Camo",    price:400, desc:"Olive and shadow, pairs with Camo",                   css:"linear-gradient(135deg,#12140e,#2e3122,#181a12)", preview:"#12140e"},
  {id:"banner_masters_pair",cat:"banner", name:"Augusta Green",   price:400, desc:"Deep green with yellow trim, pairs with Masters",      css:"linear-gradient(135deg,#071a10,#0c2218,#1a3a28)", preview:"#071a10"},
  {id:"banner_azalea_pair",cat:"banner", name:"Bloom Garden",     price:400, desc:"Dark with pink accents, pairs with Azalea",            css:"linear-gradient(135deg,#0e1118,#1a0e18,#0e1118)", preview:"#1a0e18"},
  {id:"banner_usga_pair",  cat:"banner", name:"Navy Stripe",      price:400, desc:"Institutional navy, pairs with USGA",                  css:"linear-gradient(135deg,#0a1628,#142640,#0a1628)", preview:"#0a1628"},
  {id:"banner_dark_pair",  cat:"banner", name:"Carbon Fiber",     price:400, desc:"Pure black with silver edge, pairs with Dark",          css:"linear-gradient(135deg,#000000,#141414,#000000)", preview:"#000000"},
  {id:"banner_light_pair", cat:"banner", name:"Linen & Gold",     price:400, desc:"Warm cream with gold accent, pairs with Light",         css:"linear-gradient(135deg,#f5f3ee,#eceae4,#f5f3ee)", preview:"#f5f3ee"},
  {id:"banner_storm",      cat:"banner", name:"Weather Horn",      price:600, desc:"Slate skies before the horn sounds", css:"linear-gradient(135deg,#3a4654,#1f2733)", preview:"#3a4654"},
  {id:"banner_crimson",    cat:"banner", name:"Sunday Charge",    price:600, desc:"The Sunday-red charge to the clubhouse", css:"linear-gradient(135deg,#991b1b,#1f1f1f)", preview:"#991b1b"},
  {id:"banner_ember",      cat:"banner", name:"Sunset Back-Nine", price:600, desc:"Amber-to-claret of a sunset back nine", css:"linear-gradient(135deg,#f59e0b,#b91c1c)", preview:"#f59e0b"},
  {id:"banner_champ_pair", cat:"banner", name:"Burgundy Leather", price:600, desc:"Championship leather, pairs with Sunday Red",           css:"linear-gradient(135deg,#10080a,#301c22,#10080a)", preview:"#10080a"},
  {id:"banner_mountain",   cat:"banner", name:"Mountain Range",   price:600, desc:"Golf trip mountain skyline vibes",                       css:"linear-gradient(180deg,#0f172a,#1e3a5f,#0f172a)", preview:"#0f172a"},
  {id:"banner_fairway",    cat:"banner", name:"Fairway Aerial",   price:600, desc:"Top-down fairway pattern",                               css:"linear-gradient(135deg,#064e3b,#0a7c5a,#064e3b)", preview:"#064e3b"},
  {id:"banner_gold_rush",  cat:"banner", name:"Gold Rush",         price:1000, desc:"Rich gold gradient",        css:"linear-gradient(135deg,#92400e,#f59e0b)", preview:"#92400e"},
  {id:"banner_golden_hr",  cat:"banner", name:"Golden Hour",      price:1000, desc:"Sunset gradient, warm amber to deep navy",              css:"linear-gradient(180deg,#f59e0b,#c2410c,#1e1b4b)", preview:"#f59e0b"},

  // ── CARD THEMES — Mid-tier: 300-500. Each DRAMATICALLY different from default. ──
  {id:"card_neon",         cat:"card", name:"Fairway Edge",        price:600, desc:"A clean fairway-green edge",               css:"border-left:4px solid #5fbf66;background:linear-gradient(90deg,rgba(95,191,102,.06),transparent 40%)", preview:"#5fbf66"},
  {id:"card_royal",        cat:"card", name:"Claret Edge",         price:600, desc:"A claret-red trophy edge",                css:"border-left:4px solid #8a2f3f;background:linear-gradient(90deg,rgba(138,47,63,.07),transparent 40%)", preview:"#8a2f3f"},
  {id:"card_birdie",       cat:"card", name:"Birdie Green",       price:600, desc:"Green energy for under-par rounds",        css:"border-left:4px solid #22c55e;background:linear-gradient(90deg,rgba(34,197,94,.06),transparent 40%)", preview:"#22c55e"},
  {id:"card_vintage",      cat:"card", name:"Vintage Parchment",  price:600, desc:"Old-school scorecard warmth",              css:"border-left:4px solid #c4a97d;background:linear-gradient(90deg,rgba(196,169,125,.08),transparent 40%)", preview:"#c4a97d"},
  {id:"card_fire",         cat:"card", name:"Pin Seeker",          price:800, desc:"Championship-red edge, dialed at the flag",  css:"border-left:4px solid #d4243c;background:linear-gradient(90deg,rgba(212,36,60,.07),transparent 40%)", preview:"#d4243c"},
  {id:"card_ice",          cat:"card", name:"Bluebird Edge",       price:800, desc:"A crisp Bluebird-sky edge",                css:"border-left:4px solid #4aa3e0;background:linear-gradient(90deg,rgba(74,163,224,.06),transparent 40%)", preview:"#4aa3e0"},
  {id:"card_stealth",      cat:"card", name:"Night Nine",         price:800, desc:"The slate hush of a night nine",          css:"border-left:4px solid #374151;background:linear-gradient(90deg,rgba(55,65,81,.1),transparent 40%)", preview:"#555555"},
  {id:"card_sunset",       cat:"card", name:"Twilight Round",     price:800, desc:"The amber of a twilight round",            css:"border-left:4px solid #db7a3c;background:linear-gradient(90deg,rgba(219,122,60,.07),transparent 40%)", preview:"#db7a3c"},
  {id:"card_birdie_streak",cat:"card", name:"Birdie Streak",      price:800, desc:"Electric green for under-par runs",        css:"border-left:4px solid #22d65e;background:linear-gradient(90deg,rgba(34,214,94,.07),transparent 40%)", preview:"#22d65e"},
  {id:"card_neon_night",   cat:"card", name:"Magnolia Night",     price:800, desc:"Augusta magnolia blush on a dark card",     css:"border-left:4px solid #c77f97;background:linear-gradient(90deg,rgba(199,127,151,.07),transparent 40%)", preview:"#c77f97"},
  {id:"card_dark_carbon",  cat:"card", name:"Midnight Links",     price:1000, desc:"Matte midnight-links black edge",          css:"border-left:4px solid #1a1a1a;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent 30%)", preview:"#444444"},
  {id:"card_augusta",      cat:"card", name:"Augusta Green",      price:1000, desc:"Deep Masters green prestige",              css:"border-left:4px solid #006633;background:linear-gradient(90deg,rgba(0,102,51,.08),transparent 40%)", preview:"#006633"},
  {id:"card_gold_foil",    cat:"card", name:"Gold Foil",          price:1000, desc:"Luxe metallic gold edge with shimmer, the ultimate flex", css:"border-left:4px solid #c9a84c;background:linear-gradient(90deg,rgba(201,168,76,.12),rgba(223,192,106,.05) 50%,transparent)", preview:"#c9a84c"},

  // ── NAME EFFECTS — Mid-tier: 300-500 ──
  {id:"name_shadow_depth", cat:"name", name:"Shadow Depth",        price:600, desc:"Deep shadow for a 3D carved look",  css:"text-shadow:2px 2px 4px rgba(0,0,0,.5)", preview:"#666666"},
  {id:"name_gold_shimmer", cat:"name", name:"Gold Shimmer",        price:700, desc:"Animated gold gradient on your name",    css:"text-shadow:0 0 8px rgba(201,168,76,.6)", preview:"#c9a84c"},
  {id:"name_glow_green",   cat:"name", name:"Fairway Glow",        price:700, desc:"A soft fairway-green glow",       css:"text-shadow:0 0 10px rgba(95,191,102,.7)", preview:"#5fbf66"},
  {id:"name_fire_text",    cat:"name", name:"Sunday Glow",         price:800, desc:"A Sunday-red glow",               css:"text-shadow:0 0 8px rgba(212,36,60,.6),0 0 16px rgba(168,36,58,.3)", preview:"#d4243c"},
  {id:"name_ice_text",     cat:"name", name:"Bluebird Glow",       price:800, desc:"A crisp Bluebird-sky glow",       css:"text-shadow:0 0 8px rgba(74,163,224,.6),0 0 16px rgba(186,230,253,.3)", preview:"#4aa3e0"},
  {id:"name_rainbow",      cat:"name", name:"Major Gradient",      price:1000, desc:"Text in the four majors' colours",            css:"background:linear-gradient(90deg,#1e7a4a,#c9a155,#8a2f3f,#2a4a7a,#b03a3a);-webkit-background-clip:text;-webkit-text-fill-color:transparent", preview:"#1e7a4a"},


  // ── TITLES — Basic: 200, Mid: 300-500, Premium: 750 ──
  {id:"title_early_bird",    cat:"title", name:"Early Bird",          price:400, desc:"First tee time, every time",                     css:"", preview:"#fbbf24"},
  {id:"title_night_owl",     cat:"title", name:"Night Owl",           price:400, desc:"Twilight rounds are your specialty",              css:"", preview:"#818cf8"},
  {id:"title_grinder",       cat:"title", name:"Grinder",            price:600, desc:"For the player who never stops working",          css:"", preview:"var(--gold)"},
  {id:"title_road_warrior",  cat:"title", name:"Road Warrior",        price:600, desc:"Plays everywhere, never the same course twice",  css:"", preview:"var(--gold)"},
  {id:"title_iron_will",     cat:"title", name:"Iron Will",           price:600, desc:"Bounces back from every bad hole",                css:"", preview:"#6b7280"},
  {id:"title_sharpshooter",  cat:"title", name:"Sharpshooter",       price:800, desc:"Precision approach game, deadly accurate",       css:"", preview:"var(--gold)"},
  {id:"title_hot_streak",    cat:"title", name:"Hot Streak",          price:800, desc:"On fire lately, rounds keep getting better",     css:"", preview:"#ef4444"},
  {id:"title_sandbagger",    cat:"title", name:"Sandbagger",          price:1000, desc:"Handicap says 25, plays like a 15. We see you.", css:"", preview:"var(--gold)"},
  {id:"title_course_legend", cat:"title", name:"Course Legend",       price:1000, desc:"Owns a course, everyone knows your name there", css:"", preview:"var(--gold)"},
  // PL4 — more on-brand titles (matched voice + price scale). Distinct accent
  // colours give the shelf variety; each renders as the engraved .title-plain chip.
  {id:"title_the_closer",    cat:"title", name:"The Closer",          price:800, desc:"Never met a clutch putt they didn't drain",        css:"", preview:"#23405e"},
  {id:"title_fairway_finder",cat:"title", name:"Fairway Finder",      price:600, desc:"Splits every fairway, allergic to the rough",      css:"", preview:"#3f7d4f"},
  {id:"title_wind_cheater",  cat:"title", name:"Wind Cheater",        price:700, desc:"Flights it low when the flags are snapping",       css:"", preview:"#5b7c99"},
  {id:"title_birdie_hunter", cat:"title", name:"Birdie Hunter",       price:800, desc:"Pin-seeking missile, always firing at the flag",    css:"", preview:"#c0392b"},
  {id:"title_comeback_kid",  cat:"title", name:"Comeback Kid",        price:700, desc:"Down after nine, dangerous on the back",           css:"", preview:"#b4893e"},
  {id:"title_mr_consistent", cat:"title", name:"Mr. Consistent",      price:600, desc:"Same number on the card, every single time",       css:"", preview:"#6b7280"},
  {id:"title_dew_sweeper",   cat:"title", name:"Dew Sweeper",         price:500, desc:"First group off, dew still on the grass",          css:"", preview:"#7da08a"},
  {id:"title_the_diplomat",  cat:"title", name:"The Diplomat",        price:500, desc:"Keeps the group chat civil. Mostly.",              css:"", preview:"#818cf8"},
  {id:"title_big_spender",lvl:5,    cat:"title", name:"Big Spender",         price:1500, desc:"ParCoins flow like water from your wallet",       css:"", preview:"var(--gold)"},
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
  {id:"pc01_gallery_rope", cat:"border", tier:"proshop", name:"The Gallery Rope", price:800, ringClass:"ring-gallery-rope", preview:"#b8a87e", desc:"Braided cream rope with brass stanchions at the compass points. You're the one they came to watch."},
  {id:"pc02_fescue",       cat:"border", tier:"locker",  name:"Fescue",          price:1200, ringClass:"ring-fescue", preview:"#b9a04b", desc:"Wispy golden fescue grows around the bottom arc, swaying slow. Links golf, in a circle."},
  {id:"pc03_fried_egg",    cat:"border", tier:"proshop", name:"Fried Egg",       price:600, ringClass:"ring-fried-egg", preview:"#d9c389", desc:"Half-buried in bunker sand, a lip of splash frozen mid-blast. Own your lies."},
  {id:"pc04_claret",       cat:"border", tier:"cabinet", lvl:8, name:"The Claret",      price:3000, ringClass:"ring-claret", preview:"#cfd2d6", desc:"Engraved trophy silver with a jug-handle flourish; a light sweep crosses the engraving. Unlocks at Level 8 — you earn the right to spend on it."},
  // B · Nameplates — NEW surface, arriving (renders next ship)
  {id:"pc05_locker_brass", cat:"nameplate", tier:"locker", name:"Locker Brass", price:1000, preview:"#caa75c", desc:"Brushed brass behind your name, engraved serif, two screw heads. Your locker, everywhere."},
  {id:"pc06_yardage_book", cat:"nameplate", tier:"proshop", name:"The Yardage Book", price:700, preview:"#d8d2c0", desc:"Graph paper, a hand-sketched green contour, a penciled carry number fading behind your name."},
  {id:"pc07_leaderboard_sunday",lvl:5,  cat:"nameplate", tier:"locker", name:"Leaderboard Sunday", price:1500, preview:"#1d3a2a", desc:"Hand-set white letters on deep green, straight off the manual board. Sunday at a major, every day."},
  // C · Scorecard skins — render via getPlayerCardCss (live now)
  {id:"pc08_pencil_parchment", cat:"card", tier:"proshop", name:"Pencil & Parchment", price:800, preview:"#cabd98", css:"border:1px solid #c2b48c;border-left:4px solid #b3a378;background:linear-gradient(0deg,rgba(202,189,152,.12),rgba(232,224,196,.16)),repeating-linear-gradient(0deg,transparent 0 7px,rgba(150,135,95,.07) 7px 8px)", desc:"Vintage paper stock, dot-grid rules, your numbers in pencil grey."},
  {id:"pc09_member_guest", cat:"card", tier:"locker", name:"The Member-Guest", price:1000, preview:"#e9dfc4", css:"border-top:3px double rgba(180,137,62,.85);border-bottom:3px double rgba(180,137,62,.85);background:linear-gradient(180deg,rgba(244,238,220,.16),rgba(233,223,196,.1))", desc:"Cream card, double brass rules, your league's name as a pale watermark."},
  {id:"pc10_major_sunday",lvl:8,  cat:"card", tier:"locker", name:"Major Sunday", price:1800, preview:"#0d2818", css:"border-left:6px solid #0d2818;background:linear-gradient(90deg,rgba(13,40,24,.2),rgba(13,40,24,.05) 55%,transparent)", desc:"Broadcast lower-third styling: deep-green chyron bars. Your 92 never looked so televised."},
  // D · Feed flair — NEW surface, arriving
  {id:"pc11_tap_in_tip",   cat:"flair", tier:"proshop", name:"Tap-In Tip", price:600, arriving:true, preview:"#caa75c", desc:"Your reactions land as a brass ball-marker stamp with a tiny press."},
  {id:"pc12_birdie_drop",  cat:"flair", tier:"locker", name:"Birdie Drop", price:1200, arriving:true, preview:"#3f7d4e", desc:"Under-par rounds: a ball drops into the cup on your feed card. One bounce, rattle, done."},
  {id:"pc13_gallery_roar",lvl:5,  cat:"flair", tier:"locker", name:"The Gallery Roar", price:1500, arriving:true, preview:"#b4893e", desc:"Personal bests: a hat-tip ripple and a short polite-applause burst on first view."},
  // E · Titles + the Engraving (plate renders live now)
  {id:"pc14_engraving",    cat:"title", tier:"proshop", name:"The Engraving", price:800, plate:true, preview:"#caa75c", desc:"Your equipped title renders as a small engraved brass plate instead of italic text. Applies to any title you own."},
  {id:"pc15_cart_path",    cat:"title", tier:"range", name:"Cart Path Only", price:500, preview:"#8a8674", desc:"For the member whose ball has seen more concrete than fairway. Worn with pride or not at all."},
  {id:"pc16_postman",      cat:"title", tier:"proshop", name:"The Postman", price:800, preview:"#b4893e", desc:"Posts every round. Rain, shame, or triple bogey — always delivers."},
  // F · Tee markers — NEW surface, arriving
  {id:"pc17_brass_acorn",  cat:"teemarker", tier:"range", name:"Brass Acorn", price:400, preview:"#caa75c", desc:"The classic club tee marker, polished. Says you've been here a while."},
  {id:"pc18_rubber_duck",  cat:"teemarker", tier:"proshop", name:"Rubber Duck", price:700, preview:"#e8c84a", desc:"A small yellow duck. For the member with a documented relationship with water."},
  {id:"pc19_persimmon",    cat:"teemarker", tier:"proshop", name:"Persimmon", price:700, preview:"#7a4a28", desc:"A tiny persimmon driver head, brass sole plate, whipping and all. Feel player."},
  {id:"pc20_parbaugh_marker", cat:"teemarker", tier:"locker", name:"The Parbaugh", price:1000, preview:"#b4893e", desc:"The league crest cast as a founding-gold marker. Fly the flag."},
  // G · Caddy voice packs — NEW, arriving
  {id:"pc21_old_tom",lvl:8,       cat:"voice", tier:"locker", name:"Old Tom", price:1600, arriving:true, preview:"#6f6a5b", desc:"Gruff links wisdom. \"Aye. Intae the wind, that's a three-club day. Swing easy.\""},
  {id:"pc22_bag_room",lvl:8,      cat:"voice", tier:"locker", name:"Bag Room Guy", price:1600, arriving:true, preview:"#6f6a5b", desc:"The heckling friend. \"Big number brewing on 14? Prove me wrong, I'd love that.\""},
  // I · Trophy Cabinet — commemorative, never for sale
  {id:"pc24_green_jacket", cat:"border", tier:"commem", name:"The Green Jacket", price:0, earnedBy:"Season champion only", ringClass:"", preview:"#1d3a2a", desc:"Deep-green wool ring, three small brass buttons, your championship year engraved at six o'clock."},
  {id:"pc25_ace_marker",   cat:"teemarker", tier:"commem", name:"Ace Marker", price:0, earnedBy:"Hole-in-one only", preview:"#e9d9ae", desc:"A gold ball on a brass pedestal, date engraved. There is no second way to get this, and everyone knows it."},

  // ══ NEXT WAVE (v8.24.57, PC-26..43) — prestige register: brass, leather,
  // parchment, engraving + in-group golf humor. Research: proshop-nextwave-
  // 2026-06-11.md. Ball-marker is the one new surface (rides teemarker-style
  // render on the name). Flair items stay arriving (render surface pending).
  // J · BALL MARKERS — new surface, the most-coveted real pro-shop object
  {id:"pc26_found_coin",   cat:"ball", tier:"range",   name:"Found Coin",     price:400, preview:"#b58a3a", desc:"A weathered brass penny you marked with on a whim and never stopped. Milled-edge, worn smooth."},
  {id:"pc27_pitch_mark",   cat:"ball", tier:"proshop", name:"Pitch-Mark",     price:700, preview:"#cfd2d6", desc:"Milled silver, a crosshair engraved dead center. Reads your line for you. Allegedly."},
  {id:"pc43_ctp_marker",   cat:"ball", tier:"commem",  name:"Closest to the Pin", price:0, earnedBy:"Season closest-to-pin leader", preview:"#b58a3a", desc:"Brass disc, a flagstick struck clean through it. Earned on the green, never in the shop."},
  // A · RINGS (live)
  {id:"pc39_wax_seal",lvl:8,      cat:"border", tier:"locker", name:"The Wax Seal",   price:1800, ringClass:"ring-wax-seal", preview:"#7a2e2e", desc:"A claret wax seal pressed at six o'clock, a ribbon tail beneath. Correspondence from the committee."},
  {id:"pc40_hickory_brass",cat:"border", tier:"locker", name:"Hickory & Brass",price:1400, ringClass:"ring-hickory", preview:"#7a4a28", desc:"Hickory-grain wood ringed in brass ferrule. The shaft they played before steel was legal."},
  {id:"pc42_founders_crest",cat:"border",tier:"cabinet",lvl:12,name:"The Founders' Crest",price:3000, ringClass:"ring-claret", preview:"#cfd2d6", desc:"The crest in relief inside an engraved-silver bezel, a slow light sweeping across it. The priciest ring money can buy — unlocks at Level 12. The Green Jacket it is not."},
  // C · SCORECARD SKINS (live)
  {id:"pc28_the_sleeve",   cat:"card", tier:"proshop", retired:true, name:"The Sleeve",      price:600, preview:"#cabd98", css:"border:1px solid #c2b48c;border-left:4px solid #b3a378;background:linear-gradient(160deg,rgba(202,189,152,.16),rgba(232,224,196,.1))", desc:"Kraft three-ball sleeve stock, the flap torn open. Smells like a fresh dozen."},  // v8.25.49 retired — redundant kraft with pc08 Parchment; owned copies still resolve/equip forever
  {id:"pc41_trophy_room",lvl:8,   cat:"card", tier:"locker",  name:"The Trophy Room", price:1800, preview:"#5a4632", css:"border-left:5px solid #5a4632;background:linear-gradient(90deg,rgba(90,70,50,.22),rgba(90,70,50,.05) 55%,transparent)", desc:"Walnut-panel ground with an engraved-brass plaque header. The room where the silver lives."},
  // E · TITLES + bag-tag plate (live)
  {id:"pc36_member_tag",   cat:"title", tier:"proshop", name:"Member No. __",  price:1000, plate:true, preview:"#7a4a28", desc:"Renders your title as a leather bag tag with a brass rivet. Quietly states you were here early."},
  {id:"pc37_sandbagger",   cat:"title", tier:"range",   name:"The Sandbagger's Confession", price:500, preview:"#8a8674", desc:"\"Said it was a practice round.\" Wears the truth so you don't have to."},
  {id:"pc38_mulligan",     cat:"title", tier:"range",   name:"Mulligan Club",  price:500, preview:"#8a8674", desc:"\"Plays it as it lies. Usually.\" Membership has its privileges, and its breakfast balls."},
  // B · NAMEPLATES (live)
  {id:"pc29_stimp_13",     cat:"nameplate", tier:"proshop", name:"Stimp 13",   price:1000, preview:"#1d3a2a", desc:"Bentgrass felt behind your name with a single mown light-stripe. Fast. Don't be above the hole."},
  // D · FEED FLAIR (arriving — render surface pending)
  {id:"pc31_halved",       cat:"flair", tier:"range",   name:"Halved",         price:500, arriving:true, preview:"#b58a3a", desc:"A tied result clinks two crossed flagsticks on the feed card. Nobody lost. Nobody won. Golf."},
  {id:"pc32_sandy",        cat:"flair", tier:"proshop", name:"Sandy",          price:700, arriving:true, preview:"#d9c389", desc:"An up-and-down from the bunker throws a little sand-splash and a one-putt tick. Hardest par in golf."},
  {id:"pc33_snowman",      cat:"flair", tier:"range",   name:"The Snowman",    price:400, arriving:true, preview:"#cfe2d4", desc:"An honest 8 slumps a melting snowman onto the card with a wry 'noted.' Own the blow-up."},
  // F · TEE MARKERS (live)
  {id:"pc34_whipping",     cat:"teemarker", tier:"range", name:"Whipping & Glue", price:500, preview:"#7a4a28", desc:"A hickory butt wrapped in red whipping thread. Old-world, like your short game."},
  // — Founder batch 2026-06-13: 7 new on-brand cosmetics across categories. Ring/
  //   card/nameplate carry worn-render classes (preview==worn); ball/tee/flair use
  //   the existing preview pattern (their categories render off preview/glyph). —
  {id:"pc44_iron_blade",      cat:"border",    tier:"proshop", name:"The Iron Blade", price:900, ringClass:"ring-iron-blade", preview:"#7a6a5c", desc:"Raw iron filed smooth, a single brass rivet at twelve. Duffer or scratch, you earned your swings."},
  {id:"pc45_ledger",          cat:"card",      tier:"range",   name:"The Ledger",     price:400, preview:"#f5f3ee", css:"border:1px solid #e8e4d8;border-left:4px solid #d4cec0;background:linear-gradient(180deg,#faf8f3,#f5f3ee)", desc:"Blank cream ledger stock, a single blue pencil rule up top. No frills. Just score."},
  {id:"pc46_clubhouse_crest", cat:"nameplate", tier:"locker",  name:"The Clubhouse Crest", price:1300, preview:"#6b4a28", desc:"Embossed saddle leather, the rose-and-P mark struck at the shaft. Founding wood-grain beneath."},
  {id:"pc51_chalk_board",     cat:"nameplate", tier:"range",   name:"The Chalk Board", price:500, preview:"#2a2a2a", desc:"Deep-slate manual-scoreboard chalk, your name in white. Raw honest scoring, no paint."},
  {id:"pc47_quartered_leather", cat:"ball",    tier:"proshop", name:"The Quartered Leather", price:800, preview:"#8a6f55", desc:"A scrap of rich saddle leather, quartered on a brass ring. Hit it straight; mark it well."},
  {id:"pc49_wooden_peg",      cat:"teemarker", tier:"range",   name:"The Wooden Peg", price:300, preview:"#6b4a28", desc:"A hickory dowel snapped clean, branded with a single burn-mark. From the bag on Granddad's cart."},
  {id:"pc50_eagle_soar",      cat:"flair",     tier:"locker",  name:"The Eagle Soar", price:1400, arriving:true, preview:"#4a7cb8", desc:"Two-under and a bird bursts off your card with a sharp whistle. Gone in a flash."},
  // — Founder batch 2026-06-13: premium quality-leap pieces (enamel/medallion/
  //   cloisonne/pairing-sheet/sterling). Rings + plate carry worn-render classes
  //   (preview==worn); ball reuses pbMarkerGlyph (56px shop / 12px worn). —
  {id:"pc52_crest_pin",lvl:8,     cat:"border",    tier:"locker",  name:"The Club Pin",     price:1700,  ringClass:"ring-crest-pin", preview:"#1f5135", desc:"Hard-enamel cloisonne: the rose-and-P mark on deep clubhouse green, struck in a polished brass bezel. The lapel pin they hand you when you join."},
  {id:"pc53_medallion",    cat:"border",    tier:"cabinet", lvl:6, name:"The Medallion",    price:2800, ringClass:"ring-medallion", preview:"#caa75c", desc:"A struck championship medallion, laurel in relief around the rim, a slow gleam crossing the strike. Heavy in the hand — unlocks at Level 6."},
  {id:"pc54_calfskin_tag", cat:"nameplate", tier:"locker",  name:"The Calfskin Tag", price:1400,  preview:"#7a4a28", desc:"Pebbled saddle leather, a hard-enamel green roundel riveted at the left, your name embossed deep. The bag tag the caddymaster knows by sight."},
  {id:"pc55_pairing_sheet",cat:"card",      tier:"proshop", name:"The Pairing Sheet",price:900,  preview:"#f2ecda", css:"border:1px solid #d8cfa8;border-left:4px solid #1f5135;background:linear-gradient(0deg,rgba(244,238,214,.18),rgba(252,248,232,.2)),repeating-linear-gradient(0deg,transparent 0 8px,rgba(31,81,53,.06) 8px 9px)", desc:"Tournament-issue pairing sheet: cream stock, a green committee rule down the spine, tee-time grid faint behind your score."},
  {id:"pc56_sterling",     cat:"ball",      tier:"locker",  name:"The Sterling",     price:1200,  preview:"#dfe2e6", desc:"A hand-hammered sterling silver marker, a single small sapphire-enamel dot at center. Heirloom weight; you'd mark a six-footer to win with this."},
  // v8.25.18x (Founder 2026-06-14) — AWARD-WINNING raster avatar DECORATIONS, the
  // Discord-decoration tier: full-colour rubber-hose illustrated frames that wrap
  // the avatar (deco:true → render via playerDecoSrc raster overlay, NOT a CSS ring).
  // Earned tier (Champion / Hole-in-One) are price 0 + earnedBy; the rest are
  // level-gated purchases. Art in public/img/cosmetics/deco-*.png.
  {id:"border_deco_caddy",     deco:true, lvl:3, cat:"border", tier:"proshop", name:"Caddy Companion",  price:1800, preview:"#1e4d3b", desc:"Your own rubber-hose caddy crests the rim and waves you onto the first tee. A complete laurel ring frames your photo; he just came along for the round."},
  {id:"border_deco_holeinone", deco:true, cat:"border", tier:"commem", name:"Hole-in-One",     price:0, earnedBy:"Record a hole-in-one", preview:"#7b2d3a", desc:"Confetti, a dropped ball, and the cup at six o'clock — the frame they only hand out once you've actually done the deed. Earned, never sold."},
  {id:"border_deco_champion",  deco:true, cat:"border", tier:"commem", name:"Champion",        price:0, earnedBy:"Season champion only", preview:"#caa75c", desc:"The claret jug crowns the rim over a green-jacket lapel and laurels. The most earned frame in the club — season champions only."},
  {id:"border_deco_azalea",    deco:true, lvl:5, cat:"border", tier:"locker", name:"Masters Azalea",   price:2200, preview:"#e88aa6", desc:"A spring burst of azalea blossoms garlands the rim — our nod to major season. A seasonal drop; here while the dogwoods bloom."},
  {id:"border_deco_frost",     deco:true, lvl:5, cat:"border", tier:"locker", name:"Frost Delay",      price:2200, preview:"#bcd6e6", desc:"Snow caps, icicles and crossed frosted hickories — for the diehards who tee off in the cold. A seasonal winter drop."},
  // round 2 — varied unlock methods: eagle = ACHIEVEMENT (earned), bramble = LEVEL,
  // autumn = SEASONAL purchase. Fills the Decorations shelf with chase variety.
  {id:"border_deco_eagle",     deco:true, cat:"border", tier:"commem", name:"Eagle",            price:0, earnedBy:"Card an eagle (2-under on a hole)", preview:"#caa75c", desc:"Spread eagle wings sweep the rim under a laurel-and-star crown. You don't buy this one — you fly it down the fairway and watch it drop."},
  {id:"border_deco_bramble",   deco:true, lvl:4, cat:"border", tier:"locker", name:"Bramble Rose",     price:2000, preview:"#7b2d3a", desc:"Claret and cream roses wound through forest-green thorns — the Parbaughs rose-and-bramble in full bloom. Our signature frame."},
  {id:"border_deco_autumn",    deco:true, lvl:6, cat:"border", tier:"locker", name:"Autumn Nine",      price:2400, preview:"#c2622a", desc:"Maple and oak leaves in burnt-orange and rust garland the rim, an acorn at six o'clock. A seasonal drop for the fall golf stretch."}
];
// v8.25.18x (Founder PL8): cosmetics were "still too cheap for the economy" after
// the prior re-price. Raise the active catalog ~1.5x, rounded to the nearest 50
// (free + earnedBy items stay 0). ONE post-def pass so both the shop card AND
// purchaseCosmetic use the new price. Makes the prestige pieces feel earned and
// gives the ParCoin sink real weight (cosmetic-only, no cash — no gambling-leg
// impact). Tune the multiplier here if the Founder wants it higher/lower.
PRO_SHOP_CATALOG.forEach(function(i){ if (i.price > 0) i.price = Math.round(i.price * 1.5 / 50) * 50; });
// Legacy items kept ON SALE in the Paint Locker (the best ~15); every other
// legacy item is retired from sale. Owned items are grandfathered forever —
// ownership and equip are untouched by retirement.
// v8.25.121 — Founder shop revamp ("a lot of designs can go, off-brand"): the
// garish RGB/neon light-effect rings (rainbow_shift, neon_green, crimson_ember,
// rainbow) read as Discord/gamer and clash with the cream/felt/brass/claret H&B
// aesthetic — RETIRED from the sale floor (owned copies grandfathered: their
// .ring-* classes + playerRingClass mappings remain so they still equip/render).
// Kept + re-skinned to MATERIAL: pulse_gold → brushed brass + slow gleam;
// shimmer (ice-diamond) stays (on-brand cool sparkle, not neon).
var PAINT_LOCKER_KEEP = ["border_pulse_gold","border_shimmer","banner_classic","banner_camo_pair","banner_masters_pair","banner_azalea_pair","banner_usga_pair","banner_dark_pair","banner_light_pair","banner_champ_pair","card_gold_foil","card_vintage",
  // PL4 — the 8 new titles live in COSMETICS_CATALOG; keep them OFF the retirement
  // pass (line ~266) so they render on the Titles shelf (line ~621) with the new
  // premium materials. The pre-existing legacy titles stay retired (superseded).
  "title_the_closer","title_fairway_finder","title_wind_cheater","title_birdie_hunter","title_comeback_kid","title_mr_consistent","title_dew_sweeper","title_the_diplomat"];
var PRO_SHOP_TIERS = {
  range:   {label:"Range Bucket"},
  proshop: {label:"Pro Shop"},
  locker:  {label:"Member's Locker"},
  cabinet: {label:"Champion's Cabinet"},
  commem:  {label:"Commemorative"}
};
var PRO_SHOP_SHELVES = [
  // v8.25.18x (Founder 2026-06-14) — FEATURED at the top: the award-winning raster
  // avatar decorations lead the revamped store (deco:true items; earned ones live
  // in the Trophy Cabinet). Excluded from the Rings shelf below so they never dup.
  {cat:"border", deco:true, title:"Decorations", meta:"Award-winning frames that wrap your avatar — the headliners"},
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

// PL7 (v8.25.x) — Trophy-Cabinet honors become EQUIPPABLE once the member meets
// the condition. Each earned-only SKU maps to the achievement id (PB.getAchievements
// — the same engine the Trophy Room + member profile use) that proves it. Without
// this, earnedBy items rendered "Not for sale." FOREVER, so a member who actually
// carded an eagle / a hole-in-one / won the season could never wear what they earned
// (the Founder's "Mr Parbaugh meets the requirements but I don't see access"). CTP
// has no tracked season-leader signal yet, so its marker (pc43) stays honestly
// earn-on-the-course (no auto-grant) until that stat exists — never a false unlock.
var EARN_BY_ACHIEVEMENT = {
  pc24_green_jacket:      'champion',
  border_deco_champion:   'champion',
  pc25_ace_marker:        'ace',
  border_deco_holeinone:  'ace',
  border_deco_eagle:      'eagle_eye'
};
// Standalone (used by the try-it-on preview, which lives outside the render
// closure). Recomputes once per call; the shop card path uses the cached set below.
function shopHasEarned(itemId) {
  var need = EARN_BY_ACHIEVEMENT[itemId];
  if (!need) return false;
  try {
    var u = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
    if (!u || typeof PB === "undefined" || !PB.getAchievements) return false;
    return (PB.getAchievements(u) || []).some(function(a) { return a && a.id === need; });
  } catch (e) { return false; }
}

// PL4 (v8.25.x) — title MATERIAL in the brass × Holderness&Bourne house style.
// Every title wears a real collectible material — struck-brass plate / hard-enamel
// pin / embossed leather / foil-blocked cardstock — instead of the old flat pill,
// so the Titles shelf reads as a crafted, brand-cohesive collection. Assigned by
// character; price-tier default. Returns the full <span> class (special pc15/37/38
// keep their character treatments; pc14/36 keep their dedicated plate/leather-tag).
var TITLE_MATERIAL = {
  title_early_bird: "enamel", title_night_owl: "enamel", title_hot_streak: "enamel", title_birdie_hunter: "enamel", pc16_postman: "enamel",
  // Only ONE engraved gold plate (pc14 owns it) — the others spread across
  // accent-bearing materials so no two titles read alike (Founder: each unique).
  title_course_legend: "engraved",
  title_grinder: "leather", title_sharpshooter: "enamel", title_big_spender: "foil", title_the_closer: "enamel", title_sandbagger: "foil",
  title_road_warrior: "leather", title_iron_will: "leather", title_fairway_finder: "leather", title_comeback_kid: "leather", title_wind_cheater: "leather",
  title_mr_consistent: "foil", title_the_diplomat: "foil", title_dew_sweeper: "foil"
};
function shopTitleSpanClass(item) {
  var special = { pc15_cart_path: "title-plain title-plain--road", pc37_sandbagger: "title-plain title-plain--wax", pc38_mulligan: "title-plain title-plain--coin" }[item.id];
  if (special) return special;
  var mat = TITLE_MATERIAL[item.id] || (item.price >= 900 ? "engraved" : item.price >= 600 ? "enamel" : "leather");
  return "title-" + mat;
}

// Earned-FREE titles (Founder 2026-06-15: "there should still be titles for
// achievements that they get for free and from leveling up"). The achievement
// engine (data.js getAchievements) already carries a `title` on ~69 achievements;
// a member's held achievements ARE their free titles. DERIVED (exploit-proof, same
// model as PL7/PL7b) — a member can't claim a title without holding the achievement.
function shopEarnedTitles() {
  try {
    var uid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
    if (!uid || typeof PB === "undefined" || !PB.getAchievements) return [];
    var seen = {};
    return (PB.getAchievements(uid) || []).filter(function (a) {
      if (!a || !a.title || seen[a.title]) return false; seen[a.title] = 1; return true;
    }).map(function (a) { return a.title; });
  } catch (e) { return []; }
}
// Equip a free earned title (sets equippedTitle; clears any equipped buyable title
// cosmetic so they never both show). Re-verifies earned server-of-truth (achievement)
// before writing — a forged call can't equip an un-earned title.
function equipEarnedTitle(name) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  if (shopEarnedTitles().indexOf(name) === -1) { Router.toast("Earn it on the course first."); return; }
  var cur = (currentProfile && currentProfile.equippedTitle) || "";
  var next = (cur === name) ? "" : name;
  var updates = { equippedTitle: next };
  var eq = (currentProfile && currentProfile.equippedCosmetics) || {};
  if (next && eq.title) { eq = Object.assign({}, eq, { title: null }); updates.equippedCosmetics = eq; }
  db.collection("members").doc(currentUser.uid).set(updates, { merge: true }).catch(function () {});
  if (currentProfile) { currentProfile.equippedTitle = next; if (updates.equippedCosmetics) currentProfile.equippedCosmetics = eq; }
  Router.toast(next ? "Title equipped!" : "Title removed");
  if (typeof updateProfileBar === "function") updateProfileBar();
  Router.go("shop", {}, true);
}

Router.register("shop", function() {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);
  var lifetime = getParCoinLifetime(uid);
  // #76 v8.25.160 — the member's level gates the prestige pieces (tenure unlock):
  // some items can't be PURCHASED until you've put in the rounds to reach a level,
  // so the rarest gear signals dedication, not just a coin balance.
  var myLevel = (typeof PB !== "undefined" && PB.getPlayerLevel && uid) ? ((PB.getPlayerLevel(uid) || {}).level || 1) : 1;
  var owned = (currentProfile && currentProfile.ownedCosmetics) || [];

  // PL7 — which earned-only honors has THIS member actually earned? ONE pass over
  // the achievement engine for the whole render (the ~6 cabinet cards then read this
  // cached set, never re-running getAchievements per card). Equippable when met.
  var _earnedAch = {};
  try {
    if (uid && typeof PB !== "undefined" && PB.getAchievements) {
      (PB.getAchievements(uid) || []).forEach(function(a) { if (a && a.id) _earnedAch[a.id] = true; });
    }
  } catch (e) {}
  function _hasEarned(item) {
    var need = EARN_BY_ACHIEVEMENT[item.id];
    return !!(need && _earnedAch[need]);
  }

  // Skip link + editorial masthead (matches roster/HQ pattern)
  var h = '<button type="button" class="roster-skip" onclick="var el=document.getElementById(\'shopCosmetics\');if(el){el.focus();el.scrollIntoView();}">Skip to cosmetics</button>';
  h += '<div class="shop-wrap">';
  h += '<div class="roster-masthead">';
  // v8.24.40 — ParCoin is a platform wallet, not a league ledger; name the
  // platform, not the founding league (wrong label for every other league).
  h += '<div class="roster-eyebrow">THE PRO SHOP · PARBAUGHS</div>';
  h += '<h1 class="roster-headline">Spend it like you earned it.</h1>';
  h += '</div>';

  // #76 — pro-shop atmosphere banner (Vertex Imagen, rubber-hose × H&B country-club
  // scene: walnut shelving, brass trophies, caps, headcovers, felt runner). Slim
  // decorative strip (the goods still lead just below). JS-computed URL handles the
  // GitHub-Pages base path. Generated asset — easy to swap on Founder taste call.
  h += '<div class="shop-hero-banner"><img src="' + (new URL("img/shop/hero.png", document.baseURI)).href + '" alt="The Parbaughs pro shop" loading="lazy" onerror="this.closest(\'.shop-hero-banner\').style.display=\'none\'"></div>';

  // 3m.A Wallet — compact balance CHIP (#41 v8.25.156, critic #10: the shop read
  // as a wallet, not a store, because a tall balance card dominated above the
  // fold. Slimmed to a one-line brass ledger chip so the goods lead sooner.)
  h += '<div class="pb-card pb-card--felt shop-balance-hero" aria-label="Your ParCoin balance, ' + balance + '">';
  h += '<div class="shop-balance-hero__eyebrow"><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg><span>YOUR WALLET</span></div>';
  h += '<div class="shop-balance-hero__amount"><strong>' + balance.toLocaleString() + '</strong> <span class="shop-balance-hero__unit">ParCoin</span></div>';
  if (lifetime) h += '<div class="shop-balance-hero__sub">' + lifetime.toLocaleString() + ' earned all-time</div>';
  h += '</div>';

  // 3m.A.2 Recent activity ledger (async, truthful grouped render)
  h += '<section class="pb-card pb-card--rail shop-ledger" aria-label="Recent activity">';
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
      case 'pc50_eagle_soar':  p = '<path d="M3 13c3-2.5 6-2 9 .5 3-2.5 6-3 9-.5"/><path d="M12 13.5V10"/><path d="M10.6 8.2L12 6l1.4 2.2"/>'; break; // eagle bursting off the card
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
      // v8.25.18x — raster DECORATION preview: overlay the transparent PNG (via the
      // shared playerDecoSrc mapping = preview matches worn) around the avatar.
      var _decoUrl = (typeof playerDecoSrc === 'function') ? playerDecoSrc({ equippedCosmetics: { border: item.id } }) : '';
      var _dp = (typeof playerDecoPctById === 'function') ? playerDecoPctById(item.id) : 110;
      if (_decoUrl) {
        // v8.25.207 — photo FILLS the stage (104px) + per-deco overlay % so the
        // frame hugs flush (was a 72px photo under a 140% deco = the float).
        c += '<div class="shop-ring-stage"><div style="width:104px;height:104px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center">' + (_myAvatar ? '<div style="width:104px;height:104px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center">' + _myAvatar + '</div>' : '<div class="shop-ring-core"></div>') + '<img alt="" aria-hidden="true" src="' + _decoUrl + '" style="position:absolute;top:50%;left:50%;width:' + _dp + '%;height:' + _dp + '%;transform:translate(-50%,-50%);pointer-events:none"></div></div>';
      } else {
        var ringCss = item.ringClass ? '' : 'border:' + (item.css || '3px solid ' + item.preview);
        // v8.25.42 — showcase the ring as a real object: 104px (was a cramped 56px
        // that hid the rope studs / fescue / claret sweep) on a clean brass-tinted
        // ground, the SAME worn .ring-* class so the preview matches what you equip.
        c += '<div class="shop-ring-stage"><div class="' + (item.ringClass || '') + '" style="width:104px;height:104px;border-radius:50%;' + ringCss + ';display:flex;align-items:center;justify-content:center;position:relative">' + (_myAvatar ? '<div style="width:82px;height:82px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center">' + _myAvatar + '</div>' : '<div class="shop-ring-core"></div>') + '</div></div>';
      }
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
      // PL5 — present the marker as a crafted object resting on felt (richer
      // ground + recessed rim + drop shadow under the glyph), larger so the
      // metalwork reads. Was a flat 56px glyph on the pale shared stage.
      var _mg = (typeof pbMarkerGlyph === 'function') ? pbMarkerGlyph(item.id, 66) : '';
      c += '<div class="shop-surface-stage shop-surface-stage--marker">' + (_mg ? '<span class="shop-marker-obj">' + _mg + '</span>' : '<span style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 30%,' + item.preview + ',rgba(0,0,0,.35));box-shadow:0 3px 4px -2px rgba(0,0,0,.5)"></span>') + '</div>';
    } else if (item.cat === 'voice') {
      // v8.25.230 — voice packs are CHARACTER cosmetics: preview the caddie's real
      // rubber-hose portrait (the same art Settings + the feed bot use) so the pack
      // reads as WHO you're buying, not a generic flag. Real paths from pbCaddies
      // (img/avatars/caddy-*.jpg); onerror falls back to the flag.
      var _vimg = { pc21_old_tom: 'caddy-oldtom', pc22_bag_room: 'caddy-bagroom' }[item.id];
      var _vbase = (typeof window !== 'undefined' && window.__PB_BASE__) ? window.__PB_BASE__ : '/';
      c += '<div style="height:60px;margin-bottom:8px;display:flex;align-items:center;justify-content:center">' + (_vimg
        ? '<span style="width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid var(--cb-brass);display:inline-flex;box-shadow:0 2px 6px rgba(0,0,0,.18)"><img src="' + _vbase + 'img/avatars/' + _vimg + '.jpg" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentNode.parentNode.innerHTML=\'\'"></span>'
        : _shopFlagSvg(20)) + '</div>';
    } else if (item.cat === 'title') {
      // v8.24.76 — pc36 previews as its leather bag tag (was the same brass
      // plate as pc14, so the two priciest title plates looked identical).
      var _plateCls = item.id === 'pc36_member_tag' ? 'title-tag-leather' : 'title-engraved';
      var _plateText = item.id === 'pc36_member_tag' ? 'Member No. 7' : 'Grinder';
      // PL4 — premium material per title (brass × H&B house style: brass plate /
      // enamel pin / embossed leather / foil card), replacing the flat pill.
      var _titleEl = item.plate
        ? '<span class="' + _plateCls + '">' + _plateText + '</span>'
        : '<span class="' + shopTitleSpanClass(item) + '" style="--ti:' + item.preview + '">' + escHtml(item.name) + '</span>';
      c += '<div style="padding:4px 0 8px;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="font-size:12px;font-weight:700;color:var(--cream)">' + escHtml(_myName) + '</div>' + _titleEl + '</div>';
    }
    c += '<div class="shop-item__name">' + item.name + '</div>';
    c += '<div class="shop-item__desc">' + item.desc + '</div>';
    // v8.25.8 — "Try it on" (Founder: "shop should allow for preview as well").
    // Opens a full-size preview of the piece applied to the member's own avatar /
    // name / card before any coins are spent. Shown for everything with a real
    // preview (earned-only honors are previewable ONCE the member has earned them —
    // PL7 — so they can see it on before equipping; un-earned honors stay un-browseable).
    if (!item.earnedBy || _hasEarned(item)) {
      c += '<button type="button" class="shop-item__tryon" onclick="shopPreviewCosmetic(\'' + item.id + '\')" aria-label="Preview ' + escHtml(item.name) + ' on your profile"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" style="flex-shrink:0"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>Try it on</button>';
    }
    if (item.earnedBy) {
      // PL7 — if the member has met the earn condition, the honor is THEIRS to wear
      // (P10: clearly mark it earned + give the Equip action). Otherwise it stays in
      // the cabinet with its earn-condition copy — the whole point of the cabinet.
      if (_hasEarned(item)) {
        if (equipped) {
          c += '<div class="shop-item__state shop-item__state--equipped">Earned · Equipped</div>';
        } else {
          c += '<div class="shop-cabinet__unlocked"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-1px;margin-right:4px"><path d="M5 13l4 4L19 7"/></svg>You earned this</div>';
          c += '<button class="shop-item__equip" onclick="equipCosmetic(\'' + item.id + '\',\'' + (item.plate ? 'titleplate' : item.cat) + '\')">Equip</button>';
        }
      } else {
        c += '<div class="shop-cabinet__earn">' + item.earnedBy + '. Not for sale.</div>';
      }
    } else if (item.arriving) {
      c += '<div class="shop-item__state shop-item__state--arriving">Arriving</div>';
    } else if (isOwned && equipped) {
      c += '<div class="shop-item__state shop-item__state--equipped">Equipped</div>';
    } else if (isOwned) {
      c += '<button class="shop-item__equip" onclick="equipCosmetic(\'' + item.id + '\',\'' + (item.plate ? 'titleplate' : item.cat) + '\')">Equip</button>';
    } else if (item.lvl && myLevel < item.lvl) {
      // #76 — tenure gate: the prestige pieces unlock at a level you reach by
      // PLAYING (not just saving coins), so they read as earned dedication.
      c += '<div class="shop-item__state shop-item__state--locked shop-item__state--lvl"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:3px"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>Unlocks at Lv ' + item.lvl + '</div>';
    } else if (canAfford) {
      c += '<button class="shop-item__buy" onclick="purchaseCosmetic(\'' + item.id + '\')"><span class="shop-item__buy-label">Buy</span><span class="shop-item__price">' + _shopCoinSvg + ' ' + item.price + '</span></button>';
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
      caddies.forEach(function(cd, idx) {
        var skuItem = cd.sku ? PRO_SHOP_CATALOG.filter(function(i) { return i.id === cd.sku; })[0] : null;
        // v8.25.133 (#71) — pb-caddy-host: hovering the card "perks up" the
        // living portrait; staggered animation-delay desyncs the idle breathing.
        var c = '<div class="shop-item shop-item--proshop pb-caddy-host">';
        c += '<div class="shop-tier-chip shop-tier-chip--proshop">Caddy</div>';
        // v8.25.130 — show the caddie's rubber-hose character portrait (was a
        // generic brass flag for every caddy — indistinguishable).
        var _cdImg = cd.img ? ((typeof window !== 'undefined' && window.__PB_BASE__ ? window.__PB_BASE__ : '/') + cd.img) : '';
        // PL6 — the breathing portrait now bobs INSIDE a STATIC ring (the border +
        // overflow:hidden + clip-path live on the wrapper, not on the moving img), so
        // the ring no longer floats with the breathing animation. Mirrors the Settings
        // caddie chip (.theme-row__chip--photo) — the will-change compositor layer is
        // contained by clip-path+isolation. onerror falls back to the caddie initial
        // (clean), not the brass flag (the Founder's "weird symbols").
        var _cdInit = escHtml((cd.name || '?').trim().charAt(0).toUpperCase());
        c += '<div class="shop-surface-stage"><span class="shop-caddie-ring" style="border-color:' + (cd.accent || 'var(--cb-brass)') + '">' +
          (_cdImg ? '<img class="pb-caddy-live" src="' + _cdImg + '" alt="" style="animation-delay:-' + (idx * 1.07).toFixed(2) + 's" onerror="this.style.display=\'none\';this.parentElement.textContent=\'' + _cdInit + '\'">' : _cdInit) +
          '</span></div>';
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
    // deco shelf = the buyable raster decorations; every other border shelf
    // (Rings) excludes deco items so they live only in their featured shelf.
    var items = PRO_SHOP_CATALOG.filter(function(i) {
      if (shelf.deco) return i.deco && !i.earnedBy && !i.retired;
      return i.cat === shelf.cat && !i.earnedBy && !i.retired && !i.deco;
    });
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

  // ── Earned Titles — FREE, from achievements + leveling (Founder 2026-06-15:
  //    "there should still be titles for achievements that they get for free and
  //    from leveling up"). DERIVED from the member's held achievements (exploit-
  //    proof, same model as PL7/PL7b) — each renders as an engraved trophy plate.
  var _earnedTitles = (typeof shopEarnedTitles === 'function') ? shopEarnedTitles() : [];
  var _eqTitle = (currentProfile && currentProfile.equippedTitle) || "";
  h += '<div class="shop-shelf"><div class="shop-shelf__head"><span class="shop-shelf__title">Earned Titles</span><span class="shop-shelf__meta">Free — won on the course, never bought</span></div>';
  h += '<div class="shop-shelf__rail">';
  if (_earnedTitles.length) {
    _earnedTitles.forEach(function(t) {
      var eqd = _eqTitle === t;
      var jt = String(t).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      var c = '<div class="shop-item shop-item--commem' + (eqd ? ' shop-item--equipped' : '') + '">';
      c += '<div class="shop-tier-chip shop-tier-chip--commem">Earned</div>';
      c += '<div class="shop-surface-stage"><span class="title-engraved">' + escHtml(t) + '</span></div>';
      c += '<div class="shop-item__name">' + escHtml(t) + '</div>';
      c += '<div class="shop-item__desc">A title you earned on the course. Wears under your name.</div>';
      if (eqd) c += '<div class="shop-item__state shop-item__state--equipped">Equipped</div>';
      else c += '<button class="shop-item__equip" onclick="equipEarnedTitle(\'' + jt + '\')">Equip</button>';
      c += '</div>';
      h += c;
    });
  } else {
    h += '<div class="shop-item shop-item--commem"><div class="shop-tier-chip shop-tier-chip--commem">Earned</div><div class="shop-item__desc" style="padding:14px 4px">No titles earned yet — log rounds, break scoring barriers, win events and your titles unlock as you play.</div><button class="shop-item__equip" onclick="Router.go(\'trophyroom\')">See achievements</button></div>';
  }
  h += '</div></div>';

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

  // ── The Archive (Founder 2026-06-15): a provenance museum for every avatar
  //    DECORATION — art + name + how-it's-flown + "Est. 2026". The retention/FOMO
  //    engine (#76): a newcomer who sees a frame worn on a veteran can learn WHERE
  //    + WHEN it came from. Read-only reference (owned decos still equip via the
  //    Decorations shelf + Your Locker) — this is the museum, not the till. Seeds
  //    from the 8 shipped decos; seasonal drops + retired frames accrue here over time.
  var _archDecos = PRO_SHOP_CATALOG.filter(function(c) { return c.deco; });
  if (_archDecos.length) {
    var _decoArt = { border_deco_caddy: 'deco-caddy-companion.png', border_deco_holeinone: 'deco-hole-in-one.png', border_deco_champion: 'deco-champion.png', border_deco_azalea: 'deco-masters-azalea.png', border_deco_frost: 'deco-frost-delay.png', border_deco_eagle: 'deco-eagle.png', border_deco_bramble: 'deco-bramble-rose.png', border_deco_autumn: 'deco-autumn.png' };
    var _decoSeason = { border_deco_azalea: 'Seasonal · Spring drop', border_deco_frost: 'Seasonal · Winter drop', border_deco_autumn: 'Seasonal · Fall drop' };
    var _archBase = (typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/";
    h += '<div class="shop-cabinet shop-archive"><div class="shop-cabinet__eyebrow">The Archive</div><div class="shop-cabinet__title">Every frame, and how it\'s flown.</div>';
    h += '<div class="shop-shelf__rail">';
    _archDecos.forEach(function(item) {
      var f = _decoArt[item.id];
      var prov = _decoSeason[item.id] || (item.earnedBy ? 'Earned · ' + item.earnedBy : (item.lvl ? 'Reach Level ' + item.lvl : 'Pro Shop'));
      h += '<div class="shop-item shop-archive__item">';
      h += '<div class="shop-surface-stage shop-archive__stage">' + (f ? '<img alt="" loading="lazy" src="' + _archBase + 'img/cosmetics/' + f + '" class="shop-archive__art">' : '') + '</div>';
      h += '<div class="shop-item__name">' + escHtml(item.name) + '</div>';
      h += '<div class="shop-archive__prov">' + escHtml(prov) + ' · Est. 2026</div>';
      h += '<div class="shop-item__desc">' + escHtml(item.desc) + '</div>';
      h += '</div>';
    });
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
  // PL7 — an earned-only honor the member has actually earned counts as owned here,
  // so the preview offers "Equip it" (not "Not for sale"/Buy).
  var isOwned = owned.indexOf(item.id) !== -1 || (item.price === 0 && !item.earnedBy) || shopHasEarned(item.id);
  var equippedMap = (prof && prof.equippedCosmetics) || {};
  var equipped = equippedMap[item.cat] === item.id || (item.plate && equippedMap.titleplate === item.id);

  // Full-size stage, per category — applied to the member's own identity.
  var stage = '';
  if (item.cat === 'border') {
    var _decoTry = (typeof playerDecoSrc === 'function') ? playerDecoSrc({ equippedCosmetics: { border: item.id } }) : '';
    if (_decoTry) {
      // raster decoration try-it-on: photo FILLS the 132px stage + per-deco overlay
      // % so the frame hugs flush (v8.25.207; was 92px photo under a 140% deco = float).
      var _dpTry = (typeof playerDecoPctById === 'function') ? playerDecoPctById(item.id) : 110;
      stage = '<div style="width:132px;height:132px;border-radius:50%;position:relative;margin:0 auto;display:flex;align-items:center;justify-content:center"><div style="width:132px;height:132px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg3,var(--cb-canvas))">' + myAvatar + '</div><img alt="" aria-hidden="true" src="' + _decoTry + '" style="position:absolute;top:50%;left:50%;width:' + _dpTry + '%;height:' + _dpTry + '%;transform:translate(-50%,-50%);pointer-events:none"></div>';
    } else {
      var ring = item.css || ('3px solid ' + (item.preview || 'var(--cb-brass)'));
      stage = '<div class="' + (item.ringClass || '') + '" style="width:118px;height:118px;border-radius:50%;border:' + ring + ';margin:0 auto;display:flex;align-items:center;justify-content:center;background:var(--bg3,var(--cb-canvas))">' + myAvatar + '</div>';
    }
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
    stage = '<div style="text-align:center"><div style="display:flex;justify-content:center">' + _shopFlagSvg(38) + '</div><div style="font-weight:700;font-size:15px;color:var(--cb-ink);margin-top:6px">' + escHtml(cad ? cad.name : item.name) + '</div>'
      + (line ? '<div style="font-family:var(--font-display);font-style:italic;font-size:14px;color:var(--cb-ink);background:var(--cb-chalk-2);border-radius:10px;padding:10px 12px;margin-top:10px;line-height:1.4">“' + escHtml(line) + '”</div>' : '') + '</div>';
  } else if (item.cat === 'title' || item.cat === 'nameplate') {
    var titleEl = item.plate
      ? '<span class="' + (item.id === 'pc36_member_tag' ? 'title-tag-leather' : 'title-engraved') + '">' + escHtml(item.id === 'pc36_member_tag' ? 'Member No. 7' : 'Grinder') + '</span>'
      : '<span class="' + (typeof shopTitleSpanClass === 'function' ? shopTitleSpanClass(item) : 'title-plain') + '" style="--ti:' + (item.preview || 'var(--cb-brass)') + '">' + escHtml(item.name) + '</span>';
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
    action = '<button type="button" onclick="purchaseCosmetic(\'' + esc2(item.id) + '\');shopClosePreview()" style="width:100%;min-height:48px;background:linear-gradient(180deg,var(--cb-brass-3) 0%,var(--cb-brass) 48%,var(--cb-brass-deep) 100%);border:1px solid var(--cb-brass-deep);border-radius:12px;color:#2A1E08;font-weight:800;font-size:14px;letter-spacing:.3px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-shadow:0 1px 0 rgba(255,255,255,.30);box-shadow:inset 0 1px 0 rgba(255,255,255,.50),inset 0 -2px 4px rgba(80,52,12,.40),0 3px 8px rgba(40,28,10,.30)">Buy <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;background:rgba(28,18,6,.16);box-shadow:inset 0 1px 2px rgba(28,18,6,.30);font-variant-numeric:tabular-nums">' + _shopCoinSvg + ' ' + item.price + '</span></button>';
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
