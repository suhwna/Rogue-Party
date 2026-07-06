# 프롬프트팩 v2 기반 전체 소스 최신화 플랜

## 1. 목표

현재 프로젝트를 프롬프트팩 v2 기준에 맞춰 최신화한다.

최종 목표는 다음과 같다.

- PixiJS v8 기반 2D 로그라이크 웹게임
- TypeScript 기반 코드베이스
- Vite 기반 개발/빌드 환경
- ES Modules 기반 모듈 구조
- WebGPU 우선, WebGL fallback
- 설정/저장/네트워크/렌더링/입력/게임플레이 책임 분리
- 서버 권위 판정 유지
- 60 FPS 목표
- 장시간 실행 시 메모리 누수 최소화
- 직업/스킬/유물/몹/보스/스테이지 데이터 분리
- 테스트 가능한 구조
- 출시 가능한 실행/배포 문서 보유

---

## 2. 핵심 원칙

- 한 번에 전체를 갈아엎지 않는다.
- 기존 기능을 잃지 않는다.
- 게임 로직과 렌더링을 분리한다.
- DOM 이벤트와 게임 로직을 분리한다.
- 서버는 클라이언트 값을 신뢰하지 않는다.
- 매 프레임 불필요한 객체 생성/삭제를 피한다.
- Object Pool을 적극 사용한다.
- Texture, Sprite, Graphics, Text 객체를 재사용한다.
- 이벤트 리스너와 타이머를 반드시 정리한다.
- 브라우저 콘솔 에러를 방치하지 않는다.
- 모바일/저사양 환경을 고려한다.
- 그래픽 품질이 우선이다.
- 기능 추가보다 플레이 가능한 상태 유지가 우선이다.

---

## 3. 현재 프로젝트 기준

현재 프로젝트는 대략 다음 구조다.

- `server.js`
  - HTTP 서버
  - WebSocket 서버
  - 방/로비/전투/몹/스킬/보스/유물/지도/봇/관전자 로직 대부분 포함

- `public/client.js`
  - DOM UI
  - 입력 처리
  - WebSocket 클라이언트
  - HUD
  - 선택 UI
  - Canvas fallback 렌더링 일부

- `public/pixi-renderer.js`
  - PixiJS 렌더러
  - 텍스처 생성
  - 스프라이트 풀
  - 그래픽 풀
  - 텍스트 풀
  - 캐릭터/몹/투사체/이펙트 렌더링 대부분 포함

- `smoke-check.js`
  - HTTP/WebSocket/봇/관전자/지도 투표 스모크 테스트

- `docs/prompt-pack-v2/`
  - 프롬프트팩 v2 원본 보관

- `docs/v2-prompt-application.md`
  - 프롬프트팩 v2 적용 노트

---

## 4. 최종 목표 구조

```txt
src/
  main.ts

  app/
    GameApp.ts
    SceneManager.ts
    Diagnostics.ts

  core/
    EventBus.ts
    Time.ts
    MathUtils.ts
    ObjectPool.ts
    Types.ts

  input/
    InputManager.ts
    ActionMap.ts
    PointerInput.ts
    KeyboardInput.ts

  net/
    NetworkClient.ts
    MessageTypes.ts
    ReconnectPolicy.ts

  settings/
    SettingsManager.ts
    SaveManager.ts
    SaveSchema.ts

  render/
    PixiGameRenderer.ts
    TextureFactory.ts
    CameraRenderer.ts

    pools/
      SpritePool.ts
      GraphicsPool.ts
      TextPool.ts
      ParticlePool.ts

    actors/
      PlayerRenderer.ts
      EnemyRenderer.ts
      BossRenderer.ts

    effects/
      EffectRenderer.ts
      ParticleEngine.ts
      ParticlePresets.ts
      SkillEffectRenderer.ts

    world/
      StageRenderer.ts
      ProjectileRenderer.ts
      HazardRenderer.ts
      PickupRenderer.ts

  ui/
    HudController.ts
    LobbyController.ts
    MainMenuController.ts
    ChoiceController.ts
    MapVoteController.ts
    ResultController.ts
    SettingsController.ts

  data/
    classes.ts
    skills.ts
    skillUpgrades.ts
    relics.ts
    enemies.ts
    bosses.ts
    stages.ts
    balance.ts
    rarity.ts

  game/
    clientState.ts
    camera.ts
    interpolation.ts

  server/
    NetworkServer.ts
    RoomManager.ts
    PlayerSystem.ts
    EnemySystem.ts
    SkillSystem.ts
    ProjectileSystem.ts
    CollisionSystem.ts
    StageSystem.ts
    RewardSystem.ts
    BossSystem.ts
    BotSystem.ts
    StateSerializer.ts

public/
  assets/
  index.html

docs/
  prompt-pack-v2/
  v2-prompt-application.md

server.js
smoke-check.js
package.json
tsconfig.json
vite.config.ts
```

---

## 5. Phase 0: 기준 고정

### 목표

프롬프트팩 v2를 프로젝트의 공식 개발 기준으로 고정한다.

### 작업

- `docs/prompt-pack-v2/`를 공식 기준 문서로 둔다.
- `docs/v2-prompt-application.md`를 실제 적용 체크리스트로 확장한다.
- 현재 기능 목록을 문서화한다.
- 현재 테스트 가능 범위를 정리한다.
- 리팩터링 중 반드시 유지해야 할 기능을 정의한다.

### 유지해야 할 기능

- 방 생성
- 방 리스트
- 방 입장
- 대기방
- 대기방 직업 변경
- 대기방 스킬 테스트
- 준비 완료
- 방장 시작
- 봇 추가/제거
- 관전자 모드
- 지도 투표
- 모든 플레이어 투표 시 즉시 진행
- 전투
- 이동
- 대시
- 직업별 스킬
- 유물 상자
- 유물 선택
- 레벨업 스킬 선택
- 스테이지 클리어
- 게임오버
- 결과창
- 로비 복귀
- 3챕터 구조
- 보스방
- 미니보스방
- 지키기 스테이지
- 막기 스테이지
- 보상방

### 산출물

- `docs/v2-prompt-application.md`
- `docs/current-feature-baseline.md`
- `docs/regression-checklist.md`

### 완료 조건

- 프롬프트팩 원본이 프로젝트 내부에 존재한다.
- 현재 기능 기준표가 있다.
- 회귀 방지 체크리스트가 있다.
- 이후 작업은 이 문서를 기준으로 진행한다.

---

## 6. Phase 1: 빌드 기반 최신화

### 목표

Vite + TypeScript 기반을 추가하되, 기존 게임 실행을 깨지 않는다.

### 작업

- Vite 설치
- TypeScript 설치
- `tsconfig.json` 추가
- `vite.config.ts` 추가
- `src/main.ts` 추가
- 기존 `public/client.js`와 `public/pixi-renderer.js`를 한 번에 TS로 바꾸지 않는다.
- 우선 Vite entry에서 기존 스크립트를 감싸는 방식으로 시작한다.
- dev/prod 실행 경로를 정리한다.
- `server.js`의 정적 파일 서빙과 Vite build 결과 경로를 정리한다.

### package script 예시

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "check": "node --check server.js && node --check public/client.js && node --check public/pixi-renderer.js && node --check smoke-check.js",
    "smoke": "node smoke-check.js",
    "test": "npm run check && npm run smoke"
  }
}
```

### 완료 조건

- `npm run dev` 실행 가능
- `npm run build` 성공
- `npm start` 기존 서버 실행 가능
- `npm test` 통과
- 브라우저에서 게임 진입 가능
- asset 404 없음
- 콘솔 에러 0개

---

## 7. Phase 2: 클라이언트 책임 분리

### 목표

`public/client.js`에 몰려 있는 입력, 네트워크, 설정, HUD, 선택 UI 책임을 분리한다.

### 분리 대상

```txt
src/net/NetworkClient.ts
src/net/MessageTypes.ts
src/net/ReconnectPolicy.ts

src/input/InputManager.ts
src/input/ActionMap.ts

src/settings/SettingsManager.ts
src/settings/SaveManager.ts

src/ui/HudController.ts
src/ui/LobbyController.ts
src/ui/ChoiceController.ts
src/ui/MapVoteController.ts
src/ui/ResultController.ts

src/app/Diagnostics.ts
```

### 작업

- WebSocket 연결 로직을 `NetworkClient`로 이동
- heartbeat를 `NetworkClient`로 이동
- reconnect를 `NetworkClient`로 이동
- 입력 이벤트를 `InputManager`로 이동
- key mapping을 `ActionMap`으로 이동
- localStorage 설정을 `SettingsManager`로 이동
- UI 갱신을 Controller 단위로 분리
- 진단값을 `Diagnostics`로 분리

### 원칙

- 게임 로직은 직접 DOM 이벤트를 보지 않는다.
- UI는 서버 상태를 받아 렌더링만 한다.
- NetworkClient는 메시지 송수신만 담당한다.
- SettingsManager는 저장/로드/마이그레이션만 담당한다.
- InputManager는 현재 입력 상태만 제공한다.

### 완료 조건

- 입력 동작 유지
- 방 입장 유지
- 지도 투표 유지
- 스킬 입력 유지
- heartbeat 유지
- reconnect 유지
- 설정 저장 유지
- 이벤트 중복 등록 없음
- 페이지 종료 시 cleanup 정상

---

## 8. Phase 3: Pixi 렌더러 구조 개편

### 목표

`public/pixi-renderer.js`를 렌더링 책임별로 분리한다.

### 분리 구조

```txt
src/render/PixiGameRenderer.ts
src/render/TextureFactory.ts
src/render/CameraRenderer.ts

src/render/pools/SpritePool.ts
src/render/pools/GraphicsPool.ts
src/render/pools/TextPool.ts

src/render/actors/PlayerRenderer.ts
src/render/actors/EnemyRenderer.ts
src/render/actors/BossRenderer.ts

src/render/world/StageRenderer.ts
src/render/world/ProjectileRenderer.ts
src/render/world/HazardRenderer.ts
src/render/world/PickupRenderer.ts

src/render/effects/EffectRenderer.ts
src/render/effects/SkillEffectRenderer.ts
src/render/effects/ParticleEngine.ts
src/render/effects/ParticlePresets.ts
```

### 작업

- Pixi Application 생성 책임 분리
- WebGPU/WebGL fallback 유지
- Texture 생성 책임을 `TextureFactory`로 이동
- SpritePool 분리
- GraphicsPool 분리
- TextPool 분리
- Actor 렌더링 분리
- Enemy 렌더링 분리
- Boss 렌더링 분리
- Projectile 렌더링 분리
- Hazard 렌더링 분리
- Effect 렌더링 분리
- 품질 프리셋을 렌더러 옵션으로 정식화

### 품질 프리셋

```txt
low:
  낮은 DPR cap
  낮은 effect budget
  낮은 particle count

medium:
  기본 DPR cap
  중간 effect budget
  중간 particle count

high:
  높은 DPR cap
  높은 effect budget
  높은 particle count
```

### 완료 조건

- Pixi canvas 정상 생성
- 그래픽 품질 설정 반영
- WebGPU 실패 시 WebGL fallback
- 이펙트 폭주 시 프레임 방어
- 브라우저 콘솔 에러 0개
- 장시간 실행 시 pool retained 수가 무한 증가하지 않음

---

## 9. Phase 4: 데이터 분리

### 목표

스킬, 유물, 몹, 보스, 스테이지, 밸런스 값을 코드에서 분리한다.

### 데이터 파일

```txt
src/data/classes.ts
src/data/skills.ts
src/data/skillUpgrades.ts
src/data/relics.ts
src/data/enemies.ts
src/data/bosses.ts
src/data/stages.ts
src/data/balance.ts
src/data/rarity.ts
src/data/rewards.ts
```

### 분리 대상

- 직업 기본 스탯
- 직업 패시브
- 직업 스킬
- 스킬 쿨다운
- 스킬 범위
- 스킬 피해량
- 스킬 강화
- 유물 목록
- 유물 희귀도
- 유물 최대 중첩 수
- 유물 드랍률
- 몬스터 기본 스탯
- 몬스터 AI 타입
- 몬스터 공격 패턴
- 보스 패턴
- 보스 페이즈
- 스테이지 타입
- 챕터별 난이도
- 경험치 곡선
- 파티원 수별 난이도 보정

### 원칙

- 밸런스 값은 코드 로직과 분리한다.
- 설명 텍스트는 중복되지 않게 관리한다.
- 희귀도/등급/색상/가중치는 공통 테이블로 관리한다.
- 직업에 맞지 않는 유물/스킬은 필터링 데이터로 처리한다.

### 완료 조건

- 밸런스 값을 한 곳에서 조절 가능
- 직업 추가가 쉬움
- 유물 추가가 쉬움
- 몬스터 추가가 쉬움
- 보스 패턴 추가가 쉬움
- 중복 설명 감소

---

## 10. Phase 5: 서버 게임 시스템 분리

### 목표

`server.js`의 게임 로직을 시스템 단위로 분리한다.

### 목표 구조

```txt
src/server/NetworkServer.ts
src/server/RoomManager.ts
src/server/StateSerializer.ts

src/server/systems/PlayerSystem.ts
src/server/systems/EnemySystem.ts
src/server/systems/SkillSystem.ts
src/server/systems/ProjectileSystem.ts
src/server/systems/HazardSystem.ts
src/server/systems/CollisionSystem.ts
src/server/systems/StageSystem.ts
src/server/systems/RewardSystem.ts
src/server/systems/BossSystem.ts
src/server/systems/BotSystem.ts
```

### 작업

- Room 생성/삭제/조회 분리
- Player update 분리
- Enemy update 분리
- Skill 실행 분리
- Projectile update 분리
- Hazard update 분리
- Collision 처리 분리
- Stage 진행 분리
- Reward/Relic 처리 분리
- Boss pattern runner 분리
- Bot 자동 플레이 분리
- State serialization 분리

### 충돌 개선

- Circle collision 유지
- Layer/Mask 개념 추가
- Trigger/Solid 구분
- Broad Phase 도입
- 중복 충돌 방지
- 사망/삭제된 객체 충돌 제외

### 완료 조건

- 서버 권위 판정 유지
- 기존 멀티플레이 동작 유지
- 몹/투사체/장판 업데이트 비용 감소
- 충돌 중복 처리 감소
- 보스 패턴 추가가 데이터 기반으로 가능
- 서버 파일 크기 감소

---

## 11. Phase 6: AI 및 몬스터 시스템 개선

### 목표

몬스터와 보스 AI를 FSM 또는 Behavior Tree 기반으로 정리한다.

### 일반 몬스터 FSM

```txt
idle
patrol
chase
windup
attack
recover
dead
```

### 특수 몬스터 FSM

```txt
targeting
casting
interrupted
specialAttack
recover
```

### 보스 구조

```txt
phase
patternSelect
telegraph
execute
recover
enrage
death
```

### 작업

- 몬스터별 상태 전이 명확화
- 공격 쿨다운 정리
- 타겟 상실 처리
- 캐스팅 중 피격 시 interrupt 처리
- 보스는 빙결 외에는 주요 패턴이 쉽게 끊기지 않게 처리
- AI tick 주기 조절
- 거리 계산 최적화
- 불필요한 탐색 방지

### 완료 조건

- 돌진몹 고장 감소
- 암살자 패턴 명확
- 투사몹 근접 공격 명확
- 힐러몹 힐 캐스팅 명확
- 방벽몹 역할 명확
- 보스 패턴 전조 명확
- 다수 몬스터에서도 성능 유지

---

## 12. Phase 7: 스킬 및 이펙트 품질 재작업

### 목표

모든 직업 스킬을 같은 품질 기준으로 재작업한다.

### 공통 스킬 단계

```txt
전조
발동
타격
잔상
피격 반응
쿨다운 표시
```

### 공통 기준

- 판정 위치와 이펙트 위치가 맞아야 한다.
- 범위가 명확해야 한다.
- 스킬별 식별성이 있어야 한다.
- 쓸데없는 도형 이펙트는 제거한다.
- 그래픽 품질을 우선하되, 스킬의 판정 위치와 범위는 화면에서 읽혀야 한다.
- 피격감이 있어야 한다.

### 직업별 우선순위

#### 전사

- 평타
- 강철 회오리
- 도발
- 방패 돌진
- 광역 베기

#### 궁수

- 연발 사격
- 관통 사격
- 레인 에로우
- 독화살

#### 마법사

- 별빛 폭발
- 빙결 파동
- 운석
- 연쇄 번개

#### 기계공

- 과부하
- 자동 터렛
- 감전 지뢰
- 호위 드론

#### 인형사

- 인형극
- 살아있는 인형
- 실 결계
- 피날레 교대

#### 무투가

- 연환권
- 파쇄장
- 승룡각
- 기합 폭발

#### 연금술사

- 촉매 폭탄
- 산성 플라스크
- 화염 플라스크
- 전투 영약

#### 암살자

- 칼날 난무
- 사신 표식
- 그림자 찌르기
- 연막

### 완료 조건

- 스킬별 식별성이 명확함
- 타격 위치가 판정과 맞음
- 피격감/타격감 개선
- 전사 외 직업도 같은 품질 수준
- 이펙트 과밀 시에도 프레임 유지

---

## 13. Phase 8: 파티클 엔진 도입

### 목표

스킬/피격/폭발/마법 효과를 범용 파티클 엔진으로 처리한다.

### 구조

```txt
src/render/particles/Particle.ts
src/render/particles/ParticlePool.ts
src/render/particles/Emitter.ts
src/render/particles/ParticleEngine.ts
src/render/particles/ParticlePresets.ts
```

### 지원 효과

- Hit Spark
- Slash Trail
- Smoke
- Fire
- Frost
- Lightning
- Poison
- Explosion
- Heal
- Shield
- Boss Warning
- Meteor Impact
- Dash Trail

### 원칙

- 최대 파티클 수 제한
- Pool 재사용
- 매 프레임 객체 생성 금지
- 수명/속도/알파/스케일/회전은 데이터 기반
- additive blend 사용 대상 제한
- low 품질에서는 파티클 수 자동 감소

### 완료 조건

- 파티클 수 진단 가능
- pool 반환 누락 없음
- 장시간 플레이 시 메모리 증가 없음
- 스킬 이펙트가 파티클 preset으로 재사용 가능

---

## 14. Phase 9: 스테이지/챕터/보스 최신화

### 목표

스테이지와 보스를 데이터 기반으로 정리하고, 챕터별 체감 차이를 강화한다.

### 스테이지 타입

```txt
일반
엘리트
준보스
보스
보상
지키기
막기
랜덤
```

### 챕터 설계

```txt
Chapter 1:
  학습
  기본 전투
  쉬운 전조
  낮은 특수몹 비율

Chapter 2:
  조합 압박
  특수몹 증가
  맵 기믹 강화
  보상/위험 선택 체감 증가

Chapter 3:
  고난도 패턴
  보스 중심
  고위험 보상
  파티 협동 요구
```

### 보스 개선

- 챕터별 고유 보스
- 보스별 고유 패턴
- 미니보스는 보스 패턴 재탕 금지
- 패턴 데이터와 실행 로직 분리
- 전조 시간 명확화
- 페이즈 전환 경고 추가
- 페이즈 전환 시 외형 변화
- 보스 피통/방어/패턴 빈도 재조정

### 완료 조건

- 초반 억까 감소
- 중후반 탄막 과밀 감소
- 챕터별 체감 차이 증가
- 보스가 너무 쉽게 죽지 않음
- 보스 패턴이 서로 구분됨
- 미니보스가 별도 정체성을 가짐

---

## 15. Phase 10: UI/UX 최신화

### 목표

타이틀, 메인, 방 리스트, 대기방, HUD, 선택창, 결과창을 재정리한다.

### 화면 흐름

```txt
Title
Loading
Main
Room List / Create Room
Lobby
Game
Map Vote
Reward Choice
Skill Choice
Result
```

### HUD 기준

```txt
상단:
  방 코드
  챕터
  스테이지
  스테이지 타입

하단:
  파티원 HP
  파티원 레벨
  내 유물 목록

중앙:
  지도 선택
  유물 선택
  스킬 강화 선택
  결산창

스킬 슬롯:
  LoL식 쿨다운 overlay
  키 표시
  잠금/사용 가능 상태 표시
```

### 설정 UI

- 그래픽 품질
- 키 설정
- 전체화면
- 언어

### 완료 조건

- 대기방이 팝업처럼 화면을 답답하게 가리지 않음
- 조작법은 자연스럽게 노출
- 모바일/리사이즈 대응
- 클릭/터치 영역 충분
- UI가 전투 시야를 방해하지 않음
- 폰트 로딩 실패 시 fallback

---

## 16. Phase 11: 에셋 및 특수효과 파이프라인

### 목표

음향 기반은 제외하고, 시각적 특수효과와 에셋 관리 규칙을 추가한다.

### 특수효과 목록

- 평타
- 스킬 발동
- 피격
- 치명타
- 유물 획득
- 레벨업
- 보스 전조
- 보스 피격
- 스테이지 클리어
- 게임오버
- 버튼 클릭
- 지도 선택
- 상자 획득

### 에셋 규칙

- 2D game asset
- animation-ready
- clean silhouette
- high contrast
- no text
- no logo
- no watermark
- sprite sheet friendly
- transparent background 또는 pure black background

### 산출물

```txt
public/assets/sprites/
public/assets/icons/
docs/assets-guide.md
```

### 완료 조건

- asset 404 없음
- 에셋 생성 프롬프트 문서화

---

## 17. Phase 12: 저장/설정 시스템 확장

### 목표

설정과 진행 저장을 버전 관리 가능한 구조로 만든다.

### 저장 대상

```txt
settings:
  graphicsQuality
  language
  keyMap

progress:
  unlockedClasses
  unlockedRelics
  titles
  skins
  bestClear
  statistics
```

### 원칙

- 저장 데이터에 version 필드 포함
- 깨진 저장 데이터 복구
- migration 함수 제공
- 민감 데이터 저장 금지
- localStorage 실패 처리

### 완료 조건

- 설정 저장/로드 정상
- 깨진 JSON이 있어도 게임 실행 가능
- 버전 증가 시 migration 가능
- 초기화 기능 존재

---

## 18. Phase 13: 테스트 자동화 확장

### 목표

출시 전 회귀를 자동으로 잡을 수 있게 테스트를 확장한다.

### 서버/스모크 테스트

- HTTP 정상 응답
- `/rooms` 정상 응답
- Pixi renderer 파일 배포 확인
- client runtime 파일 배포 확인
- WebSocket heartbeat
- reconnect
- 방 입장
- 대기방 직업 변경
- 봇 추가
- 관전자
- 준비 완료
- 게임 시작
- 지도 투표
- 전투 진입
- 유물 선택
- 스킬 선택
- 보스방
- 게임오버/로비 복귀

### 브라우저 테스트

- 콘솔 에러 0개
- asset 404 0개
- resize 대응
- 모바일 viewport
- Pixi canvas non-blank 확인
- 장시간 실행 메모리 증가 확인
- low/medium/high 품질 변경 확인

### 완료 조건

- `npm test` 통과
- 브라우저 수동 체크 통과
- 1인 시나리오 통과
- 2인 시나리오 통과
- 4인 시나리오 통과
- 봇-only 시나리오 통과
- 관전자 시나리오 통과

---

## 19. Phase 14: 릴리즈 준비

### 목표

다른 환경에서도 실행 가능한 상태로 정리한다.

### 작업

- README 실행법 정리
- 내부 IP 접속 방법 정리
- 배포용 빌드 확인
- 정적 파일 경로 확인
- 캐시 정책 정리
- sourcemap 정책 정리
- 로그 확인 방법 정리
- 포트 충돌 해결 방법 정리

### 릴리즈 체크리스트

```txt
npm install
npm run check
npm run smoke
npm test
npm run build
npm start
```

### 완료 조건

- 새 환경에서 실행 가능
- 내부 IP 접속 가능
- 브라우저 콘솔 에러 0개
- asset 404 0개
- 서버 재시작 후 동작 명확
- 실행/배포 문서 존재

---

## 20. 최종 추천 진행 순서

```txt
1. Phase 0: 기준 고정
2. Phase 1: Vite + TypeScript 기반 추가
3. Phase 2: 클라이언트 책임 분리
4. Phase 3: Pixi 렌더러 책임 분리
5. Phase 4: 데이터 분리
6. Phase 5: 서버 시스템 분리
7. Phase 6: AI 및 몬스터 시스템 개선
8. Phase 7: 스킬 및 이펙트 품질 재작업
9. Phase 8: 파티클 엔진 도입
10. Phase 9: 스테이지/챕터/보스 최신화
11. Phase 10: UI/UX 최신화
12. Phase 11: 에셋 및 특수효과 파이프라인
13. Phase 12: 저장/설정 시스템 확장
14. Phase 13: 테스트 자동화 확장
15. Phase 14: 릴리즈 준비
```

---

## 21. 최우선 작업

가장 먼저 할 작업은 다음 세 가지다.

```txt
1. Vite + TypeScript 기반 추가
2. client.js 책임 분리
3. pixi-renderer.js 책임 분리
```

이 세 가지를 먼저 해야 이후 스킬, 몹, 보스, UI, 이펙트 개선을 안정적으로 진행할 수 있다.

---

## 22. 절대 주의

- 전체 파일을 한 번에 갈아엎지 않는다.
- 게임 로직과 렌더링을 섞지 않는다.
- 클라이언트 값을 서버가 신뢰하지 않는다.
- 매 프레임 객체 생성/삭제를 늘리지 않는다.
- 그래픽 품질을 우선하되, 전투 판정과 위험 신호는 읽을 수 있어야 한다.
- UI가 전투 시야를 막으면 안 된다.
- 보스 패턴은 전조 없이 즉발하면 안 된다.
