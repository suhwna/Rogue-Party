function getPendingRelicChoicePlayers(players) {
  return [...(players || [])].filter((player) => player.choicePending);
}

function hasPendingRelicChoice(players) {
  return getRelicChoiceSummary(players).hasPending;
}

function countPendingRelicChoices(players) {
  return getRelicChoiceSummary(players).pendingCount;
}

function getRelicChoiceSummary(players) {
  const pendingPlayers = getPendingRelicChoicePlayers(players);
  return {
    pendingCount: pendingPlayers.length,
    hasPending: pendingPlayers.length > 0,
    pendingPlayerIds: pendingPlayers.map((player) => player.id).filter(Boolean)
  };
}

function beginRelicChoiceForPlayers(players, choiceFactory) {
  let count = 0;
  for (const player of players || []) {
    player.choicePending = true;
    player.choices = choiceFactory(player) || [];
    count += 1;
  }
  return count;
}

function clearRelicChoice(player) {
  if (!player) return;
  player.choicePending = false;
  player.choices = [];
}

function applyTimedOutRelicChoices(players, applyChoice) {
  const results = [];
  for (const player of getPendingRelicChoicePlayers(players)) {
    if (!player.choicePending || player.choices.length === 0) continue;
    const chosen = player.choices[0];
    const applied = applyChoice(player, chosen);
    if (!applied) continue;
    clearRelicChoice(player);
    results.push({ player, chosen, applied });
  }
  return results;
}

module.exports = {
  applyTimedOutRelicChoices,
  beginRelicChoiceForPlayers,
  clearRelicChoice,
  countPendingRelicChoices,
  getPendingRelicChoicePlayers,
  getRelicChoiceSummary,
  hasPendingRelicChoice
};
