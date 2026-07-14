(function () {
  function defaultEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function create(options) {
    const escapeHtml = (options && options.escapeHtml) || defaultEscape;
    const getRelicStackLabel = (options && options.getRelicStackLabel) || (() => "");
    const getSkillTypeLabel = (options && options.getSkillTypeLabel) || ((choice) => choice.slot || "강화");

    function renderRelicChoices(choices) {
      return (choices || [])
        .map((choice) => {
          const target = choice.target || "공용";
          const stackLabel = getRelicStackLabel(choice);
          return `
            <button class="choice-button has-icon" type="button" data-relic="${escapeHtml(choice.id)}">
              <span class="choice-icon" aria-hidden="true">${escapeHtml(choice.icon || "?")}</span>
              <span class="choice-copy">
                <span class="choice-meta-row">
                  <span class="choice-type-pill">${escapeHtml(target)}</span>
                  ${stackLabel ? `<span class="choice-type-pill">${escapeHtml(stackLabel)}</span>` : ""}
                </span>
                <strong>${escapeHtml(choice.name)}</strong>
                <span>${escapeHtml(choice.text)}</span>
                <span class="choice-action-row"><span>유물 선택</span><i class="choice-forward-icon" aria-hidden="true"></i></span>
              </span>
            </button>
          `;
        })
        .join("");
    }

    function renderSkillChoices(choices) {
      return (choices || [])
        .map((choice) => {
          const typeLabel = getSkillTypeLabel(choice);
          return `
            <button class="choice-button has-icon" type="button" data-skill="${escapeHtml(choice.id)}">
              <span class="choice-icon" aria-hidden="true">${escapeHtml(choice.icon || "?")}</span>
              <span class="choice-copy">
                <span class="choice-meta-row">
                  <span class="choice-type-pill">${escapeHtml(typeLabel)}</span>
                </span>
                <strong>${escapeHtml(choice.name)}</strong>
                <span>${escapeHtml(choice.text)}</span>
                <span class="choice-action-row"><span>강화 선택</span><i class="choice-forward-icon" aria-hidden="true"></i></span>
              </span>
            </button>
          `;
        })
        .join("");
    }

    return {
      renderRelicChoices,
      renderSkillChoices
    };
  }

  window.RogueChoiceController = Object.freeze({ create });
})();
