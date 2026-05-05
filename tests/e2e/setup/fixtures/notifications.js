// Synthetic notification fixtures for v8.17.0 / Ship 5+1 Gate 1 verification.
// Recipient: testZach (uid test_zach_uid_01).
//
// Coverage:
//   - 4 unread notifications across 4 type clusters (social, dm, coins, league)
//   - 1 unread that uses LEGACY linkPage field (verifies fallback aliasing)
//   - 3 read history items at staggered createdAt to verify sort + pagination
//   - 1 profile_reminder with params (verifies linkParams → params writer rename
//     and handleNotifClick params forwarding)

const admin = require('firebase-admin');

const ZACH = 'test_zach_uid_01';

function ts(secondsAgo) {
  return admin.firestore.Timestamp.fromMillis(Date.now() - secondsAgo * 1000);
}

const notifications = [
  // Unread (5) — sorted desc by createdAt at render time
  {
    toUserId: ZACH,
    type: 'wager_challenge',
    title: 'testNick challenged you!',
    message: 'Match Play for 100 ParCoins',
    page: 'wagers',
    read: false,
    createdAt: ts(30),
  },
  {
    toUserId: ZACH,
    type: 'dm',
    title: 'New Message',
    message: 'testKayvan: hey',
    // INTENTIONAL legacy field — exercises the n.linkPage fallback in indexNotifInMap
    linkPage: 'dms',
    read: false,
    createdAt: ts(20),
  },
  {
    toUserId: ZACH,
    type: 'bounty_claimed',
    title: 'Bounty claimed!',
    message: 'testKiyan claimed your 50-coin bounty',
    page: 'bounties',
    read: false,
    createdAt: ts(15),
  },
  {
    toUserId: ZACH,
    type: 'feed_like',
    title: 'New Kudos',
    message: 'testNick gave kudos to your post',
    page: 'chat',
    read: false,
    createdAt: ts(10),
  },
  {
    toUserId: ZACH,
    type: 'profile_reminder',
    title: 'Complete Your Profile',
    message: 'Add your bio, score range, and home course to earn XP.',
    page: 'members',
    params: { edit: ZACH },
    read: false,
    createdAt: ts(5),
  },

  // Read history (3) — sorted desc by createdAt; tests pagination + render
  {
    toUserId: ZACH,
    type: 'round_posted',
    title: 'testNick posted a round',
    message: '78 at Heritage Hills',
    page: 'feed',
    read: true,
    readAt: ts(7200),
    createdAt: ts(86400),
  },
  {
    toUserId: ZACH,
    type: 'feed_comment',
    title: 'New Comment',
    message: 'testKayvan commented on your post',
    page: 'chat',
    read: true,
    readAt: ts(9000),
    createdAt: ts(90000),
  },
  {
    toUserId: ZACH,
    type: 'achievement',
    title: 'Achievement unlocked: First Eagle',
    message: 'Score 2 on a par 4 (+50 XP)',
    read: true,
    readAt: ts(100000),
    createdAt: ts(180000),
  },
];

module.exports = { notifications };
