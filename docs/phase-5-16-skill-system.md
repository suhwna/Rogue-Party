# Phase 5-16: SkillSystem 1차 분리

## 목적

`server.js`에 남아 있던 스킬 슬롯 해금/쿨다운 순수 계산을 `SkillSystem` 경계로 분리했다.

이번 단계는 실제 스킬 실행 판정이나 피해 로직을 옮기지 않고, 다음 단계에서 스킬 시스템을 안전하게 잘라낼 수 있는 작은 계산 단위만 먼저 분리했다.

## 변경 사항

- `server-skill-system.js` 추가
  - `hasSkillUpgrade`
  - `getUnlockedSlotUpgrade`
  - `canUseSkillSlot`
  - `getSkillCooldown`
- `src/server/systems/SkillSystem.ts` 추가
  - 이후 TypeScript 서버 이전을 위한 typed boundary 작성
- `server.js` 변경
  - 기존 wrapper 함수명은 유지
  - 내부 구현만 `skillSystem` helper 경유로 전환
- `package.json` 변경
  - `npm run check`에 `server-skill-system.js` 문법 검사 추가

## 유지한 것

- 서버 권위 스킬 판정 유지
- 기존 슬롯 해금 규칙 유지
- 기존 Q/E/R/F 쿨다운 배율 유지
- 기존 클라이언트 payload 변경 없음

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- EnemySystem 3차: 적 군중 밀림/충돌 질량 helper 분리
- 이후 SkillSystem 2차: 스킬 실행 전 공통 guard/쿨다운 적용 helper 분리
