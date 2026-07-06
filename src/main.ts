import { createClientDiagnostics } from "./app/Diagnostics";
import { getChapterBossProfile } from "./data/bosses";
import { getClassDefinition, STARTING_CLASS_IDS } from "./data/classes";
import { MAP_DEPTH, RELIC_DROP_CHANCE } from "./data/balance";
import { getStageDifficulty } from "./data/difficulty";
import { getEnemyDefinition, isEnemyTypeUnlocked } from "./data/enemies";
import { getRarityLabel } from "./data/rarity";
import { getRelicChoiceWeight, getRelicMaxLevel, getRelicsForClass } from "./data/relics";
import { getStageRewardRule } from "./data/rewards";
import { getRiskById } from "./data/risks";
import { getPrimarySkillName, getSkillDefinition } from "./data/skills";
import { getSkillChoiceWeight, getSkillUpgradeById, getSkillUpgradeRarity } from "./data/skillUpgrades";
import { getStageNodeMeta } from "./data/stages";
import { pickWaveTraitForWave } from "./data/waveTraits";
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
window.__rogueModernizationSmoke = {
  settingsVersion: defaultSettings.version,
  dashKey: defaultActionMap.dash,
  reconnectDelay: getReconnectDelay(2),
  diagnostics: createClientDiagnostics(),
  data: {
    startingClasses: STARTING_CLASS_IDS.length,
    warriorHp: getClassDefinition("warrior").maxHp,
    relicDropChance: RELIC_DROP_CHANCE,
    rareLabel: getRarityLabel("rare"),
    bossRewardXp: getStageRewardRule("boss").clearXp,
    mapDepth: MAP_DEPTH,
    stageEightHpMul: getStageDifficulty(8).hpMul,
    bossId: getChapterBossProfile(3).id,
    defenseGlyph: getStageNodeMeta("defense").glyph,
    chargerUnlocksAtFive: isEnemyTypeUnlocked("charger", 5),
    shamanRole: getEnemyDefinition("shaman").role,
    fifthWaveTrait: pickWaveTraitForWave(5).id,
    swarmSpawnMul: getRiskById("swarm_contract").spawnMul,
    warriorPrimary: getPrimarySkillName("warrior"),
    rangerRSkill: getSkillDefinition("ranger", "r")?.name,
    warriorColossusRarity: getSkillUpgradeById("warrior_legend_colossus")
      ? getSkillUpgradeRarity(getSkillUpgradeById("warrior_legend_colossus")!)
      : "",
    rangerPierceWeight: getSkillUpgradeById("ranger_pierce") ? getSkillChoiceWeight(getSkillUpgradeById("ranger_pierce")!, 2) : 0,
    warriorRelics: getRelicsForClass("warrior").length,
    mythicRelicMaxLevel: getRelicMaxLevel({ rarity: "mythic", maxLevel: 1 }),
    rareRelicWeight: getRelicChoiceWeight({ rarity: "rare" }, 0.2, 1.3),
  },
};
