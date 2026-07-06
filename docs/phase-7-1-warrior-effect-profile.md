# Phase 7-1: Warrior Effect Quality Pass

## Summary

- Phase 7 스킬 및 이펙트 품질 재작업의 첫 번째 단위다.
- 전사 계열 이펙트에서 도형 중심 표현을 줄이고, 검/방패 실루엣과 실제 타격 지점이 더 잘 보이도록 정리했다.
- 서버 판정과 스킬 데이터는 변경하지 않고 Pixi 렌더링 표현만 조정했다.

## 변경 파일

- `public/pixi-skill-effects.js`
  - `renderWarriorSpinEffect`
    - 전체 원형 stroke 위주의 표현을 제거하고, 짧은 분절 파동 + 회전하는 한 자루의 대검 중심 표현으로 변경
    - 지나간 칼날은 낮은 alpha의 ghost sword로 표현
    - 타격 위치는 칼끝 spark/impact 중심으로 표시
  - `renderWarriorShieldChargeEffect`
    - 방패돌진 머리 부분에 `drawGfxShieldWall`을 추가해 방패가 실제로 밀고 들어가는 느낌을 강화
  - `renderWarriorSlamEffect`
    - 단순 방사형 선 표현을 줄이고, 방패 벽 + 충돌 파편 중심으로 변경

- `public/pixi-renderer.js`
  - `drawGfxGreatsword`
    - 검 끝/손잡이 부근의 불필요한 장식 선을 제거
  - `renderWarriorConeEffect`
    - 평타의 두꺼운 흰색 arc 비중을 낮추고, 칼 실루엣과 얇은 궤적 중심으로 조정
  - `renderWarriorWideCleaveEffect`
    - 광역 베기의 장식 도형을 줄이고, 대검 잔상과 명확한 칼날 궤적 중심으로 조정

## 품질 기준

- 스킬 범위는 도형 UI가 아니라 무기 궤적으로 읽혀야 한다.
- 평타, 강철 회오리, 광역 베기는 서로 다른 크기와 리듬을 가져야 한다.
- 방패 계열은 빛나는 선보다 방패 실루엣과 충돌 지점이 먼저 보여야 한다.
- 이펙트 추가는 기존 pool/primitive 경로를 재사용하고 새 의존성을 추가하지 않는다.

## 검증

- `npm run check` 통과

## 다음 단계

- Phase 7-2에서 궁수 스킬 이펙트를 같은 기준으로 정리한다.
- 특히 화살비, 관통/연발 계열의 발사 방향, 낙하감, 타격 위치를 더 명확하게 만든다.
