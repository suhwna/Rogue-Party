# 34_FEATURE_PROJECTILE

## 목표
투사체 시스템을 구현한다.

## 요구사항
- Object Pool 사용
- 속도/방향/수명/피해량
- 충돌 시 비활성화
- 화면 밖으로 나가면 반환
- Sprite 또는 Graphics fallback 지원

## 체크리스트
- 중복 충돌 방지
- Pool 반환 누락 방지
- 매 프레임 new 금지
