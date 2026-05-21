// Unit tests for src/core/handicap.js — WHS (World Handicap System) math.

import { describe, test, expect } from 'vitest';
import { loadSource } from './helpers/eval-source.js';

const {
  WHS_SCALE,
  calculateScoreDifferential,
  adjustedGrossScore,
  calculateHandicapIndex,
} = loadSource('src/core/handicap.js', [
  'WHS_SCALE',
  'calculateScoreDifferential',
  'adjustedGrossScore',
  'calculateHandicapIndex',
]);

describe('WHS_SCALE constants', () => {
  test('covers 3 through 20 rounds', () => {
    for (let n = 3; n <= 20; n++) {
      expect(WHS_SCALE[n]).toBeDefined();
      expect(WHS_SCALE[n].count).toBeGreaterThan(0);
      expect(typeof WHS_SCALE[n].adjustment).toBe('number');
    }
  });

  test('3-round bracket uses 1 differential with -2.0 adjustment', () => {
    expect(WHS_SCALE[3]).toEqual({ count: 1, adjustment: -2.0 });
  });

  test('20-round bracket uses 8 differentials, no adjustment', () => {
    expect(WHS_SCALE[20]).toEqual({ count: 8, adjustment: 0 });
  });
});

describe('calculateScoreDifferential', () => {
  test('scratch round on 113-slope course yields zero differential', () => {
    const diff = calculateScoreDifferential({ score: 72, rating: 72, slope: 113 });
    expect(diff).toBe(0);
  });

  test('+10 over rating on 113 slope yields +10 differential', () => {
    const diff = calculateScoreDifferential({ score: 82, rating: 72, slope: 113 });
    expect(diff).toBeCloseTo(10, 5);
  });

  test('higher slope penalizes the differential (player gets relief)', () => {
    const easy = calculateScoreDifferential({ score: 85, rating: 70, slope: 113 });
    const hard = calculateScoreDifferential({ score: 85, rating: 70, slope: 140 });
    expect(hard).toBeLessThan(easy);
  });

  test('returns null on missing score', () => {
    expect(calculateScoreDifferential({ score: 0, rating: 72, slope: 113 })).toBeNull();
  });

  test('returns null on slope = 0', () => {
    expect(calculateScoreDifferential({ score: 72, rating: 72, slope: 0 })).toBeNull();
  });

  test('returns null on missing rating', () => {
    expect(calculateScoreDifferential({ score: 72, rating: null, slope: 113 })).toBeNull();
  });
});

describe('adjustedGrossScore', () => {
  test('caps each hole at par + 2 + handicap strokes (net double bogey)', () => {
    const pars =   [4, 4, 4, 3, 4, 5, 4, 4, 4];
    const scores = [9, 4, 4, 3, 5, 6, 4, 4, 5];
    const adjusted = adjustedGrossScore(pars, scores, 0);
    expect(adjusted).toBe(41);
  });

  test('handicap strokes raise the cap on the appropriate holes', () => {
    const pars =   [4, 4, 4, 3, 4, 5, 4, 4, 4];
    const scores = [9, 4, 4, 3, 5, 6, 4, 4, 5];
    const adjusted = adjustedGrossScore(pars, scores, 9);
    expect(adjusted).toBe(7 + 4 + 4 + 3 + 5 + 6 + 4 + 4 + 5);
  });

  test('returns null when hole pars missing', () => {
    expect(adjustedGrossScore(null, [4, 4, 4], 0)).toBeNull();
    expect(adjustedGrossScore([], [4, 4, 4], 0)).toBeNull();
  });

  test('skips invalid hole scores (0 or NaN)', () => {
    const pars =   [4, 4, 4, 3, 4, 5, 4, 4, 4];
    const scores = [4, 0, 4, 3, 5, 6, 4, 4, 5];
    const adjusted = adjustedGrossScore(pars, scores, 0);
    expect(adjusted).toBe(4 + 4 + 3 + 5 + 6 + 4 + 4 + 5);
  });
});

describe('calculateHandicapIndex', () => {
  function makeRound(score, rating = 72, slope = 113, holesPlayed = 18, format = 'stroke') {
    return { score, rating, slope, holesPlayed, format };
  }

  test('returns null on empty rounds', () => {
    expect(calculateHandicapIndex([])).toBeNull();
    expect(calculateHandicapIndex(null)).toBeNull();
  });

  test('3-round bracket: produces a finite numeric handicap', () => {
    const rounds = [makeRound(72), makeRound(77), makeRound(82)];
    const idx = calculateHandicapIndex(rounds);
    expect(typeof idx).toBe('number');
    expect(Number.isFinite(idx)).toBe(true);
  });

  test('scramble rounds are excluded from differential pool', () => {
    const rounds = [
      makeRound(72, 72, 113, 18, 'scramble'),
      makeRound(72, 72, 113, 18, 'scramble4'),
      makeRound(72, 72, 113, 18, 'stroke'),
      makeRound(73, 72, 113, 18, 'stroke'),
      makeRound(74, 72, 113, 18, 'stroke'),
    ];
    expect(typeof calculateHandicapIndex(rounds)).toBe('number');
  });

  test('9-hole rounds are excluded (until Expected Score bootstrap)', () => {
    const rounds = [
      makeRound(40, 36, 113, 9),
      makeRound(40, 36, 113, 9),
      makeRound(40, 36, 113, 9),
    ];
    expect(calculateHandicapIndex(rounds)).toBeNull();
  });
});
