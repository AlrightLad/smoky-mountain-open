// Configuration for verify harness
module.exports = {
  LEAGUE_SCOPED: ["rounds","chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions"],

  EXPECTED: {
    members: 20,
    rounds: 22,
    chat: 26,
    trips: 1,
    invites: 28,
    scrambleTeams: 1,
    tripscores: 14,
    rangeSessions: 2
  },

  FOUNDING_LEAGUE_ID: "the-parbaughs",
  PROTECTED_LEAGUES: ["the-parbaughs"],

  TOLERANCE: {
    parcoin: 0,
    level: 0,
    handicap: 0.1
  }
};
