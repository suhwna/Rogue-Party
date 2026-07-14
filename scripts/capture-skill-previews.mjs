import { chromium } from "playwright";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.SKILL_CAPTURE_URL || "http://localhost:5173/";
const OUTPUT_DIR = path.resolve("public/assets/skill-previews");
const forceCapture = process.argv.includes("--force");
const CLASSES = ["warrior", "ranger", "mage", "engineer"];
const SLOTS = ["q", "e", "r", "f"];
const KEY_BY_SLOT = { q: "KeyQ", e: "KeyE", r: "KeyR", f: "KeyF" };
const CLIP_MS = 2600;

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function startCanvasRecorder(page) {
  await page.evaluate(() => {
    const canvas = document.querySelector(".pixi-game-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Pixi canvas not found");
    const stream = canvas.captureStream(60);
    const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType = mimeTypes.find((value) => MediaRecorder.isTypeSupported(value)) || "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_600_000 });
    window.__skillCapture = { chunks, recorder, mimeType };
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) chunks.push(event.data);
    });
    recorder.start(100);
  });
}

async function stopCanvasRecorder(page) {
  return page.evaluate(async () => {
    const capture = window.__skillCapture;
    if (!capture?.recorder) throw new Error("Skill capture was not started");
    await new Promise((resolve) => {
      capture.recorder.addEventListener("stop", resolve, { once: true });
      capture.recorder.stop();
    });
    const blob = new Blob(capture.chunks, { type: capture.mimeType });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    delete window.__skillCapture;
    return btoa(binary);
  });
}

async function captureSkill(classId, slot) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 300 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.locator("#nameInput").fill(`Preview-${classId}-${slot}`);
  await page.getByRole("button", { name: /방 생성/ }).click();
  await page.locator("#lobbyPanel:not(.hidden)").waitFor({ state: "visible" });
  await page.evaluate((expected) => document.querySelector(`.lobby-class-card[data-class="${expected}"]`)?.click(), classId);
  await page.waitForFunction((expected) => document.querySelector(`.lobby-class-card[data-class="${expected}"]`)?.classList.contains("selected"), classId);
  await page.evaluate(() => document.body.classList.add("skill-capture-active"));
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const inputCanvas = document.querySelector("#game");
    const rect = inputCanvas.getBoundingClientRect();
    inputCanvas.dispatchEvent(new MouseEvent("mousemove", {
      bubbles: true,
      clientX: rect.left + rect.width * 0.76,
      clientY: rect.top + rect.height * 0.5
    }));
  });
  await startCanvasRecorder(page);
  await page.keyboard.press(KEY_BY_SLOT[slot]);
  await page.waitForTimeout(CLIP_MS);
  const base64 = await stopCanvasRecorder(page);
  const outputPath = path.join(OUTPUT_DIR, `${classId}-${slot}.webm`);
  await writeFile(outputPath, Buffer.from(base64, "base64"));
  await context.close();
  process.stdout.write(`captured ${classId}-${slot}.webm\n`);
}

try {
  for (const classId of CLASSES) {
    for (const slot of SLOTS) {
      const outputPath = path.join(OUTPUT_DIR, `${classId}-${slot}.webm`);
      if (forceCapture) {
        await captureSkill(classId, slot);
        continue;
      }
      try {
        await access(outputPath);
        process.stdout.write(`kept ${classId}-${slot}.webm\n`);
      } catch {
        await captureSkill(classId, slot);
      }
    }
  }
} finally {
  await browser.close();
}
