/**
 * routeLabels.js
 * Converts TOPSIS score + criteria values into a plain-language label
 * so non-technical users understand why a route is ranked where it is.
 *
 * @param {Object} bus       - The bus object with score + criteria
 * @param {Array}  allBuses  - Full ranked array (bus at index 0 = best)
 * @returns {{ text: string, color: string }}
 */
export const getRouteLabel = (bus, allBuses) => {
  const index = allBuses.indexOf(bus);
  const best  = allBuses[0];

  // Rank 1 always gets "Best overall"
  if (index === 0) {
    return { text: 'Best overall', color: 'gold' };
  }

  // No transfers — highlight first since it's a strong differentiator
  if (bus.transfers === 0 && best.transfers > 0) {
    return { text: 'No transfers', color: 'teal' };
  }

  // Cheaper than rank 1
  const costDiff = best.cost - bus.cost;
  if (costDiff >= 1) {
    return { text: `Saves ${costDiff.toFixed(0)} AED`, color: 'teal' };
  }

  // Faster travel time than rank 1
  const timeDiff = Math.round(best.travelTime - bus.travelTime);
  if (timeDiff >= 3) {
    return { text: `${timeDiff} min faster`, color: 'teal' };
  }

  // Less walking than rank 1
  const walkDiff = best.walkingDistance - bus.walkingDistance;
  if (walkDiff >= 0.1) {
    return { text: 'Less walking', color: 'teal' };
  }

  // Arrives sooner (lower wait time)
  const waitDiff = Math.round(best.arrivalTime - bus.arrivalTime);
  if (waitDiff >= 2) {
    return { text: `Arrives ${waitDiff} min sooner`, color: 'teal' };
  }

  // Fallback — show rank number
  return { text: `#${index + 1} ranked`, color: 'muted' };
};