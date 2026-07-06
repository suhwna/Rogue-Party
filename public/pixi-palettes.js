(function () {
  const classPalettes = Object.freeze({
    novice: ["#d6d0c4", "#8f887c", "#f8f3e9"],
    warrior: ["#c9824c", "#6b3425", "#f8f3e9"],
    ranger: ["#7fa671", "#34593e", "#f1d08b"],
    mage: ["#8d7cae", "#3b2b55", "#dbeafe"],
    engineer: ["#d6b76d", "#4b3b22", "#9ee6ff"],
    puppeteer: ["#b985c8", "#44254f", "#f5d0fe"],
    martialist: ["#d08b5f", "#642f20", "#fde68a"],
    alchemist: ["#9aa15f", "#3f4b24", "#bef264"],
    assassin: ["#8a6f9e", "#21142f", "#f5d0fe"],
    cleric: ["#caa35a", "#59421f", "#dcfce7"],
  });

  const enemyPalettes = Object.freeze({
    slime: ["#c85d56", "#5b1f24", "#fca5a5"],
    bat: ["#8a6f9e", "#21142f", "#f5d0fe"],
    brute: ["#b98243", "#4c2515", "#fed7aa"],
    guardian: ["#7e9fb2", "#263946", "#dbeafe"],
    shaman: ["#7fa671", "#1f3f2b", "#dcfce7"],
    spitter: ["#9aa15f", "#30421e", "#bef264"],
    bomber: ["#c85d56", "#3b1715", "#fed7aa"],
    charger: ["#d08b5f", "#4c2416", "#f8f3e9"],
    stalker: ["#8a6f9e", "#160d22", "#f5d0fe"],
    mortar: ["#9b9488", "#2d2a26", "#fde68a"],
    sniper: ["#c9824c", "#332116", "#fee2e2"],
    splitter: ["#b985c8", "#35173d", "#f5d0fe"],
    splinter: ["#b985c8", "#35173d", "#f5d0fe"],
    runner: ["#c85d56", "#5b1f24", "#fca5a5"],
    runner_tank: ["#7e9fb2", "#263946", "#dbeafe"],
    runner_fast: ["#d6b76d", "#4b3b22", "#fde68a"],
    training_dummy: ["#caa35a", "#4b3421", "#f8f3e9"],
    boss: ["#c9824c", "#18120e", "#fee2e2"],
  });

  function classPalette(classId) {
    return classPalettes[classId] || classPalettes.warrior;
  }

  function enemyPalette(enemyType) {
    return enemyPalettes[enemyType] || enemyPalettes.slime;
  }

  window.RoguePixiPalettes = Object.freeze({
    classPalettes,
    enemyPalettes,
    classPalette,
    enemyPalette,
  });
})();
