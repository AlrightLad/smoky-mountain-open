/* ================================================
   PAGE: COSMETICS SHOP — Spend ParCoins on cosmetics
   Categories: Profile Borders, Banners, Card Themes
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

var COSMETICS_CATALOG = [
  // ── PROFILE BORDERS (shown around avatar) ──
  {id:"border_bronze",     cat:"border", name:"Bronze Ring",       price:50,  desc:"Subtle bronze glow",       css:"2px solid #CD7F32",          preview:"#CD7F32"},
  {id:"border_silver",     cat:"border", name:"Silver Ring",       price:75,  desc:"Clean silver finish",       css:"2px solid #C0C0C0",          preview:"#C0C0C0"},
  {id:"border_gold",       cat:"border", name:"Gold Ring",         price:150, desc:"Premium gold band",         css:"3px solid #c9a84c",          preview:"#c9a84c"},
  {id:"border_diamond",    cat:"border", name:"Diamond Ring",      price:300, desc:"Sparkling diamond edge",    css:"3px solid #b9f2ff",          preview:"#b9f2ff"},
  {id:"border_fire",       cat:"border", name:"Fire Ring",         price:200, desc:"Hot orange glow",           css:"3px solid #ff6b35",          preview:"#ff6b35"},
  {id:"border_emerald",    cat:"border", name:"Emerald Ring",      price:200, desc:"Deep green prestige",       css:"3px solid #50c878",          preview:"#50c878"},

  // ── PROFILE BANNERS (gradient behind avatar on profile) ──
  {id:"banner_sunset",     cat:"banner", name:"Sunset Fairway",    price:100, desc:"Warm orange-pink gradient", css:"linear-gradient(135deg,#ff6b35,#e8729a)", preview:"#ff6b35"},
  {id:"banner_ocean",      cat:"banner", name:"Ocean Drive",       price:100, desc:"Cool blue-teal sweep",      css:"linear-gradient(135deg,#2563eb,#06b6d4)", preview:"#2563eb"},
  {id:"banner_midnight",   cat:"banner", name:"Midnight Green",    price:100, desc:"Dark green Augusta vibe",   css:"linear-gradient(135deg,#064e3b,#059669)", preview:"#064e3b"},
  {id:"banner_storm",      cat:"banner", name:"Thunder Storm",     price:150, desc:"Deep purple-gray power",    css:"linear-gradient(135deg,#581c87,#374151)", preview:"#581c87"},
  {id:"banner_gold_rush",  cat:"banner", name:"Gold Rush",         price:200, desc:"Rich gold gradient",        css:"linear-gradient(135deg,#92400e,#f59e0b)", preview:"#92400e"},

  // ── CARD THEMES (how your rounds appear in the feed) ──
  {id:"card_neon",         cat:"card", name:"Neon Glow",           price:125, desc:"Bright accent border on your feed cards", css:"border-left:3px solid #4ade80",    preview:"#4ade80"},
  {id:"card_royal",        cat:"card", name:"Royal Purple",        price:125, desc:"Purple accent on your rounds",            css:"border-left:3px solid #a78bfa",    preview:"#a78bfa"},
  {id:"card_fire",         cat:"card", name:"Hot Shot",            price:150, desc:"Red-orange fire accent",                  css:"border-left:3px solid #ef4444",    preview:"#ef4444"},
  {id:"card_ice",          cat:"card", name:"Ice Cold",            price:150, desc:"Cool blue frost accent",                  css:"border-left:3px solid #38bdf8",    preview:"#38bdf8"}
];

var COSMETIC_CATS = {
  border: {label: "Profile Borders", icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>'},
  banner: {label: "Profile Banners", icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/></svg>'},
  card:   {label: "Card Themes",     icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>'}
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
    var isOwned = owned.indexOf(item.id) !== -1;
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
    }

    h += '<div style="font-size:12px;font-weight:700;color:var(--cream)">' + item.name + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);margin-top:2px;line-height:1.3">' + item.desc + '</div>';

    if (isOwned && equipped) {
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
  if (equipped[cat] === itemId) {
    // Unequip
    equipped[cat] = null;
  } else {
    equipped[cat] = itemId;
  }
  db.collection("members").doc(currentUser.uid).set({ equippedCosmetics: equipped }, { merge: true }).catch(function(){});
  if (currentProfile) currentProfile.equippedCosmetics = equipped;
  Router.toast(equipped[cat] ? "Equipped!" : "Unequipped");
  Router.go("shop", {}, true);
}
