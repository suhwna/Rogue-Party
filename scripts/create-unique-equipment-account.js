const progression = require("../server-progression-service");
const { createAccountStore } = require("../server-account-store");

const UNIQUE_ITEM_IDS = [
  "triple_aegis", "plague_heirloom", "auxiliary_drone_core", "guardian_necklace", "time_eater_core",
  "vampire_necklace", "double_edged_blade", "silent_warblade", "ritual_only_core", "swift_god_boots",
  "magnet_necklace", "execution_arc_blade", "endless_cleave_blade", "destructive_shout_core",
  "vortex_grip_core", "collision_charge_plate", "seeker_bow", "omnidirectional_quiver",
  "scorching_laser_bow", "gravity_rain_charm", "limitbreaker_arrowhead", "comet_core_staff",
  "flame_wave_robe", "devouring_limit_staff", "glacial_meteor_core", "infinite_chain_prism",
  "adaptive_mecha_core", "incendiary_mine_core", "swarm_controller", "eternal_drone_core",
];

const EQUIPPED = {
  warrior: { weapon: "execution_arc_blade", armor: "collision_charge_plate", amulet: "guardian_necklace", core: "vortex_grip_core" },
  ranger: { weapon: "scorching_laser_bow", armor: "swift_god_boots", amulet: "gravity_rain_charm", core: "omnidirectional_quiver" },
  mage: { weapon: "comet_core_staff", armor: "flame_wave_robe", amulet: "magnet_necklace", core: "glacial_meteor_core" },
  engineer: { weapon: "double_edged_blade", armor: "triple_aegis", amulet: "swarm_controller", core: "adaptive_mecha_core" },
};

const store = createAccountStore({ progression });
if (process.argv[2] === "--sync") {
  const accountId = String(process.argv[3] || "").toUpperCase();
  const session = store.getSession(accountId, String(process.argv[4] || ""));
  if (!session) throw new Error("account authentication failed");
  for (const [classId, slots] of Object.entries(EQUIPPED)) {
    const loadout = session.progress.equipment[classId];
    if (!loadout) continue;
    for (const [slot, baseId] of Object.entries(slots)) loadout[slot] = `unique-test-${baseId}`;
  }
  const saved = store.updateProgress(accountId, progression.normalizeProgress(session.progress), "unique-equipment-synced");
  if (!saved) throw new Error("failed to sync unique equipment");
  process.stdout.write(`${JSON.stringify({ accountId, syncedClasses: Object.keys(EQUIPPED) }, null, 2)}\n`);
  process.exit(0);
}
if (process.argv[2] === "--verify") {
  const session = store.getSession(String(process.argv[3] || "").toUpperCase(), String(process.argv[4] || ""));
  if (!session) throw new Error("account authentication failed");
  const uniqueItems = session.progress.inventory.items.filter((item) => UNIQUE_ITEM_IDS.includes(item.baseId));
  process.stdout.write(`${JSON.stringify({
    accountId: session.account.id,
    displayName: session.account.displayName,
    role: session.account.role,
    uniqueRarityItems: uniqueItems.filter((item) => item.rarity === "unique").length,
    enhancedTo20: uniqueItems.filter((item) => item.enhance === 20).length,
    equippedSlots: Object.fromEntries(Object.entries(EQUIPPED).map(([classId]) => [
      classId,
      Object.values(session.progress.equipment[classId] || {}).filter((value) => String(value).startsWith("unique-test-")).length,
    ])),
  }, null, 2)}\n`);
  process.exit(0);
}
const catalog = progression.getCatalogSnapshot();
const itemBaseMap = new Map(catalog.itemBases.map((base) => [base.id, base]));
const missing = UNIQUE_ITEM_IDS.filter((id) => !itemBaseMap.has(id));
if (missing.length) throw new Error(`missing unique equipment: ${missing.join(", ")}`);

const progress = progression.getDefaultProgress();
progress.account = { level: 100, xp: 0 };
for (const key of Object.keys(progress.currencies)) progress.currencies[key] = 999_999;
progress.mastery.shared = {
  points: 800,
  nodes: Object.fromEntries(["damage", "maxHp", "regen", "moveSpeed", "attackSpeed", "cooldown", "critDamage", "area"].map((id) => [id, 100])),
};
progress.records.highestAscension = 5;
progress.records.classBestAscension = Object.fromEntries(Object.keys(progress.equipment).map((classId) => [classId, 5]));

progress.inventory.items = UNIQUE_ITEM_IDS.map((baseId, index) => {
  const base = itemBaseMap.get(baseId);
  const accessoryAffixes = ["power", "haste", "attack_speed", "critical", "critical_damage", "area", "regeneration"];
  const affixId = accessoryAffixes[index % accessoryAffixes.length];
  return {
    id: `unique-test-${baseId}`,
    baseId,
    rarity: "unique",
    itemLevel: 100,
    enhance: 20,
    affixes: base.slot === "amulet" || base.slot === "core"
      ? [{ id: affixId, value: affixId === "haste" || affixId === "attack_speed" ? 35 : 0.16 }]
      : [],
  };
});

for (const [classId, slots] of Object.entries(EQUIPPED)) {
  const loadout = progress.equipment[classId];
  if (!loadout) continue;
  for (const [slot, baseId] of Object.entries(slots)) loadout[slot] = `unique-test-${baseId}`;
}

progress.collections.equipmentBases = [...new Set([...progress.collections.equipmentBases, ...UNIQUE_ITEM_IDS])];
progress.statistics.itemsFound = progress.inventory.items.length;

const session = store.createAdmin({ displayName: "신규장비테스트", progress: progression.normalizeProgress(progress) });
process.stdout.write(`${JSON.stringify({
  accountId: session.account.id,
  displayName: session.account.displayName,
  role: session.account.role,
  sessionToken: session.sessionToken,
  recoveryKey: `${session.account.id}.${session.recoveryCode}`,
  uniqueRarityItems: session.progress.inventory.items.filter((item) => item.rarity === "unique").length,
  equippedClasses: Object.keys(EQUIPPED),
}, null, 2)}\n`);
