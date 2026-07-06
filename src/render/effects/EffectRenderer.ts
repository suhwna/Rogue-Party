import type { PixiRenderContext } from "../PixiRenderContext";
import { renderFloatingEffects, type FloatingEffectRendererHost, type FloatingEffectView } from "./FloatingEffectRenderer";

type EffectRendererHost = PixiRenderContext["renderer"] & FloatingEffectRendererHost;

export function renderEffectSections(context: PixiRenderContext): void {
  renderFloatingEffects(context.renderer as EffectRendererHost, context.floatingEffects as FloatingEffectView[], context.now);
}
