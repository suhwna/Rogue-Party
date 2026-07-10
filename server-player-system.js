function roomPlayers(room) {
  return room && room.players ? [...room.players.values()] : [];
}

function getBotPlayers(room) {
  return roomPlayers(room).filter((member) => member.bot);
}

function getHumanPlayers(room) {
  return roomPlayers(room).filter((member) => !member.bot);
}

function isActivePlayer(player) {
  return Boolean(player && !player.spectator);
}

function getActivePlayers(room) {
  return roomPlayers(room).filter(isActivePlayer);
}

function isActiveLivingPlayer(player) {
  return isActivePlayer(player) && player.hp > 0;
}

function getActiveLivingPlayers(room) {
  return roomPlayers(room).filter(isActiveLivingPlayer);
}

function countSpectators(room) {
  return roomPlayers(room).filter((member) => member.spectator).length;
}

function countReadyPlayers(room) {
  return getActivePlayers(room).filter((player) => player.ready).length;
}

function areAllPlayersReady(room) {
  const activePlayers = getActivePlayers(room);
  return activePlayers.length > 0 && activePlayers.every((player) => player.ready);
}

function getPlayerClassLabel(player, classes) {
  const label = classes[player.classId].label;
  if (player.classId === "novice" || player.jobTier <= 1) return label;
  return `${player.jobTier}차 ${label}`;
}

function getPlayerStatusEffects(player) {
  const effects = [];
  if (player.shield > 0) effects.push("shield");
  if (player.tauntGuardTimer > 0) effects.push("taunt_guard");
  if (player.immunityTimer > 0) effects.push("immune");
  if (player.poisonTimer > 0) effects.push("poison");
  if (player.dashSpeedTimer > 0) effects.push("haste");
  if (player.comboTimer > 0) effects.push("combo");
  if ((player.martialChi || 0) > 0) effects.push("chi");
  if ((player.martialFlowTimer || 0) > 0) effects.push("flow");
  if ((player.engineerMechaTimer || 0) > 0) effects.push("mecha");
  if (player.stealthTimer > 0) effects.push("stealth");
  return effects;
}

module.exports = {
  areAllPlayersReady,
  countReadyPlayers,
  countSpectators,
  getActiveLivingPlayers,
  getActivePlayers,
  getBotPlayers,
  getHumanPlayers,
  getPlayerClassLabel,
  getPlayerStatusEffects,
  isActiveLivingPlayer,
  isActivePlayer
};
