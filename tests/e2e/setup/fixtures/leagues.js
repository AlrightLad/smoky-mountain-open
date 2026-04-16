// Synthetic leagues for the Playwright E2E suite.
const users = require('./users.js');
const allUids = users.users.map(u => u.uid);

const leagues = [
  {
    id: 'test-league-01',
    doc: {
      name: 'Test Parbaughs',
      slug: 'test-parbaughs',
      location: 'York, PA (test)',
      founded: '2026',
      badge: 'founding',
      tier: 'free',
      visibility: 'public',
      commissioner: 'test_zach_uid_01',
      admins: ['test_zach_uid_01'],
      memberCount: allUids.length,
      memberUids: allUids,
      inviteCode: 'TEST-CODE-01',
      theme: 'classic',
      createdAt: Date.now(),
      settings: {
        seasons: true,
        parcoins: true,
        wagers: true,
        bounties: true,
        trashTalk: true,
      },
    },
  },
  {
    id: 'test-league-02',
    doc: {
      name: 'Test Weekend League',
      slug: 'test-weekend',
      location: 'York, PA (test)',
      founded: '2026',
      badge: null,
      tier: 'free',
      visibility: 'public',
      commissioner: 'test_zach_uid_01',
      admins: ['test_zach_uid_01'],
      memberCount: 2,
      memberUids: ['test_scen_ml_01', 'test_zach_uid_01'],
      inviteCode: 'TEST-CODE-02',
      theme: 'classic',
      createdAt: Date.now(),
      settings: {
        seasons: true,
        parcoins: true,
        wagers: true,
        bounties: true,
        trashTalk: true,
      },
    },
  },
];

module.exports = leagues;
module.exports.leagues = leagues;
