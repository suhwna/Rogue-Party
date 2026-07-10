export interface BotBrain {
  nextVoteAt: number;
  nextChoiceAt: number;
  nextSkillAt: number;
  nextDashAt: number;
  nextThinkAt: number;
  skillCursor: number;
  targetId: string | null;
  strafeDir: -1 | 1;
}

export interface BotInputLike {
  mx: number;
  my: number;
  attacking: boolean;
}

export interface BotPlayerLike {
  botBrain?: BotBrain | null;
  input?: BotInputLike;
}

export interface BotIdentity {
  id: string;
  name: string;
  classId: string;
}

export interface BotMapNodeLike {
  readonly depth?: number;
}

export interface BotRelicChoiceLike {
  readonly consumable?: boolean;
  readonly target?: string;
  readonly upgrading?: boolean;
  readonly maxLevel?: number;
  readonly level?: number;
}

export interface BotSkillChoiceLike {
  readonly id?: string;
  readonly slot?: string;
  readonly requires?: string;
  readonly tier?: number;
}

export interface BotChoicePlayerLike {
  readonly classId: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly jobTier: number;
  readonly choices?: BotRelicChoiceLike[];
  readonly pendingSkillChoices?: BotSkillChoiceLike[];
}

export function createBotBrain(random = Math.random): BotBrain {
  return {
    nextVoteAt: 0,
    nextChoiceAt: 0,
    nextSkillAt: 0,
    nextDashAt: 0,
    nextThinkAt: 0,
    skillCursor: 0,
    targetId: null,
    strafeDir: random() < 0.5 ? -1 : 1,
  };
}

export function ensureBotBrain<TPlayer extends BotPlayerLike>(player: TPlayer): BotBrain {
  if (!player.botBrain) player.botBrain = createBotBrain();
  return player.botBrain;
}

export function resetBotInput(bot: BotPlayerLike): void {
  if (!bot.input) return;
  bot.input.mx = 0;
  bot.input.my = 0;
  bot.input.attacking = false;
}

export function createBotIdentity(
  roomCode: string,
  activeCount: number,
  botNumber: number,
  classRotation: readonly string[],
  botNames: readonly string[],
): BotIdentity {
  const classId = classRotation[(activeCount + botNumber - 1) % classRotation.length] ?? "warrior";
  const baseName = botNames[(botNumber - 1) % botNames.length] ?? `Bot ${botNumber}`;
  return {
    id: `bot:${roomCode}:${botNumber}`,
    name: `${baseName} ${botNumber}`,
    classId,
  };
}

export function pickBotMapNode<TNode extends BotMapNodeLike>(
  availableNodes: readonly TNode[],
  getNodeGameplayKind: (node: TNode) => string,
  random = Math.random,
): TNode | null {
  if (!availableNodes.length) return null;
  const weights: Record<string, number> = {
    reward: 9.2,
    boss: 8.8,
    miniboss: 6.4,
    elite: 5.4,
    defense: 4.8,
    blockade: 4.2,
    combat: 3.6,
    random: 2.7,
  };
  return [...availableNodes].sort((a, b) => {
    const aKind = getNodeGameplayKind(a);
    const bKind = getNodeGameplayKind(b);
    const aScore = (weights[aKind] ?? 3) + (a.depth ?? 0) * 0.08 + random() * 0.55;
    const bScore = (weights[bKind] ?? 3) + (b.depth ?? 0) * 0.08 + random() * 0.55;
    return bScore - aScore;
  })[0] ?? null;
}

export function pickBestBotRelicChoice<TChoice extends BotRelicChoiceLike>(
  bot: BotChoicePlayerLike & { readonly choices?: TChoice[] },
  random = Math.random,
): TChoice | null {
  return [...(bot.choices ?? [])].sort(
    (a, b) => scoreBotRelicChoice(bot, b, random) - scoreBotRelicChoice(bot, a, random),
  )[0] ?? null;
}

export function scoreBotRelicChoice(
  bot: BotChoicePlayerLike,
  choice: BotRelicChoiceLike,
  random = Math.random,
): number {
  let score = 100;
  if (choice.consumable && bot.hp < bot.maxHp * 0.55) score += 80;
  if (choice.target && choice.target !== "공용" && choice.target !== "Common") score += 18;
  if (choice.upgrading) score += 14;
  if (!choice.consumable && choice.maxLevel && choice.level && choice.level >= choice.maxLevel) score -= 80;
  return score + random() * 12;
}

export function pickBestBotSkillChoice<TChoice extends BotSkillChoiceLike>(
  bot: BotChoicePlayerLike & { readonly pendingSkillChoices?: TChoice[] },
  random = Math.random,
): TChoice | null {
  return [...(bot.pendingSkillChoices ?? [])].sort(
    (a, b) => scoreBotSkillChoice(bot, b, random) - scoreBotSkillChoice(bot, a, random),
  )[0] ?? null;
}

export function scoreBotSkillChoice(
  bot: BotChoicePlayerLike,
  choice: BotSkillChoiceLike,
  random = Math.random,
): number {
  let score = 110;
  if (choice.slot) score += 80;
  if (choice.requires) score += 22;
  if (choice.tier && choice.tier > bot.jobTier) score += choice.tier * 18;
  if (choice.id && choice.id.includes(bot.classId)) score += 10;
  return score + random() * 10;
}
