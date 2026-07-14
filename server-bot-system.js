function createBotBrain(random = Math.random) {
  return {
    nextVoteAt: 0,
    nextChoiceAt: 0,
    nextSkillAt: 0,
    nextDashAt: 0,
    nextThinkAt: 0,
    skillCursor: 0,
    targetId: null,
    strafeDir: random() < 0.5 ? -1 : 1
  };
}

function ensureBotBrain(player) {
  if (!player.botBrain) player.botBrain = createBotBrain();
  return player.botBrain;
}

function resetBotInput(bot) {
  if (!bot || !bot.input) return;
  bot.input.mx = 0;
  bot.input.my = 0;
  bot.input.attacking = false;
}

function createBotIdentity(roomCode, activeCount, botNumber, classRotation, botNames) {
  const classId = classRotation[(activeCount + botNumber - 1) % classRotation.length] || "warrior";
  const baseName = botNames[(botNumber - 1) % botNames.length] || `Bot ${botNumber}`;
  return {
    id: `bot:${roomCode}:${botNumber}`,
    name: `${baseName} ${botNumber}`,
    classId
  };
}

function pickBotMapNode(availableNodes, getNodeGameplayKind, random = Math.random) {
  if (!availableNodes || !availableNodes.length) return null;
  const weights = {
    reward: 9.2,
    boss: 8.8,
    miniboss: 6.4,
    elite: 5.4,
    defense: 4.8,
    blockade: 4.2,
    combat: 3.6,
    random: 2.7
  };
  return [...availableNodes].sort((a, b) => {
    const aKind = getNodeGameplayKind(a);
    const bKind = getNodeGameplayKind(b);
    const aScore = (weights[aKind] || 3) + (a.depth || 0) * 0.08 + random() * 0.55;
    const bScore = (weights[bKind] || 3) + (b.depth || 0) * 0.08 + random() * 0.55;
    return bScore - aScore;
  })[0] || null;
}

function pickBestBotRelicChoice(bot, random = Math.random) {
  return [...(bot.choices || [])].sort((a, b) => scoreBotRelicChoice(bot, b, random) - scoreBotRelicChoice(bot, a, random))[0] || null;
}

function scoreBotRelicChoice(bot, choice, random = Math.random) {
  let score = 100;
  const relicId = choice.id || choice.relicId || choice.targetId || "";
  const damageWeights = {
    power_core: 82,
    sharp_eye: 70,
    fatal_mark: 64,
    rapid_loader: 58,
    cooling_gear: 52,
    splitter_core: 48,
    giant_lens: 42,
    swift_boots: 10,
    heartstone: 6,
    iron_plate: 4,
    living_moss: 2
  };
  score += damageWeights[relicId] || 0;
  if (relicId === "splitter_core") {
    const projectileClasses = new Set(["ranger", "mage", "engineer", "puppeteer", "alchemist"]);
    score += projectileClasses.has(bot.classId) ? 24 : -44;
  }
  if (choice.consumable && bot.hp < bot.maxHp * 0.35) score += 96;
  else if (choice.consumable) score -= 26;
  if (choice.target && choice.target !== "공용" && choice.target !== "Common") score += 18;
  if (choice.upgrading) score += 14;
  if (!choice.consumable && choice.maxLevel && choice.level >= choice.maxLevel) score -= 80;
  return score + random() * 12;
}

function pickBestBotSkillChoice(bot, random = Math.random) {
  return [...(bot.pendingSkillChoices || [])].sort((a, b) => scoreBotSkillChoice(bot, b, random) - scoreBotSkillChoice(bot, a, random))[0] || null;
}

function scoreBotSkillChoice(bot, choice, random = Math.random) {
  let score = 110;
  if (choice.slot) score += 80;
  if (choice.requires) score += 22;
  if (choice.tier && choice.tier > bot.jobTier) score += choice.tier * 18;
  if (choice.id && choice.id.includes(bot.classId)) score += 10;
  return score + random() * 10;
}

module.exports = {
  createBotBrain,
  createBotIdentity,
  ensureBotBrain,
  pickBestBotRelicChoice,
  pickBestBotSkillChoice,
  pickBotMapNode,
  scoreBotRelicChoice,
  scoreBotSkillChoice,
  resetBotInput
};
