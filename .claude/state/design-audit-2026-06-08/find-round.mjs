process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const db=admin.firestore();
const snap=await db.collection('rounds').limit(8).get();
snap.forEach(d=>{const r=d.data();const keys=Object.keys(r).filter(k=>/uid|player|owner|user|by|member/i.test(k));console.log(d.id, '|', keys.map(k=>k+'='+JSON.stringify(r[k])).join(' '), '| course='+(r.course||r.courseName||'?'), 'score='+(r.totalScore||r.score||r.total||'?'));});
