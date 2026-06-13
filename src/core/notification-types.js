// Single source of truth for notification type vocabulary (v8.17.0 / Ship 5+1).
// New types must be registered in NOTIFICATION_TYPES AND NOTIFICATION_META.
// String-literal sweep (replacing existing usages with NOTIFICATION_TYPES.*)
// is deferred to B.34 — keeping literals grep-friendly through Gate 1.

window.NOTIFICATION_TYPES = {
  FEED_LIKE: "feed_like",
  COMMENT_LIKE: "comment_like",
  FEED_COMMENT: "feed_comment",
  FEED_REPLY: "feed_reply",
  // v8.20.0 (Ship 5+5) — surface-aware engagement types. feed_* fire from
  // /chat (Clubhouse) writers; round_* fire from /feed + HQ Home League Pulse
  // round-post writers. Cluster stays "social" for both; only the page deep-
  // link target differs.
  ROUND_LIKE: "round_like",
  ROUND_COMMENT: "round_comment",
  ROUND_REPLY: "round_reply",
  ROUND_COMMENT_LIKE: "round_comment_like",
  ROUND_TEETAP: "round_teetap",
  DM: "dm",
  BOUNTY_CLAIMED: "bounty_claimed",
  WAGER_CHALLENGE: "wager_challenge",
  WAGER_ACCEPTED: "wager_accepted",
  WAGER_DECLINED: "wager_declined",
  WAGER_RESULT: "wager_result",
  LEAGUE_REQUEST: "league_request",
  LEAGUE_APPROVED: "league_approved",
  LEAGUE_DENIED: "league_denied",
  INVITE_REQUEST: "invite_request",
  ROUND_POSTED: "round_posted",
  ACHIEVEMENT: "achievement",
  PROFILE_REMINDER: "profile_reminder",
  TEE_POSTED: "tee_posted",
  TEE_WITHDRAWAL: "tee_withdrawal",
  TEE_CANCELLED: "tee_cancelled",
  TEE_RSVP: "tee_rsvp",
  SUSPENSION: "suspension",
  UNSUSPENSION: "unsuspension",
  REMOVAL: "removal",
  REINSTATEMENT: "reinstatement",
  REPORT: "report",
  FEATURE_REQUEST: "feature_request",
  SOCIAL_ACTION: "social_action",
  WELCOME: "welcome"
};

// cluster drives icon dispatch. page is the deep-link target route.
// tee_rsvp + welcome have no current writers (future-proof placeholders).
window.NOTIFICATION_META = {
  feed_like:        { cluster: "social", page: "chat" },
  comment_like:     { cluster: "social", page: "chat" },
  feed_comment:     { cluster: "social", page: "chat" },
  feed_reply:       { cluster: "social", page: "chat" },
  // v8.20.0 (Ship 5+5) — round-post engagement deep-links to /feed.
  round_like:         { cluster: "social", page: "feed" },
  round_comment:      { cluster: "social", page: "feed" },
  round_reply:        { cluster: "social", page: "feed" },
  round_comment_like: { cluster: "social", page: "feed" },
  round_teetap:       { cluster: "social", page: "feed" },
  social_action:    { cluster: "social", page: "feed" },
  dm:               { cluster: "dm",     page: "dms" },
  bounty_claimed:   { cluster: "coins",  page: "bounties" },
  wager_challenge:  { cluster: "coins",  page: "wagers" },
  wager_accepted:   { cluster: "coins",  page: "wagers" },
  wager_declined:   { cluster: "coins",  page: "wagers" },
  wager_result:     { cluster: "coins",  page: "wagers" },
  league_request:   { cluster: "league", page: "leagues" },
  league_approved:  { cluster: "league", page: "leagues" },
  league_denied:    { cluster: "league", page: "leagues" },
  invite_request:   { cluster: "league", page: "admin" },
  round_posted:     { cluster: "round",  page: "feed" },
  achievement:      { cluster: "round",  page: "trophyroom" },
  profile_reminder: { cluster: "round",  page: "members" },
  tee_posted:       { cluster: "tee",    page: "teetimes" },
  tee_withdrawal:   { cluster: "tee",    page: "teetimes" },
  tee_cancelled:    { cluster: "tee",    page: "teetimes" },
  tee_rsvp:         { cluster: "tee",    page: "teetimes" },
  suspension:       { cluster: "admin",  page: "settings" },
  unsuspension:     { cluster: "admin",  page: "settings" },
  removal:          { cluster: "admin",  page: "settings" },
  reinstatement:    { cluster: "admin",  page: "settings" },
  report:           { cluster: "admin",  page: "admin" },
  feature_request:  { cluster: "misc",   page: "admin" },
  welcome:          { cluster: "misc",   page: "home" }
};

// Cluster → icon glyph (Gate 1 placeholders; design-bot-authored SVGs ship
// in a subsequent design-bot-fed ship per P23 polish-defers).
// Uses fill: currentColor so cluster CSS class controls the color.
window.NOTIFICATION_CLUSTER_ICON = {
  social: '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>',
  dm:     '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M2 3h12v8H6l-3 3v-3H2z"/></svg>',
  coins:  '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>',
  league: '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v12M3 2h9l-2 3 2 3H3"/></svg>',
  round:  '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M8 2l2 4 4 .5-3 3 .8 4.5L8 12l-3.8 2 .8-4.5-3-3 4-.5z"/></svg>',
  tee:    '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 6h12M5 1v3M11 1v3"/></svg>',
  admin:  '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><path d="M8 1l5 2v5c0 3-2 5-5 7-3-2-5-4-5-7V3z"/></svg>',
  misc:   '<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><circle cx="8" cy="8" r="2"/></svg>'
};
