import { enemyPalette } from "./TexturePalettes";
import { outline, px } from "./PixelDrawing";

export function drawEnemySheetFrame(
  ctx: CanvasRenderingContext2D,
  type: string,
  frame: number,
): void {
  const [main, dark, light] = enemyPalette(type);
  const bob = frame % 2;

  if (type === "bat") {
    px(ctx, 4, 22 - bob * 2, 22, 11, dark);
    px(ctx, 38, 22 - bob * 2, 22, 11, dark);
    px(ctx, 24, 20, 16, 22, main);
    px(ctx, 25, 13, 5, 9, main);
    px(ctx, 36, 13, 5, 9, main);
    px(ctx, 29, 28, 3, 3, "#11110f");
    px(ctx, 36, 28, 3, 3, "#11110f");
  } else if (type === "charger") {
    px(ctx, 10, 22, 38, 25, main);
    px(ctx, 41, 27, 17, 7, light);
    px(ctx, 7, 26, 12, 17, dark);
    px(ctx, 45, 16, 10, 11, "#f8f3e9");
    px(ctx, 43, 38, 11, 5, dark);
  } else if (type === "guardian") {
    px(ctx, 13, 8, 38, 47, dark);
    px(ctx, 20, 13, 24, 37, main);
    px(ctx, 23, 27, 18, 4, light);
    px(ctx, 31, 17, 4, 30, light);
    px(ctx, 16, 17, 8, 30, "#1f252b");
  } else if (type === "shaman") {
    px(ctx, 18, 15, 28, 37, dark);
    px(ctx, 24, 10, 16, 14, main);
    px(ctx, 48, 8, 5, 43, light);
    px(ctx, 45, 5, 11, 9, light);
    px(ctx, 25, 30, 14, 4, "#dcfce7");
  } else if (type === "spitter") {
    px(ctx, 10, 22, 31, 23, main);
    px(ctx, 35, 25, 18, 11, dark);
    px(ctx, 49, 27, 7, 7, light);
    px(ctx, 17, 18, 8, 6, "#bef264");
    px(ctx, 24, 16, 6, 6, "#bef264");
  } else if (type === "bomber") {
    px(ctx, 14, 18, 36, 36, main);
    px(ctx, 23, 27, 18, 18, dark);
    px(ctx, 38, 7, 5, 14, "#f8f3e9");
    px(ctx, 42, 4, 8, 8, "#f97316");
    px(ctx, 19, 22, 5, 5, "#11110f");
  } else if (type === "stalker") {
    px(ctx, 16, 8, 32, 46, dark);
    px(ctx, 24, 18, 17, 13, main);
    px(ctx, 43, 35, 17, 4, light);
    px(ctx, 21, 12, 24, 7, "#111113");
  } else if (type === "mortar") {
    px(ctx, 11, 24, 36, 24, main);
    px(ctx, 38, 9, 12, 26, dark);
    px(ctx, 41, 9, 6, 8, light);
    px(ctx, 16, 31, 22, 4, "#2d2a26");
  } else if (type === "sniper") {
    px(ctx, 8, 23, 35, 19, main);
    px(ctx, 38, 26, 22, 5, dark);
    px(ctx, 55, 23, 7, 10, light);
    px(ctx, 20, 18, 12, 6, "#332116");
  } else if (type === "brute") {
    px(ctx, 9, 14, 46, 39, main);
    px(ctx, 17, 6, 30, 13, dark);
    px(ctx, 23, 34, 6, 10, light);
    px(ctx, 37, 34, 6, 10, light);
    px(ctx, 16, 25, 7, 5, "#11110f");
    px(ctx, 42, 25, 7, 5, "#11110f");
  } else if (type === "runner" || type === "runner_tank" || type === "runner_fast") {
    px(ctx, 16, 18, 29, 29, main);
    px(ctx, 41, 26, 12, 7, light);
    px(ctx, 17, 47, 9, 7, dark);
    px(ctx, 34, 47, 9, 7, dark);
  } else if (type === "training_dummy") {
    px(ctx, 26, 7, 13, 11, light);
    px(ctx, 20, 18, 24, 28, main);
    px(ctx, 15, 24, 34, 6, dark);
    px(ctx, 29, 46, 8, 12, dark);
    px(ctx, 18, 57, 29, 5, dark);
    px(ctx, 24, 23, 4, 4, "#11110f");
    px(ctx, 36, 23, 4, 4, "#11110f");
    px(ctx, 27, 36, 12, 2, "#11110f");
  } else if (type === "slime" || type === "splitter" || type === "splinter") {
    px(ctx, 16, 34, 34, 13, dark);
    px(ctx, 13, 29, 39, 15, main);
    px(ctx, 19, 21 - bob, 28, 17, main);
    px(ctx, 23, 17 - bob, 8, 8, light);
    px(ctx, 39, 24 - bob, 8, 7, light);
    px(ctx, 15, 39, 8, 6, dark);
    px(ctx, 45, 38, 8, 6, dark);
    px(ctx, 25, 30, 4, 5, "#11110f");
    px(ctx, 39, 30, 4, 5, "#11110f");
    px(ctx, 30, 39, 10, 3, dark);
  } else {
    px(ctx, 11, 25, 42, 25, main);
    px(ctx, 20, 16 - bob, 26, 15, main);
    px(ctx, 22, 26, 5, 5, "#11110f");
    px(ctx, 39, 26, 5, 5, "#11110f");
    px(ctx, 26, 39, 13, 3, dark);
  }

  if (type !== "bat" && type !== "slime" && type !== "splitter" && type !== "splinter") {
    px(ctx, 20, 51, 9, 6, dark);
    px(ctx, 38, 51, 9, 6, dark);
  }

  outline(ctx, 8, 7, 50, 52);
}
