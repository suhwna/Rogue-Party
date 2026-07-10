(() => {
  function normalizeStyle(value) {
    return String(value || "").toLowerCase();
  }

  function classifyEffectStyle(style, kind = "") {
    const text = normalizeStyle(style);
    const effectKind = normalizeStyle(kind);
    const basicEngineerBolt = text.includes("engineer_bolt") && !text.includes("mecha");
    const basicMechaBolt = text.includes("mecha_bolt");
    const mechaLaserShot = text.includes("mecha_laser_shot") || text.includes("laser_shot");
    const mechaMuzzle = text.includes("mecha_laser_muzzle") || text.includes("mecha_hand_laser");
    const rail = text.includes("rail_") || text.includes("rail_turret") || text === "rail_bolt";
    const chainLightning = text.includes("chain_lightning") || effectKind === "chain" || text.includes("chain");
    const excludedLightning = basicEngineerBolt || basicMechaBolt || mechaLaserShot || mechaMuzzle;
    const lightningSkill =
      !excludedLightning &&
      (chainLightning ||
        text.includes("lightning") ||
        text.includes("electric") ||
        text.includes("shock") ||
        text.includes("overclock") ||
        rail ||
        text.includes("turret_bolt"));
    const projectileLightning =
      !excludedLightning &&
      (text.includes("electric") || text.includes("chain") || text.includes("rail") || text.includes("shock"));

    return {
      text,
      kind: effectKind,
      basicEngineerBolt,
      basicMechaBolt,
      basicTechBolt: basicEngineerBolt || basicMechaBolt,
      mechaLaserShot,
      mechaMuzzle,
      rail,
      chainLightning,
      lightningSkill,
      projectileLightning,
      beam: mechaMuzzle || mechaLaserShot || text.includes("laser") || rail,
      engineer: text.includes("engineer") || text.includes("turret") || text.includes("drone") || text.includes("mine") || text.includes("mecha") || rail,
      mage: text.includes("mage") || text.includes("frost") || text.includes("meteor") || text.includes("star") || lightningSkill,
    };
  }

  function classifyProjectileStyle(style, classId = "") {
    const info = classifyEffectStyle(style, "projectile");
    const text = info.text;
    const owner = normalizeStyle(classId);
    return {
      ...info,
      poison: text.includes("poison") || text.includes("venom") || text.includes("acid"),
      fire: text.includes("fire") || text.includes("meteor") || text.includes("mortar") || text.includes("bomb"),
      lightning: info.projectileLightning,
      tool: info.basicEngineerBolt || text.includes("wrench"),
      laser: info.mechaLaserShot,
      missile: text.includes("missile") || text.includes("rocket"),
      arcane: owner === "mage" || text.includes("arcane") || text.includes("star_orb"),
      arrow: text.includes("arrow") || text.includes("ranger") || text.includes("sniper") || text.includes("shuriken"),
      thread: text.includes("thread"),
      flask: text.includes("alchemy") || text.includes("bottle") || text.includes("flask"),
      shadow: text.includes("shuriken") || text.includes("shadow") || text.includes("assassin"),
    };
  }

  window.RogueEffectStyle = Object.freeze({
    normalizeStyle,
    classifyEffectStyle,
    classifyProjectileStyle,
  });
})();
