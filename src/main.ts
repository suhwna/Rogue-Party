import { createClientDiagnostics } from "./app/Diagnostics";
import { getChapterBossProfile } from "./data/bosses";
import { getClassDefinition, STARTING_CLASS_IDS } from "./data/classes";
import { MAP_DEPTH, RELIC_DROP_CHANCE } from "./data/balance";
import { getStageDifficulty } from "./data/difficulty";
import { getEnemyDefinition, isEnemyTypeUnlocked } from "./data/enemies";
import { getRelicChoiceWeight, getRelicMaxLevel, getRelicsForClass } from "./data/relics";
import { getStageRewardRule } from "./data/rewards";
import { getRiskById } from "./data/risks";
import { getPrimarySkillName, getSkillDefinition } from "./data/skills";
import { getSkillChoiceWeight, getSkillUpgradeById } from "./data/skillUpgrades";
import { getStageNodeMeta } from "./data/stages";
import { defaultActionMap } from "./input/ActionMap";
import { getReconnectDelay } from "./net/ReconnectPolicy";
import { defaultSettings } from "./settings/SettingsManager";

type ModernizationPhase = "phase-0" | "phase-1" | "phase-2" | "phase-3" | "phase-4";

interface ModernizationRuntimeInfo {
  readonly plan: string;
  readonly activePhases: readonly ModernizationPhase[];
  readonly legacyClient: boolean;
  readonly legacyRenderer: boolean;
  readonly viteBridge: boolean;
  readonly phase2Modules: readonly string[];
}

declare global {
  interface Window {
    __rogueModernization?: ModernizationRuntimeInfo;
    __rogueModernizationSmoke?: unknown;
  }
}

export const modernizationRuntime: ModernizationRuntimeInfo = {
  plan: "docs/full-modernization-plan.md",
  activePhases: ["phase-0", "phase-1", "phase-2", "phase-3", "phase-4"],
  legacyClient: true,
  legacyRenderer: true,
  viteBridge: true,
  phase2Modules: [
    "NetworkClient",
    "ActionMap",
    "SettingsManager",
    "Diagnostics",
    "HudController",
    "PixiGameRenderer",
    "DataFoundation",
  ],
};

window.__rogueModernization = modernizationRuntime;
const warriorRelicsForSmoke = getRelicsForClass("warrior");
window.__rogueModernizationSmoke = {
  settingsVersion: defaultSettings.version,
  dashKey: defaultActionMap.dash,
  reconnectDelay: getReconnectDelay(2),
  diagnostics: createClientDiagnostics(),
  data: {
    startingClasses: STARTING_CLASS_IDS.length,
    warriorHp: getClassDefinition("warrior").maxHp,
    relicDropChance: RELIC_DROP_CHANCE,
    bossRewardXp: getStageRewardRule("boss").clearXp,
    mapDepth: MAP_DEPTH,
    stageEightHpMul: getStageDifficulty(8).hpMul,
    bossId: getChapterBossProfile(3).id,
    defenseGlyph: getStageNodeMeta("defense").glyph,
    chargerUnlocksAtSixMinutes: isEnemyTypeUnlocked("charger", 7),
    shamanRole: getEnemyDefinition("shaman").role,
    swarmSpawnMul: getRiskById("swarm_contract").spawnMul,
    warriorPrimary: getPrimarySkillName("warrior"),
    rangerRSkill: getSkillDefinition("ranger", "r")?.name,
    rangerPierceWeight: getSkillUpgradeById("ranger_pierce") ? getSkillChoiceWeight(getSkillUpgradeById("ranger_pierce")!, 2) : 0,
    warriorRelics: warriorRelicsForSmoke.length,
    firstWarriorRelicMaxLevel: warriorRelicsForSmoke[0] ? getRelicMaxLevel(warriorRelicsForSmoke[0]) : 0,
    baseRelicWeight: getRelicChoiceWeight({ id: "power_core" }, 0, 1),
  },
};
