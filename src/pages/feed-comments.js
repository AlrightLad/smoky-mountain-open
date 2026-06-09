// Feed — Comments + likes subsystem. Extracted per W1.A5 (AMD-027).
// Functions: _renderCommentThread, _renderCommentRow, _patchKudosButton,
// _patchCommentCount, _appendCommentRowToDOM, _removeCommentRowFromDOM,
// _patchCommentLike, feedToggleLike, feedShowCommentInput, feedSubmitComment,
// feedToggleCommentLike, feedConfirmDeleteComment, etc.

function _renderCommentThread(roundId, comments, commentLikes) {
  if (!comments || !comments.length) return '';
  var h = '<div data-comment-thread="1" data-round-id="' + roundId + '" style="padding:0 14px 4px">';
  comments.forEach(function(c, ci) {
    h += _renderCommentRow(roundId, c, ci, commentLikes);
  });
  h += '</div>';
  return h;
}

function _renderCommentRow(roundId, c, ci, commentLikes) {
  // App Store 1.2 — skip comments from blocked members. Return empty (not a
  // reindex) so ci stays aligned for like/delete actions on remaining rows.
  if (typeof pbIsBlocked === "function" && pbIsBlocked(c.uid)) return '';
  var cLikes = (commentLikes && commentLikes[String(ci)]) || [];
  var iLikedC = (typeof currentUser !== "undefined" && currentUser) && cLikes.indexOf(currentUser.uid) !== -1;
  var ownComment = (typeof currentUser !== "undefined" && currentUser) && c.uid === currentUser.uid;
  var likeColor = iLikedC ? "var(--gold)" : "var(--muted2)";
  var h = '<div data-comment-row="1" data-round-id="' + roundId + '" data-comment-idx="' + ci + '" style="display:flex;gap:6px;align-items:flex-start;padding:4px 0;font-size:11px">';
  h += '<span style="color:var(--gold);font-weight:700;flex-shrink:0">' + escHtml(c.name || "Member") + '</span>';
  h += '<span style="color:var(--cream);flex:1;min-width:0;line-height:1.4">' + escHtml(c.text || "") + '</span>';
  h += '<span data-action="comment-like" data-round-id="' + roundId + '" data-comment-idx="' + ci + '" data-i-liked="' + (iLikedC ? '1' : '0') + '" data-likes-count="' + cLikes.length + '" onclick="event.stopPropagation();feedToggleCommentLike(\'' + roundId + '\',' + ci + ')" style="cursor:pointer;color:' + likeColor + ';font-size:10px;flex-shrink:0">♥' + (cLikes.length ? ' ' + cLikes.length : '') + '</span>';
  if (ownComment) {
    h += '<span data-action="comment-delete" data-round-id="' + roundId + '" data-comment-idx="' + ci + '" data-armed="false" onclick="event.stopPropagation();feedConfirmDeleteComment(this,\'' + roundId + '\',' + ci + ')" style="cursor:pointer;color:var(--muted2);font-size:12px;flex-shrink:0">×</span>';
  }
  h += '</div>';
  return h;
}

// ── DOM patch helpers ──

// Patch all kudos buttons for this roundId across surfaces (typically only one
// is in DOM since Router renders one page at a time, but querySelectorAll
// handles the multi-element case defensively).
function _patchKudosButton(roundId, isLiked, count) {
  var rows = document.querySelectorAll('[data-round-id="' + roundId + '"]');
  var color = isLiked ? "var(--cb-brass)" : "var(--cb-mute)";
  rows.forEach(function(row) {
    var btn = row.querySelector('[data-action="kudos"]');
    if (!btn) return;
    btn.setAttribute('data-i-liked', isLiked ? '1' : '0');
    btn.setAttribute('data-likes-count', count);
    btn.style.color = color;
    var svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isLiked ? 'currentColor' : 'none');
      svg.style.color = color;
    }
    var span = btn.querySelector('span');
    if (span) {
      span.style.color = color;
      span.textContent = "Kudos" + (count > 0 ? " " + count : "");
    }
  });
}

function _patchCommentCount(roundId, count) {
  var rows = document.querySelectorAll('[data-round-id="' + roundId + '"]');
  rows.forEach(function(row) {
    var btn = row.querySelector('[data-action="comment"]');
    if (!btn) return;
    var span = btn.querySelector('span');
    if (span) span.textContent = "Comment" + (count > 0 ? " " + count : "");
  });
}

// v8.24.8 — Brass Tee-Tap reaction patch. Mirrors _patchKudosButton: keeps the
// data-i-tapped + data-tap-count attributes (revert state) and the brass active
// color in sync across every surface rendering this round (feed lead + satellite
// card + HQ League Pulse). The Tee Tap is the golfer's "well played" — distinct
// from Kudos, stored in rounds/{id}.reactions.teeTap (engagement subfield).
function _patchTeeTapButton(roundId, tapped, count) {
  var rows = document.querySelectorAll('[data-round-id="' + roundId + '"]');
  var color = tapped ? "var(--cb-brass)" : "var(--cb-mute)";
  rows.forEach(function(row) {
    var btn = row.querySelector('[data-action="teetap"]');
    if (!btn) return;
    btn.setAttribute('data-i-tapped', tapped ? '1' : '0');
    btn.setAttribute('data-tap-count', count);
    btn.setAttribute('aria-pressed', tapped ? 'true' : 'false');
    btn.style.color = color;
    var svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', tapped ? 'currentColor' : 'none');
      svg.style.color = color;
    }
    var span = btn.querySelector('span');
    if (span) {
      span.style.color = color;
      span.textContent = "Tee Tap" + (count > 0 ? " " + count : "");
    }
  });
}

// Append a comment row to the thread. If the thread doesn't exist yet (first
// comment on this round), create it after the action row.
function _appendCommentRowToDOM(roundId, comment, newIdx, commentLikes) {
  var threads = document.querySelectorAll('[data-comment-thread="1"][data-round-id="' + roundId + '"]');
  if (threads.length > 0) {
    threads.forEach(function(t) {
      t.insertAdjacentHTML('beforeend', _renderCommentRow(roundId, comment, newIdx, commentLikes));
    });
    return;
  }
  // First comment: create thread container after action row.
  var actionRows = document.querySelectorAll('[data-feed-action-row="1"][data-round-id="' + roundId + '"]');
  actionRows.forEach(function(ar) {
    var threadHtml = _renderCommentThread(roundId, [comment], commentLikes);
    ar.insertAdjacentHTML('afterend', threadHtml);
  });
}

// Remove a specific comment row + re-index subsequent rows so onclick / data
// attributes stay aligned with the new array indices. If the thread is now
// empty, remove the thread container too (cosmetic — keeps DOM tidy).
function _removeCommentRowFromDOM(roundId, commentIdx) {
  var rows = document.querySelectorAll('[data-comment-row="1"][data-round-id="' + roundId + '"][data-comment-idx="' + commentIdx + '"]');
  rows.forEach(function(r) { r.remove(); });
  // Re-index subsequent rows in each thread instance.
  var threads = document.querySelectorAll('[data-comment-thread="1"][data-round-id="' + roundId + '"]');
  threads.forEach(function(thread) {
    var allRows = thread.querySelectorAll('[data-comment-row="1"]');
    allRows.forEach(function(r, idx) {
      r.setAttribute('data-comment-idx', idx);
      var likeSpan = r.querySelector('[data-action="comment-like"]');
      var deleteSpan = r.querySelector('[data-action="comment-delete"]');
      if (likeSpan) {
        likeSpan.setAttribute('data-comment-idx', idx);
        likeSpan.setAttribute('onclick', "event.stopPropagation();feedToggleCommentLike('" + roundId + "'," + idx + ")");
      }
      if (deleteSpan) {
        deleteSpan.setAttribute('data-comment-idx', idx);
        deleteSpan.setAttribute('onclick', "event.stopPropagation();feedConfirmDeleteComment(this,'" + roundId + "'," + idx + ")");
      }
    });
    if (allRows.length === 0) thread.remove();
  });
}

function _patchCommentLike(roundId, commentIdx, isLiked, count) {
  var spans = document.querySelectorAll('[data-action="comment-like"][data-round-id="' + roundId + '"][data-comment-idx="' + commentIdx + '"]');
  spans.forEach(function(s) {
    s.setAttribute('data-i-liked', isLiked ? '1' : '0');
    s.setAttribute('data-likes-count', count);
    s.style.color = isLiked ? "var(--gold)" : "var(--muted2)";
    s.textContent = "♥" + (count > 0 ? " " + count : "");
  });
}

function feedToggleLike(roundId) {
  if (!db || !currentUser) { Router.toast("Sign in to give kudos"); return; }
  if (!roundId) return;
  var uid = currentUser.uid;

  // S1.2: read current button state from DOM for revert. data-i-liked +
  // data-likes-count are set at render time and kept in sync by _patchKudosButton.
  var btn = document.querySelector('[data-round-id="' + roundId + '"] [data-action="kudos"]');
  var prevLiked = btn ? (btn.getAttribute('data-i-liked') === '1') : false;
  var prevCount = btn ? parseInt(btn.getAttribute('data-likes-count') || '0', 10) : 0;

  // S1.2: optimistic surgical patch — toggle DOM state immediately.
  var newLiked = !prevLiked;
  var newCount = prevCount + (newLiked ? 1 : -1);
  if (newCount < 0) newCount = 0;
  _patchKudosButton(roundId, newLiked, newCount);

  // S1.2: suppress rounds snapshot listener re-render so the write echo
  // doesn't blow away our patch via Router.go('home'). Cleared 2s post-write.
  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var likes = data.likes || [];
    var idx = likes.indexOf(uid);
    var isLiking = idx === -1;
    if (idx !== -1) likes.splice(idx, 1);
    else likes.push(uid);
    return db.collection("rounds").doc(roundId).update({ likes: likes }).then(function() {
      // Reconcile DOM with canonical state (in case our optimistic prediction
      // disagreed with the .get() result — e.g., if another user liked
      // simultaneously, the count from likes.length is authoritative).
      _patchKudosButton(roundId, isLiking, likes.length);
      if (isLiking && data.player && data.player !== uid) {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        var courseLabel = data.course ? " at " + data.course : "";
        sendNotification(data.player, {
          type: "round_like",
          title: "New Kudos",
          message: myName + " gave kudos to your round" + courseLabel,
          page: "feed"
        });
      }
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function(err) {
    window._suppressRoundsRerender = false;
    if (typeof pbWarn === "function") pbWarn("[feed] toggleLike failed:", err && err.message);
    _patchKudosButton(roundId, prevLiked, prevCount);
    Router.toast("Couldn't add kudos, please try again");
  });
}

// v8.24.8 — Brass Tee-Tap reaction toggle. Same optimistic-patch + reconcile
// + suppress-rerender machinery as feedToggleLike, but writes the engagement
// subfield rounds/{id}.reactions.teeTap (allowed server-side as of the v8.24.x
// rules deploy; blocked members are denied by the same rules). The Tee Tap is
// golf's "well played" nod — a distinct social signal from Kudos.
function feedToggleTeeTap(roundId) {
  if (!db || !currentUser) { Router.toast("Sign in to tee-tap"); return; }
  if (!roundId) return;
  var uid = currentUser.uid;

  var btn = document.querySelector('[data-round-id="' + roundId + '"] [data-action="teetap"]');
  var prevTapped = btn ? (btn.getAttribute('data-i-tapped') === '1') : false;
  var prevCount = btn ? parseInt(btn.getAttribute('data-tap-count') || '0', 10) : 0;

  var newTapped = !prevTapped;
  var newCount = prevCount + (newTapped ? 1 : -1);
  if (newCount < 0) newCount = 0;
  _patchTeeTapButton(roundId, newTapped, newCount);

  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var reactions = data.reactions || {};
    var taps = reactions.teeTap || [];
    var idx = taps.indexOf(uid);
    var isTapping = idx === -1;
    if (idx !== -1) taps.splice(idx, 1);
    else taps.push(uid);
    reactions.teeTap = taps;
    return db.collection("rounds").doc(roundId).update({ reactions: reactions }).then(function() {
      _patchTeeTapButton(roundId, isTapping, taps.length);
      if (isTapping && data.player && data.player !== uid) {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        var courseLabel = data.course ? " at " + data.course : "";
        sendNotification(data.player, {
          type: "round_teetap",
          title: "Tee Tap",
          message: myName + " tee-tapped your round" + courseLabel,
          page: "feed"
        });
      }
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function(err) {
    window._suppressRoundsRerender = false;
    if (typeof pbWarn === "function") pbWarn("[feed] toggleTeeTap failed:", err && err.message);
    _patchTeeTapButton(roundId, prevTapped, prevCount);
    Router.toast("Couldn't tee-tap, please try again");
  });
}

function feedShowCommentInput(roundId) {
  // Close all other open feed comment inputs
  document.querySelectorAll('[id^="feedComment-"]').forEach(function(el) {
    if (el.id.indexOf("feedCommentText") !== -1) return;
    if (el.id !== "feedComment-" + roundId) {
      el.style.display = "none";
    }
  });
  var el = document.getElementById("feedComment-" + roundId);
  if (!el) return;
  var isHidden = el.style.display === "none" || el.style.display === "";
  el.style.display = isHidden ? "flex" : "none";
  if (isHidden) {
    var input = document.getElementById("feedCommentText-" + roundId);
    if (input) input.focus();
  }
}

function feedSubmitComment(roundId) {
  if (!db || !currentUser) { Router.toast("Sign in to comment"); return; }
  if (!roundId) return;
  var input = document.getElementById("feedCommentText-" + roundId);
  var text = input ? input.value.trim() : "";
  if (!text) return;

  var name = currentProfile ? PB.getDisplayName(currentProfile) : "Anon";
  var newComment = { uid: currentUser.uid, name: name, text: text, at: new Date().toISOString() };

  // S1.2: read current comment count from comment button for the new index +
  // for the post-write reconcile. Count is read from the span text via regex
  // (the comment button doesn't carry data-likes-count — that attribute lives
  // on kudos buttons + per-comment hearts).
  var commentBtn = document.querySelector('[data-round-id="' + roundId + '"] [data-action="comment"]');
  var prevCommentCount = 0;
  if (commentBtn) {
    var span = commentBtn.querySelector('span');
    var m = span && span.textContent.match(/Comment\s+(\d+)/);
    if (m) prevCommentCount = parseInt(m[1], 10);
  }
  var newIdx = prevCommentCount;  // appending at end → new index = current count

  // S1.2: surgical optimistic patch — append row + bump count + clear input.
  // commentLikes is empty for a brand-new comment so heart count = 0.
  _appendCommentRowToDOM(roundId, newComment, newIdx, {});
  _patchCommentCount(roundId, prevCommentCount + 1);
  if (input) input.value = "";
  var commentEl = document.getElementById("feedComment-" + roundId);
  if (commentEl) commentEl.style.display = "flex";
  var newInput = document.getElementById("feedCommentText-" + roundId);
  if (newInput) { newInput.value = ""; newInput.focus(); }

  // S1.2: suppress snapshot-listener re-render echo
  window._suppressRoundsRerender = true;

  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var comments = data.comments || [];
    comments.push(newComment);
    return db.collection("rounds").doc(roundId).update({ comments: comments }).then(function() {
      var courseLabel = data.course ? " at " + data.course : "";
      // Notify round owner
      if (data.player && data.player !== currentUser.uid) {
        sendNotification(data.player, {
          type: "round_comment",
          title: "New Comment",
          message: name + " commented on your round" + courseLabel + ": \"" + text.substring(0, 40) + (text.length > 40 ? "..." : "") + "\"",
          page: "feed"
        });
      }
      // Cascade to prior commenters — v8.17.0 two-layer hardening
      var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
      var _roundLeagueId = data.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
      var notified = {};
      notified[currentUser.uid] = true;
      if (data.player) notified[data.player] = true;
      comments.forEach(function(c) {
        if (c.uid && !notified[c.uid]) {
          notified[c.uid] = true;
          var p = (typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(c.uid) : null;
          if (!p) return;
          if (_roundLeagueId && (!p.leagues || p.leagues.indexOf(_roundLeagueId) === -1)) return;
          if (!!p.isTestAccount !== _writerIsTest) return;
          sendNotification(c.uid, {
            type: "round_reply",
            title: "New Reply",
            message: name + " also commented on a round you commented on",
            page: "feed"
          });
        }
      });
      // Reconcile count with canonical state (in case another user commented
      // simultaneously, comments.length may differ from our prediction).
      _patchCommentCount(roundId, comments.length);
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function(err) {
    window._suppressRoundsRerender = false;
    if (typeof pbWarn === "function") pbWarn("[feed] submitComment failed:", err && err.message);
    // Revert: remove the optimistically-appended row + restore count.
    _removeCommentRowFromDOM(roundId, newIdx);
    _patchCommentCount(roundId, prevCommentCount);
    Router.toast("Couldn't post comment, please try again");
  });
}

function feedToggleCommentLike(roundId, commentIdx) {
  if (!db || !currentUser) { Router.toast("Sign in to give kudos"); return; }
  if (!roundId) return;
  var uid = currentUser.uid;

  // S1.2: read current heart state from DOM for revert.
  var heart = document.querySelector('[data-action="comment-like"][data-round-id="' + roundId + '"][data-comment-idx="' + commentIdx + '"]');
  var prevLiked = heart ? (heart.getAttribute('data-i-liked') === '1') : false;
  var prevCount = heart ? parseInt(heart.getAttribute('data-likes-count') || '0', 10) : 0;

  // S1.2: optimistic surgical patch.
  var newLiked = !prevLiked;
  var newCount = prevCount + (newLiked ? 1 : -1);
  if (newCount < 0) newCount = 0;
  _patchCommentLike(roundId, commentIdx, newLiked, newCount);

  // S1.2: suppress snapshot-listener re-render echo
  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var commentLikes = data.commentLikes || {};
    var key = String(commentIdx);
    if (!commentLikes[key]) commentLikes[key] = [];
    var idx = commentLikes[key].indexOf(uid);
    var isLiking = idx === -1;
    if (idx !== -1) commentLikes[key].splice(idx, 1);
    else commentLikes[key].push(uid);
    return db.collection("rounds").doc(roundId).update({ commentLikes: commentLikes }).then(function() {
      // Reconcile DOM with canonical state.
      _patchCommentLike(roundId, commentIdx, isLiking, commentLikes[key].length);
      var comments = data.comments || [];
      if (isLiking && comments[commentIdx] && comments[commentIdx].uid && comments[commentIdx].uid !== uid) {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        sendNotification(comments[commentIdx].uid, {
          type: "round_comment_like",
          title: "Comment Kudos",
          message: myName + " gave kudos to your comment",
          page: "feed"
        });
      }
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function(err) {
    window._suppressRoundsRerender = false;
    if (typeof pbWarn === "function") pbWarn("[feed] toggleCommentLike failed:", err && err.message);
    _patchCommentLike(roundId, commentIdx, prevLiked, prevCount);
    Router.toast("Couldn't add kudos, please try again");
  });
}

function feedConfirmDeleteComment(el, roundId, commentIdx) {
  if (el.dataset.armed === "true") {
    feedDeleteComment(roundId, commentIdx);
    return;
  }
  el.dataset.armed = "true";
  el.style.color = "var(--alert)";
  setTimeout(function() {
    if (el) { el.dataset.armed = "false"; el.style.color = "var(--muted2)"; }
  }, 3000);
}

function feedDeleteComment(roundId, commentIdx) {
  if (!db || !currentUser) return;
  if (!roundId) return;

  // S1.2: capture original comment + count for revert. We read from the .get()
  // canonical state inside the .catch, but for the optimistic patch we rely on
  // the DOM count. Original comment object cached via DOM scrape (name + text
  // are in spans) so we can re-append on failure — visual order on revert is
  // append-to-end (acceptable per S1.2 audit, simpler than insert-at-original).
  var commentBtn = document.querySelector('[data-round-id="' + roundId + '"] [data-action="comment"]');
  var prevCommentCount = 0;
  if (commentBtn) {
    var span = commentBtn.querySelector('span');
    var m = span && span.textContent.match(/Comment\s+(\d+)/);
    if (m) prevCommentCount = parseInt(m[1], 10);
  }

  // Snapshot the comment row's content for potential revert (re-append on
  // failure). Read from the row before we remove it.
  var rowEl = document.querySelector('[data-comment-row="1"][data-round-id="' + roundId + '"][data-comment-idx="' + commentIdx + '"]');
  var snapshotComment = null;
  if (rowEl) {
    var spans = rowEl.querySelectorAll('span');
    if (spans.length >= 2) {
      snapshotComment = {
        uid: currentUser.uid,
        name: spans[0].textContent || "Member",
        text: spans[1].textContent || "",
        at: new Date().toISOString()
      };
    }
  }

  // S1.2: surgical optimistic patch — remove row + decrement count.
  _removeCommentRowFromDOM(roundId, commentIdx);
  var newCount = prevCommentCount - 1;
  if (newCount < 0) newCount = 0;
  _patchCommentCount(roundId, newCount);

  // S1.2: suppress snapshot-listener re-render echo
  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) {
      window._suppressRoundsRerender = false;
      return;
    }
    var data = doc.data();
    var comments = data.comments || [];
    if (commentIdx >= 0 && commentIdx < comments.length) {
      comments.splice(commentIdx, 1);
      return db.collection("rounds").doc(roundId).update({ comments: comments }).then(function() {
        // Reconcile count with canonical state.
        _patchCommentCount(roundId, comments.length);
        setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
      });
    } else {
      window._suppressRoundsRerender = false;
    }
  }).catch(function(err) {
    window._suppressRoundsRerender = false;
    if (typeof pbWarn === "function") pbWarn("[feed] deleteComment failed:", err && err.message);
    // Revert: re-append the snapshotted comment at the END of the thread.
    // Index = current visible row count. Visual order is wrong vs original
    // position, but this is a rare failure path and member can re-tap delete.
    if (snapshotComment) {
      var visibleRows = document.querySelectorAll('[data-comment-row="1"][data-round-id="' + roundId + '"]');
      _appendCommentRowToDOM(roundId, snapshotComment, visibleRows.length, {});
    }
    _patchCommentCount(roundId, prevCommentCount);
    Router.toast("Couldn't delete comment, please try again");
  });
}

// v8.20.0 (Ship 5+5) — shareScorecard previously called nothing (typeof ===
// 'function' guard always false). Now copies the round detail URL to the
// clipboard. Native Share API (Capacitor) deferred to post-native shell.
function shareScorecard(roundId) {
  if (!roundId) return;
  var url = window.location.origin + window.location.pathname + '?roundId=' + encodeURIComponent(roundId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      Router.toast("Link copied");
    }).catch(function() {
      Router.toast("Couldn't copy link");
    });
  } else {
    Router.toast("Share not supported on this browser");
  }
}
