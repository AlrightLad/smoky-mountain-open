// ========== THEME SYSTEM ==========
var THEMES = {
  classic: {label:"Parbaugh Classic", desc:"Gold & dark — the original", colors:["#0e1118","#c9a84c","#eae8e0"], meta:"#0e1118"},
  camo:    {label:"Camo",             desc:"Olive & flame — hunting lodge", colors:["#12140e","#d4943c","#e8e4d8"], meta:"#12140e"},
  masters: {label:"Masters",          desc:"Pine green & Augusta yellow", colors:["#071a10","#fdd835","#f0efe8"], meta:"#071a10"},
  azalea:  {label:"Azalea",           desc:"Pink blooms & deep green", colors:["#0e1118","#e8729a","#f0efe8"], meta:"#0e1118"},
  usga:    {label:"USGA",             desc:"Navy & red — clean GHIN style", colors:["#0a1628","#c41e3a","#f2f0ea"], meta:"#0a1628"},
  sundayred:{label:"Sunday Red",      desc:"Championship Sunday — bold red", colors:["#10080a","#d4243c","#f0e8e8"], meta:"#10080a"},
  dark:    {label:"Dark Mode",        desc:"True black — OLED friendly", colors:["#000000","#b89a3e","#d8d6d0"], meta:"#000000"},
  light:   {label:"Light Mode",       desc:"Clean & bright — daytime", colors:["#f5f3ee","#8a6d1e","#1a1a18"], meta:"#f5f3ee"}
};
function applyTheme(themeId) {
  if (!themeId || themeId === "classic") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
  // Update mobile browser chrome color
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta && THEMES[themeId]) meta.setAttribute("content", THEMES[themeId].meta);
  else if (meta) meta.setAttribute("content", "#0e1118");
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
  } catch(e) {}
})();
