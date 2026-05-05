// Scenario registry. Order is execution order.
// S11 (logout cleanup) MUST be last — subsequent scenarios would fail
// because the smoke account is logged out after S11 runs.

module.exports = [
  require('./s1-auth.js'),
  require('./s2-listener.js'),
  require('./s3-panel-render.js'),
  require('./s4-v6-nav-fix.js'),
  require('./s5-legacy-linkpage.js'),
  require('./s6-params-forwarding.js'),
  require('./s7-readat.js'),
  require('./s8-scrollback.js'),
  require('./s9-mark-read-promotion.js'),
  require('./s10-dismiss-delete.js'),
  require('./s12-spectator-nonregression.js'),
  require('./s11-logout-cleanup.js')
];
