# Phase 5-21: StateSerializer 스킬 슬롯 view 분리

## 목적

플레이어 state payload 안의 `skillSlots` 생성 책임을 `StateSerializer` 경계로 분리했다.

이번 단계는 HUD에 직접 쓰이는 스킬 슬롯 payload 모양을 유지하면서, `server.js`의 view 조립 책임을 한 조각 줄이는 데 집중했다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `skillSlotView`
  - `skillSlotViews`
  - 1자리 반올림 helper `round1`
- `src/server/StateSerializer.ts` 확장
  - `SkillSlotPlayerLike`
  - `SkillSlotUpgradeLike`
  - `SkillSlotViewOptions`
  - `SkillSlotView`
  - `skillSlotView`
  - `skillSlotViews`
- `server.js` 변경
  - 기존 `getSkillSlots(player)` wrapper 유지
  - 내부 구현만 `stateSerializer.skillSlotViews` 경유로 전환

## 유지한 것

- 기존 `skillSlots` payload 필드 유지
- 기존 Q 기본 스킬 ID 규칙 유지
- 기존 잠김/아이콘/쿨다운/ready 계산 유지
- 기존 클라이언트 HUD 계약 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 6차: player dash/knockback movement view 재사용
- 또는 PlayerSystem 2차: player class/passive/status helper 분리 검토
