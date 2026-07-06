# 프롬프트팩 v2 Phase 진행 상태

`docs/full-modernization-plan.md` 기준으로 실제 적용 상태를 추적한다.

## 완료

- Phase 0: 기준 고정
  - 전체 로드맵 문서 유지
  - 현재 기능 기준표 추가
  - 회귀 방지 체크리스트 추가
  - v2 적용 노트 상태표화

- Phase 1: 빌드 기반 최신화
  - Vite 설치
  - TypeScript 설치
  - `tsconfig.json` 추가
  - `vite.config.ts` 추가
  - `src/main.ts` 추가
  - 기존 `npm start` 실행 경로 유지
  - Vite dev 서버와 Node backend proxy 확인
  - Vite build 산출물에 legacy runtime assets 포함

- Phase 2: 클라이언트 책임 분리 1차
  - 레거시 브라우저 런타임 브릿지 `public/client-runtime.js` 추가
  - 설정 로드/저장/정규화 책임을 브릿지로 우선 위임
  - 키 매핑 판정 책임을 브릿지로 우선 위임
  - reconnect delay 계산 책임을 브릿지로 우선 위임
  - diagnostics 생성 책임을 브릿지로 우선 위임
  - TypeScript 모듈 골격 추가: NetworkClient, MessageTypes, ReconnectPolicy, ActionMap, SettingsManager, Diagnostics, HudController
  - smoke-check가 client runtime bridge 배포를 확인하도록 확장

- Phase 2: 클라이언트 책임 분리 2차
  - 레거시 호환 입력 브릿지 `public/client-input.js` 추가
  - 키보드/마우스/스킬 sequence/대시 sequence 이벤트 처리를 `RogueInputManager`로 이동
  - 입력 listener cleanup을 `RogueInputManager.destroy()`로 이동
  - 레거시 호환 네트워크 전송 브릿지 `public/client-network.js` 추가
  - `socket.send(JSON.stringify(...))` 직접 호출을 `sendClientMessage()` 경유로 정리
  - TypeScript `InputManager`와 `NetworkBridge` 계약 추가
  - smoke-check가 input/network bridge 배포를 확인하도록 확장

- Phase 2: 클라이언트 책임 분리 3차 이후
  - HUD/Choice/Lobby/Map/Result 브릿지 추가
  - Vite build 산출물과 smoke-check에 client controller bridge 확인 추가
  - 기존 `public/client.js` 실행 경로 유지

- Phase 3: Pixi 렌더러 책임 분리
  - Pixi runtime/config/quality/pool bridge 추가
  - TextureFactory, SpritePool, TextPool, GraphicsPool 책임 분리
  - Camera/Scene/World/Projectile/Hazard/Pickup bridge 추가
  - Enemy/Player/Effect/SkillEffect bridge 추가
  - Actor/Enemy/Boss/World/Projectile/Hazard/Pickup/Effect TypeScript composition 정리
  - `src/render/PixiGameRenderer.ts`, `src/render/world/StageRenderer.ts`, `src/render/actors/BossRenderer.ts` 경계 추가
  - smoke-check가 Pixi bridge delivery를 확인하도록 확장

- Phase 4: 데이터 분리 1차
  - `src/data/classes.ts` 추가: 직업 기본 스탯, 시작 직업, 봇 직업 순서, 대시 프로필
  - `src/data/rarity.ts` 추가: 희귀도 순서, 가중치, 점수, 최대 중첩, alias
  - `src/data/balance.ts` 추가: 핵심 전투/보상/지도/레벨 상수
  - `src/data/rewards.ts` 추가: 스테이지별 보상 규칙
  - `src/data/index.ts` 추가: 데이터 모듈 재수출
  - `src/main.ts`가 Phase 4 활성 상태와 데이터 smoke 값을 노출하도록 갱신

- Phase 4: 데이터 분리 2차
  - `src/data/difficulty.ts` 추가: 파티/스테이지/챕터 난이도 테이블
  - `src/data/bosses.ts` 추가: 챕터 보스/준보스 프로필
  - `src/data/stages.ts` 추가: 스테이지 노드 메타, 특수 스테이지 타입 목록
  - 신규 데이터 모듈을 `src/data/index.ts`와 `src/main.ts` smoke payload에 연결

- Phase 4: 데이터 분리 3차
  - `src/data/enemies.ts` 추가: 적 타입/기본 스탯/역할/해금 조건/등장 가중치
  - `src/data/waveTraits.ts` 추가: 군세/방벽/의식/폭주/보스 관문 trait 정의
  - `src/data/risks.ts` 추가: 보통 방/군세 방/유리 방/문지기 방 modifier 정의
  - 신규 데이터 모듈을 `src/data/index.ts`와 `src/main.ts` smoke payload에 연결

- Phase 4: 데이터 분리 4차
  - `src/data/skills.ts` 추가: 직업별 Q/E/R/F 스킬 슬롯 정의
  - `unlockUpgradeId`로 스킬 강화 데이터와 연결될 경계 마련
  - 신규 데이터 모듈을 `src/data/index.ts`와 `src/main.ts` smoke payload에 연결

- Phase 4: 데이터 분리 5차
  - `src/data/skillUpgrades.ts` 추가: 직업별 스킬 강화, 희귀도 override, 비활성 강화 목록 분리
  - `src/data/relics.ts` 추가: 유물/소모성 보급품 카탈로그, 직업 필터, 최대 중첩, 선택 가중치 helper 분리
  - 신규 데이터 모듈을 `src/data/index.ts`와 `src/main.ts` smoke payload에 연결

- Phase 4: 데이터 분리 6차
  - `server-data-registry.js` 추가: CommonJS 서버 런타임이 읽을 수 있는 희귀도/선택 가중치 registry 경계 마련
  - `server.js`의 유물 최대 중첩, 유물 선택 가중치, 스킬 강화 희귀도, 스킬 선택 가중치 계산을 registry 경유로 위임
  - `npm run check`가 `server-data-registry.js` 문법 검사를 포함하도록 확장
  - 임시 포트 smoke로 HTTP/WebSocket/지도 투표/봇/관전자 흐름 유지 확인

- Phase 4: 데이터 분리 7차
  - `server-data-registry.js`에 현재 유물/소모성 보급 효과를 ID별 operation registry로 추가
  - `server.js`의 유물 적용 경로가 registry를 우선 사용하고, 누락 시 기존 `reward.apply`로 fallback하도록 변경
  - 유물 효과 적용 변경 후 임시 포트 smoke로 HTTP/WebSocket/지도 투표/봇/관전자 흐름 유지 확인

- Phase 4: 데이터 분리 8차
  - `server-data-registry.js`에 스테이지별 상자 제한과 유물 상자 드랍 판정 helper 추가
  - `server.js`의 `getStageChestLimit`, `maybeDropRelicChest` 계산식을 registry 경유로 축소
  - 상자 드랍 판정 변경 후 임시 포트 smoke로 HTTP/WebSocket/지도 투표/봇/관전자 흐름 유지 확인

- Phase 4: 데이터 분리 9차
  - `server-data-registry.js`에 스테이지 보상 preview, 자동 유물 선택 boost, 유물 선택 boost helper 추가
  - `server.js`의 `getStageRewardPreview`, `enterAutoRelicChoice`, `pickRelics` 계산식을 registry 경유로 축소
  - 보상 preview/boost 변경 후 임시 포트 smoke로 HTTP/WebSocket/지도 투표/봇/관전자 흐름 유지 확인

- Phase 4: 데이터 분리 마감
  - 직업/희귀도/밸런스/보상/난이도/보스/스테이지/적/웨이브/위험도/스킬/스킬 강화/유물 데이터 모듈 추가
  - CommonJS 서버 런타임용 `server-data-registry.js` 경계 추가
  - 유물/보상 계산 일부를 registry 경유로 전환
  - 마감 문서 `docs/phase-4-data-split-summary.md` 추가

- Phase 5: 서버 게임 시스템 분리 1차
  - `server-room-manager.js` 추가: 방 초기 상태 생성, 방 조회/생성, 공개 방 목록 생성 책임 분리
  - `src/server/RoomManager.ts` 추가: 이후 TypeScript 서버 이전을 위한 Room/PublicRoom 계약 작성
  - `server.js`의 `getRoom`, `getPublicRooms`가 RoomManager 경유로 동작하도록 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-1-room-manager.md` 추가

- Phase 5: 서버 게임 시스템 분리 2차
  - `server-player-system.js` 추가: 플레이어 분류/활성/생존/관전자/준비 상태 helper 분리
  - `src/server/systems/PlayerSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 PlayerSystem 계약 작성
  - `server.js`의 기존 플레이어 분류 함수명은 유지하고 내부 구현만 PlayerSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-2-player-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 3차
  - `server-state-serializer.js` 추가: state payload의 시간/권한 계산 helper 분리
  - `src/server/StateSerializer.ts` 추가: 이후 TypeScript 서버 이전을 위한 StateSerializer 계약 작성
  - `server.js`의 `buildState`가 room timer/capability 값을 serializer 경유로 계산하도록 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-3-state-serializer.md` 추가

- Phase 5: 서버 게임 시스템 분리 4차
  - `server-reward-system.js` 추가: 유물 선택 시작/해제/대기 player 집계 helper 분리
  - `src/server/systems/RewardSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 RewardSystem 계약 작성
  - `server.js`의 유물 선택 상태 관리 일부를 RewardSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-4-reward-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 5차
  - `server-bot-system.js` 추가: bot brain, bot input reset, bot identity helper 분리
  - `src/server/systems/BotSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 BotSystem 계약 작성
  - `server.js`의 봇 기본 상태/입력 reset 일부를 BotSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-5-bot-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 6차
  - `server-bot-system.js` 확장: 봇 지도/유물/스킬 선택 점수 helper 분리
  - `src/server/systems/BotSystem.ts` 확장: 선택 점수 typed boundary 작성
  - `server.js`의 봇 선택 점수 계산을 BotSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-6-bot-scoring.md` 추가

- Phase 5: 서버 게임 시스템 분리 7차
  - `server-stage-system.js` 추가: 지도 노드 조회, 가용 노드 계산, 투표 집계/승자 helper 분리
  - `src/server/systems/StageSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 StageSystem 계약 작성
  - `server.js`의 지도/투표 순수 계산 일부를 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-7-stage-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 8차
  - `server-enemy-system.js` 추가: 적 타입 해금, 원거리 압박 타입, 투사체 cap/count, 적 타입 카운트 helper 분리
  - `src/server/systems/EnemySystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 EnemySystem 계약 작성
  - `server.js`의 적 관련 순수 계산 일부를 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-8-enemy-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 9차
  - `server-projectile-system.js` 추가: 투사체 이동, 만료 판정, 생존 투사체 필터 helper 분리
  - `src/server/systems/ProjectileSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 ProjectileSystem 계약 작성
  - `server.js`의 `updateProjectiles()` 생명주기 일부와 프레임 종료 투사체 정리를 ProjectileSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-9-projectile-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 10차
  - `server-state-serializer.js` 확장: projectile view/payload helper 분리
  - `src/server/StateSerializer.ts` 확장: projectile view TypeScript 계약 작성
  - `server.js`의 `buildState()` projectile payload 생성을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-10-state-projectile-view.md` 추가

- Phase 5: 서버 게임 시스템 분리 11차
  - `server-state-serializer.js` 확장: enemy movement/enemy view helper 분리
  - `src/server/StateSerializer.ts` 확장: enemy view TypeScript 계약 작성
  - `server.js`의 `buildState()` enemy payload 생성을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-11-state-enemy-view.md` 추가

- Phase 5: 서버 게임 시스템 분리 12차
  - `server-state-serializer.js` 확장: hazard/relic chest/xp orb/stage objective view helper 분리
  - `src/server/StateSerializer.ts` 확장: world object view TypeScript 계약 작성
  - `server.js`의 `buildState()` world object payload 생성을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-12-state-world-view.md` 추가

- Phase 5: 서버 게임 시스템 분리 13차
  - `server-collision-system.js` 추가: 거리, 선분 거리, 정규화 벡터, 각도 차이 helper 분리
  - `src/server/systems/CollisionSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 CollisionSystem 계약 작성
  - `server.js`의 기존 충돌/벡터 helper 함수명은 유지하고 내부 구현만 CollisionSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-13-collision-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 14차
  - `server-collision-system.js` 확장: 원형 겹침, 선분-원 충돌 predicate helper 추가
  - `src/server/systems/CollisionSystem.ts` 확장: predicate TypeScript 계약 작성
  - `server.js`의 투사체/범위/선분 피격 판정 일부를 CollisionSystem predicate 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-14-collision-predicates.md` 추가

- Phase 5: 서버 게임 시스템 분리 15차
  - `server-enemy-system.js` 확장: 가까운 플레이어, 가까운 적, 최저 체력 플레이어, 방어 목표 aggro 반경 helper 분리
  - `src/server/systems/EnemySystem.ts` 확장: 타겟 검색 TypeScript 계약 작성
  - `server.js`의 기존 타겟 검색 wrapper 함수명은 유지하고 내부 구현만 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-15-enemy-targeting.md` 추가

- Phase 5: 서버 게임 시스템 분리 16차
  - `server-skill-system.js` 추가: 스킬 강화 보유, 슬롯 해금, 슬롯 사용 가능 여부, 스킬 쿨다운 helper 분리
  - `src/server/systems/SkillSystem.ts` 추가: 이후 TypeScript 서버 이전을 위한 SkillSystem 계약 작성
  - `server.js`의 기존 스킬 슬롯 wrapper 함수명은 유지하고 내부 구현만 SkillSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-16-skill-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 17차
  - `server-enemy-system.js` 확장: 적 군중 밀림 벡터와 적 충돌 질량 helper 분리
  - `src/server/systems/EnemySystem.ts` 확장: 군중 밀림/질량 TypeScript 계약 작성
  - `server.js`의 기존 wrapper 함수명은 유지하고 내부 구현만 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-17-enemy-crowd.md` 추가

- Phase 5: 서버 게임 시스템 분리 18차
  - `server-collision-system.js` 확장: 충돌 fallback hash와 separation vector helper 분리
  - `src/server/systems/CollisionSystem.ts` 확장: fallback separation TypeScript 계약 작성
  - `server.js`의 기존 wrapper 함수명은 유지하고 내부 구현만 CollisionSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-18-collision-fallback.md` 추가

- Phase 5: 서버 게임 시스템 분리 19차
  - `server-skill-system.js` 확장: 스킬 trigger guard와 쿨다운 적용 helper 분리
  - `src/server/systems/SkillSystem.ts` 확장: 스킬 타이머 포함 TypeScript 계약 작성
  - `server.js`의 플레이어/봇 스킬 발동 조건과 쿨다운 세팅을 SkillSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-19-skill-guard.md` 추가

- Phase 5: 서버 게임 시스템 분리 20차
  - `server-collision-system.js` 확장: 이동 후 월드 경계 clamp helper 분리
  - `src/server/systems/CollisionSystem.ts` 확장: mutable point/world bounds TypeScript 계약 작성
  - `server.js`의 플레이어/적 이동 wrapper 내부 구현을 CollisionSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-20-collision-move.md` 추가

- Phase 5: 서버 게임 시스템 분리 21차
  - `server-state-serializer.js` 확장: 플레이어 스킬 슬롯 view helper 분리
  - `src/server/StateSerializer.ts` 확장: 스킬 슬롯 view TypeScript 계약 작성
  - `server.js`의 `getSkillSlots(player)` wrapper 내부 구현을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-21-state-skill-slots.md` 추가

- Phase 5: 서버 게임 시스템 분리 22차
  - `server-state-serializer.js`의 `movementView`를 export하여 플레이어 movement view에도 재사용
  - `server.js`의 플레이어 `dashMove`, `knockbackMove` inline payload 조립을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-22-state-player-movement.md` 추가

- Phase 5: 서버 게임 시스템 분리 23차
  - `server-player-system.js` 확장: 플레이어 class label, passive view, status effect helper 분리
  - `src/server/systems/PlayerSystem.ts` 확장: 표시용 player helper TypeScript 계약 작성
  - `server.js`의 기존 wrapper 함수명은 유지하고 내부 구현만 PlayerSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-23-player-view-helpers.md` 추가

- Phase 5: 서버 게임 시스템 분리 24차
  - `server-enemy-system.js` 확장: 적 status effect helper 분리
  - `src/server/systems/EnemySystem.ts` 확장: enemy status TypeScript 계약 작성
  - `server.js`의 기존 wrapper 함수명은 유지하고 내부 구현만 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-24-enemy-status-helper.md` 추가

- Phase 5: 서버 게임 시스템 분리 25차
  - `server-stage-system.js` 확장: stage map frame/path/available view helper 분리
  - `src/server/systems/StageSystem.ts` 확장: stage map view TypeScript 계약 작성
  - `server.js`의 `stageMapView(room)` wrapper 내부 구현을 StageSystem 경유로 전환
  - node 상세 view는 기존 `mapNodeView(room, node)` 콜백으로 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-25-stage-map-view.md` 추가

- Phase 5: 서버 게임 시스템 분리 26차
  - `server-state-serializer.js` 확장: 플레이어 입력/조준 view helper 분리
  - `src/server/StateSerializer.ts` 확장: player input view TypeScript 계약 작성
  - `server.js`의 player state aim/move/facing/attacking 계산을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-26-state-player-input.md` 추가

- Phase 5: 서버 게임 시스템 분리 27차
  - `server-state-serializer.js` 확장: 플레이어 vitals/scalar view helper 분리
  - `src/server/StateSerializer.ts` 확장: player vitals view TypeScript 계약 작성
  - `server.js`의 player state HP/보호막/속도/무적/크기/기력 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-27-state-player-vitals.md` 추가

- Phase 5: 서버 게임 시스템 분리 28차
  - `server-state-serializer.js` 확장: 플레이어 progression/reward summary view helper 분리
  - `src/server/StateSerializer.ts` 확장: player progression view TypeScript 계약 작성
  - `server.js`의 player state 레벨/XP/점수/유물 수/전직 단계 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-28-state-player-progression.md` 추가

- Phase 5: 서버 게임 시스템 분리 29차
  - `server-state-serializer.js` 확장: 플레이어 identity/class visual view helper 분리
  - `src/server/StateSerializer.ts` 확장: player identity view TypeScript 계약 작성
  - `server.js`의 player state id/name/bot/spectator/class/icon/color/passive 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-29-state-player-identity.md` 추가

- Phase 5: 서버 게임 시스템 분리 30차
  - `server-state-serializer.js` 확장: 플레이어 loadout/reward choice view helper 분리
  - `src/server/StateSerializer.ts` 확장: player loadout view TypeScript 계약 작성
  - `server.js`의 player state 유물/스킬 강화/선택지 공개 범위 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-30-state-player-loadout.md` 추가

- Phase 5: 서버 게임 시스템 분리 31차
  - `server-state-serializer.js` 확장: 플레이어 action/cooldown view helper 분리
  - `src/server/StateSerializer.ts` 확장: player action state view TypeScript 계약 작성
  - `server.js`의 player state 스킬/대시 쿨다운, 준비 상태, 마지막 행동 timestamp 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-31-state-player-action.md` 추가

- Phase 5: 서버 게임 시스템 분리 32차
  - `server-state-serializer.js` 확장: 플레이어 position view helper 분리
  - `src/server/StateSerializer.ts` 확장: player position view TypeScript 계약 작성
  - `server.js`의 player state x/y 좌표 반올림 계산을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-32-state-player-position.md` 추가

- Phase 5: 서버 게임 시스템 분리 33차
  - `server-stage-system.js` 확장: map node view helper 분리
  - `src/server/systems/StageSystem.ts` 확장: stage map node view TypeScript 계약 작성
  - `server.js`의 `mapNodeView(room, node)` payload 조립 본문을 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-33-stage-map-node-view.md` 추가

- Phase 5: 서버 게임 시스템 분리 34차
  - `server-state-serializer.js` 확장: room identity view helper 분리
  - `src/server/StateSerializer.ts` 확장: room identity view TypeScript 계약 작성
  - `server.js`의 room state code/wave/floor/chapter/status/host payload 계산 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-34-state-room-identity.md` 추가

- Phase 5: 서버 게임 시스템 분리 35차
  - `server-state-serializer.js` 확장: room population/capability summary view helper 분리
  - `src/server/StateSerializer.ts` 확장: room population view TypeScript 계약 작성
  - `server.js`의 room state ready/count/bot/choice pending payload 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-35-state-room-population.md` 추가

- Phase 5: 서버 게임 시스템 분리 36차
  - `server-stage-system.js` 확장: map choice refresh helper 분리
  - `src/server/systems/StageSystem.ts` 확장: mutable map choice TypeScript 계약 작성
  - `server.js`의 `room.mapChoices` 갱신 중복을 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-36-stage-map-choice-refresh.md` 추가

- Phase 5: 서버 게임 시스템 분리 37차
  - `server-stage-system.js` 확장: map progression helper 분리
  - `src/server/systems/StageSystem.ts` 확장: mutable stage map progression TypeScript 계약 작성
  - `server.js`의 지도 노드 소진 시 다음 챕터 전환/완료 판정 중복을 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-37-stage-map-progression.md` 추가

- Phase 5: 서버 게임 시스템 분리 38차
  - `server-stage-system.js` 확장: map node start helper 분리
  - `src/server/systems/StageSystem.ts` 확장: mutable map node start TypeScript 계약 작성
  - `server.js`의 선택된 지도 노드 적용 mutation 일부를 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-38-stage-map-node-start.md` 추가

- Phase 5: 서버 게임 시스템 분리 39차
  - `server-stage-system.js` 확장: final stage clear/count helper 분리
  - `src/server/systems/StageSystem.ts` 확장: stage clear/count TypeScript 계약 작성
  - `server.js`의 최종 스테이지 클리어 판정과 결과창용 stage count 계산을 StageSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-39-stage-clear-counts.md` 추가

- Phase 5: 서버 게임 시스템 분리 40차
  - `server-reward-system.js` 확장: relic choice summary helper 분리
  - `src/server/systems/RewardSystem.ts` 확장: relic choice summary TypeScript 계약 작성
  - `server.js`의 유물 선택 pending count/has pending 확인 일부를 RewardSystem summary 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-40-reward-choice-summary.md` 추가

- Phase 5: 서버 게임 시스템 분리 41차
  - `server-state-serializer.js` 확장: run result player row view helper 분리
  - `src/server/StateSerializer.ts` 확장: run result player view TypeScript 계약 작성
  - `server.js`의 결산창 player row payload 조립을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-41-state-run-result-player.md` 추가

- Phase 5: 서버 게임 시스템 분리 42차
  - `server-state-serializer.js` 확장: run result summary view helper 분리
  - `src/server/StateSerializer.ts` 확장: run result summary TypeScript 계약 작성
  - `server.js`의 결산창 result summary payload 조립을 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-42-state-run-result-summary.md` 추가

- Phase 5: 서버 게임 시스템 분리 43차
  - `server-reward-system.js` 확장: relic choice timeout helper 분리
  - `src/server/systems/RewardSystem.ts` 확장: timed out relic choice TypeScript 계약 작성
  - `server.js`의 유물 선택 제한시간 종료 처리 loop를 RewardSystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-43-reward-choice-timeout.md` 추가

- Phase 5: 서버 게임 시스템 분리 44차
  - `server-room-manager.js` 확장: gameover cleanup helper 분리
  - `src/server/RoomManager.ts` 확장: gameover cleanup TypeScript 계약 작성
  - `server.js`의 `finishRun()` cleanup 본문을 RoomManager 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-44-room-gameover-cleanup.md` 추가

- Phase 5: 서버 게임 시스템 분리 45차
  - `server-state-serializer.js` 확장: room stage summary view helper 분리
  - `src/server/StateSerializer.ts` 확장: room stage summary TypeScript 계약 작성
  - `server.js`의 room state risk/stage/waveTrait/threatLevel payload 일부를 StateSerializer 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-45-state-room-stage-summary.md` 추가

- Phase 5: 서버 게임 시스템 분리 46차
  - `server-room-manager.js` 확장: stage clear combat object cleanup helper 분리
  - `src/server/RoomManager.ts` 확장: stage combat object cleanup TypeScript 계약 작성
  - `server.js`의 `completeWave()` 전장 오브젝트 정리 일부를 RoomManager 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-46-room-stage-clear-objects.md` 추가

- Phase 5: 서버 게임 시스템 분리 47차
  - `server-hazard-system.js` 추가: hazard live filter와 owned hazard helper 분리
  - `src/server/systems/HazardSystem.ts` 추가: HazardSystem TypeScript 계약 작성
  - `server.js`의 hazard 생명주기 filter와 owned hazard 조회 일부를 HazardSystem 경유로 전환
  - `package.json` check script에 `server-hazard-system.js` 문법 검사 추가
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-47-hazard-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 48차
  - `server-boss-system.js` 추가: 챕터 보스/준보스 프로필 조회와 보스 profile view helper 분리
  - `src/server/systems/BossSystem.ts` 추가: BossSystem TypeScript 계약 작성
  - `server.js`의 보스 프로필 선택/조회 wrapper 내부 구현을 BossSystem 경유로 전환
  - `package.json` check script에 `server-boss-system.js` 문법 검사 추가
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-48-boss-system.md` 추가

- Phase 5: 서버 게임 시스템 분리 49차
  - `server-network-server.js` 추가: WebSocket handshake/frame decode/JSON frame encode helper 분리
  - `src/server/NetworkServer.ts` 추가: NetworkServer TypeScript 계약 작성
  - `server.js`의 handshake, frame read, send wrapper 내부 구현을 NetworkServer 경유로 전환
  - `package.json` check script에 `server-network-server.js` 문법 검사 추가
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-5-49-network-server.md` 추가

- Phase 5: 서버 게임 시스템 분리 마감
  - NetworkServer, RoomManager, StateSerializer, Player/Enemy/Skill/Projectile/Hazard/Collision/Stage/Reward/Boss/Bot System 경계 확보
  - CommonJS helper와 TypeScript 계약을 병행 추가해 이후 서버 TS 이전 발판 마련
  - 마감 문서 `docs/phase-5-server-system-summary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 마감
  - enemy `aiState`/`windupChannel` 관측 경계 추가
  - 공통 timer tick, windup advance, interrupt policy, support/ranged cast profile 경계 추가
  - charger/melee/bomber/elite/boss-snipe/mini-shadow/mortar windup 경계 정리
  - special pattern policy와 boss phase transition helper 분리
  - 직접 `windup.time -= dt` 패턴 제거 확인
  - 마감 문서 `docs/phase-6-ai-monster-summary.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 마감
  - 전사/궁수/마법사/기계공/인형사/무투가/연금술사/암살자 1차 Pixi 스킬 이펙트 품질 패스 완료
  - 서버 권위 판정과 밸런스는 유지하고 렌더링 식별성, 타격점, 애니메이션감을 개선
  - 마감 문서 `docs/phase-7-skill-effect-summary.md` 추가

- Phase 8: 파티클 엔진 도입 마감
  - `public/pixi-particles.js`와 `src/render/particles/*` 기반 추가
  - particle preset, quality별 particle budget, diagnostics, 주요 직업/공용 preset adoption 완료
  - 마감 문서 `docs/phase-8-particle-engine-summary.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 1차
  - 챕터별 stage profile과 보스/미니보스 profile metadata 추가
  - room state에 `chapterProfile` 추가
  - boss profile view에 role/pattern/phase/telegraph/patternMix 정보를 노출
  - 진행 기록 `docs/phase-9-1-stage-boss-profile-foundation.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 2차
  - 챕터 profile의 `stagePressureMul`을 실제 스폰 압박도에 연결
  - `specialEnemyBudget`을 기본몹/특수몹 비율과 엘리트 확률에 연결
  - 보스/미니보스 profile의 `telegraph`와 챕터 `bossTelegraphBias`를 주요 보스 전조 시간에 연결
  - 진행 기록 `docs/phase-9-2-chapter-profile-runtime-hooks.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 3차
  - 보스/미니보스 생성 시 `patternMix`를 enemy 상태에 저장
  - 보스 계열 특수 패턴 허용을 채널별 cycle에서 공유 pattern gate로 전환
  - `patternMix.special + patternMix.punish` 비율에 따라 10-step 중 2~4 step만 강패턴 허용
  - 진행 기록 `docs/phase-9-3-boss-pattern-mix-gate.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 4차
  - 보스 phase visual state(`phaseTitle`, `phaseTransitionTimer`, `phaseAuraColor`) 추가
  - phase transition warning effect에 profile phase title, phase, duration 추가
  - Pixi enemy renderer와 fallback renderer에 boss phase aura 표시 추가
  - 진행 기록 `docs/phase-9-4-boss-phase-telegraph-visual-state.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 5차
  - 챕터 profile에 `visualTone` 추가 및 room state 직렬화
  - Pixi world renderer가 챕터 색감과 스테이지 타입을 함께 사용하도록 변경
  - 막기/지키기/보상/엘리트/보스방의 바닥 연출과 objective 표시 강화
  - 비좌표 objective가 잘못 그려지지 않도록 objective renderer 방어 추가
  - 진행 기록 `docs/phase-9-5-stage-ambience-feedback.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 6차
  - 보스/미니보스 profile에 `signaturePatterns` 추가
  - BossSystem에 `getSignaturePatterns`, `nextBossPattern` helper 추가
  - 보스/미니보스 특수 패턴 선택을 고정 modulo 순환에서 profile 기반 패턴 키 소비로 전환
  - enemy state에 `currentBossPattern` 추가
  - 진행 기록 `docs/phase-9-6-boss-signature-pattern-hooks.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 마감
  - 챕터 profile, stage ambience, boss phase feedback, boss signature pattern hook 적용 범위 정리
  - smoke-check가 `room.chapterProfile.visualTone`과 stage map boss `signaturePatterns`를 확인하도록 보강
  - 마감 기록 `docs/phase-9-stage-boss-summary.md` 추가

- Phase 10: UI/UX 최신화 1차
  - 타이틀/메인/방 입장 화면에 pixel RPG shell, feature badge, gate visual treatment 추가
  - 대기방을 화면 전체 팝업 대신 왼쪽 loadout console 형태로 축소해 테스트 공간 확보
  - 방 목록/입장 copy와 Phase 10 UI shell smoke marker 보강
  - 세부 기록 `docs/phase-10-1-ui-shell-refresh.md` 추가

- Phase 10: UI/UX 최신화 2차
  - 유물/스킬 선택 카드에 `choice-action-row` 추가
  - 지도 투표 카드에 `map-choice-top`과 투표 상태 action row 추가
  - modal/card pixel shell hierarchy와 smoke marker 보강
  - 세부 기록 `docs/phase-10-2-choice-result-hierarchy.md` 추가

- Phase 10: UI/UX 최신화 3차
  - 상단 HUD `OPT` 버튼과 `settingsOverlay` 추가
  - graphics quality 즉시 반영, language 저장, key capture/remap UI 추가
  - 음향 설정 필드 제거 및 settings normalize 계약 정리
  - 세부 기록 `docs/phase-10-3-settings-ui.md` 추가

- Phase 10: UI/UX 최신화 4차
  - desktop `1280x720`, mobile `390x844` 브라우저 overlap pass 수행
  - 모바일 settings overlay scroll 보정
  - 브라우저 콘솔 에러 0개 확인
  - 세부 기록 `docs/phase-10-4-viewport-overlap-pass.md` 추가

- Phase 10: UI/UX 최신화 마감
  - title/main/lobby/choice/map/result/settings/viewport 적용 범위 정리
  - 마감 기록 `docs/phase-10-uiux-summary.md` 추가

- Phase 11: 에셋 및 특수효과 파이프라인 1차
  - `public/assets/asset-manifest.json` visual-only manifest 추가
  - sprites/icons/effects README와 `docs/assets-guide.md` 추가
  - smoke-check가 `/assets/asset-manifest.json` contract를 확인하도록 보강
  - 세부 기록 `docs/phase-11-1-visual-asset-pipeline-foundation.md` 추가

## 다음 대상

- Phase 11-2: visual asset manifest loader/helper
  - `public/pixi-assets.js` visual manifest loader/helper 추가
  - `src/render/VisualAssetManifest.ts` 타입 경계 추가
  - 진행 기록 `docs/phase-11-2-visual-asset-manifest-helper.md` 추가

- Phase 11-3: texture asset descriptor contract
  - manifest entry의 `textureKey`/`aliases`/`path` normalization 추가
  - TextureFactory에 external asset texture 우선 생성 계약 추가
  - Pixi renderer 단일 `texture()` 진입점에 descriptor lookup과 generated fallback 연결
  - diagnostics에 `assetTextures.external/fallback` 추가
  - 진행 기록 `docs/phase-11-3-texture-asset-descriptor-contract.md` 추가

- Phase 11-4: texture fallback policy
  - `public/assets/asset-manifest.json`에 `texturePolicy`, `textureKeyGuide` 추가
  - `public/assets/asset-manifest.sample.json` 예시 manifest 추가
  - `docs/assets-guide.md`에 texture replacement priority, key naming, graphics quality priority, regression checklist 추가
  - smoke-check가 manifest policy와 sample manifest를 확인하도록 보강
  - 진행 기록 `docs/phase-11-4-texture-fallback-policy.md` 추가

## Phase 11 진행 기록

- Phase 11 closeout
  - visual-only asset pipeline 범위 마감
  - 마감 기록 `docs/phase-11-visual-asset-pipeline-summary.md` 추가
  - Phase 12 저장/설정 시스템 확장으로 이동

- Phase 12-1: save schema foundation

  - `public/client-save.js` 진행도 저장 bridge 추가
  - `src/settings/SaveSchema.ts`, `src/settings/SaveManager.ts` 추가
  - settings v2와 legacy v1 migration 경계 추가
  - `window.__rogueProgress` debug/control bridge 추가
  - 진행 기록 `docs/phase-12-1-save-schema-foundation.md` 추가

- Phase 12-2: run result progress recording
  - `public/client.js` result overlay rendering now records one run result into progress statistics.
  - `lastRecordedResultKey` and `getResultSaveKey(result, nextState)` prevent duplicate counting while gameover state is rendered repeatedly.
  - `clientDiagnostics.progressRuns` and `progressSaveFailed` expose save status for debugging.
  - `smoke-check.js` now verifies the result-save wiring markers.
  - Phase note added: `docs/phase-12-2-run-result-progress-recording.md`.

- Phase 12-3: progress import/export and closeout
  - `public/client-save.js` exposes `exportUserProgress(progress)` and `importUserProgress(snapshot)`.
  - `src/settings/SaveManager.ts` mirrors the same import/export contract.
  - `window.__rogueProgress.export()` and `window.__rogueProgress.import(snapshot)` allow debug backup/restore.
  - Invalid import snapshots recover to `defaultProgress`.
  - Phase note added: `docs/phase-12-3-progress-import-export.md`.

- Phase 13-1: HTTP/static smoke contract
  - `smoke-check.js` now parses `index.html` linked script/link refs and fetches each internal static asset.
  - JS/CSS responses that fall back to HTML are treated as failures.
  - `/rooms` public field shape is checked when rooms are present.
  - Phase note added: `docs/phase-13-1-http-static-smoke-contract.md`.

- Phase 13-2: room list WebSocket/HTTP smoke scenario
  - `smoke-check.js` now creates a unique lobby through WebSocket and checks that it appears in `/rooms`.
  - Public room fields `code`, `status`, `playerCount`, `maxPlayers`, and `hostName` are validated against the joined room.
  - Phase note added: `docs/phase-13-2-room-list-smoke-scenario.md`.

- Phase 13-3: client save runtime contract
  - `smoke-check.js` executes `public/client-save.js` inside a Node VM sandbox.
  - Fake `localStorage` verifies save/load, broken JSON recovery, run result recording, and progress import/export.
  - Phase note added: `docs/phase-13-3-client-save-runtime-contract.md`.

- Phase 13-4: UI controller runtime contract
  - `smoke-check.js` now executes `client-choice.js`, `client-result.js`, and `client-map.js` in a Node VM sandbox.
  - Choice, result, and map render contracts verify required data attributes, key markup, and HTML escaping.
  - Phase note added: `docs/phase-13-4-ui-controller-runtime-contract.md`.

- Phase 13 closeout
  - Fast smoke coverage now includes linked static assets, `/rooms`, save runtime, UI controller runtime, WebSocket flow, bots, and spectator mode.
  - Browser pixel/memory/long-run E2E checks are deferred to a dedicated browser harness.
  - Phase summary added: `docs/phase-13-test-automation-summary.md`.

- Phase 14: release prep closeout
  - Root `README.md` added with install/run/internal IP/port conflict/verification guidance.
  - `docs/release-runbook.md` added with release checklist, smoke markers, static/runtime checks, and deferred checks.
  - `package.json` adds `release:check`.
  - Phase summary added: `docs/phase-14-release-prep-summary.md`.

## Phase 6 세부 완료 기록

- Phase 6: AI 및 몬스터 시스템 개선 1차
  - `server-enemy-system.js`에 `getEnemyAiState`, `getEnemyWindupChannel` 추가
  - `src/server/systems/EnemySystem.ts`에 AI 상태/windup channel 계약 추가
  - enemy state payload에 `aiState`, `windupChannel` 추가
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-1-enemy-ai-state.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 2차
  - `server-enemy-system.js`에 `tickEnemyTimers` 추가
  - `src/server/systems/EnemySystem.ts`에 `EnemyTimerLike`와 timer tick 계약 추가
  - `server.js`의 `updateEnemies()` 공통 timer/cleanup block을 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-2-enemy-timer-tick.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 3차
  - `server-enemy-system.js`에 `advanceEnemyWindup` 추가
  - `src/server/systems/EnemySystem.ts`에 windup tick result 계약 추가
  - 샤먼/방벽몹/스나이퍼/투사 casting 진행을 EnemySystem helper 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-3-enemy-windup-advance.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 4차
  - `server-enemy-system.js`에 interruptible windup 판정과 `interruptEnemyWindup` 추가
  - `src/server/systems/EnemySystem.ts`에 interrupt policy 타입/계약 추가
  - `server.js`의 `interruptEnemyCast()` 정책/타이머 분기를 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-4-enemy-interrupt-policy.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 5차
  - `server-enemy-system.js`에 `getChargeDashCooldown` 추가
  - `src/server/systems/EnemySystem.ts`에 charger cooldown 계약 추가
  - charger/mini boss/boss/defense objective charge windup 전이를 `advanceChargeWindup` 경유로 정리
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-5-charger-fsm-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 6차
  - duelist mini boss `mini_cleave` windup 진행을 `advanceEnemyWindup` 경유로 전환
  - stalker `stalker_stab`, `stalker_shuriken` windup 진행을 `advanceEnemyWindup` 경유로 전환
  - brute `brute_swing` windup 진행을 `advanceEnemyWindup` 경유로 전환
  - 완료된 windup payload를 실행 함수에 넘겨 판정 좌표와 타이밍을 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-6-melee-windup-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 7차
  - `advanceBomberExplosionWindup(room, enemy, dt)` wrapper 추가
  - 일반 전투와 지키기 스테이지의 `bomber_explode` 준비동작 진행을 공통 helper 경유로 전환
  - `explodeBomber(room, enemy, cast?)`가 완료된 windup payload를 받아 반경을 유지하도록 변경
  - 자폭은 피격으로 끊기지 않는 의도된 행동이라 interrupt policy는 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-7-bomber-windup-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 8차
  - `server-enemy-system.js`에 `getSupportCastProfile(enemy, kind)` 추가
  - `src/server/systems/EnemySystem.ts`에 support cast profile 계약 추가
  - shaman heal 반경/시전시간/회복시간 계산을 EnemySystem profile 경유로 전환
  - guardian barrier 반경/시전시간/회복시간 계산을 EnemySystem profile 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-8-support-cast-profile.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 9차
  - `server-enemy-system.js`에 `getRangedCastProfile(enemy, kind, pressureMul)` 추가
  - `src/server/systems/EnemySystem.ts`에 ranged cast profile 계약 추가
  - mortar arm time/radius/recovery 계산을 EnemySystem profile 경유로 전환
  - sniper windup/range/lead speed/recovery 계산을 EnemySystem profile 경유로 전환
  - spitter cast/warning/recovery 계산을 EnemySystem profile 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-9-ranged-cast-profile.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 10차
  - `server-enemy-system.js`에 special pattern cycle/defer/timer/cooldown helper 추가
  - `src/server/systems/EnemySystem.ts`에 `SpecialPatternEnemyLike` 계약 추가
  - elite/miniboss/boss 특수 패턴 빈도 제어 wrapper를 EnemySystem 경유로 전환
  - 기존 10-step cycle과 3/7/10 특수 패턴 허용 정책 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-10-special-pattern-policy.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 11차
  - `server-enemy-system.js`에 `isEliteSpecialWindupKind(kind)` 추가
  - `src/server/systems/EnemySystem.ts`에 elite special windup kind helper 추가
  - `updateEliteSpecial()`의 windup 직접 tick을 `advanceEnemyWindup` 경유로 전환
  - `isEliteSpecialWindup(kind)` wrapper를 EnemySystem 경유로 전환
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-11-elite-windup-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 12차
  - `advanceBossSnipeWindup(room, enemy, dt, onReady)` wrapper 추가
  - legacy mini boss, hunter mini boss, void boss의 `snipe` windup 직접 tick을 wrapper 경유로 전환
  - 준비 완료 payload callback으로 기존 split shot/cooldown/projectile 로직 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-12-boss-snipe-windup-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 13차
  - `server-boss-system.js`에 `getBossPhaseTransition(enemy)` 추가
  - `src/server/systems/BossSystem.ts`에 boss phase transition 계약 추가
  - `server.js`에 `applyBossPhaseTransition(...)` 추가
  - `updateBossEnemy()`의 페이즈 전환 조건/수치 계산을 BossSystem helper 경유로 전환
  - 기존 2페이즈 우선 전환 순서와 페이즈 패턴 발동은 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-13-boss-phase-transition.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 14차
  - `updateHunterMiniBoss()`의 `mini_shadow_stab` 직접 tick을 `advanceEnemyWindup` 경유로 전환
  - 준비 완료 payload를 `performMiniShadowStab()`에 전달해 기존 좌표/타이밍 유지
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-14-mini-shadow-windup-boundary.md` 추가

- Phase 6: AI 및 몬스터 시스템 개선 15차
  - `updateMortar()`의 `mortar` 직접 tick을 `advanceEnemyWindup` 경유로 전환
  - 준비 완료 payload를 `castMortarPool()`에 전달해 기존 장판 정보 유지
  - `server.js`에서 직접 `windup.time -= dt` 패턴 제거 확인
  - `npm run check`, `npm run build`, 임시 포트 `npm test` 통과
  - 세부 기록 `docs/phase-6-15-mortar-windup-boundary.md` 추가

## 보류

- Phase 10 이후는 Phase 9 완료 후 순서대로 진행한다.
- 대형 파일을 한 번에 갈아엎지 않고, 기능 단위로 나눠 진행한다.

## Phase 7 세부 진행 기록

- Phase 7: 스킬 및 이펙트 품질 재작업 1차
  - 전사 Q 강철 회오리를 전체 원형 도형이 아니라 회전하는 한 자루 대검 + 분절 파동 중심으로 조정
  - 전사 방패돌진 머리 부분에 방패 벽 실루엣을 추가해 밀고 들어가는 방향성을 강화
  - 전사 방패 충돌은 방사형 장식선을 줄이고 방패 벽/충돌 파편 중심으로 조정
  - 전사 평타와 광역 베기의 두꺼운 흰색 arc/장식 도형 비중을 줄이고 칼날 실루엣과 궤적 중심으로 조정
  - `drawGfxGreatsword`의 불필요한 손잡이 끝 장식선을 제거
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-1-warrior-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 2차
  - 궁수 화살비를 분절 경계 + 선행 발사 화살 + 낙하 화살 + 착탄 spark 중심으로 조정
  - 궁수 관통 사격 lane 폭을 키우고 양쪽 레일/중앙 화살/종점 impact를 추가
  - warning 상태와 실제 발동 상태의 화살 수와 alpha를 구분
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-2-ranger-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 3차
  - 마법사 빙결을 퍼지는 원형 장판보다 순간 결정/균열 중심으로 조정
  - 마법사 운석은 높은 낙하선, target arc, 착탄 impact, 불꽃 패치로 구성 변경
  - 연쇄 번개에 보조 가지 전류를 추가해 연쇄 전류 느낌 강화
  - 별빛/점멸 계열은 rune/star/방사선/spark를 분리해 단순 원형 폭발감을 완화
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-3-mage-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 4차
  - 기계공 감전 지뢰를 분절 arc, 이중 gear, 전기 방전, 바닥 베이스 중심으로 조정
  - 터렛/장치 투척은 시작점에서 목표점까지 보간되는 장치 위치와 착지 impact를 추가
  - 터렛 본체에 포신/삼각 지지대를 추가해 설치물 실루엣 강화
  - 드론은 gear core, 회전 rotor arc, 하단 본체 라인으로 장치성을 강화
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-4-engineer-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 5차
  - 인형사 실 효과를 주 실/보조 실로 분리해 연결 방향성을 강화
  - 실 결계는 원형 장판 비중을 낮추고 중심-양끝 실 연결과 수직 실 기둥 중심으로 조정
  - 피날레 교대는 양끝 rune ring과 spark로 교대 위치를 구분
  - 소환/돌진은 목표 위치에 인형 머리/몸통/팔/그림자가 단계적으로 보이게 조정
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-5-puppeteer-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 6차
  - 무투가 파쇄장을 전방 capsule lane, 반복 palm arc, 종점 impact burst 중심으로 조정
  - 승룡각은 이동 lane 위에 상승 kick line과 공중 impact를 추가해 상승감을 강화
  - 기합 폭발은 짧은 arc 조각, 방사 line, 중심 star로 중심 폭발감을 강화
  - 연환권/연환 흐름 combo/flurry/finisher 계열도 crisp renderer가 직접 처리
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-6-martial-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 7차
  - 연금술사 플라스크 투척을 시전자에서 목표까지 보간되는 포물선, 잔상, 착탄 burst 중심으로 조정
  - 촉매 폭탄은 황금색 detonation, 산성 장판은 기포/방울/부식 자국, 화염 장판은 불꽃 혀/불씨로 분리
  - 전투 영약은 치유 안개 방울, 십자 flash, 부드러운 rune ring으로 회복 계열 식별성을 강화
  - 서버 판정과 밸런스는 유지하고 Pixi 렌더링 품질만 조정
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-7-alchemist-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 8차
  - 암살자 칼날 부채/베기 계열이 빈 분기로 소모되지 않도록 다중 blade stroke 렌더링 추가
  - 그림자 찌르기는 dash lane, 잔상 베기, 종점 arc, impact burst로 찌르기 방향과 타격점을 강화
  - 연막은 어두운 smoke pocket, 분신 실루엣, 짧은 blade arc로 분신 스킬 정체성을 강화
  - 표식/표창/그림자 echo/mark chain은 별도 star, rune, jagged chain 그래픽으로 분리
  - `npm run check` 통과
  - 진행 기록 `docs/phase-7-8-assassin-effect-profile.md` 추가

- Phase 7: 스킬 및 이펙트 품질 재작업 마감
  - 전사/궁수/마법사/기계공/인형사/무투가/연금술사/암살자 1차 Pixi 스킬 이펙트 품질 패스 완료
  - 서버 권위 판정, 스킬 밸런스, 의존성은 변경하지 않고 렌더링 식별성과 애니메이션감을 개선
  - 마감 기록 `docs/phase-7-skill-effect-summary.md` 추가

## Phase 8 세부 진행 기록

- Phase 7/8 고도화: 스킬 이펙트 공통 품질 레이어
  - 모든 styled skill 렌더링 전에 `renderSkillEffectPolishLayer()`를 호출해 방향성, 타격점, 속성감을 공통으로 보강
  - 신규 particle preset `bladeGlint`, `metalSpark`, `arcaneDust`, `lightningFork`, `shockRing` 추가
  - 기존 직업별 crisp renderer와 서버 판정은 유지하고 Pixi 시각 품질 레이어만 추가
  - 진행 기록 `docs/phase-7-8-visual-polish-pass.md` 추가

- Phase 7/8 고도화: 스킬 이펙트 스프라이트시트 전환
  - `public/assets/effects/`에 픽셀풍 스킬 이펙트 스프라이트시트 14종 추가
  - `assetEffectFrameTexture()`와 `assetEffectFx()`로 외부 sheet frame을 Pixi Sprite로 렌더링
  - `renderAssetStyledSkillEffect()`가 성공하면 기존 절차형 fallback으로 내려가지 않는 asset-first 경로 연결
  - `asset-manifest.json`에 스킬 이펙트는 외부 spritesheet asset을 우선한다는 정책 추가
  - `smoke-check.js`가 스프라이트시트 manifest, SVG asset, renderer bridge를 검증하도록 확장
  - 진행 기록 `docs/phase-7-8-asset-spritesheet-effect-pass.md` 추가

- Phase 8: 파티클 엔진 도입 마감
  - `public/pixi-particles.js`, `src/render/particles/*`, Pixi renderer preset bridge, particle budget diagnostics, primary/remaining class preset adoption 완료
  - particle preset 현재 목록: `hitSpark`, `slashTrail`, `fireBurst`, `poisonBurst`, `frostBurst`, `healMist`, `smokePuff`, `bladeGlint`, `metalSpark`, `arcaneDust`, `lightningFork`, `shockRing`
  - quality별 particle budget: low 110 / medium 180 / high 280
  - Phase 9 보스/스테이지 이펙트 확장용 기반으로 사용 가능
  - `npm run check`, `npm run build`, `npm test` 통과
  - 마감 문서 `docs/phase-8-particle-engine-summary.md` 추가

- Phase 8: 파티클 엔진 도입 5차
  - 전사 도발, 공용 warning/impact, 기계공 장치, 인형사 swap/materialize, 암살자 slash/fan, 연금술사 throw trail의 spark 주 경로를 particle preset으로 전환
  - `fireBurst`, `poisonBurst`, `healMist`, `smokePuff`, `slashTrail`, `hitSpark`를 효과 의미별로 사용
  - 기존 `drawGfxSparkSpray` 호출은 fallback 식으로 유지
  - `smoke-check.js`가 전체 particle preset 이름 배포를 확인하도록 확장
  - `npm run check` 통과
  - 진행 기록 `docs/phase-8-5-remaining-class-preset-adoption.md` 추가

- Phase 8: 파티클 엔진 도입 4차
  - renderer quality preset에 `particleBudget` 명시값 추가
  - public runtime, TS renderer config, TS particle engine 기본 budget을 low 110 / medium 180 / high 280으로 통일
  - Pixi renderer가 `effectBudget * 0.62` 임시 계산 대신 `qualityPreset.particleBudget`을 사용하도록 변경
  - diagnostics에 `particleBudget`, `particles.pressure` 노출
  - `smoke-check.js`가 particle budget/pressure 배포 여부를 확인하도록 확장
  - `npm run check` 통과
  - 진행 기록 `docs/phase-8-4-particle-budget-diagnostics.md` 추가

- Phase 8: 파티클 엔진 도입 3차
  - 전사 cleave impact, shield charge contact, spin blade tip, 기본 평타/광역베기 칼끝 spark를 particle preset 경로로 연결
  - 궁수 arrow rain 착탄 spark를 `hitSpark` preset 경로로 연결
  - 마법사 frost snap, meteor travel/impact, chain lightning/star burst 타격점을 `frostBurst`, `fireBurst`, `hitSpark` preset 경로로 연결
  - 기존 `drawGfxSparkSpray` fallback은 유지해 로드 순서나 구형 경로 방어
  - `npm run check` 통과
  - 진행 기록 `docs/phase-8-3-primary-class-particle-hooks.md` 추가

- Phase 8: 파티클 엔진 도입 1차
  - `public/pixi-particles.js`에 `ParticleEngine`, `PARTICLE_PRESETS`, 프레임 예산 기반 particle stats 추가
  - `src/render/particles/*`에 TypeScript 기준 모듈 추가
  - Pixi renderer가 `RoguePixiParticles`를 로드하고 `diagnostics.particles`를 갱신하도록 연결
  - 공통 `impact`, `explosion`, `death` fallback 효과를 particle preset 경로로 일부 전환
  - `public/index.html`, `package.json`, `smoke-check.js`에 particle bridge 로드/검사 경계 추가
  - `npm run check` 통과
  - 진행 기록 `docs/phase-8-1-particle-engine-foundation.md` 추가

- Phase 8: 파티클 엔진 도입 2차
  - `drawGfxSparkSpray`가 particle budget을 reserve한 뒤 spark를 그리도록 변경
  - 기존 직업별 spark 호출 다수를 별도 수정 없이 공통 particle budget 아래로 편입
  - 연금술사 폭탄/화염/산성/영약 대표 효과에 `hitSpark`, `fireBurst`, `poisonBurst`, `healMist` preset 우선 경로 추가
  - 서버 판정, 밸런스, 의존성은 변경하지 않음
  - `npm run check` 통과
  - 진행 기록 `docs/phase-8-2-particle-preset-adoption.md` 추가

## Phase 9 세부 진행 기록

- Phase 9: 스테이지/챕터/보스 최신화 1차
  - `src/data/stages.ts`에 `ChapterStageProfile`과 `getChapterStageProfile(chapter)` 추가
  - `src/data/bosses.ts`의 챕터 보스/미니보스 profile에 역할, 패턴 태그, 페이즈명, 전조 시간, 패턴 비율 metadata 추가
  - `server.js`에 런타임용 챕터 profile helper와 `room.chapterProfile` state 추가
  - `server-boss-system.js`의 boss profile view가 신규 metadata를 직렬화하도록 확장
  - `smoke-check.js`가 combat state의 `chapterProfile`을 확인하도록 확장
  - `npm run check` 통과
  - 진행 기록 `docs/phase-9-1-stage-boss-profile-foundation.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 2차
  - `stagePressureMul`을 일반 스테이지 스폰 압박도 계산에 연결
  - `specialEnemyBudget`을 스폰 플랜의 기본몹 선호, 최소 기본몹 비율, 엘리트 확률에 연결
  - `getEnemyTelegraphTime(room, enemy, channel, fallback)`로 보스/미니보스 전조 시간을 profile 기반으로 보정
  - charge, miniboss snipe/cleave/shadow stab, void boss snipe 전조가 profile 값을 참조하도록 변경
  - 일반 돌진몹/원거리몹 기본 밸런스는 유지
  - `npm run check` 통과
  - 진행 기록 `docs/phase-9-2-chapter-profile-runtime-hooks.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 3차
  - 보스 생성 시 chapter boss `patternMix`를 enemy 상태에 저장
  - 미니보스 생성 시 mini boss `patternMix`로 덮어쓰기
  - `allowBossPatternByMix(enemy, channel)`와 `isPatternMixSpecialSlot(step, allowedCount)` 추가
  - 보스 계열 특수 패턴 채널이 `bossSharedPatternStep`을 공유하도록 변경
  - `patternMix.special + patternMix.punish` 비율에 따라 10-step 중 2~4 step만 강패턴을 허용
  - 일반 엘리트몹 특수 패턴 정책은 유지
  - `npm run check` 통과
  - 진행 기록 `docs/phase-9-3-boss-pattern-mix-gate.md` 추가

- Phase 9: 스테이지/챕터/보스 최신화 4차
  - `applyBossPhaseTransition(...)`에서 profile `phaseTitles`와 `telegraph.phase`를 phase visual state에 연결
  - enemy state에 `phaseTitle`, `phaseTransitionTime`, `phaseTransitionTimeMax`, `phaseAuraColor` 추가
  - `server-enemy-system.js` timer tick에서 `phaseTransitionTimer` 감소 처리
  - `public/pixi-enemies.js`와 `public/pixi-renderer.js`에 boss phase aura/flare 표시 추가
  - `npm run check` 통과
  - 진행 기록 `docs/phase-9-4-boss-phase-telegraph-visual-state.md` 추가
