import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const backendTarget = process.env.VITE_BACKEND_TARGET ?? "http://localhost:5173";
const pixiBundlePath = resolve(__dirname, "node_modules", "pixi.js", "dist", "pixi.js");
const legacyRuntimeAssets = [
  "client-runtime.js",
  "client-input.js",
  "client-network.js",
  "client-hud.js",
  "client-choice.js",
  "client-lobby.js",
  "client-map.js",
  "client-result.js",
  "pixi-runtime.js",
  "pixi-texture-factory.js",
  "pixi-pools.js",
  "pixi-camera.js",
  "pixi-scene.js",
  "pixi-world.js",
  "pixi-pickups.js",
  "pixi-projectiles.js",
  "pixi-hazards.js",
  "pixi-enemies.js",
  "pixi-players.js",
  "pixi-effects.js",
  "pixi-primitives.js",
  "pixi-pixel-drawing.js",
  "pixi-palettes.js",
  "pixi-actor-textures.js",
  "pixi-enemy-textures.js",
  "pixi-boss-textures.js",
  "pixi-texture-keys.js",
  "pixi-world-textures.js",
  "pixi-common-textures.js",
  "pixi-melee-textures.js",
  "pixi-ranged-textures.js",
  "pixi-elemental-textures.js",
  "pixi-class-textures.js",
  "pixi-skill-effects.js",
  "client.js",
  "pixi-renderer.js",
];

function legacyRuntimeBridge(): Plugin {
  return {
    name: "rogue-party-legacy-runtime-bridge",
    configureServer(server) {
      server.middlewares.use("/vendor/pixi.js", (_req, res) => {
        res.setHeader("content-type", "application/javascript; charset=utf-8");
        res.end(readFileSync(pixiBundlePath));
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "vendor/pixi.js",
        source: readFileSync(pixiBundlePath),
      });

      for (const assetName of legacyRuntimeAssets) {
        this.emitFile({
          type: "asset",
          fileName: assetName,
          source: readFileSync(resolve(__dirname, "public", assetName)),
        });
      }
    },
  };
}

export default defineConfig({
  root: "public",
  publicDir: false,
  plugins: [legacyRuntimeBridge()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: false,
    proxy: {
      "/rooms": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/ws": {
        target: backendTarget.replace(/^http/, "ws"),
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
