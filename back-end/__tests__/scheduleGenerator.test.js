import { calculateWalkingTime, generateArrivalTimes } from '../services/scheduleGenerator.service.js';

describe('calculateWalkingTime', () => {

  test('UT-04: standard distance converts correctly', () => {
    // (0.5 / 5) * 60 = 6 minutes
    expect(calculateWalkingTime(0.5)).toBe(6);
  });

  test('UT-05: result always rounds UP (ceil not floor)', () => {
    // (0.1 / 5) * 60 = 1.2 → ceil = 2
    expect(calculateWalkingTime(0.1)).toBe(2);
  });

  test('UT-06: zero distance returns zero minutes', () => {
    expect(calculateWalkingTime(0)).toBe(0);
  });

});

describe('generateArrivalTimes', () => {

  test('UT-09: forceMinOffset guarantees no bus before minimum', () => {
    const now = new Date();
    const results = generateArrivalTimes(15, now, 5, 12);
    results.forEach(dep => {
      expect(dep.minutesFromNow).toBeGreaterThanOrEqual(12);
    });
  });

  test('UT-10: subsequent buses spaced exactly by frequency', () => {
    const now = new Date();
    const results = generateArrivalTimes(15, now, 3, 10);
    const gap1 = results[1].minutesFromNow - results[0].minutesFromNow;
    const gap2 = results[2].minutesFromNow - results[1].minutesFromNow;
    expect(gap1).toBe(15);
    expect(gap2).toBe(15);
  });

  test('UT-11: without forceMinOffset first bus within frequency window', () => {
    const now = new Date();
    const results = generateArrivalTimes(15, now, 5);
    expect(results[0].minutesFromNow).toBeGreaterThanOrEqual(0);
    expect(results[0].minutesFromNow).toBeLessThan(15);
  });

});