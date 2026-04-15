// ========== THEME SYSTEM ==========
var THEMES = {
  classic: {label:"Parbaugh Classic", desc:"Gold & dark — the original", colors:["#0e1118","#c9a84c","#eae8e0"], meta:"#0e1118", texture:"classic-tile.jpg", texOp:.22, texBlend:"overlay"},
  camo:    {label:"Camo",             desc:"Olive & flame — hunting lodge", colors:["#12140e","#d4943c","#e8e4d8"], meta:"#12140e", texture:"camo-tile.jpg", texOp:.25, texBlend:"overlay"},
  masters: {label:"Masters",          desc:"Pine green & Augusta yellow", colors:["#071a10","#fdd835","#f0efe8"], meta:"#071a10", texture:"masters-tile.jpg", texOp:.20, texBlend:"soft-light"},
  azalea:  {label:"Azalea",           desc:"Pink blooms & deep green", colors:["#0e1118","#e8729a","#f0efe8"], meta:"#0e1118", texture:"azalea-tile.jpg", texOp:.22, texBlend:"overlay"},
  usga:    {label:"USGA",             desc:"Navy & red — clean GHIN style", colors:["#0a1628","#c41e3a","#f2f0ea"], meta:"#0a1628", texture:"usga-tile.jpg", texOp:.22, texBlend:"overlay"},
  sundayred:{label:"Sunday Red",      desc:"Championship Sunday — bold red", colors:["#10080a","#d4243c","#f0e8e8"], meta:"#10080a", texture:"champion-tile.jpg", texOp:.20, texBlend:"soft-light"},
  dark:    {label:"Dark Mode",        desc:"True black — OLED friendly", colors:["#000000","#b89a3e","#d8d6d0"], meta:"#000000", texture:"dark-tile.jpg", texOp:.18, texBlend:"overlay"},
  light:   {label:"Light Mode",       desc:"Clean & bright — daytime", colors:["#f5f3ee","#8a6d1e","#1a1a18"], meta:"#f5f3ee", texture:"light-tile.jpg", texOp:.20, texBlend:"multiply"}
};
function applyTheme(themeId) {
  if (!themeId || themeId === "classic") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
  var t = THEMES[themeId || "classic"];
  // Update mobile browser chrome color
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta && t) meta.setAttribute("content", t.meta);
  else if (meta) meta.setAttribute("content", "#0e1118");
  // Set html background color for the theme (body is transparent so texture shows through)
  document.documentElement.style.background = t ? t.meta : "#0e1118";
  // Apply texture to the overlay div (real DOM element, not pseudo-element)
  var overlay = document.getElementById("textureOverlay");
  if (overlay && t && t.texture) {
    overlay.style.backgroundImage = "url('textures/" + t.texture + "')";
    overlay.style.opacity = String(t.texOp);
    overlay.style.mixBlendMode = t.texBlend;
    overlay.style.backgroundRepeat = "repeat";
    overlay.style.backgroundSize = "300px 300px";
    console.log("[Texture] Applied:", t.texture, "opacity:", t.texOp, "blend:", t.texBlend);
  } else {
    console.warn("[Texture] Failed - overlay:", !!overlay, "theme:", themeId, "texture:", t ? t.texture : "none");
  }
}
function saveTheme(themeId) {
  applyTheme(themeId);
  // Persist to localStorage for instant load on next visit
  try { localStorage.setItem("pb_theme", themeId); } catch(e) {}
  // Persist to Firestore for cross-device sync
  if (currentUser && db) {
    db.collection("members").doc(currentUser.uid).update({theme: themeId}).catch(function(){});
  }
}
// Load theme immediately from localStorage (before auth resolves)
(function() {
  try {
    var saved = localStorage.getItem("pb_theme");
    if (saved && THEMES[saved]) applyTheme(saved);
    else applyTheme("classic");
  } catch(e) { applyTheme("classic"); }
})();
// Retry texture application after DOM is fully loaded (in case div wasn't ready)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    var saved = "classic";
    try { saved = localStorage.getItem("pb_theme") || "classic"; } catch(e) {}
    applyTheme(saved);
  });
}
