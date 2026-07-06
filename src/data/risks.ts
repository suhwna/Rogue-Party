export const RISK_IDS = ["safe_path", "swarm_contract", "glass_run", "early_boss"] as const;

export type RiskId = (typeof RISK_IDS)[number];

export interface RiskDefinition {
  readonly id: RiskId;
  readonly name: string;
  readonly text: string;
  readonly rarityBoost: number;
  readonly xpMul: number;
  readonly spawnMul: number;
  readonly noClearHeal: boolean;
  readonly earlyBoss: boolean;
}

export const RISKS = [
  {
    id: "safe_path",
    name: "보통 방",
    text: "추가 변형이 없는 표준 전투입니다.",
    rarityBoost: 0,
    xpMul: 1,
    spawnMul: 1,
    noClearHeal: false,
    earlyBoss: false,
  },
  {
    id: "swarm_contract",
    name: "군세 방",
    text: "적 수 +30%. 유물 상자 희귀도 보정이 증가합니다.",
    rarityBoost: 0.16,
    xpMul: 1,
    spawnMul: 1.3,
    noClearHeal: false,
    earlyBoss: false,
  },
  {
    id: "glass_run",
    name: "유리 방",
    text: "클리어 회복이 사라지는 대신 경험치가 1.2배입니다.",
    rarityBoost: 0.08,
    xpMul: 1.18,
    spawnMul: 1.08,
    noClearHeal: true,
    earlyBoss: false,
  },
  {
    id: "early_boss",
    name: "문지기 방",
    text: "미니 문지기가 추가됩니다. 에픽 유물 확률이 증가합니다.",
    rarityBoost: 0.22,
    xpMul: 1.04,
    spawnMul: 1.08,
    noClearHeal: false,
    earlyBoss: true,
  },
] as const satisfies readonly RiskDefinition[];

export const RISK_BY_ID = Object.fromEntries(RISKS.map((risk) => [risk.id, risk])) as Record<RiskId, RiskDefinition>;

export function getRiskById(id: string | null | undefined): RiskDefinition {
  return isRiskId(id) ? RISK_BY_ID[id] : RISK_BY_ID.safe_path;
}

export function isRiskId(id: string | null | undefined): id is RiskId {
  return Boolean(id && Object.prototype.hasOwnProperty.call(RISK_BY_ID, id));
}
