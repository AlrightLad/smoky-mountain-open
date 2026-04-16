// Firebase Admin SDK initialization for verify harness
var admin = require("firebase-admin");
var path = require("path");
var fs = require("fs");

// Find service account key
var keyPaths = [
  path.resolve(__dirname, "../../.service-account.json"),
  path.resolve(__dirname, "../../../serviceAccountKey.json")
];
var keyPath = keyPaths.find(function(p) { return fs.existsSync(p); });
if (!keyPath) {
  console.error("FATAL: No service account key found. Checked:", keyPaths.join(", "));
  process.exit(2);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
}

var db = admin.firestore();
var auth = admin.auth();

async function getAllDocs(collection) {
  var snap = await db.collection(collection).get();
  var docs = [];
  snap.forEach(function(doc) { docs.push({ _id: doc.id, _ref: doc.ref, data: doc.data() }); });
  return docs;
}

async function getDoc(collection, id) {
  var doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { _id: doc.id, _ref: doc.ref, data: doc.data() } : null;
}

async function getMember(uid) {
  return getDoc("members", uid);
}

module.exports = { db: db, auth: auth, admin: admin, getAllDocs: getAllDocs, getDoc: getDoc, getMember: getMember };
