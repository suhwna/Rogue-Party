# Phase 9-1 Stage/Boss Profile Foundation

## 목표

Phase 9의 스테이지/챕터/보스 최신화를 시작하기 전에, 챕터와 보스가 공통으로 참조할 수 있는 프로필 데이터를 먼저 추가했다.

이번 작업은 즉시 대규모 패턴을 바꾸는 단계가 아니라, 이후 보스 패턴, 챕터별 맵 분위기, 전조 시간, 스테이지 압박도를 데이터 기반으로 조절하기 위한 기반 작업이다.

## 변경 사항

- `src/data/stages.ts`
  - `ChapterStageProfile` 추가
  - 1~3챕터별 이름, 테마, 전투 초점, 압박도, 특수몹 예산, 보스 전조 보정값 추가
  - `getChapterStageProfile(chapter)` helper 추가

- `src/data/bosses.ts`
  - `BossProfile`에 챕터명, 역할, 패턴 태그, 페이즈명, 전조 시간, 패턴 비율 필드 추가
  - 챕터 보스 3종에 phase/pattern/telegraph profile 추가
  - 미니보스 3종에 일반 패턴과 특수 패턴 비율 정보를 추가

- `server.js`
  - 서버 런타임용 `CHAPTER_STAGE_PROFILES` 추가
  - `getChapterStageProfile`, `chapterStageProfileView` helper 추가
  - room state에 `chapterProfile` 추가

- `server-boss-system.js`
  - `bossProfileView(profile)`가 신규 보스 프로필 필드를 직렬화하도록 확장

- `smoke-check.js`
  - combat state에 `room.chapterProfile`이 포함되는지 확인하도록 확장

## 현재 계약

`room.chapterProfile`은 다음 정보를 내려준다.

```txt
chapter
name
theme
combatFocus
stagePressureMul
specialEnemyBudget
bossTelegraphBias
```

보스 profile view는 다음 필드를 추가로 내려줄 수 있다.

```txt
chapterTitle
role
patternTags
phaseTitles
telegraph
patternMix
```

## 다음 작업

Phase 9-2에서는 이 profile을 실제 스테이지 시작/보스 패턴 선택에 더 깊게 연결한다.

- 챕터별 전투 압박도 적용 범위 확대
- 보스별 패턴 선택 비율 정리
- 페이즈 전환 전조와 외형 상태를 profile 기반으로 연결
- 미니보스와 챕터 보스의 패턴 재탕 감소

## 검증

- `npm run check`
