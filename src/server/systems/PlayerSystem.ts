export interface PlayerLike {
  readonly bot?: boolean;
  readonly spectator?: boolean;
  readonly hp?: number;
  readonly ready?: boolean;
}

export interface PlayerClassViewLike extends PlayerLike {
  readonly classId: string;
  readonly jobTier: number;
}

export interface ClassLabelLike {
  readonly label: string;
}

export interface PlayerStatusLike extends PlayerLike {
  readonly shield?: number;
  readonly tauntGuardTimer?: number;
  readonly immunityTimer?: number;
  readonly poisonTimer?: number;
  readonly dashSpeedTimer?: number;
  readonly comboTimer?: number;
  readonly martialChi?: number;
  readonly martialFlowTimer?: number;
  readonly engineerMechaTimer?: number;
  readonly stealthTimer?: number;
}

export interface RoomWithPlayers<TPlayer extends PlayerLike = PlayerLike> {
  readonly players: Map<string, TPlayer>;
}

export function roomPlayers<TPlayer extends PlayerLike>(room: RoomWithPlayers<TPlayer>): TPlayer[] {
  return [...room.players.values()];
}

export function getBotPlayers<TPlayer extends PlayerLike>(room: RoomWithPlayers<TPlayer>): TPlayer[] {
  return roomPlayers(room).filter((member) => Boolean(member.bot));
}

export function getHumanPlayers<TPlayer extends PlayerLike>(room: RoomWithPlayers<TPlayer>): TPlayer[] {
  return roomPlayers(room).filter((member) => !member.bot);
}

export function isActivePlayer(player: PlayerLike | null | undefined): boolean {
  return Boolean(player && !player.spectator);
}

export function getActivePlayers<TPlayer extends PlayerLike>(room: RoomWithPlayers<TPlayer>): TPlayer[] {
  return roomPlayers(room).filter(isActivePlayer);
}

export function isActiveLivingPlayer(player: PlayerLike | null | undefined): boolean {
  return isActivePlayer(player) && Number(player?.hp) > 0;
}

export function getActiveLivingPlayers<TPlayer extends PlayerLike>(room: RoomWithPlayers<TPlayer>): TPlayer[] {
  return roomPlayers(room).filter(isActiveLivingPlayer);
}

export function countSpectators(room: RoomWithPlayers): number {
  return roomPlayers(room).filter((member) => member.spectator).length;
}

export function countReadyPlayers(room: RoomWithPlayers): number {
  return getActivePlayers(room).filter((player) => player.ready).length;
}

export function areAllPlayersReady(room: RoomWithPlayers): boolean {
  const activePlayers = getActivePlayers(room);
  return activePlayers.length > 0 && activePlayers.every((player) => player.ready);
}

export function getPlayerClassLabel(
  player: PlayerClassViewLike,
  classes: Record<string, ClassLabelLike>,
): string {
  const label = classes[player.classId]!.label;
  if (player.classId === "novice" || player.jobTier <= 1) return label;
  return `${player.jobTier}차 ${label}`;
}

export function getPlayerStatusEffects(player: PlayerStatusLike): string[] {
  const effects: string[] = [];
  if ((player.shield ?? 0) > 0) effects.push("shield");
  if ((player.tauntGuardTimer ?? 0) > 0) effects.push("taunt_guard");
  if ((player.immunityTimer ?? 0) > 0) effects.push("immune");
  if ((player.poisonTimer ?? 0) > 0) effects.push("poison");
  if ((player.dashSpeedTimer ?? 0) > 0) effects.push("haste");
  if ((player.comboTimer ?? 0) > 0) effects.push("combo");
  if ((player.martialChi ?? 0) > 0) effects.push("chi");
  if ((player.martialFlowTimer ?? 0) > 0) effects.push("flow");
  if ((player.engineerMechaTimer ?? 0) > 0) effects.push("mecha");
  if ((player.stealthTimer ?? 0) > 0) effects.push("stealth");
  return effects;
}
