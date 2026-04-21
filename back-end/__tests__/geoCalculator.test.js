import { calculateDistance } from '../services/geoCalculator.service.js';

describe('calculateDistance', () => {

  test('UT-01: two valid different Dubai coordinates', () => {
    const result = calculateDistance(25.197, 55.279, 25.204, 55.271);
   expect(result).toBeCloseTo(1.12, 1);
  });

  test('UT-02: same point passed twice returns exactly 0', () => {
    const result = calculateDistance(25.197, 55.279, 25.197, 55.279);
    expect(result).toBe(0);
  });

  test('UT-03: Dubai to London returns large distance', () => {
    const result = calculateDistance(25.197, 55.279, 51.507, -0.127);
    expect(result).toBeGreaterThan(5400);
expect(result).toBeLessThan(5600);
  });

});