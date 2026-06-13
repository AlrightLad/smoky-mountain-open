// PB distance-to-pin — GPS Front / Center / Back to the green during live play.
// Founder-greenlit 2026-06-13 (Lane A). Spec: task-queue/founder/hole-diagram-
// self-position-plan.md.
//
// HOW IT WORKS
//   • The green's edges are crowdsourced: a member standing on the green taps
//     "Set the green" and drops a FRONT-edge pin then a BACK-edge pin (2 GPS
//     reads). center = midpoint. Stored on the shared course doc (courses/{id}.
//     greens[holeIdx]) — any active member can write it (Firestore rules already
//     allow member course writes; auto-create #26 rides the same path), so it
//     only gets better as the league plays.
//   • During play, "Distance to green" reads the phone's GPS once (on tap —
//     battery-safe, no watch over a 4-hour round) and shows Haversine yards to
//     front / center / back, the classic rangefinder read.
//
// PRIVACY (legal §3 — data minimization): the member's own location is NEVER
// stored or transmitted. It is read transiently in-browser to compute the
// distance and discarded. Only the GREEN's coordinates (a course feature, not
// personal data) persist. Geolocation is opt-in — the browser permission prompt
// gates the first read, and every denied/unavailable state is explained (P10),
// never shown as a silent 0.

var pbDistanceStrip, pbReadDistance, pbSetGreen, pbCancelSetGreen;

(function () {
  // Session flag: once a member reads distance successfully this session we
  // remember it so the prompt copy can soften (the browser remembers the grant).
  var _geoOk = false;
  // 2-step "set the green" capture state: { holeIdx, courseId, front:{la,ln} }.
  var _setState = null;
  var POOR_ACCURACY_M = 18; // beyond this, label a personal READ "approx"
  var SET_MAX_ACCURACY_M = 12; // a SET persists league-wide → require a tighter fix

  // Haversine great-circle distance → whole yards.
  function _yards(la1, ln1, la2, ln2) {
    var R = 6371000, toRad = Math.PI / 180;
    var dLa = (la2 - la1) * toRad, dLn = (ln2 - ln1) * toRad;
    var a = Math.sin(dLa / 2) * Math.sin(dLa / 2)
          + Math.cos(la1 * toRad) * Math.cos(la2 * toRad) * Math.sin(dLn / 2) * Math.sin(dLn / 2);
    var meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(meters * 1.0936133);
  }

  // The stored green for a course+hole, or null. { f:{la,ln}, b:{la,ln}, ... }.
  function _greenFor(courseId, holeIdx) {
    if (!courseId || typeof PB === 'undefined' || !PB.getCourse) return null;
    var c = PB.getCourse(courseId);
    if (!c || !c.greens) return null;
    var g = c.greens[String(holeIdx)] || c.greens[holeIdx];
    if (!g || !g.f || !g.b || typeof g.f.la !== 'number' || typeof g.b.la !== 'number') return null;
    return g;
  }

  // One-shot GPS read via the shared helper (Capacitor native or web fallback).
  function _readGps() {
    if (typeof PB !== 'undefined' && PB.native && PB.native.gps && PB.native.gps.current) {
      return PB.native.gps.current({ highAccuracy: true, timeout: 12000, maxAge: 5000 });
    }
    if (navigator.geolocation) {
      return new Promise(function (res, rej) {
        navigator.geolocation.getCurrentPosition(
          function (p) { res({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }); },
          function (e) { rej(e); },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
        );
      });
    }
    return Promise.reject(new Error('unsupported'));
  }

  // A geolocation error → a human, actionable line (P10: what / why / what to do).
  function _geoMsg(err) {
    if (err && err.code === 1) return 'Location is blocked. Enable it for this site to see distance.';
    if (err && err.code === 2) return 'Can’t get a GPS fix right now — try again in the open.';
    if (err && err.code === 3) return 'GPS timed out — try again.';
    if (err && /unsupported/.test(String(err && err.message))) return 'This device can’t share location.';
    return 'Couldn’t read your location — try again.';
  }

  // ── The strip shown in the live-play hole header ──────────────────────────
  // Returns '' when there is no course to anchor a green to (nothing to measure).
  pbDistanceStrip = function (holeIdx) {
    if (typeof liveState === 'undefined' || !liveState || !liveState.active) return '';
    var courseId = liveState.courseId;
    var supported = (typeof navigator !== 'undefined' && navigator.geolocation)
      || (typeof PB !== 'undefined' && PB.native && PB.native.isNative && PB.native.isNative());
    if (!supported) return ''; // no GPS at all — stay quiet rather than tease
    var green = _greenFor(courseId, holeIdx);

    var h = '<div class="ls-dist" id="ls-dist-' + holeIdx + '">';
    if (_setState && _setState.holeIdx === holeIdx) {
      // mid-capture — front done, waiting on back (front capture replaces inline)
      h += '<div class="ls-dist__set">';
      h += '<div class="ls-dist__setlbl">Walk to the <b>back</b> edge of the green, then tap.</div>';
      h += '<div class="ls-dist__row">';
      h += '<button type="button" class="ls-dist__btn ls-dist__btn--go" onclick="pbSetGreen(' + holeIdx + ')">Capture back edge</button>';
      h += '<button type="button" class="ls-dist__btn ls-dist__btn--ghost" onclick="pbCancelSetGreen()">Cancel</button>';
      h += '</div></div>';
    } else if (green) {
      // green known — offer the rangefinder read (tap; battery-safe)
      h += '<button type="button" class="ls-dist__read" onclick="pbReadDistance(' + holeIdx + ')">';
      h += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4l9 3-3 2 3 2-9 2"/><path d="M5 21h6"/></svg>';
      h += '<span>Distance to green</span></button>';
      h += '<div class="ls-dist__out" id="ls-dist-out-' + holeIdx + '" aria-live="polite"></div>';
    } else if (courseId) {
      // no green yet — actionable invite to crowdsource it (P10)
      h += '<button type="button" class="ls-dist__set-start" onclick="pbSetGreen(' + holeIdx + ')">';
      h += '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4l9 3-3 2 3 2-9 2"/><path d="M5 21h6"/></svg>';
      h += '<span>Set the green for GPS distance</span></button>';
    } else {
      return ''; // no course doc to store a green on
    }
    h += '</div>';
    return h;
  };

  // ── Read GPS and render Front / Center / Back yards ───────────────────────
  pbReadDistance = function (holeIdx) {
    var out = document.getElementById('ls-dist-out-' + holeIdx);
    if (!out) return;
    var green = _greenFor(liveState && liveState.courseId, holeIdx);
    if (!green) { out.innerHTML = '<span class="ls-dist__msg">No green set for this hole yet.</span>'; return; }
    out.innerHTML = '<span class="ls-dist__msg">Reading GPS…</span>';
    _readGps().then(function (pos) {
      _geoOk = true;
      var la = pos.latitude, ln = pos.longitude;
      var cf = _yards(la, ln, green.f.la, green.f.ln);
      var cb = _yards(la, ln, green.b.la, green.b.ln);
      var cc = _yards(la, ln, (green.f.la + green.b.la) / 2, (green.f.ln + green.b.ln) / 2);
      var approx = (pos.accuracy && pos.accuracy > POOR_ACCURACY_M);
      var html = '<div class="ls-dist__fcb">'
        + '<div class="ls-dist__pt"><span class="ls-dist__n">' + cf + '</span><span class="ls-dist__k">Front</span></div>'
        + '<div class="ls-dist__pt ls-dist__pt--c"><span class="ls-dist__n">' + cc + '</span><span class="ls-dist__k">Center</span></div>'
        + '<div class="ls-dist__pt"><span class="ls-dist__n">' + cb + '</span><span class="ls-dist__k">Back</span></div>'
        + '</div>';
      html += '<button type="button" class="ls-dist__refresh" onclick="pbReadDistance(' + holeIdx + ')">'
        + (approx ? 'approx · tap to refresh' : 'tap to refresh') + '</button>';
      out.innerHTML = html;
    }).catch(function (err) {
      out.innerHTML = '<span class="ls-dist__msg ls-dist__msg--warn">' + _geoMsg(err) + '</span>'
        + '<button type="button" class="ls-dist__refresh" onclick="pbReadDistance(' + holeIdx + ')">Try again</button>';
    });
  };

  // ── Crowdsource the green: capture front edge, then back edge ─────────────
  pbSetGreen = function (holeIdx) {
    var courseId = liveState && liveState.courseId;
    if (!courseId) { if (typeof Router !== 'undefined' && Router.toast) Router.toast('Add this course first to save a green.'); return; }
    if (typeof Router !== 'undefined' && Router.toast) Router.toast(_setState ? 'Reading back edge…' : 'Reading front edge…');
    _readGps().then(function (pos) {
      _geoOk = true;
      // A SET persists to the shared course for the whole league, so unlike a
      // personal read it must come from a precise fix — a poor one would store a
      // pin tens of metres off and make everyone's distance wrong (P9 data
      // integrity). Reject a weak fix and let them retry in the open. (Missing
      // accuracy data — some browsers omit it — is allowed through.)
      if (typeof pos.accuracy === 'number' && pos.accuracy > SET_MAX_ACCURACY_M) {
        _setState = null;
        _rerenderStrip(holeIdx);
        if (typeof Router !== 'undefined' && Router.toast) Router.toast('GPS isn’t precise enough to set the green (±' + Math.round(pos.accuracy) + 'm). Step into the open and try again.');
        return;
      }
      if (!_setState || _setState.holeIdx !== holeIdx) {
        // first tap → front edge captured; flip the strip to "capture back"
        _setState = { holeIdx: holeIdx, courseId: courseId, front: { la: pos.latitude, ln: pos.longitude } };
        _rerenderStrip(holeIdx);
        if (typeof Router !== 'undefined' && Router.toast) Router.toast('Front edge set — now the back.');
        return;
      }
      // second tap → back edge; persist front+back to the course doc
      var green = {
        f: { la: _setState.front.la, ln: _setState.front.ln },
        b: { la: pos.latitude, ln: pos.longitude },
        by: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : null,
        at: Date.now()
      };
      _saveGreen(courseId, holeIdx, green);
      _setState = null;
      _rerenderStrip(holeIdx);
      if (typeof Router !== 'undefined' && Router.toast) Router.toast('Green saved — distance is live for the league.');
    }).catch(function (err) {
      _setState = null;
      _rerenderStrip(holeIdx);
      if (typeof Router !== 'undefined' && Router.toast) Router.toast(_geoMsg(err));
    });
  };

  pbCancelSetGreen = function () {
    var idx = _setState ? _setState.holeIdx : null;
    _setState = null;
    if (idx != null) _rerenderStrip(idx);
  };

  // Persist the green to the shared course doc + update the in-memory cache so
  // the read works immediately without a round-trip. Merge-write keeps other
  // holes' greens intact (Firestore deep-merges nested maps under merge:true).
  function _saveGreen(courseId, holeIdx, green) {
    try {
      var c = PB.getCourse(courseId);
      if (c) { c.greens = c.greens || {}; c.greens[String(holeIdx)] = green; }
    } catch (e) {}
    try {
      if (typeof db !== 'undefined' && db) {
        var patch = { greens: {} };
        patch.greens[String(holeIdx)] = green;
        db.collection('courses').doc(courseId).set(patch, { merge: true }).catch(function () {});
      }
    } catch (e) {}
  }

  // Re-render just the distance strip in place (cheap; avoids a full hole
  // re-render that would reset score steppers mid-interaction).
  function _rerenderStrip(holeIdx) {
    var el = document.getElementById('ls-dist-' + holeIdx);
    if (!el) return;
    var fresh = pbDistanceStrip(holeIdx);
    if (!fresh) { el.outerHTML = ''; return; }
    // pbDistanceStrip returns the wrapper too; swap the outerHTML.
    el.outerHTML = fresh;
  }

  // Expose on window so (a) the production minifier keeps these (they're only
  // referenced from inline onclick strings + the deferred playnow chunk, which
  // it can't see statically — without this it tree-shakes the whole IIFE), and
  // (b) the inline onclick handlers resolve them against the global scope.
  window.pbDistanceStrip = pbDistanceStrip;
  window.pbReadDistance = pbReadDistance;
  window.pbSetGreen = pbSetGreen;
  window.pbCancelSetGreen = pbCancelSetGreen;
})();
