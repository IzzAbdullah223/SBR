import { rankBuses } from '../services/topsis.service.js';

const weights = {
  time: 0.55, cost: 0.20,
  walkingDistance: 0.15, transfers: 0.10
};

const cheapestWeights = {
  time: 0.15, cost: 0.55,
  walkingDistance: 0.20, transfers: 0.10
};

const makeBus = (id, arrivalTime, travelTime, cost, walkingDistance, transfers) => ({
  busId: id, arrivalTime, travelTime, cost,
  walkingDistance, transfers,
  routeNumber: id, nolFare: cost, cashFare: cost + 1,
  walkingTime: 5
});

describe('rankBuses', () => {

  test('UT-04: empty array returns empty array', () => {
    expect(rankBuses([], weights)).toEqual([]);
  });

  test('UT-05: single bus receives score of 1.0', () => {
    const result = rankBuses([makeBus('A', 5, 20, 3, 0.3, 0)], weights);
    expect(result[0].score).toBe(1.0);
  });

  test('UT-06: cheapest mode ranks lowest fare bus first', () => {
    const buses = [
      makeBus('A', 5, 20, 5, 0.3, 0),
      makeBus('B', 5, 20, 3, 0.3, 0),
      makeBus('C', 5, 20, 8, 0.3, 0),
    ];
    const result = rankBuses(buses, cheapestWeights);
    expect(result[0].busId).toBe('B');
  });

  test('UT-07: fastest mode ranks lowest travel time first', () => {
    const fastWeights = { time: 0.55, cost: 0.15, walkingDistance: 0.15, transfers: 0.15 };
    const buses = [
      makeBus('A', 5, 45, 3, 0.3, 0),
      makeBus('B', 5, 20, 3, 0.3, 0),
      makeBus('C', 5, 60, 3, 0.3, 0),
    ];
    const result = rankBuses(buses, fastWeights);
    expect(result[0].busId).toBe('B');
  });

  test('UT-08: identical buses produce equal scores without crashing', () => {
    const buses = [
      makeBus('A', 5, 20, 3, 0.3, 0),
      makeBus('B', 5, 20, 3, 0.3, 0),
    ];
    const result = rankBuses(buses, weights);
    expect(result[0].score).toBe(result[1].score);
  });

});