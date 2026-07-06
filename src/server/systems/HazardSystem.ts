export interface HazardLike {
  readonly ownerId?: string | number | null;
  readonly type?: string;
  readonly dead?: boolean;
}

export function filterLiveHazards<THazard extends HazardLike>(hazards: Iterable<THazard>): THazard[] {
  return [...hazards].filter((hazard) => !hazard.dead);
}

export function getOwnedHazards<THazard extends HazardLike>(
  hazards: Iterable<THazard>,
  ownerId: string | number | null,
  type?: string,
): THazard[] {
  return filterLiveHazards(hazards).filter((hazard) => hazard.ownerId === ownerId && (!type || hazard.type === type));
}

export function countOwnedHazards<THazard extends HazardLike>(
  hazards: Iterable<THazard>,
  ownerId: string | number | null,
  type?: string,
): number {
  return getOwnedHazards(hazards, ownerId, type).length;
}
