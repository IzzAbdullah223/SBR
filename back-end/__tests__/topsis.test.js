import { rankBuses } from '../services/topsis.service.js';

// ── Shared test data ───────────────────────────────────────────────────────

const FASTEST   = { totalJourneyTime: 0.70, cost: 0.15, walkingDistance: 0.05, transfers: 0.10 };
const CHEAPEST  = { totalJourneyTime: 0.15, cost: 0.65, walkingDistance: 0.10, transfers: 0.10 };
const LESS_WALK = { totalJourneyTime: 0.15, cost: 0.10, walkingDistance: 0.65, transfers: 0.10 };
const FEWEST_TR = { totalJourneyTime: 0.20, cost: 0.15, walkingDistance: 0.10, transfers: 0.55 };

// Helper — builds a minimal valid bus object
const bus = (name, totalJourneyTime, cost, walkingDistance, transfers) => ({
  busId: name,
  routeNumber: name,
  name,
  totalJourneyTime,
  cost,
  walkingDistance,
  transfers,
});

// ── Edge cases ─────────────────────────────────────────────────────────────

describe('rankBuses — edge cases', () => {
  test('returns empty array for empty input', () => {
    expect(rankBuses([], FASTEST)).toEqual([]);
  });

  test('returns empty array for null input', () => {
    expect(rankBuses(null, FASTEST)).toEqual([]);
  });

  test('single bus gets score 1.0', () => {
    const result = rankBuses([bus('A', 30, 5, 0.3, 0)], FASTEST);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(1.0);
  });

  test('all buses identical — scores are equal', () => {
    const buses = [
      bus('A', 60, 10, 0.5, 1),
      bus('B', 60, 10, 0.5, 1),
    ];
    const result = rankBuses(buses, FASTEST);
    expect(result[0].score).toBe(result[1].score);
  });

  test('output length matches input length', () => {
    const buses = [
      bus('A', 30, 5,  0.2, 0),
      bus('B', 45, 8,  0.4, 1),
      bus('C', 60, 12, 0.6, 1),
      bus('D', 90, 15, 0.8, 2),
    ];
    expect(rankBuses(buses, FASTEST)).toHaveLength(4);
  });

  test('scores are between 0 and 1', () => {
    const buses = [
      bus('A', 30, 5,  0.2, 0),
      bus('B', 60, 15, 0.8, 2),
    ];
    rankBuses(buses, FASTEST).forEach(b => {
      expect(b.score).toBeGreaterThanOrEqual(0);
      expect(b.score).toBeLessThanOrEqual(1);
    });
  });

  test('result is sorted descending by score', () => {
    const buses = [
      bus('Slow',  90, 15, 0.8, 2),
      bus('Fast',  30, 5,  0.2, 0),
      bus('Mid',   60, 10, 0.5, 1),
    ];
    const result = rankBuses(buses, FASTEST);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });

  test('original bus object properties are preserved in output', () => {
    const input = [
      { ...bus('A', 30, 5, 0.2, 0), routeName: 'Route A', color: '#ff0000' },
      { ...bus('B', 60, 10, 0.5, 1), routeName: 'Route B', color: '#00ff00' },
    ];
    const result = rankBuses(input, FASTEST);
    expect(result.find(b => b.busId === 'A').routeName).toBe('Route A');
    expect(result.find(b => b.busId === 'A').color).toBe('#ff0000');
  });
});

// ── Fastest mode ───────────────────────────────────────────────────────────

describe('rankBuses — fastest mode', () => {
  test('bus with significantly lower totalJourneyTime wins', () => {
    const buses = [
      bus('Slow', 90, 10, 0.5, 1),
      bus('Fast', 40, 10, 0.5, 1),  // same cost + walking, much faster
    ];
    const result = rankBuses(buses, FASTEST);
    expect(result[0].busId).toBe('Fast');
  });

  test('large time gap beats small walking advantage', () => {
    // Fast has 15 min less journey time but slightly more walking
    const buses = [
      bus('LessWalk', 90, 10, 0.3, 1),
      bus('Fast',     75, 10, 0.6, 1),
    ];
    const result = rankBuses(buses, FASTEST);
    expect(result[0].busId).toBe('Fast');
  });

  test('direct bus beats transfer when journey time is similar', () => {
    const buses = [
      bus('Direct',   60, 10, 0.4, 0),  // no transfer
      bus('Transfer', 58, 10, 0.4, 1),  // 2 min faster but has transfer
    ];
    const result = rankBuses(buses, FASTEST);
    // transfers has 0.10 weight — direct should edge out with only 2 min difference
    expect(result[0].busId).toBe('Direct');
  });

  test('3-bus fastest ranking is ordered by totalJourneyTime when all else equal', () => {
    const buses = [
      bus('C', 90, 10, 0.5, 1),
      bus('A', 30, 10, 0.5, 1),
      bus('B', 60, 10, 0.5, 1),
    ];
    const result = rankBuses(buses, FASTEST);
    expect(result[0].busId).toBe('A');
    expect(result[1].busId).toBe('B');
    expect(result[2].busId).toBe('C');
  });
});

// ── Cheapest mode ──────────────────────────────────────────────────────────

describe('rankBuses — cheapest mode', () => {
  test('cheaper bus wins even if slightly slower', () => {
    const buses = [
      bus('Expensive', 50, 15, 0.4, 1),
      bus('Cheap',     60, 5,  0.4, 1),  // 10 min slower but 10 AED cheaper
    ];
    const result = rankBuses(buses, CHEAPEST);
    expect(result[0].busId).toBe('Cheap');
  });

  test('same cost — faster one wins in cheapest mode', () => {
    const buses = [
      bus('Slow', 80, 10, 0.5, 1),
      bus('Fast', 40, 10, 0.5, 1),
    ];
    const result = rankBuses(buses, CHEAPEST);
    expect(result[0].busId).toBe('Fast');
  });

  test('3-bus cheapest ranking ordered by cost when time is similar', () => {
    const buses = [
      bus('Mid',      55, 10, 0.5, 1),
      bus('Cheapest', 60, 3,  0.5, 1),
      bus('Pricey',   50, 20, 0.5, 1),
    ];
    const result = rankBuses(buses, CHEAPEST);
    expect(result[0].busId).toBe('Cheapest');
    expect(result[result.length - 1].busId).toBe('Pricey');
  });
});

// ── Less walking mode ──────────────────────────────────────────────────────

describe('rankBuses — less walking mode', () => {
  test('bus with least walking wins', () => {
    const buses = [
      bus('LongWalk',  40, 10, 1.5, 1),
      bus('ShortWalk', 70, 10, 0.1, 1),  // slower but much less walking
    ];
    const result = rankBuses(buses, LESS_WALK);
    expect(result[0].busId).toBe('ShortWalk');
  });

  test('zero walking beats everything in less_walking mode', () => {
    const buses = [
      bus('NoWalk',   80, 15, 0.0, 1),
      bus('SomeWalk', 40, 5,  0.5, 0),
    ];
    const result = rankBuses(buses, LESS_WALK);
    expect(result[0].busId).toBe('NoWalk');
  });
});

// ── Fewest transfers mode ──────────────────────────────────────────────────

describe('rankBuses — fewest transfers mode', () => {
  test('direct bus wins over transfer in fewest_transfers mode', () => {
    const buses = [
      bus('Transfer', 40, 8,  0.3, 1),  // faster and cheaper
      bus('Direct',   65, 12, 0.5, 0),  // slower and pricier but no transfer
    ];
    const result = rankBuses(buses, FEWEST_TR);
    expect(result[0].busId).toBe('Direct');
  });

  test('two direct buses — faster one wins', () => {
    const buses = [
      bus('DirectSlow', 80, 10, 0.4, 0),
      bus('DirectFast', 50, 10, 0.4, 0),
    ];
    const result = rankBuses(buses, FEWEST_TR);
    expect(result[0].busId).toBe('DirectFast');
  });
});

// ── Mode consistency ───────────────────────────────────────────────────────

describe('rankBuses — mode consistency', () => {
  // Same pool of buses ranked under different modes
  const buses = [
    bus('Fast+Expensive',  50, 20, 0.8, 1),
    bus('Slow+Cheap',      90, 3,  0.8, 1),
    bus('Balanced',        70, 10, 0.8, 1),
    bus('LessWalk',        75, 10, 0.1, 1),
    bus('Direct',          80, 10, 0.8, 0),
  ];

  test('fastest mode picks Fast+Expensive', () => {
    const result = rankBuses(buses, FASTEST);
    expect(result[0].busId).toBe('Fast+Expensive');
  });

  test('cheapest mode picks Slow+Cheap', () => {
    const result = rankBuses(buses, CHEAPEST);
    expect(result[0].busId).toBe('Slow+Cheap');
  });

  test('less_walking mode picks LessWalk', () => {
    const result = rankBuses(buses, LESS_WALK);
    expect(result[0].busId).toBe('LessWalk');
  });

  test('fewest_transfers mode picks Direct', () => {
    const result = rankBuses(buses, FEWEST_TR);
    expect(result[0].busId).toBe('Direct');
  });

  test('same buses ranked differently under different modes', () => {
    const fastest  = rankBuses(buses, FASTEST)[0].busId;
    const cheapest = rankBuses(buses, CHEAPEST)[0].busId;
    expect(fastest).not.toBe(cheapest);
  });
});

// ── Real-world scenario ────────────────────────────────────────────────────

describe('rankBuses — real world scenario (Deira → Mall of Emirates)', () => {
  // Mirrors actual search results from the app
  const realBuses = [
    bus('C09→93',  93,  12.5, 0.35, 1),
    bus('X94→96', 84,  12.5, 0.69, 1),
    bus('8→93',   102, 15.0, 0.71, 1),
    bus('8→84',   109, 15.0, 0.71, 1),
    bus('C01→93', 136, 12.5, 0.71, 1),
    bus('X13→93', 158, 12.5, 0.71, 1),
  ];

  test('fastest mode — X94 wins when journey gap is large enough', () => {
    // X94 totalJourneyTime=84 vs C09=93 → 9 min gap → time advantage wins
    const result = rankBuses(realBuses, FASTEST);
    expect(result[0].busId).toBe('X94→96');
  });

  test('cheapest mode — cheapest fares rank above expensive ones', () => {
    const result = rankBuses(realBuses, CHEAPEST);
    const top3 = result.slice(0, 3).map(b => b.busId);
    // 12.5 AED buses should dominate top positions over 15 AED ones
    top3.forEach(id => {
      const b = realBuses.find(x => x.busId === id);
      expect(b.cost).toBe(12.5);
    });
  });

  test('less_walking mode — C09 wins (0.35km vs 0.69+ for all others)', () => {
    const result = rankBuses(realBuses, LESS_WALK);
    expect(result[0].busId).toBe('C09→93');
  });

  test('X13→93 ranks last in fastest mode — highest totalJourneyTime', () => {
  const result = rankBuses(realBuses, FASTEST);
  expect(result[result.length - 1].busId).toBe('X13→93');
});

test('8→84 ranks last in cheapest mode — most expensive fare', () => {
  const result = rankBuses(realBuses, CHEAPEST);
  expect(result[result.length - 1].busId).toBe('8→84');
});
  test('expensive buses (15 AED) never win cheapest mode', () => {
    const result = rankBuses(realBuses, CHEAPEST);
    expect(result[0].cost).not.toBe(15);
  });
});