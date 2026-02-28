/**
 * TOPSIS SERVICE
 * Pure TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) algorithm
 */

/**
 * Normalize weights to sum to 1
 * @param {Object} weights - User-defined weights {time, cost, walkingDistance, transfers}
 * @returns {Object} Normalized weights mapped to criteria keys
 */
const normalizeWeights = (weights) => {
 
  const total = weights.time + weights.cost + weights.walkingDistance + weights.transfers;

  return {
    arrivalTime: (weights.time / 2) / total,
    travelTime:  (weights.time / 2) / total,
    cost:            weights.cost / total,
    walkingDistance: weights.walkingDistance / total,
    transfers:       weights.transfers / total,
  };
};

/**
 * Run TOPSIS algorithm to rank buses
 * @param {Array} buses   - Array of bus objects with criteria values
 * @param {Object} weights - User preferences {time, cost, walkingDistance, transfers}
 * @returns {Array} Buses sorted by TOPSIS score descending (best first)
 */
export const rankBuses = (buses, weights) => {
  if (!buses || buses.length === 0) return [];
  if (buses.length === 1) {
    buses[0].score = 1.0;
    return buses;
  }

  // All five criteria are "cost" type — lower value is better
  const criteria = ['arrivalTime', 'travelTime', 'cost', 'walkingDistance', 'transfers'];

  // Normalize user weights
  const normalizedWeights = normalizeWeights(weights);

  // ── Step 1: Build the normalized decision matrix ──────────────────────────
  const normalizedMatrix = criteria.map(criterion => {
    const values = buses.map(bus => bus[criterion]);
    const denominator = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    if (denominator === 0) return values.map(() => 0);
    return values.map(val => val / denominator);
  });

  // ── Step 2: Apply weights ─────────────────────────────────────────────────
  const weightedMatrix = criteria.map((criterion, idx) =>
    normalizedMatrix[idx].map(val => val * normalizedWeights[criterion])
  );

  // ── Step 3: Ideal (A+) and Negative-Ideal (A-) solutions ─────────────────
  // Lower is better → ideal = min, negative-ideal = max
  const idealSolution        = criteria.map((_, idx) => Math.min(...weightedMatrix[idx]));
  const negativeIdealSolution = criteria.map((_, idx) => Math.max(...weightedMatrix[idx]));

  // ── Step 4: Separation distances D+ and D- for each bus ──────────────────
  const distances = buses.map((_, busIdx) => {
    let dPlus = 0, dMinus = 0;
    criteria.forEach((_, cIdx) => {
      const v = weightedMatrix[cIdx][busIdx];
      dPlus  += Math.pow(v - idealSolution[cIdx],         2);
      dMinus += Math.pow(v - negativeIdealSolution[cIdx], 2);
    });
    return {
      distanceToIdeal:   Math.sqrt(dPlus),
      distanceToNegative: Math.sqrt(dMinus),
    };
  });

  // ── Step 5: Relative closeness score  C* = D- / (D+ + D-) ────────────────
  // Score ranges 0 (worst) → 1 (best)
  const busesWithScores = buses.map((bus, idx) => {
    const { distanceToIdeal, distanceToNegative } = distances[idx];
    const denom = distanceToIdeal + distanceToNegative;
    const score = denom === 0 ? 0 : distanceToNegative / denom;
    return { ...bus, score: Math.round(score * 100) / 100 };
  });

  // ── Step 6: Sort descending by score ─────────────────────────────────────
  busesWithScores.sort((a, b) => b.score - a.score);

  return busesWithScores;
};