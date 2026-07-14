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
}

export interface AccountSummaryMessage {
  readonly id: string;
  readonly displayName?: string;
  readonly revision: number;
  readonly createdAt?: number;
  readonly updatedAt?: number;
}

export interface AccountProgressActionMessage {
  readonly action: string;
  readonly classId?: string;
  readonly nodeId?: string;
  readonly itemId?: string;
  readonly itemIds?: readonly string[];
  readonly slot?: string;
  readonly affixIndex?: number;
  readonly runeId?: string;
  readonly runeSlot?: number;
  readonly runeType?: string;
  readonly tier?: number;
  readonly recipeId?: string;
  readonly title?: string;
  readonly skin?: string;
  readonly perkId?: string;
  readonly mode?: "standard" | "daily" | "weekly";
}

export type ClientMessage =
  | {
      type: "join";
      room: string;
      name: string;
      classId?: string;
      growthLoadout?: GrowthLoadoutMessage;
      accountId?: string;
      accountToken?: string;
    }
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
  | { type: "accountProgressAction"; actionPayload: AccountProgressActionMessage }
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
  | { type: "joined"; id: string; room: string; account?: AccountSummaryMessage | null; progress?: Record<string, unknown> | null }
  | {
      type: "accountProgress";
      account: AccountSummaryMessage;
      progress: Record<string, unknown>;
      reason: string;
      message?: string;
    }
  | { type: "error"; message: string }
  | { type: "pong"; t: number; serverTime: number };
