const normalizeWeights = (weights) => {
  const total = weights.time + weights.cost + weights.walkingDistance + weights.transfers;
  return {
    arrivalTime:     (weights.time / 2) / total,
    travelTime:      (weights.time / 2) / total,
    cost:             weights.cost            / total,
    walkingDistance:  weights.walkingDistance  / total,
    transfers:        weights.transfers        / total,
  };
};
export const rankBuses = (buses, weights) => {
  if (!buses || buses.length === 0) return [];

  if (buses.length === 1) {
    return [{ ...buses[0], score: 1.0 }];
  }
  const criteria = ['arrivalTime', 'travelTime', 'cost', 'walkingDistance', 'transfers'];
  const normalizedWeights = normalizeWeights(weights);

  const normalizedMatrix = criteria.map(criterion => {
    const values = buses.map(bus => bus[criterion]);
    const denominator = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    if (denominator === 0) return values.map(() => 0);
    return values.map(val => val / denominator);
  });
  const weightedMatrix = criteria.map((criterion, idx) =>
    normalizedMatrix[idx].map(val => val * normalizedWeights[criterion])
  );
  const idealSolution = criteria.map((_, idx) => Math.min(...weightedMatrix[idx]));
  const negativeIdealSolution = criteria.map((_, idx) => Math.max(...weightedMatrix[idx]));

  const distances = buses.map((_, busIdx) => {
    let dPlus = 0, dMinus = 0;
    criteria.forEach((_, cIdx) => {
      const v = weightedMatrix[cIdx][busIdx];
      dPlus  += Math.pow(v - idealSolution[cIdx], 2);
      dMinus += Math.pow(v - negativeIdealSolution[cIdx], 2);
    });
    return {
      distanceToIdeal:    Math.sqrt(dPlus),
      distanceToNegative: Math.sqrt(dMinus),
    };
  });
  const busesWithScores = buses.map((bus, idx) => {
    const { distanceToIdeal, distanceToNegative } = distances[idx];
    const denom = distanceToIdeal + distanceToNegative;
    const score = denom === 0 ? 0 : distanceToNegative / denom;
    return { ...bus, score: Math.round(score * 100) / 100 };
  });
  busesWithScores.sort((a, b) => b.score - a.score);
  return busesWithScores;
};