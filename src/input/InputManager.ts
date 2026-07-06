import { matchesActionKey, type ActionMap } from "./ActionMap";

export interface PointerState {
  x: number;
  y: number;
}

export interface SkillSequences {
  q: number;
  e: number;
  r: number;
  f: number;
}

export interface InputManagerOptions {
  getSettings: () => { keyMap?: Partial<ActionMap> };
  isSpectator: () => boolean;
  unlockAudio: () => void;
}

export class InputManager {
  private readonly keys = new Set<string>();
  private readonly pointer: PointerState = { x: 0, y: 0 };
  private readonly skillSeqs: SkillSequences = { q: 0, e: 0, r: 0, f: 0 };
  private mouseDown = false;
  private dashSeq = 0;
  private disposers: Array<() => void> = [];

  constructor(private readonly options: InputManagerOptions) {}

  bind(canvas: HTMLCanvasElement, root: Window = window): void {
    this.add(canvas, "mousemove", (event) => this.onMouseMove(canvas, event as MouseEvent));
    this.add(canvas, "mousedown", (event) => this.onMouseDown(event as MouseEvent));
    this.add(root, "mouseup", () => {
      this.mouseDown = false;
    });
    this.add(canvas, "contextmenu", (event) => event.preventDefault());
    this.add(root, "keydown", (event) => this.onKeyDown(event as KeyboardEvent));
    this.add(root, "keyup", (event) => this.keys.delete((event as KeyboardEvent).code));
  }

  destroy(): void {
    while (this.disposers.length) this.disposers.pop()?.();
    this.keys.clear();
    this.mouseDown = false;
  }

  readMove(): { mx: number; my: number } {
    let mx = 0;
    let my = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    return { mx, my };
  }

  getPointer(): PointerState {
    return this.pointer;
  }

  isMouseDown(): boolean {
    return this.mouseDown;
  }

  getSkillSeqs(): SkillSequences {
    return this.skillSeqs;
  }

  getDashSeq(): number {
    return this.dashSeq;
  }

  private onMouseMove(canvas: HTMLCanvasElement, event: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
  }

  private onMouseDown(event: MouseEvent): void {
    this.options.unlockAudio();
    if (event.button === 0) this.mouseDown = true;
    if (this.options.isSpectator()) return;
    if (event.button === 2) this.skillSeqs.q += 1;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) return;
    this.keys.add(event.code);
    this.options.unlockAudio();
    if (this.options.isSpectator()) return;
    const keyMap = this.options.getSettings().keyMap;
    if (matchesActionKey(event.code, keyMap, "skillQ", ["KeyQ", "Digit1"]) && !event.repeat) this.skillSeqs.q += 1;
    if (matchesActionKey(event.code, keyMap, "skillE", ["KeyE", "Digit2"]) && !event.repeat) this.skillSeqs.e += 1;
    if (matchesActionKey(event.code, keyMap, "skillR", ["KeyR", "Digit3"]) && !event.repeat) this.skillSeqs.r += 1;
    if (matchesActionKey(event.code, keyMap, "skillF", ["KeyF", "Digit4"]) && !event.repeat) this.skillSeqs.f += 1;
    if (matchesActionKey(event.code, keyMap, "dash", ["Space"]) && !event.repeat) {
      event.preventDefault();
      this.dashSeq += 1;
    }
  }

  private add<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    handler: (event: WindowEventMap[K]) => void,
  ): void;
  private add<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ): void;
  private add(target: Window | HTMLElement, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    this.disposers.push(() => target.removeEventListener(type, handler));
  }
}
