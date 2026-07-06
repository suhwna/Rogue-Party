# Phase 10-2: Choice And Result Hierarchy

## Scope

- 유물 선택, 스킬 강화 선택, 지도 투표, 결과창의 정보 계층을 1차 정리했다.
- 실제 선택/투표/결과 로직은 유지하고, 카드 상태와 UI marker를 보강했다.

## Changes

- `public/client-choice.js`, `src/ui/ChoiceController.ts`, `public/client.js`
  - 유물/스킬 카드 하단에 `choice-action-row`를 추가했다.
  - 유물은 `유물 선택`, 스킬은 `강화 선택` 액션을 명확히 표시한다.

- `public/client-map.js`, `public/client.js`
  - 지도 투표 카드 상단을 `map-choice-top`으로 분리했다.
  - stage label과 vote count를 별도 pill로 표시한다.
  - 카드 하단에는 `이 경로 투표`, `투표 전송 중`, `투표 완료` 상태를 표시한다.

- `public/styles.css`
  - modal 배경을 pixel shell 톤으로 정리했다.
  - choice card 내부 grid를 정리해 설명과 action row가 분리되도록 했다.
  - map vote card에 top status row와 bottom action row 스타일을 추가했다.

- `smoke-check.js`
  - `.choice-action-row`, `.map-choice-top` CSS marker를 확인한다.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 10-3: settings UI와 graphics-quality control 정식화.
- Phase 10-4: resize/mobile viewport에서 modal, lobby, HUD 겹침 점검.
