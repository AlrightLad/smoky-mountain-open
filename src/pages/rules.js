/* ================================================
   PAGE: RULES
   ================================================ */
Router.register("rules", function() {
  var h = '<div class="sh"><h2>Rules</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // Parbaugh house rules
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Parbaugh house rules</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  h += 'All Parbaugh rounds follow USGA rules with the following exceptions:<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Breakfast balls:</span> 2 per round — 1 on the front 9, 1 on the back 9. Re-tee only, no re-hitting approach shots.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Honor system:</span> Scouts honor. Log your scores truthfully. Having another Parbaugh attest your score earns 150 XP.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Scoring:</span> Only the player can log their own rounds. The Commissioner cannot override scores.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Profile ownership:</span> Only the player can edit their own profile. No exceptions.';
  h += '</div></div></div>';

  // Game formats
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Game formats</span></div>';

  var formats = [
    {name:"Stroke play",desc:"Standard golf. Lowest total score wins. Every stroke counts. The purest form of the game."},
    {name:"Parbaugh Stroke Play",desc:"The Parbaughs signature format. Handicap-adjusted stroke play that levels the playing field. Your net score = gross score minus your GHIN handicap strokes (allocated by hole difficulty). The lowest net score wins. A 20-handicapper and a scratch player compete on equal footing."},
    {name:"Stableford",desc:"Point-based scoring. Double bogey or worse = 0 pts, Bogey = 1, Par = 2, Birdie = 3, Eagle = 4, Albatross = 5. Higher is better. Rewards aggressive play and minimizes blowup hole damage."},
    {name:"Scramble",desc:"Team format (2-4 players). Everyone tees off, pick the best shot, everyone plays from there. Repeat until holed. Captain hits last on every shot. Great equalizer across skill levels."},
    {name:"Best ball",desc:"Team format. Everyone plays their own ball for the entire hole. The lowest individual score on each hole counts as the team score."},
    {name:"Match play",desc:"Head-to-head, hole by hole. Win a hole = 1 up. Lose a hole = 1 down. Tie = halved. Match ends when one player is up by more holes than remain (e.g. 3&2 means 3 up with 2 to play)."},
    {name:"Skins",desc:"Each hole has a value (skin). Lowest score on the hole wins the skin. If tied, the skin carries over to the next hole. High-pressure format where one great hole can win everything."},
    {name:"Chapman (Pinehurst)",desc:"Both players tee off. Players swap balls for the second shot. After the second shot, choose the better ball and alternate shots until holed."},
    {name:"Shamble",desc:"Like a scramble off the tee — everyone tees off, pick the best drive, then everyone plays their own ball from there. Combines the scramble tee advantage with individual play."}
  ];

  formats.forEach(function(f) {
    h += '<div class="card"><div style="padding:14px 16px">';
    h += '<div style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:4px">' + f.name + '</div>';
    h += '<div style="font-size:12px;color:var(--muted);line-height:1.6">' + f.desc + '</div>';
    h += '</div></div>';
  });
  h += '</div>';

  // Season point system explanation
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Season point system</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  h += 'The Parbaugh Season uses a handicap-adjusted point system so all skill levels compete on an even playing field. Your expected score is calculated as course par + your handicap. Points are awarded based on how you perform against that number.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Base points:</span> Each round starts at 100 points. For every stroke better than your expected score, you gain 5 points. For every stroke worse, you lose 5 points. Minimum 10 points per round — you always get credit for showing up.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Example:</span> If par is 72 and your handicap is 18, your expected score is 90. Shoot 85 and you earn 125 points (100 + 5×5). Shoot 95 and you earn 75 points (100 - 5×5). A scratch golfer shooting 75 (+3) earns 85 points, same as a 20-handicap shooting 95 (+3). Equal performance = equal points.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Bonus points:</span><br>';
  h += '• Personal best round: +50 points<br>';
  h += '• New course played: +25 points<br>';
  h += '• Attested score: +15 points<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Why points?</span> A 40-handicap who beats their expected score by 5 strokes earns the same points as a scratch player who beats theirs by 5. Improvement is rewarded equally regardless of skill. Playing more rounds and more courses also earns more points — activity is rewarded alongside performance.';
  h += '</div></div></div>';

  // Scramble specific rules
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Scramble rules</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  h += '<span style="color:var(--gold);font-weight:600">Captain:</span> Every scramble team has a designated captain. Captain must hit last on every shot — tee shots, approaches, chips, and putts.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Ball placement:</span> Within one club length of the chosen shot, no closer to the hole. On the green, within one putter head length.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Tee shots:</span> Each player must contribute a minimum number of tee shots (typically 3-4 per 18 holes depending on team size).<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Scoring:</span> Both players log the scramble round separately on their own profile for tracking purposes.';
  h += '</div></div></div>';

  // USGA link
  h += '<div style="padding:16px;text-align:center">';
  h += '<a href="https://www.usga.org/rules/rules-and-clarifications/rules-and-clarifications.html" target="_blank" rel="noopener" style="font-size:12px;color:var(--gold);text-decoration:none;letter-spacing:.3px">Official USGA Rules of Golf →</a>';
  h += '</div>';

  // GHIN Handicap explanation
  h += '<div class="section"><div class="sec-head"><span class="sec-title">GHIN Handicap System</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  h += 'The Parbaughs uses the <span style="color:var(--gold);font-weight:600">World Handicap System (WHS)</span> formula, the same one used by GHIN and the USGA.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">How it works:</span><br>';
  h += '1. Each round generates a <em>Score Differential</em>: (113 ÷ Slope) × (Score − Rating)<br>';
  h += '2. Your most recent 20 rounds are considered<br>';
  h += '3. The best differentials are selected (number depends on how many rounds you have)<br>';
  h += '4. Those are averaged and multiplied by 0.96<br>';
  h += '5. The result is your Handicap Index (capped at 54.0)<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Selection table:</span><br>';
  h += '3-5 rounds → best 1 differential<br>';
  h += '6-8 rounds → best 2 differentials<br>';
  h += '9-10 rounds → best 3 differentials<br>';
  h += '11-20 rounds → scales up to best 8 differentials<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Minimum rounds:</span> 3 rounds required to establish a handicap. Until then, you can set a manual handicap on your profile.<br><br>';
  h += '<span style="color:var(--gold);font-weight:600">Course Handicap:</span> For Parbaugh Stroke Play, your Handicap Index is adjusted to the specific course: Course Handicap = Index × (Slope ÷ 113) + (Rating − Par). Strokes are allocated by hole difficulty rating.';
  h += '</div></div></div>';

  document.querySelector('[data-page="rules"]').innerHTML = h;
});

