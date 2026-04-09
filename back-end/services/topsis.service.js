//TOPSIS stands for Technique for Order of Preference by Similarity to Ideal Solution.
//The idea in one sentence: the best option is the one closest to the perfect imaginary solution and furthest from the worst imaginary solution.


const normalizeWeights = (weights) => {
  const total = weights.time + weights.cost + weights.walkingDistance + weights.transfers;
  return {
    arrivalTime:     (weights.time / 2) / total,//just divided by total for safety assuming that the passed values didnot sum to 1.
    travelTime:      (weights.time / 2) / total, 
    cost:             weights.cost            / total,
    walkingDistance:  weights.walkingDistance  / total,
    transfers:        weights.transfers        / total,
  };
};

export const rankBuses = (buses, weights) => {
  if (!buses || buses.length === 0) return [];

  // Use spread to avoid mutating the original object — consistent with multi-bus path below
  if (buses.length === 1) {
    return [{ ...buses[0], score: 1.0 }];//If there's only one bus, TOPSIS can't compare anything — there's nothing to compare against. So we just give it a perfect score of 1.0 and return. The ...buses[0] spread copies all the bus properties so we don't mutate the original object.
  }

  const criteria = ['arrivalTime', 'travelTime', 'cost', 'walkingDistance', 'transfers'];// 
  const normalizedWeights = normalizeWeights(weights);

  // Step 1: Normalized decision matrix
 //Right now the numbers are on completely different scales. arrivalTime is 3–8 minutes. walkingDistance is 80–200 meters. cost is 3–6 AED. You cannot compare or combine these directly. A difference of 1 in arrivalTime is huge. A difference of 1 in walkingDistance is nothing. We need to bring everything onto the same scale (0 to 1) using math.
  const normalizedMatrix = criteria.map(criterion => {// this return a array of values like [[2,e2,2],]
    const values = buses.map(bus => bus[criterion]);
    const denominator = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));//This is the sum of squares.orEuclidean length of the vector of values
    if (denominator === 0) return values.map(() => 0);
    return values.map(val => val / denominator);//For each criterion, we divide every value by the square root of the sum of all squared values. This is called Euclidean normalization. this is return ex:values = [25, 30, 20]
  });

  // Step 2: Apply weights here we normalized the weights sent to us fasted wich many critera or  least walkingl....
  const weightedMatrix = criteria.map((criterion, idx) =>
    normalizedMatrix[idx].map(val => val * normalizedWeights[criterion])
  );

  // Step 3: Ideal (A+) and Negative-Ideal (A-) — lower is better for all criteria
  const idealSolution         = criteria.map((_, idx) => Math.min(...weightedMatrix[idx]));// here we are making the imaginary best soloution that we want to compare others to note that is is mixed of many buse crte
  const negativeIdealSolution = criteria.map((_, idx) => Math.max(...weightedMatrix[idx]));

  // Step 4: Separation distances D+ and D-
  //For each bus, we're going to accumulate two sums — one measuring closeness to ideal, one measuring closeness to worst. They start at 0 and grow with each criterion.
//dPlus  = distance to the IDEAL bus (accumulated)
//dPlus  = distance to the IDEAL bus (accumulated)

  const distances = buses.map((_, busIdx) => {
    let dPlus = 0, dMinus = 0;
    criteria.forEach((_, cIdx) => {
      const v = weightedMatrix[cIdx][busIdx];
      dPlus  += Math.pow(v - idealSolution[cIdx],         2);
      dMinus += Math.pow(v - negativeIdealSolution[cIdx], 2);
    });
    return {
      distanceToIdeal:    Math.sqrt(dPlus),//Square root converts sum-of-squares back to actual Euclidean distance. Think of it like Pythagoras but in 5 dimensions instead of 2.
      distanceToNegative: Math.sqrt(dMinus),
    };
  });

  // Step 5: Relative closeness C* = D- / (D+ + D-)
  const busesWithScores = buses.map((bus, idx) => {
    const { distanceToIdeal, distanceToNegative } = distances[idx];
    const denom = distanceToIdeal + distanceToNegative;
    const score = denom === 0 ? 0 : distanceToNegative / denom;
    return { ...bus, score: Math.round(score * 100) / 100 };
  });

  // Step 6: Sort descending
  busesWithScores.sort((a, b) => b.score - a.score);

  return busesWithScores;
};