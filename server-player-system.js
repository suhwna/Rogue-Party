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

function getClassPassiveView(player) {
  if (player.classId === "warrior") {
    return { name: "전열", text: "받는 피해 감소, 근접 공격 시 보호막과 추가 피해" };
  }
  if (player.classId === "ranger") {
    return { name: "저격", text: "거리가 멀수록 피해 증가, 명중한 적을 취약하게 만듦" };
  }
  if (player.classId === "mage") {
    return { name: "과부하", text: "빙결/화상 등 상태이상 적에게 더 강함" };
  }
  if (player.classId === "engineer") {
    return { name: "장비 운용", text: "설치물이 적을 자동 압박합니다. Q 과부하로 배치된 장비를 강화합니다." };
  }
  if (player.classId === "puppeteer") {
    return { name: "실표식", text: "본체와 인형이 실표식을 쌓고, 결계/인형극/교대로 표식을 절단합니다." };
  }
  if (player.classId === "martialist") {
    return { name: "기력", text: "연속 공격으로 기력을 쌓고 스킬이 보유 기력에 따라 강화됩니다." };
  }
  if (player.classId === "alchemist") {
    return { name: "증류 반응", text: "산성 장판과 화염 장판이 만나면 폭발하고 짧은 잔류 장판을 남깁니다." };
  }
  if (player.classId === "assassin") {
    return { name: "그림자 처형", text: "다중 표식 대상에게 그림자 추가타가 발생하고 낮은 체력 적을 강하게 처형합니다." };
  }
  if (player.classId === "cleric") {
    return { name: "신성", text: "피해를 줄 때 가장 약한 아군을 회복" };
  }
  return { name: "생존 본능", text: "Q로 회복과 밀쳐내기를 동시에 수행" };
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
  getClassPassiveView,
  getHumanPlayers,
  getPlayerClassLabel,
  getPlayerStatusEffects,
  isActiveLivingPlayer,
  isActivePlayer
};
