process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'parbaughs';
var admin = require('firebase-admin');
var fs = require('fs');
admin.initializeApp({ projectId: 'parbaughs' });
var db = admin.firestore();
function dec(v){if(v==null)return null;if('stringValue'in v)return v.stringValue;if('integerValue'in v)return parseInt(v.integerValue,10);if('doubleValue'in v)return v.doubleValue;if('booleanValue'in v)return v.booleanValue;if('timestampValue'in v)return admin.firestore.Timestamp.fromDate(new Date(v.timestampValue));if('nullValue'in v)return null;if('arrayValue'in v)return((v.arrayValue.values)||[]).map(dec);if('mapValue'in v){var o={},fl=v.mapValue.fields||{};for(var k in fl)o[k]=dec(fl[k]);return o;}return null;}
function latest(glob){var d='.claude/state/backups';var f=fs.readdirSync(d).filter(function(x){return x.indexOf('parbaughs-'+glob+'-')===0;}).sort().pop();return f?(d+'/'+f):null;}
(async function(){
  var cols = ['members','rounds','leagues','scrambleTeams','trips'];
  for (var ci=0; ci<cols.length; ci++){
    var col=cols[ci]; var path=latest(col);
    if(!path){ console.log('no backup for '+col); continue; }
    var raw=JSON.parse(fs.readFileSync(path,'utf8'));
    var batch=db.batch(), n=0;
    raw.forEach(function(d){ var id=(d.name||'').split('/').pop(); var fl=d.fields||{}; var o={}; for(var k in fl)o[k]=dec(fl[k]); batch.set(db.collection(col).doc(id), o); n++; });
    await batch.commit();
    console.log('seeded '+col+': '+n+' docs');
  }
  // ensure zach's member doc has an activeLeague so league-scoped reads resolve
  await db.collection('members').doc('1GE683EauXO8TVhcStKfWiCCcRl2').set({ activeLeague: 'the-parbaughs' }, { merge: true });
  console.log('set zach.activeLeague = the-parbaughs');
  process.exit(0);
})().catch(function(e){ console.log('seed err:', e.message); process.exit(1); });
