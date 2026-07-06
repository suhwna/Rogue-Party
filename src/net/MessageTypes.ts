export type ClientMessage =
  | { type: "join"; room: string; name: string; classId?: string }
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
  | { type: "changeClass"; classId: string }
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
