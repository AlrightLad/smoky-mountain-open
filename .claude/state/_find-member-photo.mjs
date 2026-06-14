import { readFileSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.secrets/prod-service-account.json','utf8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();
const snap = await db.collection('photos').where('type','==','member').get();
console.log('member photos in photos collection:', snap.size);
const out = [];
snap.forEach(d => { const x = d.data(); out.push({ docId: d.id, refId: x.refId || x.uid || '?', len: (x.data||'').length }); });
out.slice(0,12).forEach(o => console.log(' doc=', o.docId, 'refId=', o.refId, 'bytes=', o.len));
// map refId -> member name
for (const o of out.slice(0,12)) { try { const m = await db.collection('members').doc(o.refId).get(); if (m.exists) console.log('   ', o.refId, '->', m.data().name || m.data().username); } catch(e){} }
