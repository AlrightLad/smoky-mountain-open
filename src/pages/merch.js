/* ================================================
   PAGE: MERCH — "coming soon" vintage-poster welcome
   ================================================
   v8.25.48 (Founder 2026-06-13): the merch program is coming soon, so the page
   is a tasteful Lee-Wybranski-style tournament-poster screen (clubhouse + rolling
   course + dawn sky + wordmark) instead of bouncing to the Shop. Pure inline SVG,
   no external asset; Clubhouse design tokens with hex fallbacks (var(--tok,#hex))
   so the poster never renders a missing-token black on any theme.
   ================================================ */
Router.register("merch", function() {
  var h = '<div class="sh"><h2>Merch</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // A vintage golf-poster: dawn sky + low sun, layered fairway hills, a clean
  // clubhouse silhouette with a flag, framed, with the wordmark + COMING SOON.
  h += '<div class="merch-poster">';
  h += '<svg viewBox="0 0 400 580" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Parbaughs merch — coming soon">';
  h +=   '<defs>';
  h +=     '<linearGradient id="mp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--cb-felt,#0e2c20)"/><stop offset="60%" stop-color="#1c4334"/><stop offset="100%" stop-color="#3a5a3f"/></linearGradient>';
  h +=     '<radialGradient id="mp-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f6e6b4" stop-opacity=".95"/><stop offset="55%" stop-color="var(--cb-brass,#caa04a)" stop-opacity=".45"/><stop offset="100%" stop-color="#caa04a" stop-opacity="0"/></radialGradient>';
  h +=     '<linearGradient id="mp-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--cb-paper,#efe6d2)"/><stop offset="100%" stop-color="var(--cb-chalk,#e7dcc4)"/></linearGradient>';
  h +=   '</defs>';
  // poster frame
  h +=   '<rect x="6" y="6" width="388" height="568" rx="6" fill="#0e2c20"/>';
  h +=   '<rect x="14" y="14" width="372" height="552" rx="3" fill="none" stroke="var(--cb-brass,#caa04a)" stroke-width="1.5" opacity=".7"/>';
  // sky + sun
  h +=   '<rect x="16" y="16" width="368" height="300" fill="url(#mp-sky)"/>';
  h +=   '<circle cx="262" cy="150" r="86" fill="url(#mp-sun)"/>';
  h +=   '<circle cx="262" cy="150" r="30" fill="#f6e6b4" opacity=".9"/>';
  // distant treeline
  h +=   '<path d="M16 250 Q 90 222 150 244 Q 230 214 300 242 Q 350 226 384 246 L384 316 L16 316 Z" fill="#163024"/>';
  // clubhouse silhouette (centered): body + gabled roof + cupola + flag
  h +=   '<g transform="translate(146,176)">';
  h +=     '<rect x="0" y="46" width="108" height="74" fill="var(--cb-chalk,#e7dcc4)"/>';                 // clubhouse body
  h +=     '<path d="M-8 50 L54 8 L116 50 Z" fill="var(--cb-brass,#caa04a)"/>';                            // gable roof
  h +=     '<rect x="44" y="-6" width="20" height="20" fill="var(--cb-chalk,#e7dcc4)"/><path d="M40 -4 L54 -16 L68 -4 Z" fill="var(--cb-brass,#caa04a)"/>';  // cupola
  h +=     '<line x1="54" y1="-16" x2="54" y2="-34" stroke="#0e2c20" stroke-width="1.5"/><path d="M54 -34 L70 -29 L54 -24 Z" fill="#9c3b34"/>';            // cupola flag
  h +=     '<rect x="12" y="64" width="14" height="34" fill="#163024"/><rect x="47" y="64" width="14" height="34" fill="#163024"/><rect x="82" y="64" width="14" height="34" fill="#163024"/>';  // windows/door
  h +=   '</g>';
  // rolling fairway foreground (layered greens)
  h +=   '<path d="M16 316 Q 130 296 220 312 Q 310 326 384 308 L384 396 L16 396 Z" fill="#3c5848"/>';
  h +=   '<path d="M16 348 Q 150 330 260 350 Q 330 362 384 348 L384 420 L16 420 Z" fill="#2f4a38"/>';
  // a flagstick on the lawn
  h +=   '<line x1="318" y1="356" x2="318" y2="318" stroke="var(--cb-brass,#caa04a)" stroke-width="2" stroke-linecap="round"/><path d="M318 318 L338 324 L318 330 Z" fill="#9c3b34"/>';
  // title band
  h +=   '<rect x="16" y="396" width="368" height="170" fill="url(#mp-band)"/>';
  h +=   '<text x="200" y="446" text-anchor="middle" font-family="var(--font-display,Georgia,serif)" font-size="44" font-weight="700" font-style="italic" fill="var(--cb-felt,#1d3a2a)" letter-spacing="-1">Parbaughs</text>';
  h +=   '<text x="200" y="474" text-anchor="middle" font-family="var(--font-mono,monospace)" font-size="11" font-weight="700" letter-spacing="5" fill="var(--cb-brass-deep,#9c7c38)">THE PRO SHOP</text>';
  h +=   '<line x1="120" y1="492" x2="280" y2="492" stroke="var(--cb-brass,#caa04a)" stroke-width="1" opacity=".5"/>';
  h +=   '<text x="200" y="520" text-anchor="middle" font-family="var(--font-display,Georgia,serif)" font-size="20" font-weight="700" fill="var(--cb-ink,#2a2118)">Coming Soon</text>';
  h +=   '<text x="200" y="546" text-anchor="middle" font-family="var(--font-mono,monospace)" font-size="9" letter-spacing="3" fill="var(--cb-mute,#6b6354)">EST. 2026 · YORK, PA</text>';
  h += '</svg>';
  h += '</div>';

  h += '<div class="merch-note">Caps, headcovers, towels and more — in the works. The Commissioner will sound the horn when the shop opens.</div>';

  document.querySelector('[data-page="merch"]').innerHTML = h;
});
