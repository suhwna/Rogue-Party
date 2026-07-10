export interface GrowthLoadoutMessage {
  readonly version?: number;
  readonly classId?: string;
  readonly accountLevel?: number;
  readonly ascensionLevel?: number;
  readonly points?: number;
  readonly nodes?: Record<string, number>;
  readonly gearBonuses?: Record<string, number>;
  readonly challenge?: {
    readonly mode?: "standard" | "daily" | "weekly";
    readonly key?: string;
    readonly seed?: number;
    readonly modifierId?: string;
    readonly ruleId?: string;
  };
  readonly cosmetic?: { readonly title?: string; readonly skin?: string };
  readonly startPerkId?: string;
}

export type ClientMessage =
  | { type: "join"; room: string; name: string; classId?: string; growthLoadout?: GrowthLoadoutMessage }
  | {
      type: "input";
      mx: number;
      my: number;
      aimX: number;
      aimY: number;
      attacking: boolean;
      skillSeqs: { q: number; e: number; r: number; f: number };
      dashSeq: number;
    }
  | { type: "start" }
  | { type: "changeClass"; classId: string; growthLoadout?: GrowthLoadoutMessage }
  | { type: "setGrowthLoadout"; growthLoadout?: GrowthLoadoutMessage }
  | { type: "toggleReady" }
  | { type: "toggleSpectator" }
  | { type: "addBot" }
  | { type: "removeBot" }
  | { type: "returnLobby" }
  | { type: "choose"; relicId: string }
  | { type: "chooseSkill"; upgradeId: string }
  | { type: "chooseMap"; nodeId: string }
  | { type: "ping"; t: number };

export type ServerMessage =
  | { type: "state"; [key: string]: unknown }
  | { type: "joined"; id: string; room: string }
  | { type: "error"; message: string }
  | { type: "pong"; t: number; serverTime: number };
