// Unit tests for src/core/parcoins.js — earn-rate math (pure functions only).

import { describe, test, expect } from 'vitest';
import { loadSource } from './helpers/eval-source.js';

const {
  PARCOIN_RATES,
  calcRoundCoins,
  calcRangeCoins,
  calcStreakCoins,
  calcAchievementCoins,
} = loadSource('src/core/parcoins.js', [
  'PARCOIN_RATES',
  'calcRoundCoins',
  'calcRangeCoins',
  'calcStreakCoins',
  'calcAchievementCoins',
]);

describe('PARCOIN_RATES economy invariants', () => {
  test('round_18h_base is 50 (CLAUDE.md ParCoin Economy contract)', () => {
    expect(PARCOIN_RATES.round_18h_base).toBe(50);
  });

  test('attestation bonus is half of base for both 18H and 9H', () => {
    expect(PARCOIN_RATES.round_18h_attested).toBe(25);
    expect(PARCOIN_RATES.round_9h_attested).toBe(10);
  });

  test('daily login is exactly 1 (no streak bonus per Founder ruling)', () => {
    expect(PARCOIN_RATES.daily_login).toBe(1);
  });

  test('playing one 18H round earns >= 50x daily login', () => {
    expect(PARCOIN_RATES.round_18h_base).toBeGreaterThanOrEqual(
      50 * PARCOIN_RATES.daily_login
    );
  });

  test('event_win and season_champion are >= 500 / 1000 respectively', () => {
    expect(PARCOIN_RATES.event_win).toBeGreaterThanOrEqual(500);
    expect(PARCOIN_RATES.season_champion).toBeGreaterThanOrEqual(1000);
  });
});

describe('calcRoundCoins', () => {
  test('18H non-attested = 50', () => {
    expect(calcRoundCoins(false, false)).toBe(50);
  });

  test('18H attested = 75', () => {
    expect(calcRoundCoins(false, true)).toBe(75);
  });

  test('9H non-attested = 25', () => {
    expect(calcRoundCoins(true, false)).toBe(25);
  });

  test('9H attested = 35', () => {
    expect(calcRoundCoins(true, true)).toBe(35);
  });
});

describe('calcRangeCoins', () => {
  test('< 30 minutes earns nothing', () => {
    expect(calcRangeCoins(0)).toBe(0);
    expect(calcRangeCoins(15)).toBe(0);
    expect(calcRangeCoins(29)).toBe(0);
  });

  test('>= 30 minutes earns flat 10 coins (no scaling)', () => {
    expect(calcRangeCoins(30)).toBe(10);
    expect(calcRangeCoins(60)).toBe(10);
    expect(calcRangeCoins(180)).toBe(10);
  });

  test('null/undefined duration treated as 0', () => {
    expect(calcRangeCoins(null)).toBe(0);
    expect(calcRangeCoins(undefined)).toBe(0);
  });
});

describe('calcStreakCoins', () => {
  test('always returns 1 (flat daily login)', () => {
    expect(calcStreakCoins()).toBe(1);
  });
});

describe('calcAchievementCoins', () => {
  test('social achievements always earn 10 (capped)', () => {
    expect(calcAchievementCoins(50, true)).toBe(10);
    expect(calcAchievementCoins(200, true)).toBe(10);
    expect(calcAchievementCoins(0, true)).toBe(10);
  });

  test('play achievement at low XP (<= 50) earns 25', () => {
    expect(calcAchievementCoins(25, false)).toBe(25);
    expect(calcAchievementCoins(50, false)).toBe(25);
  });

  test('play achievement at high XP (>= 200) earns 50', () => {
    expect(calcAchievementCoins(200, false)).toBe(50);
    expect(calcAchievementCoins(500, false)).toBe(50);
  });

  test('play achievement at mid XP interpolates between 25 and 50', () => {
    const result = calcAchievementCoins(125, false);
    expect(result).toBeGreaterThanOrEqual(35);
    expect(result).toBeLessThanOrEqual(40);
  });

  test('missing XP defaults to 25', () => {
    expect(calcAchievementCoins(0, false)).toBe(25);
    expect(calcAchievementCoins(null, false)).toBe(25);
  });
});
