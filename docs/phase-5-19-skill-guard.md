# Phase 5-19: SkillSystem 공통 guard/쿨다운 적용 분리

## 목적

스킬 입력 처리에서 반복되던 “현재 슬롯을 발동할 수 있는가”와 “발동 후 쿨다운을 적용한다” 계산을 `SkillSystem` 경계로 분리했다.

이번 단계는 실제 직업별 스킬 실행 로직은 유지하고, 플레이어/봇이 공유하는 스킬 발동 전 조건과 쿨다운 적용만 먼저 분리했다.

## 변경 사항

- `server-skill-system.js` 확장
  - `canTriggerSkillSlot`
  - `applySkillCooldown`
- `src/server/systems/SkillSystem.ts` 확장
  - 스킬 타이머 포함 player 계약 추가
  - trigger guard/cooldown apply typed boundary 작성
- `server.js` 변경
  - 봇 스킬 사용 조건을 `canTriggerSkillSlot` 경유로 전환
  - 플레이어 스킬 입력 조건을 `canTriggerSkillSlot` 경유로 전환
  - 스킬 발동 후 쿨다운 세팅을 `applySkillCooldown` 경유로 전환

## 유지한 것

- 기존 슬롯 해금 규칙 유지
- 기존 쿨다운 계산식 유지
- 기존 직업별 스킬 실행 함수 유지
- 서버 권위 스킬 판정 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- CollisionSystem 4차: move/clamp helper 또는 충돌 resolver 일부 분리 검토
- StateSerializer 5차: player stat/skill slot view 일부 분리 검토
