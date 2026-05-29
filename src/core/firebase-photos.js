// Firebase Photo System — savePhoto, loadPhoto, loadTripPhotos,
// loadCoursePhotos, slideCourseCarousel, preloadMemberPhotos, compressPhoto.
// Extracted per W1.A5 (AMD-027) from src/core/firebase.js.

// ========== FIRESTORE PHOTO SYSTEM ==========
// Photos stored in a dedicated 'photos' collection: { type, refId, data, uploadedBy, createdAt }
// Types: "member", "course", "trip"

var photoCache = {}; // Cache loaded photos in memory: { "member:zach": "data:image/jpeg;..." }

function savePhoto(type, refId, dataUrl, caption) {
  // Save locally
  var cacheKey = type + ":" + refId;
  photoCache[cacheKey] = dataUrl;
  
  // Save to Firestore
  if (!db || syncStatus === "offline") return Promise.resolve(false);
  var doc = {
    type: type,
    refId: refId,
    data: dataUrl,
    caption: caption || "",
    uploadedBy: currentUser ? currentUser.uid : "local",
    createdAt: fsTimestamp()
  };
  var docId = type + "_" + refId + (type === "trip" ? "_" + genId() : "");
  return db.collection("photos").doc(docId).set(doc)
    .then(function() { pbLog("[Photo] Saved:", cacheKey); return true; })
    .catch(function(e) { pbWarn("[Photo] Save failed:", e.message); return false; });
}

function loadPhoto(type, refId) {
  var cacheKey = type + ":" + refId;
  if (photoCache[cacheKey]) return Promise.resolve(photoCache[cacheKey]);
  if (!db) return Promise.resolve(null);
  var docId = type + "_" + refId;
  return db.collection("photos").doc(docId).get()
    .then(function(doc) {
      if (doc.exists && doc.data().data) {
        photoCache[cacheKey] = doc.data().data;
        return doc.data().data;
      }
      return null;
    })
    .catch(function() { return null; });
}

function loadTripPhotos(tripId) {
  if (!db) return Promise.resolve([]);
  return db.collection("photos").where("type","==","trip").where("refId","==",tripId).get()
    .then(function(snap) {
      var photos = [];
      snap.forEach(function(doc) { var d = doc.data(); photos.push({ src: d.data, caption: d.caption, uploadedBy: d.uploadedBy, id: doc.id, createdAt: d.createdAt }); });
      photos.sort(function(a,b) { return (a.createdAt||0) - (b.createdAt||0); });
      return photos;
    })
    .catch(function() { return []; });
}

// Load all photos for a course from Firestore and render carousel
function loadCoursePhotos(courseId) {
  if (!db) return;
  db.collection("photos").where("type","==","course").where("refId","==",courseId).get()
    .then(function(snap) {
      var photos = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        if (d.data) photos.push({ src: d.data, caption: d.caption || "", id: doc.id, createdAt: d.createdAt });
      });
      if (!photos.length) return;
      photos.sort(function(a,b) { return (a.createdAt||0) - (b.createdAt||0); });
      // Cache the first photo for quick display
      photoCache["course:" + courseId] = photos[0].src;
      // Render into the photo area
      var el = document.getElementById("course-photo-area");
      if (!el) return;
      if (photos.length === 1) {
        el.outerHTML = '<div class="course-banner"><img alt="" src="' + photos[0].src + '" style="width:100%;max-height:220px;object-fit:cover;border-radius:var(--radius)"></div>';
      } else {
        // Carousel for multiple photos
        var ch = '<div class="course-carousel" style="position:relative;overflow:hidden;border-radius:var(--radius);margin:0 16px">';
        ch += '<div id="cc-track" style="display:flex;transition:transform .3s ease;width:' + (photos.length * 100) + '%">';
        photos.forEach(function(p) {
          ch += '<div style="flex:0 0 ' + (100/photos.length) + '%;"><img alt="" src="' + p.src + '" style="width:100%;max-height:220px;object-fit:cover;display:block"></div>';
        });
        ch += '</div>';
        ch += '<div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px">';
        photos.forEach(function(p, i) {
          ch += '<div class="cc-dot" data-idx="' + i + '" style="width:7px;height:7px;border-radius:50%;background:' + (i===0?'var(--gold)':'rgba(255,255,255,.4)') + ';cursor:pointer" onclick="slideCourseCarousel(' + i + ',' + photos.length + ')"></div>';
        });
        ch += '</div></div>';
        el.outerHTML = ch;
      }
    })
    .catch(function(e) { pbWarn("[CoursePhotos] Load failed:", e.message); });
}

function slideCourseCarousel(idx, total) {
  var track = document.getElementById("cc-track");
  if (!track) return;
  track.style.transform = "translateX(-" + (idx * (100/total)) + "%)";
  var dots = document.querySelectorAll(".cc-dot");
  dots.forEach(function(d) { d.style.background = parseInt(d.dataset.idx) === idx ? "var(--gold)" : "rgba(255,255,255,.4)"; });
}

// Preload member photos for avatar display
function preloadMemberPhotos() {
  if (!db) return;
  db.collection("photos").where("type","==","member").get()
    .then(function(snap) {
      snap.forEach(function(doc) {
        var d = doc.data();
        photoCache["member:" + d.refId] = d.data;
      });
      pbLog("[Photo] Preloaded", snap.size, "member photos");
      
      // Also cross-reference: if a member's Firebase UID has a photo but their claimedFrom doesn't (or vice versa), cache both ways
      db.collection("members").get({ source: 'server' }).then(function(mSnap) {
        mSnap.forEach(function(mDoc) {
          var m = mDoc.data();
          // Cache member profile for achievement/XP lookups
          fbMemberCache[m.id] = m;
          if (m.claimedFrom) {
            fbMemberCache[m.claimedFrom] = m;
            playerIdMap[m.id] = m.claimedFrom; // Firebase UID → local ID
          }

          // ── Sync Firestore name back into PB seed state ──────────────
          // Firestore is source of truth for display names — update the
          // local seed player record so PB.getPlayer() always returns the
          // real name, not the hardcoded founding-member fallback.
          var localId = m.claimedFrom || m.id;
          var seedPlayer = PB.getPlayer(localId);
          if (seedPlayer && m.name && seedPlayer.name !== m.name) {
            seedPlayer.name = m.name;
          }
          if (seedPlayer && m.username && seedPlayer.username !== m.username) {
            seedPlayer.username = m.username;
          }

          var fbPhoto = photoCache["member:" + m.id];
          var localPhoto = m.claimedFrom ? photoCache["member:" + m.claimedFrom] : null;
          if (fbPhoto && m.claimedFrom && !localPhoto) {
            photoCache["member:" + m.claimedFrom] = fbPhoto;
          }
          if (localPhoto && !fbPhoto) {
            photoCache["member:" + m.id] = localPhoto;
          }
          if (m.photoUrl && !photoCache["member:" + m.id]) {
            photoCache["member:" + m.id] = m.photoUrl;
          }
        });
        pbLog("[Members] Cached", Object.keys(fbMemberCache).length, "member profiles");
        // v7.9 — refresh persisted stats at session start so XP displays don't drift.
        // See logs/v7.9-persistplayerstats-recon-2026-04-16T23-30.md
        if (currentUser && currentUser.uid) {
          persistPlayerStats(currentUser.uid);
        }
        updateProfileBar();
        // Only re-render home page for avatar updates — members page fetches fresh from Firestore on its own
        if (Router.getPage() === "home") Router.go("home", Router.getParams(), true);
      });
    });
}

// Compress photo to target size
function compressPhoto(dataUrl, maxKB, maxDim, callback) {
  maxKB = maxKB || PHOTO_MAX_KB;
  maxDim = maxDim || 400;
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement("canvas");
    var w = img.width, h = img.height;
    if (w > maxDim || h > maxDim) {
      var ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    // Try progressively lower quality until under maxKB
    var quality = 0.7;
    var result = canvas.toDataURL("image/jpeg", quality);
    while (result.length > maxKB * 1370 && quality > 0.1) { // 1370 ≈ bytes per KB in base64
      quality -= 0.1;
      result = canvas.toDataURL("image/jpeg", quality);
    }
    pbLog("[Photo] Compressed to", Math.round(result.length / 1370), "KB at quality", quality.toFixed(1));
    callback(result);
  };
  img.onerror = function() {
    pbWarn("[Photo] Failed to load image for compression");
    Router.toast("Could not process image, try a different photo");
  };
  img.src = dataUrl;
}
