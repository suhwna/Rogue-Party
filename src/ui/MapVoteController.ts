export interface MapVoteController {
  renderChoices(choices: unknown[], context: Record<string, unknown>): string;
  renderBoard(stageMap: unknown, context: Record<string, unknown>): string;
}
