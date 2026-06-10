
## scrambleTeams legacy id-space (logged 2026-06-10, v8.24.35 triage)
The `scrambleTeams/smo_scramble` doc roster holds LEGACY profile ids
(zach/kayvan/kiyan/nick) while rules `allow update` checks `uid() in
members` (auth uids). Zach passes via amIFounder; kayvan/kiyan/nick
would be DENIED on any team write (live scoring, match sync). Dormant
today (legacy SMO team, no active scramble play on it). Fix candidates
for the next rules ship (fold into multi-league rules ship on approval):
dual-field `memberUids` (auth) alongside `members` (legacy) + rules
check either — avoids breaking app display logic that maps legacy ids.
Do NOT superset the `members` array itself: pages render roster names
from it and would show duplicates.
