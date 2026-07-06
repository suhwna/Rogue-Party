export interface ChoiceViewModel {
  id: string;
  name: string;
  text: string;
  icon?: string;
  rarity?: string;
  rarityLabel?: string;
  target?: string;
  slot?: string;
  maxLevel?: number;
  level?: number;
  upgrading?: boolean;
  consumable?: boolean;
}

export interface ChoiceControllerOptions {
  escapeHtml: (value: unknown) => string;
  getChoiceRarityLabel: (choice: ChoiceViewModel) => string;
  getRelicStackLabel: (choice: ChoiceViewModel) => string;
  getSkillTypeLabel: (choice: ChoiceViewModel) => string;
}

export class ChoiceController {
  constructor(private readonly options: ChoiceControllerOptions) {}

  renderRelicChoices(choices: ChoiceViewModel[]): string {
    return choices
      .map((choice) => {
        const rarity = choice.rarity || "common";
        const rarityLabel = this.options.getChoiceRarityLabel(choice);
        const target = choice.target || "공용";
        const stackLabel = this.options.getRelicStackLabel(choice);
        return `
          <button class="choice-button has-icon" type="button" data-relic="${this.options.escapeHtml(choice.id)}" data-rarity="${this.options.escapeHtml(rarity)}" data-rarity-label="${this.options.escapeHtml(rarityLabel)}">
            <span class="choice-rarity-strip" aria-hidden="true"></span>
            <span class="choice-icon" aria-hidden="true">${this.options.escapeHtml(choice.icon || "?")}</span>
            <span class="choice-copy">
              <span class="choice-meta-row">
                <span class="rarity-badge">${this.options.escapeHtml(rarityLabel)}</span>
                <span class="choice-type-pill">${this.options.escapeHtml(target)}</span>
                ${stackLabel ? `<span class="choice-type-pill">${this.options.escapeHtml(stackLabel)}</span>` : ""}
              </span>
              <strong>${this.options.escapeHtml(choice.name)}</strong>
              <span>${this.options.escapeHtml(choice.text)}</span>
              <span class="choice-action-row"><span>유물 선택</span><i>CLICK</i></span>
            </span>
          </button>
        `;
      })
      .join("");
  }

  renderSkillChoices(choices: ChoiceViewModel[]): string {
    return choices
      .map((choice) => {
        const rarity = choice.rarity || "common";
        const rarityLabel = this.options.getChoiceRarityLabel(choice);
        const typeLabel = this.options.getSkillTypeLabel(choice);
        return `
          <button class="choice-button has-icon" type="button" data-skill="${this.options.escapeHtml(choice.id)}" data-rarity="${this.options.escapeHtml(rarity)}" data-rarity-label="${this.options.escapeHtml(rarityLabel)}">
            <span class="choice-rarity-strip" aria-hidden="true"></span>
            <span class="choice-icon" aria-hidden="true">${this.options.escapeHtml(choice.icon || "?")}</span>
            <span class="choice-copy">
              <span class="choice-meta-row">
                <span class="rarity-badge">${this.options.escapeHtml(rarityLabel)}</span>
                <span class="choice-type-pill">${this.options.escapeHtml(typeLabel)}</span>
              </span>
              <strong>${this.options.escapeHtml(choice.name)}</strong>
              <span>${this.options.escapeHtml(choice.text)}</span>
              <span class="choice-action-row"><span>강화 선택</span><i>CLICK</i></span>
            </span>
          </button>
        `;
      })
      .join("");
  }
}
