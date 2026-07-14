const progression = require("../server-progression-service");
const { createAccountStore } = require("../server-account-store");

const accountId = String(process.argv[2] || "").trim().toUpperCase();
if (!/^RP-[A-F0-9]{12}$/.test(accountId)) {
  throw new Error("usage: node scripts/promote-super-account.js RP-XXXXXXXXXXXX");
}

const store = createAccountStore({ progression });
const account = store.getTrusted(accountId);
if (!account || account.role !== "admin") throw new Error("admin account not found");

const catalog = progression.getCatalogSnapshot();
const progress = progression.getDefaultProgress();
const classIds = Object.keys(progress.equipment);
const accessoryAffixes = ["power", "vitality", "haste", "attack_speed", "critical", "critical_damage", "area", "regeneration"];

progress.account = { level: 9999, xp: 0 };
for (const key of Object.keys(progress.currencies)) progress.currencies[key] = 999_999_999;
progress.mastery.shared = {
  points: 79_992,
  nodes: Object.fromEntries(["damage", "maxHp", "regen", "moveSpeed", "attackSpeed", "cooldown", "critDamage", "area"].map((id) => [id, 9999])),
};
progress.records.highestAbyssDepth = 9999;
progress.records.highestAscension = 5;
progress.records.classBestAscension = Object.fromEntries(classIds.map((classId) => [classId, 5]));

progress.inventory.items = catalog.itemBases.map((base, index) => ({
  id: `super-item-${base.id}`,
  baseId: base.id,
  rarity: "mythic",
  itemLevel: 9999,
  enhance: 20,
  affixes: base.slot === "amulet" || base.slot === "core"
    ? [{ id: accessoryAffixes[index % accessoryAffixes.length], value: accessoryAffixes[index % accessoryAffixes.length] === "haste" || accessoryAffixes[index % accessoryAffixes.length] === "attack_speed" ? 500 : 2 }]
    : [],
}));

progress.inventory.runes = catalog.runes.map((rune) => ({
  id: `super-rune-${rune.id}`,
  runeId: rune.id,
  tier: 8,
}));

const equippedRuneTypes = ["fury", "focus", "expansion"];
for (const classId of classIds) {
  const equippedRunes = equippedRuneTypes.map((runeId) => {
    const id = `super-rune-${classId}-${runeId}`;
    progress.inventory.runes.push({ id, runeId, tier: 8 });
    return id;
  });
  const loadout = progress.equipment[classId];
  for (const slot of ["weapon", "armor", "amulet", "core"]) {
    const preferred = catalog.itemBases.find((base) => base.id === `${classId}_${slot}_1`)
      || catalog.itemBases.find((base) => base.slot === slot && base.classId === classId)
      || catalog.itemBases.find((base) => base.slot === slot && base.classId === "all");
    loadout[slot] = preferred ? `super-item-${preferred.id}` : "";
  }
  loadout.runes = equippedRunes;
}

progress.inventory.bossMaterials = Object.fromEntries(catalog.bosses.map((boss) => [boss.id, 9999]));
progress.collections.equipmentBases = catalog.itemBases.map((item) => item.id);
progress.collections.runeTypes = catalog.runes.map((rune) => rune.id);
progress.collections.monsters = catalog.monsters.map((monster) => monster.id);
progress.collections.bosses = catalog.bosses.map((boss) => boss.id);
progress.collections.relics = catalog.relics.map((relic) => relic.id);
progress.unlockedRelics = [...progress.collections.relics];
progress.statistics.itemsFound = progress.inventory.items.length;
progress.statistics.runesFound = progress.inventory.runes.length;

const saved = store.updateProgress(accountId, progression.normalizeProgress(progress), "super-account-promoted");
if (!saved) throw new Error("failed to save super account");

process.stdout.write(`${JSON.stringify({
  accountId: saved.account.id,
  role: saved.account.role,
  accountLevel: saved.progress.account.level,
  masteryNodes: saved.progress.mastery.shared.nodes,
  currencies: saved.progress.currencies,
  mythicItems: saved.progress.inventory.items.filter((item) => item.rarity === "mythic").length,
  maxRunes: saved.progress.inventory.runes.filter((rune) => rune.tier === 8).length,
  equipmentCatalog: saved.progress.collections.equipmentBases.length,
}, null, 2)}\n`);
