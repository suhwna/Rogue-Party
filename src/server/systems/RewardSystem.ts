export interface RelicChoicePlayerLike<TChoice = unknown> {
  readonly id?: string;
  choicePending: boolean;
  choices: TChoice[];
}

export interface RelicChoiceSummary {
  readonly pendingCount: number;
  readonly hasPending: boolean;
  readonly pendingPlayerIds: readonly string[];
}

export function getPendingRelicChoicePlayers<TPlayer extends RelicChoicePlayerLike>(
  players: Iterable<TPlayer>,
): TPlayer[] {
  return [...players].filter((player) => player.choicePending);
}

export function hasPendingRelicChoice(players: Iterable<RelicChoicePlayerLike>): boolean {
  return getRelicChoiceSummary(players).hasPending;
}

export function countPendingRelicChoices(players: Iterable<RelicChoicePlayerLike>): number {
  return getRelicChoiceSummary(players).pendingCount;
}

export function getRelicChoiceSummary(players: Iterable<RelicChoicePlayerLike>): RelicChoiceSummary {
  const pendingPlayers = getPendingRelicChoicePlayers(players);
  return {
    pendingCount: pendingPlayers.length,
    hasPending: pendingPlayers.length > 0,
    pendingPlayerIds: pendingPlayers.map((player) => player.id).filter((id): id is string => Boolean(id)),
  };
}

export function beginRelicChoiceForPlayers<TChoice, TPlayer extends RelicChoicePlayerLike<TChoice>>(
  players: Iterable<TPlayer>,
  choiceFactory: (player: TPlayer) => TChoice[],
): number {
  let count = 0;
  for (const player of players) {
    player.choicePending = true;
    player.choices = choiceFactory(player);
    count += 1;
  }
  return count;
}

export function clearRelicChoice(player: RelicChoicePlayerLike): void {
  player.choicePending = false;
  player.choices = [];
}

export interface TimedOutRelicChoiceResult<TPlayer, TChoice, TApplied> {
  readonly player: TPlayer;
  readonly chosen: TChoice;
  readonly applied: TApplied;
}

export function applyTimedOutRelicChoices<TChoice, TApplied, TPlayer extends RelicChoicePlayerLike<TChoice>>(
  players: Iterable<TPlayer>,
  applyChoice: (player: TPlayer, choice: TChoice) => TApplied | null | undefined,
): TimedOutRelicChoiceResult<TPlayer, TChoice, TApplied>[] {
  const results: TimedOutRelicChoiceResult<TPlayer, TChoice, TApplied>[] = [];
  for (const player of getPendingRelicChoicePlayers(players)) {
    if (!player.choicePending || player.choices.length === 0) continue;
    const chosen = player.choices[0]!;
    const applied = applyChoice(player, chosen);
    if (!applied) continue;
    clearRelicChoice(player);
    results.push({ player, chosen, applied });
  }
  return results;
}
