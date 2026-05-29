// Unit tests for src/core/tournament-engine.js — free, deterministic tournament
// generation (no LLM API). Stubs PB so players have known, varied handicaps.

import { describe, test, expect } from 'vitest';
import { loadSource } from './helpers/eval-source.js';

// Eight players, handicaps 1..8 keyed by id p1..p8.
const HANDICAPS = { p1: 1, p2: 2, p3: 3, p4: 4, p5: 5, p6: 6, p7: 7, p8: 8 };
const PB = {
  getPlayer: (id) => (id in HANDICAPS ? { id, name: id.toUpperCase() } : null),
  getPlayerRounds: (id) => [{ id }],
  calcHandicap: (rounds) => (rounds && rounds[0] ? HANDICAPS[rounds[0].id] : null),
};

const eng = loadSource('src/core/tournament-engine.js', [
  'TOURNAMENT_FORMATS',
  'TOURNAMENT_TEAM_STYLES',
  'TOURNAMENT_POINT_SYSTEMS',
  'TOURNAMENT_PRESETS',
  'tournamentFormat',
  'tournamentTeamStyle',
  'tournamentPointSystem',
  'tournamentPreset',
  'tournamentPlayerStat',
  'tournamentRankPlayers',
  'tournamentBalanceTeams',
  'tournamentTeeGroups',
  'tournamentSeedBracket',
  'tournamentSeedOrder',
  'tournamentRoundSchedule',
  'tournamentGenerate',
  'tournamentBuildField',
  'tournamentValidate',
], { PB });

const ids = (n) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

describe('catalog', () => {
  test('every preset references valid catalog ids', () => {
    eng.TOURNAMENT_PRESETS.forEach((p) => {
      expect(eng.tournamentFormat(p.format).id).toBe(p.format);
      expect(eng.tournamentTeamStyle(p.teamStyle).id).toBe(p.teamStyle);
      expect(eng.tournamentPointSystem(p.pointSystem).id).toBe(p.pointSystem);
      expect(p.rounds).toBeGreaterThan(0);
      expect(p.defaultTitle && p.defaultTitle.length).toBeGreaterThan(0);
    });
  });

  test('Smoky Mountain Open is the namesake default preset', () => {
    const smoky = eng.tournamentPreset('smoky');
    expect(smoky).not.toBeNull();
    expect(smoky.format).toBe('stableford');
    expect(smoky.teamStyle).toBe('individual');
    expect(smoky.pointSystem).toBe('stableford');
  });

  test('lookups fall back to a sane default for unknown ids', () => {
    expect(eng.tournamentFormat('nope').id).toBe('stableford');
    expect(eng.tournamentTeamStyle('nope').id).toBe('individual');
    expect(eng.tournamentPointSystem('nope').id).toBe('stableford');
    expect(eng.tournamentPreset('nope')).toBeNull();
  });
});

describe('tournamentPlayerStat', () => {
  test('reads handicap from PB round history', () => {
    const s = eng.tournamentPlayerStat('p3');
    expect(s.handicap).toBe(3);
    expect(s.name).toBe('P3');
    expect(s.established).toBe(true);
  });

  test('defaults unestablished players to handicap 20', () => {
    const s = eng.tournamentPlayerStat('ghost');
    expect(s.handicap).toBe(20);
    expect(s.established).toBe(false);
  });
});

describe('tournamentRankPlayers', () => {
  test('sorts ascending by handicap (best first)', () => {
    const ranked = eng.tournamentRankPlayers(['p5', 'p1', 'p8', 'p3']);
    expect(ranked.map((p) => p.id)).toEqual(['p1', 'p3', 'p5', 'p8']);
  });
});

describe('tournamentBalanceTeams (snake draft)', () => {
  test('8 players into 2 teams: 4 each, tight spread', () => {
    const out = eng.tournamentBalanceTeams(ids(8), 2);
    expect(out.teams).toHaveLength(2);
    expect(out.teams[0].members).toHaveLength(4);
    expect(out.teams[1].members).toHaveLength(4);
    // Snake draft of 1..8 => Team A {1,4,5,8}=18, Team B {2,3,6,7}=18 => spread 0.
    expect(out.spread).toBe(0);
    expect(out.fairness).toBe('Excellent balance');
  });

  test('odd counts still split with a near-balanced spread', () => {
    const out = eng.tournamentBalanceTeams(ids(7), 2);
    const sizes = out.teams.map((t) => t.members.length).sort();
    expect(sizes).toEqual([3, 4]);
    expect(out.spread).toBeLessThan(6);
  });

  test('combined handicap is reported per team', () => {
    const out = eng.tournamentBalanceTeams(ids(8), 2);
    out.teams.forEach((t) => {
      const sum = t.members.reduce((a, p) => a + p.handicap, 0);
      expect(t.combinedHandicap).toBeCloseTo(sum, 5);
    });
  });
});

describe('tournamentTeeGroups', () => {
  test('groups of 4 with the remainder in the last group', () => {
    const groups = eng.tournamentTeeGroups(ids(8), 4);
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.length === 4)).toBe(true);
  });

  test('10 players -> 4,4,2', () => {
    const groups = eng.tournamentTeeGroups(ids(8).concat(['p9', 'p10']), 4);
    expect(groups.map((g) => g.length)).toEqual([4, 4, 2]);
  });

  test('field smaller than group size stays one group', () => {
    expect(eng.tournamentTeeGroups(ids(3), 4)).toHaveLength(1);
  });
});

describe('tournamentSeedBracket', () => {
  test('power-of-two field: no byes, 1-vs-N seeding', () => {
    const b = eng.tournamentSeedBracket(ids(8));
    expect(b.size).toBe(8);
    expect(b.byes).toBe(0);
    // First match is top seed vs bottom seed.
    expect(b.matches[0].seedA).toBe(1);
    expect(b.matches[0].seedB).toBe(8);
    expect(b.matches[0].playerA.id).toBe('p1');
    expect(b.matches[0].playerB.id).toBe('p8');
    expect(b.matches[0].bye).toBe(false);
  });

  test('non-power-of-two field pads to next power of two with byes for top seeds', () => {
    const b = eng.tournamentSeedBracket(ids(5));
    expect(b.size).toBe(8);
    expect(b.byes).toBe(3);
    // The #1 seed should be paired against an empty slot (a bye).
    const topMatch = b.matches.find((m) => m.seedA === 1 || m.seedB === 1);
    expect(topMatch.bye).toBe(true);
  });

  test('fewer than 2 players yields an empty bracket', () => {
    expect(eng.tournamentSeedBracket(['p1']).matches).toHaveLength(0);
  });
});

describe('tournamentSeedOrder', () => {
  test('size 4 -> [1,4,2,3]', () => {
    expect(eng.tournamentSeedOrder(4)).toEqual([1, 4, 2, 3]);
  });
  test('size 8 -> [1,8,4,5,2,7,3,6]', () => {
    expect(eng.tournamentSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe('tournamentRoundSchedule', () => {
  test('single format repeats across rounds', () => {
    const s = eng.tournamentRoundSchedule('stableford', 3, '8:00 AM');
    expect(s).toHaveLength(3);
    expect(s.every((r) => r.format === 'stableford')).toBe(true);
    expect(s[0].teeTime).toBe('8:00 AM');
  });

  test('mixed rotates the format', () => {
    const s = eng.tournamentRoundSchedule('mixed', 3);
    const fmts = new Set(s.map((r) => r.format));
    expect(fmts.size).toBeGreaterThan(1);
  });
});

describe('tournamentGenerate (orchestrator)', () => {
  test('individual stableford -> tee groups field', () => {
    const t = eng.tournamentGenerate({ memberIds: ids(8), format: 'stableford', teamStyle: 'individual', pointSystem: 'stableford', rounds: 3 });
    expect(t.schedule).toHaveLength(3);
    expect(t.field.kind).toBe('groups');
  });

  test('individual match -> bracket field', () => {
    const t = eng.tournamentGenerate({ memberIds: ids(8), format: 'match', teamStyle: 'individual', pointSystem: 'match', rounds: 1 });
    expect(t.field.kind).toBe('bracket');
    expect(t.field.result.size).toBe(8);
  });

  test('ryder -> two balanced teams', () => {
    const t = eng.tournamentGenerate({ memberIds: ids(8), format: 'match', teamStyle: 'ryder', pointSystem: 'match', rounds: 3 });
    expect(t.field.kind).toBe('teams');
    expect(t.field.result.teams).toHaveLength(2);
  });

  test('pairs -> 2-player teams', () => {
    const t = eng.tournamentGenerate({ memberIds: ids(8), format: 'bestball', teamStyle: 'pairs', pointSystem: 'strokes', rounds: 2 });
    expect(t.field.kind).toBe('teams');
    expect(t.field.result.teams).toHaveLength(4);
    expect(t.field.result.teams.every((tm) => tm.members.length === 2)).toBe(true);
  });
});

describe('tournamentValidate', () => {
  test('passes a complete config', () => {
    const v = eng.tournamentValidate({ name: 'Spring Open', winnerTitle: 'Champ', teamStyle: 'individual', memberIds: ids(4), startAt: Date.now() });
    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  test('flags missing name, title, and start', () => {
    const v = eng.tournamentValidate({ teamStyle: 'individual', memberIds: ids(4) });
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/name the tournament|title|start/i);
  });

  test('enforces minimum players for the team style', () => {
    const v = eng.tournamentValidate({ name: 'X', winnerTitle: 'Y', teamStyle: 'ryder', memberIds: ids(2), startAt: Date.now() });
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/at least 4 players/i);
  });
});
