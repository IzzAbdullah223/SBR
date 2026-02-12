/**
 * TOPSIS SERVICE
 * Pure TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) algorithm
 */

/**
 * Normalize weights to sum to 1
 * @param {Object} weights - User-defined weights
 * @returns {Object} Normalized weights
 */
const normalizeWeights = (weights) => {
  const total = weights.time + weights.cost + weights.walkingDistance + weights.transfers;
  
  return {
    arrivalTime: weights.time / total,
    travelTime: weights.time / total,
    cost: weights.cost / total,
    walkingDistance: weights.walkingDistance / total,
    transfers: weights.transfers / total,
  };
};

/**
 * Run TOPSIS algorithm to rank buses
 * @param {Array} buses - Array of bus objects with criteria
 * @param {Object} weights - User preferences {time, cost, walkingDistance, transfers}
 * @returns {Array} Buses ranked by TOPSIS score
 */
export const rankBuses = (buses, weights) => {
  if (!buses || buses.length === 0) return [];
  if (buses.length === 1) {
    buses[0].score = 1.0;
    return buses;
  }

  // Criteria to evaluate (all are cost criteria - lower is better)
  const criteria = ['arrivalTime', 'travelTime', 'cost', 'walkingDistance', 'transfers'];
  
  // Normalize user weights
  const normalizedWeights = normalizeWeights(weights);

  // Step 1: Normalize the decision matrix
  const normalizedMatrix = criteria.map(criterion => {
    const values = buses.map(bus => bus[criterion]);
    const sumOfSquares = values.reduce((sum, val) => sum + val * val, 0);
    const denominator = Math.sqrt(sumOfSquares);
    
    // Avoid division by zero
    if (denominator === 0) return values.map(() => 0);
    
    return values.map(val => val / denominator);
  });

  // Step 2: Apply weights to normalized matrix
  const weightedMatrix = criteria.map((criterion, idx) => {
    return normalizedMatrix[idx].map(val => val * normalizedWeights[criterion]);
  });

  // Step 3: Determine ideal and negative-ideal solutions
  // All criteria are cost criteria (lower is better)
  const idealSolution = criteria.map((_, idx) => Math.min(...weightedMatrix[idx]));
  const negativeIdealSolution = criteria.map((_, idx) => Math.max(...weightedMatrix[idx]));

  // Step 4: Calculate separation measures
  const distances = buses.map((_, busIdx) => {
    let distanceToIdeal = 0;
    let distanceToNegative = 0;

    criteria.forEach((_, criterionIdx) => {
      const value = weightedMatrix[criterionIdx][busIdx];
      distanceToIdeal += Math.pow(value - idealSolution[criterionIdx], 2);
      distanceToNegative += Math.pow(value - negativeIdealSolution[criterionIdx], 2);
    });

    return {
      distanceToIdeal: Math.sqrt(distanceToIdeal),
      distanceToNegative: Math.sqrt(distanceToNegative),
    };
  });

  // Step 5: Calculate relative closeness to ideal solution (TOPSIS score)
  const busesWithScores = buses.map((bus, idx) => {
    const { distanceToIdeal, distanceToNegative } = distances[idx];
    
    // Avoid division by zero
    const denominator = distanceToIdeal + distanceToNegative;
    const score = denominator === 0 ? 0 : distanceToNegative / denominator;
    
    return {
      ...bus,
      score: Math.round(score * 100) / 100, // Round to 2 decimals
    };
  });

  // Step 6: Sort by score (highest first = closest to ideal)
  busesWithScores.sort((a, b) => b.score - a.score);

  return busesWithScores;
};