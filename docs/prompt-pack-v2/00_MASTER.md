# 00_MASTER

## 프로젝트 전제
2D 웹게임을 PixiJS v8, TypeScript, Vite, GSAP 기반으로 개발한다.

## 공통 기술 스택
- PixiJS v8
- TypeScript
- Vite
- ES Modules
- GSAP
- WebGPU 우선, WebGL Fallback
- 브라우저 실행 환경

## 공통 개발 원칙
- SOLID
- DRY
- KISS
- Composition 우선
- 명확한 책임 분리
- Object Pool 적극 사용
- 불필요한 객체 생성 최소화
- Texture, Sprite, Container 재사용
- 이벤트 리스너 정리
- 메모리 누수 방지

## 성능 목표
- 기본 목표 60FPS
- 프레임 드롭 최소화
- GC 발생 최소화
- Draw Call 최소화
- 모바일/저사양 환경 고려
- Resize 대응
- 고해상도 디스플레이 대응

## 코드 출력 규칙
- 실행 가능한 코드 우선
- 필요한 파일 경로 명시
- 수정 범위가 작으면 변경된 부분만 출력
- 수정 범위가 크면 파일 전체 출력
- 주석은 코드 흐름 설명 위주로 작성
- 과장된 설명보다 실제 동작 가능한 구현 우선

## 금지
- 임의 라이브러리 추가 금지
- 브라우저 콘솔 에러 방치 금지
- any 남발 금지
- 매 프레임 new/delete 반복 금지
