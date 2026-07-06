export interface DungeonWorld {
  w: number;
  h: number;
}

export interface DungeonRoom {
  chapter?: number;
  floor?: number;
}

export interface ChapterTheme {
  base: string;
  side: string;
  torch: string;
  torchSoft: string;
  scarA: string;
  scarB: string;
}

export interface SpriteLike {
  zIndex: number;
  blendMode?: string;
  rotation?: number;
}

export interface DungeonRendererHost {
  layers: {
    floor: unknown;
    pickup: unknown;
  };
  rect(parent: unknown, x: number, y: number, width: number, height: number, color: string, alpha: number): SpriteLike;
  sprite(
    key: string,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): SpriteLike;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
  bar(x: number, y: number, width: number, height: number, ratio: number, fill: string): void;
  noise(x: number, y: number): number;
}

export interface DungeonObjective {
  type?: string;
  x: number;
  y: number;
  radius?: number;
  hp?: number;
  maxHp?: number;
}

export function resolveChapter(room: DungeonRoom = {}): number {
  return Math.max(1, Math.min(3, Math.round(Number(room.chapter || room.floor || 1))));
}

export function chapterTheme(chapter: number): ChapterTheme {
  if (chapter === 2) {
    return {
      base: "#09140f",
      side: "#0d1c13",
      torch: "#84cc16",
      torchSoft: "#bef264",
      scarA: "#84cc16",
      scarB: "#6ba79e",
    };
  }
  if (chapter === 3) {
    return {
      base: "#080913",
      side: "#0d1020",
      torch: "#8b5cf6",
      torchSoft: "#93c5fd",
      scarA: "#b985c8",
      scarB: "#7e9fb2",
    };
  }
  return {
    base: "#0f0c0c",
    side: "#11100f",
    torch: "#f97316",
    torchSoft: "#facc15",
    scarA: "#d6b76d",
    scarB: "#7e9fb2",
  };
}

export function renderDungeon(
  renderer: DungeonRendererHost,
  world: DungeonWorld | null | undefined,
  now: number,
  room: DungeonRoom = {},
): void {
  if (!world) return;
  const chapter = resolveChapter(room);
  const theme = chapterTheme(chapter);
  renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, theme.base, 1).zIndex = -2400;

  const tileSize = 96;
  for (let y = tileSize / 2; y < world.h; y += tileSize) {
    for (let x = tileSize / 2; x < world.w; x += tileSize) {
      const variant = Math.floor(renderer.noise(Math.floor(x / tileSize) * 23, Math.floor(y / tileSize) * 31) * 6) % 6;
      const tile = renderer.sprite(`floor-tile-${chapter}-${variant}`, renderer.layers.floor, x, y, tileSize / 64, tileSize / 64, "#ffffff", 0.96);
      tile.zIndex = -2200;
    }
  }

  for (let x = tileSize / 2; x < world.w; x += tileSize) {
    const top = renderer.sprite(`wall-block-${chapter}`, renderer.layers.floor, x, 28, tileSize / 64, 0.9, "#ffffff", 1);
    const bottom = renderer.sprite(`wall-block-${chapter}`, renderer.layers.floor, x, world.h - 26, tileSize / 64, 0.9, "#ffffff", 1);
    top.zIndex = -900;
    bottom.zIndex = world.h + 900;
  }

  for (let y = tileSize / 2; y < world.h; y += tileSize) {
    renderer.rect(renderer.layers.floor, 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
    renderer.rect(renderer.layers.floor, world.w - 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
  }

  for (let i = 0; i < 20; i += 1) {
    const side = i % 4;
    const t = renderer.noise(i * 19, 3);
    const x = side < 2 ? 150 + t * (world.w - 300) : side === 2 ? 58 : world.w - 58;
    const y = side >= 2 ? 150 + t * (world.h - 300) : side === 0 ? 70 : world.h - 70;
    const glow = 0.08 + Math.sin(now / 240 + i) * 0.025;
    renderer.sprite(`torch-${chapter}`, renderer.layers.floor, x, y, 1.25, 1.25, "#ffffff", 0.82).zIndex = y - 12;
    renderer.rect(renderer.layers.floor, x, y - 4, 96, 34, theme.torch, glow).zIndex = y - 20;
  }

  for (let i = 0; i < 44; i += 1) {
    const x = renderer.noise(i * 19, 3) * world.w;
    const y = renderer.noise(i * 31, 9) * world.h;
    const w = 36 + renderer.noise(i, 14) * 82;
    const h = 4 + renderer.noise(i, 18) * 7;
    renderer.rect(renderer.layers.floor, x, y, w, h, i % 3 === 0 ? theme.scarB : theme.scarA, 0.04 + Math.sin(now / 1700 + i) * 0.012);
  }

  if (chapter >= 2) {
    const count = chapter === 2 ? 28 : 36;
    for (let i = 0; i < count; i += 1) {
      const x = renderer.noise(i * 17, chapter * 41) * world.w;
      const y = renderer.noise(i * 29, chapter * 53) * world.h;
      const scale = chapter === 2 ? 0.5 + renderer.noise(i, 5) * 0.35 : 0.34 + renderer.noise(i, 7) * 0.28;
      const key = chapter === 2 ? "fx-poison-cloud" : "fx-frost-shards";
      const tint = chapter === 2 ? "#84cc16" : "#8b5cf6";
      const sprite = renderer.sprite(key, renderer.layers.floor, x, y, scale, scale * 0.62, tint, chapter === 2 ? 0.08 : 0.07);
      sprite.blendMode = "add";
      sprite.zIndex = -1800;
      sprite.rotation = renderer.noise(i, 11) * Math.PI;
    }
  }
}

export function renderObjective(renderer: DungeonRendererHost, objective: DungeonObjective | null | undefined, now: number): void {
  if (!objective) return;
  const color = objective.type === "defense" ? "#7e9fb2" : "#caa35a";
  renderer.sprite("chest", renderer.layers.pickup, objective.x, objective.y, 1.5, 1.5, color, 0.72).zIndex = objective.y;
  renderer.ring(objective.x, objective.y, objective.radius || 70, color, 0.22 + Math.sin(now / 250) * 0.06, 2);
  if (Number(objective.maxHp || 0) > 0) {
    renderer.bar(
      objective.x,
      objective.y - (objective.radius || 60) - 24,
      90,
      8,
      Number(objective.hp || 0) / Math.max(1, Number(objective.maxHp || 1)),
      "#86efac",
    );
  }
}
