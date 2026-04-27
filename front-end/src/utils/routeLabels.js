export const getRouteLabel = (bus, allBuses) => {
  const index = allBuses.indexOf(bus);
  const best  = allBuses[0];
  if (index === 0) {
    return { text: 'Best overall', color: 'gold' };
  }
  if (bus.transfers === 0 && best.transfers > 0) {
    return { text: 'No transfers', color: 'teal' };
  }
  const costDiff = best.cost - bus.cost;
  if (costDiff >= 1) {
    return { text: `Saves ${costDiff.toFixed(0)} AED`, color: 'teal' };
  }
  const timeDiff = Math.round(best.totalJourneyTime - bus.totalJourneyTime);
  if (timeDiff >= 3) {
    return { text: `${timeDiff} min faster`, color: 'teal' };
  }
  const walkDiff = best.walkingDistance - bus.walkingDistance;
  if (walkDiff >= 0.1) {
    return { text: 'Less walking', color: 'teal' };
  }
  const waitDiff = Math.round(best.arrivalTime - bus.arrivalTime);
  if (waitDiff >= 2) {
    return { text: `Arrives ${waitDiff} min sooner`, color: 'teal' };
  }
  return { text: `#${index + 1} ranked`, color: 'muted' };
};