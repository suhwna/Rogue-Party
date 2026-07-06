# Phase 9-2 Chapter Profile Runtime Hooks

## 목표

Phase 9-1에서 추가한 챕터/보스 profile metadata를 실제 런타임 계산에 연결했다.

이번 단계는 보스 패턴 자체를 대규모로 교체하기 전, 챕터별 난이도 체감과 보스 전조 시간을 데이터 기반으로 조절할 수 있게 만드는 작업이다.

## 변경 사항

- `server.js`
  - `getChapterStagePressureMul(room)` 추가
  - `getChapterSpecialEnemyBudget(room)` 추가
  - `getBossTelegraphBias(room)` 추가
  - `getBossProfileForEnemy(room, enemy)` 추가
  - `getEnemyTelegraphTime(room, enemy, channel, fallback)` 추가

## 적용 범위

- 일반 스테이지 스폰 수 계산
  - `stagePressureMul`을 `countPressure`에 반영
  - 챕터가 오를수록 더 강한 압박을 만들 수 있는 연결점 확보

- 특수몹/기본몹 비율
  - `specialEnemyBudget`을 스폰 플랜에 반영
  - 초반 챕터에서는 특수몹 비중을 낮추고 기본몹 비중을 높임
  - 후반 챕터에서는 특수몹과 엘리트가 조금 더 열리도록 연결

- 엘리트 확률
  - `specialEnemyBudget`을 엘리트 확률 계산에 반영
  - 기존 party/stage/chapter 난이도 계산은 유지

- 보스/미니보스 전조
  - 보스 charge windup
  - 보스 objective charge windup
  - 레거시 미니보스 snipe windup
  - 미니보스 cleave windup
  - 헌터 미니보스 shadow stab/snipe windup
  - void boss 기본 snipe windup

## 설계 의도

- 일반 돌진몹/원거리몹의 기본 밸런스는 건드리지 않았다.
- `getEnemyTelegraphTime`은 `enemy.type === "boss"`인 대상에게만 profile 전조를 적용한다.
- 보스 phase가 올라가면 약간 빨라질 수 있지만, profile 전조 최소값보다 지나치게 짧아지지 않도록 했다.
- Phase 9-3에서 `patternMix`를 실제 패턴 선택 비율에 연결할 예정이다.

## 검증

- `npm run check`
