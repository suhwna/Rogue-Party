function filterLiveHazards(hazards) {
  return (hazards || []).filter((hazard) => !hazard.dead);
}

function getOwnedHazards(hazards, ownerId, type) {
  return filterLiveHazards(hazards).filter((hazard) => hazard.ownerId === ownerId && (!type || hazard.type === type));
}

function countOwnedHazards(hazards, ownerId, type) {
  return getOwnedHazards(hazards, ownerId, type).length;
}

module.exports = {
  countOwnedHazards,
  filterLiveHazards,
  getOwnedHazards
};
