# Phase 6: AI 및 몬스터 시스템 개선 마감

## Summary

- Phase 6은 `docs/full-modernization-plan.md`의 AI 및 몬스터 시스템 개선 단계다.
- 이번 단계에서는 전체 AI를 한 번에 갈아엎지 않고, 기존 서버 권위 판정과 전투 동작을 유지하면서 FSM/Behavior Tree로 이동 가능한 경계를 확보했다.
- 핵심 성과는 수동 timer/windup 처리 제거, 특수 패턴 빈도 정책 분리, 보스 페이즈 전환 정책 분리다.

## 완료한 경계

- enemy state 관측 경계
  - `aiState`
  - `windupChannel`

- 공통 timer tick
  - 공격/사격/힐/돌진/특수패턴 timer 감소
  - 상태이상 timer 감소
  - 만료 시 owner/mark cleanup

- 공통 windup advance
  - shaman heal
  - guardian barrier
  - sniper snipe
  - spitter spit
  - charger charge
  - stalker stab/shuriken
  - brute swing
  - duelist mini cleave
  - bomber explode
  - elite special
  - boss/mini boss snipe
  - mini shadow stab
  - mortar

- interrupt policy
  - 캐스팅 중 피격으로 끊기는 행동과 끊기지 않는 행동의 정책을 EnemySystem으로 분리
  - 자폭 시작 후 피격으로 끊기지 않는 의도는 유지
  - 보스는 기존처럼 일반 interrupt에 쉽게 끊기지 않는 구조 유지

- cast profile
  - support cast profile: shaman heal, guardian barrier
  - ranged cast profile: mortar, sniper, spitter

- 특수 패턴 정책
  - elite/miniboss/boss 특수 패턴 빈도 제어 cycle 분리
  - defer timer와 cooldown multiplier 분리
  - elite special cooldown 분리

- 보스 정책
  - 보스 phase transition 조건/수치 분리
  - 보스/준보스 snipe windup 공통화

## 유지한 것

- 실제 피해량, 공격 판정, 투사체 생성, 장판 생성, 보스 패턴 구성은 가능한 한 유지했다.
- 플레이어/몹/보스 충돌과 서버 권위 판정은 유지했다.
- 보스 패턴 runner의 대규모 재구성은 Phase 9에서 처리한다.

## 검증

- 각 세부 단계마다 다음을 통과했다.
  - `npm run check`
  - `npm run build`
  - 임시 포트 `5211` 기준 `npm test`

## 다음 Phase

- Phase 7: 스킬 및 이펙트 품질 재작업
- 목표는 전 직업 스킬의 전조, 발동, 타격, 잔상, 피격 반응, 쿨다운 표시 품질을 같은 기준으로 끌어올리는 것이다.
