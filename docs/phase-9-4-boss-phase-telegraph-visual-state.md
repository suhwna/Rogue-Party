# Phase 9-4 Boss Phase Telegraph Visual State

## 목표

보스 페이즈 전환이 갑작스럽게 느껴지는 문제를 줄이고, Phase 9-1에서 추가한 `phaseTitles`와 `telegraph.phase` metadata를 실제 서버 상태와 Pixi 렌더링에 연결했다.

## 변경 사항

- `server.js`
  - 보스 enemy 기본 상태에 phase visual fields 추가
    - `phaseTitle`
    - `phaseTransitionTimer`
    - `phaseTransitionTimerMax`
    - `phaseAuraColor`
  - `applyBossPhaseTransition(...)`에서 profile `phaseTitles`와 phase telegraph 값을 적용
  - phase warning effect에 `duration`, `phase`, `label` 추가
  - phase flare explosion effect 추가

- `server-enemy-system.js`
  - `tickEnemyTimers(enemy, dt)`에서 `phaseTransitionTimer` 감소 처리

- `server-state-serializer.js`
  - enemy view에 phase visual fields 추가

- `public/pixi-enemies.js`
  - boss `phaseTransitionTime`이 남아 있을 때 phase aura, inner flare, impact star 표시

- `public/pixi-renderer.js`
  - Pixi enemy bridge가 없을 때도 동일한 phase aura fallback 표시

## 의도

- 페이즈 전환 시 보스가 강해지는 상태를 더 명확하게 보여준다.
- 보스 sprite key는 이미 `bossPhase`를 포함하므로, phase가 오르면 다른 boss sprite frame이 사용된다.
- 이번 단계는 즉시 패턴 발동 구조 자체를 지연시키지는 않는다.
- Phase 9 후속에서 phase transition 패턴 자체의 지연/대기 구조를 더 정교하게 만들 수 있다.

## 검증

- `npm run check`
