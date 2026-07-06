# Phase 9-3 Boss Pattern Mix Gate

## 목표

보스/미니보스가 강한 패턴을 너무 자주 연속으로 사용하는 문제를 줄이기 위해, Phase 9-1에서 추가한 `patternMix`를 실제 특수 패턴 허용 정책에 연결했다.

## 변경 사항

- `server.js`
  - 보스 생성 시 `bossProfile.patternMix`를 enemy 상태에 저장
  - 미니보스 생성 시 `miniProfile.patternMix`로 덮어쓰기
  - `allowBossPatternByMix(enemy, channel)` 추가
  - `isPatternMixSpecialSlot(step, allowedCount)` 추가
  - 보스 계열은 기존 채널별 특수 패턴 cycle 대신 공유 pattern gate를 사용

## 동작 방식

기존에는 `boss`, `boss_charge`, `boss_shot`, `miniboss` 같은 채널이 각각 별도의 10-step cycle을 굴렸다.

이 때문에 각 채널은 30% 제한을 지키더라도, 실제 체감은 강한 패턴이 너무 자주 이어질 수 있었다.

이제 `enemy.type === "boss"`인 대상은 `bossSharedPatternStep`을 공유한다.

```txt
special + punish 비율이 낮은 미니보스:
  10스텝 중 2스텝 허용

일반 챕터 보스:
  10스텝 중 3스텝 허용

향후 더 공격적인 보스:
  10스텝 중 최대 4스텝까지 허용
```

허용되지 않은 특수 패턴 시도는 기존처럼 `deferSpecialPattern`으로 기본 패턴 window를 열어둔다.

## 의도

- 보스/미니보스 기본 패턴 비율을 더 높인다.
- 강력한 패턴이 몰아서 나오는 느낌을 줄인다.
- `patternMix` 데이터만 바꿔도 보스별 공격 성향을 조절할 수 있게 한다.
- 일반 엘리트몹 특수 패턴 정책은 유지한다.

## 검증

- `npm run check`
