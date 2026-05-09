import * as topsisService from '../services/topsis.service.js';

export const MODE_WEIGHTS = {
  fastest:          { totalJourneyTime: 0.70, cost: 0.15, walkingDistance: 0.05, transfers: 0.10 },
  cheapest:         { totalJourneyTime: 0.15, cost: 0.65, walkingDistance: 0.10, transfers: 0.10 },
  less_walking:     { totalJourneyTime: 0.15, cost: 0.10, walkingDistance: 0.65, transfers: 0.10 },
  fewest_transfers: { totalJourneyTime: 0.20, cost: 0.15, walkingDistance: 0.10, transfers: 0.55 },
};

const REQUIRED_CRITERIA = ['totalJourneyTime', 'cost', 'walkingDistance', 'transfers'];

export const buildRepresentatives = (allBuses) => {
  const busGroups = {};
  allBuses.forEach((bus) => {
    if (!busGroups[bus.routeNumber])
      busGroups[bus.routeNumber] = [];
    
    busGroups[bus.routeNumber].push(bus);
  });

  return Object.values(busGroups).map((group) => {
    const sorted = group.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const rep = sorted[0];
    rep.upcomingDepartures = sorted.map((b) => ({
      departureTime:   b.departureTime,
      departureTime24: b.departureTime24,
      minutesFromNow:  b.arrivalTime,
    }));
    return rep;
  });
};

export const rankBuses = (req, res) => {
  try {
    const { buses, optimizationMode } = req.body;

    if (!Array.isArray(buses) || buses.length === 0) {
      return res.status(400).json({ success: false, message: 'buses must be a non-empty array.' });
    }

    const invalid = buses.some(b => REQUIRED_CRITERIA.some(c => b[c] == null || isNaN(b[c])));
    if (invalid) {
      return res.status(400).json({ success: false, message: 'Each bus must have totalJourneyTime, cost, walkingDistance and transfers.' });
    }

    const weights = MODE_WEIGHTS[optimizationMode] || MODE_WEIGHTS.fastest;
    const ranked  = topsisService.rankBuses(buses, weights);

    return res.status(200).json({ success: true, count: ranked.length, buses: ranked });
  } catch (error) {
    console.error('Error in rankBuses:', error);
    return res.status(500).json({ success: false, message: 'Ranking failed. Please try again.' });
  }
};