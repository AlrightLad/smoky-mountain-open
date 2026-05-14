// V7 diagnostic — read-only investigation of CTO's recent rounds.
// Looks up zboogher@gmail.com's UID, queries 10 most recent rounds across
// ALL leagues (no leagueId filter), reports field shapes per V7.1.
//
// Read-only: NO writes. NO mutations. Diagnostic output to stdout.

const path = require('path');
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '.service-account.json');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)) });
}
const db = admin.firestore();
const auth = admin.auth();

(async function() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' V7 — MTD ROOT CAUSE DIAGNOSTIC (read-only)');
  console.log('═══════════════════════════════════════════════════════');

  // 1. Resolve CTO's UID via email lookup
  const user = await auth.getUserByEmail('zboogher@gmail.com');
  console.log('\n[V7.1] CTO Auth user resolved:');
  console.log('  uid:', user.uid);
  console.log('  email:', user.email);
  console.log('  emailVerified:', user.emailVerified);

  // 2. Resolve member doc + claimedFrom chain
  const memberDoc = await db.collection('members').doc(user.uid).get();
  if (!memberDoc.exists) {
    console.log('\n[!] No member doc at members/' + user.uid);
    return;
  }
  const member = memberDoc.data();
  console.log('\n[V7.1] CTO member doc:');
  console.log('  id:', memberDoc.id);
  console.log('  name:', member.name);
  console.log('  username:', member.username);
  console.log('  claimedFrom:', member.claimedFrom || '(none)');
  console.log('  leagues:', JSON.stringify(member.leagues || []));
  console.log('  activeLeague:', member.activeLeague || '(none)');
  console.log('  totalRounds (cached):', member.totalRounds);
  console.log('  computedHandicap (cached):', member.computedHandicap);
  console.log('  bestRound (cached):', member.bestRound);

  // 3. Build full set of player IDs (uid + claimedFrom). Rounds are written
  //    with player == legacy seed id sometimes (e.g., "zach"), so getAllPlayerIds
  //    semantics is the right query shape.
  const playerIds = [user.uid];
  if (member.claimedFrom) playerIds.push(member.claimedFrom);
  console.log('\n[V7.1] Player IDs to query:', JSON.stringify(playerIds));

  // 4. Query rounds across ALL leagues (no leagueId filter) for each player ID
  console.log('\n[V7.1] Recent rounds (10 most recent across ALL leagues):');
  const allRounds = [];
  for (const pid of playerIds) {
    const snap = await db.collection('rounds').where('player', '==', pid).get();
    snap.forEach(doc => {
      const d = doc.data();
      allRounds.push({ docId: doc.id, ...d });
    });
  }
  // Sort by createdAt or timestamp or date desc
  allRounds.sort((a, b) => {
    const at = (a.createdAt && a.createdAt._seconds) || a.timestamp || (a.date ? new Date(a.date).getTime() / 1000 : 0);
    const bt = (b.createdAt && b.createdAt._seconds) || b.timestamp || (b.date ? new Date(b.date).getTime() / 1000 : 0);
    return bt - at;
  });

  console.log('\n  Total rounds across all leagues:', allRounds.length);

  const recent = allRounds.slice(0, 10);
  recent.forEach((r, i) => {
    console.log('\n  ── Round ' + (i + 1) + ' ──');
    console.log('    docId:        ', r.docId);
    console.log('    id (in-doc):  ', r.id);
    console.log('    player:       ', r.player);
    console.log('    playerName:   ', r.playerName);
    console.log('    date:         ', JSON.stringify(r.date), '(typeof', typeof r.date + ')');
    console.log('    timestamp:    ', r.timestamp, '(typeof', typeof r.timestamp + ')');
    if (r.createdAt) {
      console.log('    createdAt:    ', JSON.stringify(r.createdAt));
    } else {
      console.log('    createdAt:    (missing)');
    }
    console.log('    leagueId:     ', JSON.stringify(r.leagueId));
    console.log('    course:       ', r.course);
    console.log('    score:        ', r.score);
    console.log('    holesPlayed:  ', r.holesPlayed);
    console.log('    format:       ', r.format);
    console.log('    visibility:   ', r.visibility);
    console.log('    status:       ', r.status);
  });

  // 5. April vs May classification
  console.log('\n[V7.3] April / May classification:');
  const april2026 = [], may2026 = [], otherMonth = [], noDate = [];
  recent.forEach(r => {
    if (!r.date) { noDate.push(r); return; }
    if (typeof r.date !== 'string') { noDate.push(r); return; }
    if (r.date.startsWith('2026-04')) april2026.push(r);
    else if (r.date.startsWith('2026-05')) may2026.push(r);
    else otherMonth.push(r);
  });
  console.log('  April 2026 rounds in last 10:', april2026.length);
  april2026.forEach(r => console.log('    ', r.date, '· league=', r.leagueId, '· score=', r.score));
  console.log('  May 2026 rounds in last 10:  ', may2026.length);
  may2026.forEach(r => console.log('    ', r.date, '· league=', r.leagueId, '· score=', r.score));
  console.log('  Other month in last 10:      ', otherMonth.length);
  otherMonth.forEach(r => console.log('    ', r.date, '· league=', r.leagueId, '· score=', r.score));
  console.log('  No date field in last 10:    ', noDate.length);

  // 6. League distribution
  console.log('\n[V7.4] League distribution across all CTO rounds:');
  const leagueCounts = {};
  allRounds.forEach(r => {
    const lid = r.leagueId || '(missing)';
    leagueCounts[lid] = (leagueCounts[lid] || 0) + 1;
  });
  Object.keys(leagueCounts).forEach(lid => {
    console.log('  ' + lid + ': ' + leagueCounts[lid]);
  });

  // 7. activeLeague check — what does code "see" as MTD?
  const activeLeague = member.activeLeague || 'the-parbaughs';
  console.log('\n[V7.4] If activeLeague is "' + activeLeague + '", these rounds reach ctx.myRounds:');
  const inActiveLeague = allRounds.filter(r => r.leagueId === activeLeague);
  console.log('  count:', inActiveLeague.length);
  const inActiveLeagueRecent = inActiveLeague.slice().sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  }).slice(0, 5);
  inActiveLeagueRecent.forEach(r => console.log('    ', r.date, '· score=', r.score, '· leagueId=', r.leagueId));

  // 8. Run the actual MTD filter against this set
  console.log('\n[V7.2] Simulated MTD filter (home.js:718-723):');
  const now = new Date();
  console.log('  Now: year=' + now.getFullYear() + ', month=' + now.getMonth() + ' (May 2026 = year 2026, month 4)');
  const mtdMatch = inActiveLeague.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  console.log('  MTD count via home.js filter (active league only):', mtdMatch.length);
  mtdMatch.forEach(r => console.log('    ', r.date, '· score=', r.score));

  // 9. Same MTD filter applied across ALL leagues (not just active)
  const mtdMatchAllLeagues = allRounds.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  console.log('  MTD count if filter ran across ALL leagues:', mtdMatchAllLeagues.length);
  mtdMatchAllLeagues.forEach(r => console.log('    ', r.date, '· score=', r.score, '· league=', r.leagueId));

  // 10. April count by approach
  console.log('\n  Reference: April count via active-league filter:', inActiveLeague.filter(r => r.date && r.date.startsWith('2026-04')).length);
  console.log('  Reference: April count across all leagues:        ', allRounds.filter(r => r.date && r.date.startsWith('2026-04')).length);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' V7 DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
