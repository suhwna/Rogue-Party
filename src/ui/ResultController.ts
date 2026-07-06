export interface ResultControllerOptions {
  escapeHtml: (value: unknown) => string;
  formatRelicCount: (source: unknown) => string;
}

export class ResultController {
  constructor(private readonly options: ResultControllerOptions) {}

  renderStats(rows: Array<[string, string]>): string {
    return rows
      .map(
        ([label, value]) => `
          <div class="result-stat">
            <span>${this.options.escapeHtml(label)}</span>
            <strong>${this.options.escapeHtml(value)}</strong>
          </div>
        `,
      )
      .join("");
  }
}
