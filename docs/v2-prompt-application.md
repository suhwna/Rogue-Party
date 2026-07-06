# Prompt Pack v2 적용 노트

## 읽은 기준

- 원본 프롬프트팩은 `docs/prompt-pack-v2/`에 보관한다.
- `00_MASTER`: PixiJS v8, TypeScript, Vite, ES Modules, GSAP, WebGPU 우선/WebGL fallback, object pool, listener cleanup, 60 FPS.
- `ROLE`: Architecture, Gameplay, Graphics, UIUX, AI, Performance, Review, Test, Network, Audio, Save, Shader, Particle, Level Design, Balance, Security, Build, Debug, Refactor, Document, Release.
- `FEATURE`: Player, Enemy, Skill, Projectile, Inventory, Stage, Camera, Collision, Particle Engine, Loading, Scene, Input, Effects, HUD, Settings, Save/Load, Minimap, Boss, Dialogue, Quest.

## 적용 상태표

| 상태 | 항목 | 근거 |
| --- | --- | --- |
| 적용됨 | WebSocket heartbeat | client `ping`, server `pong`, latency diagnostics |
| 적용됨 | Reconnect | 제한 횟수와 backoff가 있는 client reconnect |
| 적용됨 | Security 기초 | server packet size limit, message shape validation, safe id sanitizer, input sequence clamp |
| 적용됨 | Save/Settings 기초 | versioned localStorage settings, broken data fallback, graphics quality, volume, mute, language, keyMap base |
| 적용됨 | Performance 기초 | Pixi quality presets, effect budget, DPR cap, pool retain sizes |
| 적용됨 | Debug/Test 기초 | client/renderer diagnostics, smoke test renderer/runtime/ping-pong checks |
| 적용됨 | Cleanup 기초 | heartbeat/reconnect timers included in runtime cleanup |
| 적용됨 | Phase 0 기준 문서 | `docs/full-modernization-plan.md`, `docs/current-feature-baseline.md`, `docs/regression-checklist.md` |
| 적용됨 | Phase 1 빌드 기반 | Vite + TypeScript skeleton, legacy public runtime 유지 |
| 적용됨 | Phase 2 클라이언트 책임 분리 | runtime/input/network/HUD/choice/lobby/map/result bridge, TS module contracts |
| 적용됨 | Phase 3 Pixi 렌더러 책임 분리 | runtime bridge split, texture factory, pools, camera, scene/world/projectile/hazard/pickup/actor/effect TS composition, target renderer boundaries |
| 적용됨 | Phase 4 데이터 분리 | classes, rarity, balance, rewards, difficulty, bosses, stages, enemies, waveTraits, risks, skills, skillUpgrades, relics TS data modules added; server runtime rarity/reward weighting/effect/drop/preview registry wired |
| 적용됨 | Phase 5 서버 시스템 분리 | NetworkServer handshake/frame helpers, RoomManager create/list/gameover/stage clear object cleanup helpers, PlayerSystem activity/view helpers, StateSerializer room identity/population/stage summary/timers/capabilities/projectile/enemy/world object view/player identity/loadout/action/position/skill slots/movement/input/vitals/progression/run result player/summary view, RewardSystem relic choice summary/timeout helpers, BotSystem, StageSystem map/vote/node view/choice refresh/progression/start node/clear count helpers, EnemySystem targeting/crowd/status helpers, HazardSystem live/owned helpers, BossSystem profile/view helpers, ProjectileSystem, CollisionSystem helpers/predicates/fallback separation/move clamp, SkillSystem slot/cooldown/trigger guard helpers and TypeScript boundaries applied; closeout documented |
| 적용됨 | Phase 6 AI 및 몬스터 시스템 개선 | enemy `aiState`/`windupChannel` 관측 경계, 공통 timer tick, windup advance, interrupt policy, charger FSM boundary, stalker/brute/duelist melee windup boundary, bomber explode windup boundary, elite windup boundary, boss snipe windup boundary, mini shadow windup boundary, mortar windup boundary, support/ranged cast profile helper, special pattern policy helper, boss phase transition helper 추가 완료; 마감 문서 `docs/phase-6-ai-monster-summary.md` 작성 |
| 적용됨 | Phase 7 스킬 및 이펙트 품질 재작업 | 전사/궁수/마법사/기계공/인형사/무투가/연금술사/암살자 주요 스킬 이펙트 1차 품질 기준 적용; 전조/발동/타격/잔상/피격 반응 기준으로 직업별 Pixi 렌더링 패스 완료 |
| 적용됨 | Phase 8 파티클 엔진 도입 | `public/pixi-particles.js`와 `src/render/particles/*` 추가; Pixi renderer particle budget/stats 연결; quality별 particle budget/diagnostics/preset adoption 완료; 마감 문서 `docs/phase-8-particle-engine-summary.md` 작성 |
| 적용됨 | Phase 7/8 스킬 이펙트 고도화 | `renderSkillEffectPolishLayer()` 공통 품질 레이어와 `bladeGlint`, `metalSpark`, `arcaneDust`, `lightningFork`, `shockRing` preset 추가; 직업별 crisp renderer는 유지 |
| 적용됨 | Phase 7/8 스킬 이펙트 스프라이트시트 전환 | `public/assets/effects/*.svg` 14종, `assetEffectFx()`, `renderAssetStyledSkillEffect()` 추가; 스킬 이펙트는 외부 spritesheet asset-first 경로 사용 |
| 적용됨 | Phase 9 스테이지/챕터/보스 최신화 | 챕터별 stage profile, 보스/미니보스 role/pattern/phase/telegraph metadata, room `chapterProfile` state 추가; `stagePressureMul`, `specialEnemyBudget`, `bossTelegraphBias` 런타임 연결, `patternMix` 공유 게이트, phase visual state, `visualTone` 기반 챕터/스테이지 월드 피드백, `signaturePatterns` 기반 보스/미니보스 패턴 선택 hook 적용 및 마감 문서 작성 완료 |
| 적용됨 | Phase 10 UI/UX 최신화 1차 | 타이틀/메인/방 입장 화면 pixel RPG shell, 대기방 loadout console, room copy 정리, Phase 10 UI shell smoke marker 추가 |
| 적용됨 | Phase 10 UI/UX 최신화 2차 | 유물/스킬 선택 card action row, 지도 투표 top/status row, modal/card hierarchy 정리, Phase 10 choice marker 추가 |
| 적용됨 | Phase 10 UI/UX 최신화 3차 | `OPT` settings overlay, graphics quality control, language 저장값, key capture/remap UI 추가; 음향 설정 필드 제거 |
| 적용됨 | Phase 10 UI/UX 최신화 4차/마감 | desktop/mobile viewport overlap pass, settings overlay scroll 보정, browser console error 0개 확인, 마감 문서 작성 |
| 적용됨 | Phase 11 에셋 및 특수효과 파이프라인 1차 | visual-only asset manifest, sprites/icons/effects README, `docs/assets-guide.md`, asset manifest smoke check 추가 |
| 적용됨 | Phase 11 에셋 및 특수효과 파이프라인 2차 | `pixi-assets.js` visual asset manifest loader/helper, `VisualAssetManifest.ts` 타입 경계 추가 |
| 적용됨 | Phase 11 에셋 및 특수효과 파이프라인 3차 | texture asset descriptor 계약, external texture 우선 생성, generated fallback, `assetTextures` diagnostics 추가 |
| 적용됨 | Phase 11 에셋 및 특수효과 파이프라인 4차 | texture fallback policy, texture key guide, sample manifest, graphics quality priority 규칙 추가 |
| 적용됨 | Phase 11 에셋 및 특수효과 파이프라인 마감 | visual-only asset pipeline closeout, audio 제외 유지, Phase 12 이동 기준 정리 |
| 적용됨 | Phase 12 저장/설정 시스템 확장 1차 | settings v2 migration, progress save schema, `RogueSaveManager`, `window.__rogueProgress` 추가 |
| 적용됨 | Phase 12 저장/설정 시스템 확장 2차 | 결과창 표시 시 run result를 progress statistics에 1회 기록, 중복 기록 방지 키와 diagnostics 추가 |
| 적용됨 | Phase 12 저장/설정 시스템 확장 3차/마감 | progress export/import, invalid snapshot 복구, debug bridge 확장 |
| 적용됨 | Phase 13 테스트 자동화 확장 1차 | index.html linked asset fetch, JS/CSS HTML fallback 방지, /rooms shape 검증 |
| 적용됨 | Phase 13 테스트 자동화 확장 2차 | WebSocket join 후 /rooms 노출 및 public field 검증 |
| 적용됨 | Phase 13 테스트 자동화 확장 3차 | client-save.js VM runtime contract, fake localStorage 저장/복구/import/export 검증 |
| 적용됨 | Phase 13 테스트 자동화 확장 4차 | choice/result/map UI controller VM runtime contract, escape/data attribute 검증 |
| 적용됨 | Phase 13 테스트 자동화 확장 마감 | smoke marker 확장, browser pixel/memory/long-run E2E는 별도 harness로 보류 |
| 적용됨 | Phase 14 릴리즈 준비 마감 | README, release runbook, release:check script, 실행/포트/내부 IP/검증 문서화 |
| 보류 | GSAP 기반 transition | 핵심 게임 안정화 이후 적용 |
| 보류 | 시각 특수효과 asset pipeline | 음향 에셋은 제외하고 시각적 특수효과 에셋 파이프라인만 유지 |
| 보류 | minimap/dialogue/quest | 현재 핵심 로그라이크 루프와 직접 연결되지 않아 후순위 |

## 다음 작업 순서

1. 전체 로드맵 1차 실행은 Phase 14까지 완료됨.

# Phase 14 완료

- 루트 `README.md`를 추가했다.
- `docs/release-runbook.md`를 추가했다.
- `package.json`에 `release:check`를 추가했다.
- 실행, 내부 IP 접속, 포트 충돌, smoke marker, release checklist를 문서화했다.
- 마감 문서: `docs/phase-14-release-prep-summary.md`.

# Phase 13 완료

- fast smoke coverage를 확장하고 Phase 13을 마감한다.
- 정상 smoke marker: `http ok`, `save contract ok`, `ui contract ok`, `ws ok`, `room list ok`, `map vote ok`, `bot ok`, `spectator ok`.
- browser pixel/memory/long-run E2E는 별도 browser harness 도입 시 진행한다.
- 마감 문서: `docs/phase-13-test-automation-summary.md`.

# Phase 13-4 추가 적용

- `smoke-check.js`에 `loadWindowBridge(path, globalName)` helper를 추가했다.
- `client-choice.js`, `client-result.js`, `client-map.js`를 Node VM sandbox에서 실제 실행한다.
- 선택/결과/지도 렌더링의 필수 data attribute, 주요 markup, HTML escape를 검증한다.
- 진행 기록 문서: `docs/phase-13-4-ui-controller-runtime-contract.md`.

# Phase 13-3 추가 적용

- `smoke-check.js`가 `public/client-save.js`를 Node VM sandbox에서 실제 실행한다.
- fake `localStorage`로 save/load, broken JSON recovery, run result recording, progress import/export를 검증한다.
- 진행 기록 문서: `docs/phase-13-3-client-save-runtime-contract.md`.

# Phase 13-2 추가 적용

- `smoke-check.js`에 `checkRoomListVisibility()`를 추가했다.
- WebSocket으로 고유 방에 입장한 뒤 HTTP `/rooms`에 방이 노출되는지 확인한다.
- `/rooms` 공개 필드 `code`, `status`, `playerCount`, `maxPlayers`, `hostName`을 joined room 기준으로 검증한다.
- 진행 기록 문서: `docs/phase-13-2-room-list-smoke-scenario.md`.

# Phase 13-1 추가 적용

- `smoke-check.js`에 `checkLinkedAssetResponses(html)`를 추가했다.
- `index.html`이 참조하는 내부 JS/CSS 파일을 모두 fetch해 404와 HTML fallback을 잡는다.
- `/rooms` 응답에 방이 있을 경우 public field shape를 검증한다.
- 진행 기록 문서: `docs/phase-13-1-http-static-smoke-contract.md`.

# Phase 12-3 추가 적용

- `public/client-save.js`가 `exportUserProgress(progress)`, `importUserProgress(snapshot)`을 제공한다.
- `src/settings/SaveManager.ts`가 같은 import/export 계약을 제공한다.
- `window.__rogueProgress.export()`와 `window.__rogueProgress.import(snapshot)`으로 debug backup/restore가 가능하다.
- invalid snapshot import는 `defaultProgress`로 복구한다.
- Phase 12 저장/설정 시스템 확장 범위를 마감한다.
- 진행 기록 문서: `docs/phase-12-3-progress-import-export.md`.

# Phase 12-2 추가 적용

- `public/client.js`가 결과창 표시 시 `recordDisplayedResult(result, nextState)`를 통해 로컬 progress statistics를 기록한다.
- `lastRecordedResultKey`와 `getResultSaveKey(result, nextState)`로 같은 gameover state 반복 수신 중 중복 저장을 막는다.
- `clientDiagnostics.progressRuns`와 `progressSaveFailed`로 진행 기록 저장 상태를 확인할 수 있다.
- `smoke-check.js`가 결과 저장 연결 marker를 확인한다.
- 진행 기록 문서: `docs/phase-12-2-run-result-progress-recording.md`.

# Phase 11-1 추가 적용

- `public/assets/asset-manifest.json`을 추가하고 visual-only/audio false contract를 명시했다.
- `public/assets/sprites`, `public/assets/icons`, `public/assets/effects` 디렉터리 README를 추가했다.
- `docs/assets-guide.md`에 sprite/icon/effect 프롬프트와 intake checklist를 작성했다.
- smoke-check가 `/assets/asset-manifest.json` 배포와 contract를 확인한다.

# Phase 11 완료

- visual-only asset pipeline 범위를 마감했다.
- audio/SFX/BGM asset work는 제외 상태를 유지한다.
- 실제 외부 bitmap 교체는 manifest `generatedAssets` 데이터 추가로 진행할 수 있게 됐다.
- 마감 기록은 `docs/phase-11-visual-asset-pipeline-summary.md`에 남겼다.

# Phase 11-3 추가 적용

- manifest entry에 `textureKey`, `aliases`, `path` 기반 descriptor 조회 계약을 추가했다.
- TextureFactory가 external asset texture를 먼저 시도하고 없으면 generated canvas texture로 fallback한다.
- Pixi renderer의 단일 `texture()` 진입점에 descriptor lookup을 연결했다.
- diagnostics에 `assetTextures.external/fallback`을 추가했다.
- 진행 기록은 `docs/phase-11-3-texture-asset-descriptor-contract.md`에 남겼다.

# Phase 11-4 추가 적용

- `asset-manifest.json`에 `texturePolicy`와 `textureKeyGuide`를 추가했다.
- `asset-manifest.sample.json`에 actor/enemy/boss/effect/icon 교체 예시를 추가했다.
- `docs/assets-guide.md`에 texture replacement priority, key naming, manifest entry shape, graphics quality priority, regression checklist를 추가했다.
- smoke-check가 manifest policy와 sample manifest를 확인한다.
- 진행 기록은 `docs/phase-11-4-texture-fallback-policy.md`에 남겼다.

# Phase 11-2 추가 적용

- `public/pixi-assets.js`에 visual asset manifest loader/helper를 추가했다.
- `src/render/VisualAssetManifest.ts`에 manifest 타입과 path helper를 추가했다.
- `public/index.html`이 `pixi-assets.js`를 Pixi runtime보다 먼저 로드한다.
- 진행 기록은 `docs/phase-11-2-visual-asset-manifest-helper.md`에 남겼다.

# Phase 10 완료

- UI/UX 최신화 범위를 마감했다.
- desktop `1280x720`, mobile `390x844`에서 main/lobby/settings overlap pass를 수행했다.
- 모바일 settings overlay scroll 보정을 적용했고 브라우저 콘솔 에러 0개를 확인했다.
- 마감 기록은 `docs/phase-10-uiux-summary.md`에 남겼다.

# Phase 10-4 추가 적용

- `docs/phase-10-4-viewport-overlap-pass.md`를 추가했다.
- `.settings-overlay`를 상단 정렬/스크롤 가능하게 보정했다.
- `npm run check`, `npm run build`, 임시 포트 `npm test`를 통과했다.

# Phase 10-3 추가 적용

- `OPT` 설정 버튼과 `settingsOverlay`를 추가했다.
- graphics quality 즉시 반영, language 저장, key capture/remap UI를 구현했다.
- `bgmVolume`, `sfxVolume`, `muted` 설정 필드를 제거하고 음향 범위를 제외했다.
- 진행 기록은 `docs/phase-10-3-settings-ui.md`에 남겼다.

# Phase 10-2 추가 적용

- `choice-action-row`로 유물/스킬 선택 카드의 클릭 의도를 명확히 했다.
- `map-choice-top`으로 지도 투표 카드의 stage label과 vote count를 분리했다.
- modal/card CSS hierarchy와 smoke marker를 보강했다.
- 진행 기록은 `docs/phase-10-2-choice-result-hierarchy.md`에 남겼다.

# Phase 10-1 추가 적용

- `public/index.html`에 title badge, gate symbol, main menu 설명, loadout test lobby copy를 추가했다.
- `public/styles.css`에 pixel shell, scanline, compact lobby console, room card treatment를 적용했다.
- `smoke-check.js`가 Phase 10 UI shell marker와 style marker를 확인한다.
- 진행 기록은 `docs/phase-10-1-ui-shell-refresh.md`에 남겼다.

# Phase 9 완료

- Stage/chapter/boss modernization 범위를 마감했다.
- smoke-check가 `room.chapterProfile.visualTone`과 stage map boss `signaturePatterns`를 확인한다.
- 마감 기록은 `docs/phase-9-stage-boss-summary.md`에 남겼다.

# Phase 9-6 추가 적용

- 보스/미니보스 profile에 `signaturePatterns`를 추가했다.
- BossSystem에 `getSignaturePatterns()`와 `nextBossPattern()`을 추가했다.
- 주요 보스/미니보스 특수 패턴 선택을 고정 modulo 분기에서 profile 기반 패턴 키 소비로 전환했다.
- enemy state에 `currentBossPattern`을 추가했다.
- 상세 기록은 `docs/phase-9-6-boss-signature-pattern-hooks.md`에 남겼다.

# Phase 9-5 추가 적용

- 챕터 stage profile에 `visualTone`을 추가하고 `room.chapterProfile.visualTone`으로 직렬화했다.
- Pixi world renderer가 챕터 색감과 stage kind를 함께 사용해 방 분위기를 다르게 그린다.
- 막기/지키기/보상/엘리트/미니보스/보스 방의 바닥 연출과 objective 피드백을 강화했다.
- 좌표가 없는 reward/miniboss objective가 잘못 렌더링되지 않도록 방어했다.
- 상세 기록은 `docs/phase-9-5-stage-ambience-feedback.md`에 남겼다.

# Phase 9-4 추가 적용

- 보스 phase transition 시 profile `phaseTitles`와 `telegraph.phase`를 사용한다.
- enemy state에 `phaseTitle`, `phaseTransitionTime`, `phaseTransitionTimeMax`, `phaseAuraColor`를 추가했다.
- Pixi enemy bridge와 fallback renderer에 phase aura/flare 표시를 추가했다.
- 상세 기록은 `docs/phase-9-4-boss-phase-telegraph-visual-state.md`에 남겼다.

# Phase 9-3 추가 적용

- 보스/미니보스 생성 시 `patternMix`를 enemy 상태에 저장했다.
- 보스 계열 특수 패턴은 채널별 cycle 대신 `bossSharedPatternStep` 공유 gate를 사용한다.
- `patternMix.special + patternMix.punish` 비율에 따라 강패턴 허용 step 수가 조절된다.
- 상세 기록은 `docs/phase-9-3-boss-pattern-mix-gate.md`에 남겼다.

# Phase 9-2 추가 적용

- `stagePressureMul`을 스폰 압박도 계산에 연결했다.
- `specialEnemyBudget`을 기본몹/특수몹 비율과 엘리트 확률에 연결했다.
- `bossTelegraphBias`와 보스/미니보스 profile의 `telegraph`를 주요 보스 전조 시간에 연결했다.
- 상세 기록은 `docs/phase-9-2-chapter-profile-runtime-hooks.md`에 남겼다.

# Phase 9-1 추가 적용

- `src/data/stages.ts`에 챕터별 stage profile을 추가했다.
- `src/data/bosses.ts`와 `server.js`의 보스/미니보스 profile에 role, patternTags, phaseTitles, telegraph, patternMix metadata를 추가했다.
- room state에 `chapterProfile`을 추가하고 smoke-check가 이를 확인하도록 확장했다.
- 상세 기록은 `docs/phase-9-1-stage-boss-profile-foundation.md`에 남겼다.
# Phase 8 완료

- Particle engine, preset bridge, quality별 particle budget, diagnostics, 주요 직업/공용 preset adoption을 마감했다.
- Phase 9 보스/스테이지 최신화에서 보스 전조, 페이즈 전환, 챕터 분위기 이펙트에 재사용한다.
- 마감 문서는 `docs/phase-8-particle-engine-summary.md`다.

# Phase 8-5 추가 적용

- 공용 warning/impact, 기계공, 인형사, 암살자, 연금술사 throw trail의 남은 주요 spark 경로를 particle preset으로 연결했다.
- `smoke-check.js`가 전체 particle preset 이름 배포를 확인하도록 확장했다.
- 상세 기록은 `docs/phase-8-5-remaining-class-preset-adoption.md`에 남겼다.

# Phase 8-4 추가 적용

- Renderer quality preset에 `particleBudget`을 명시하고 low/medium/high 예산을 110/180/280으로 통일했다.
- Diagnostics에 `particleBudget`과 `particles.pressure`를 노출해 이펙트 포화 여부를 추적할 수 있게 했다.
- 상세 기록은 `docs/phase-8-4-particle-budget-diagnostics.md`에 남겼다.

# Phase 8-3 추가 적용

- 전사 cleave/shield/spin/basic slash, 궁수 arrow rain, 마법사 frost/meteor/lightning/star burst 주요 타격 지점을 particle preset 경로로 연결했다.
- 상세 기록은 `docs/phase-8-3-primary-class-particle-hooks.md`에 남겼다.
- 다음 작업은 Phase 8-4 particle budget 진단과 품질 프리셋별 제한값 세분화다.
