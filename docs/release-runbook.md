# Release Runbook

## Goal

다른 환경에서도 게임을 설치, 검증, 실행할 수 있도록 릴리즈 전 확인 절차를 정리한다.

## Environment

- Node.js 18 이상
- npm
- 기본 포트: `5173`
- 포트 변경: `PORT` 환경변수

## Fresh Setup

```bat
npm install
npm run check
npm run build
npm test
```

## Local Run

```bat
npm start
```

접속:

```txt
http://localhost:5173/
```

## Temporary Port Smoke

기존 5173 서버를 유지한 채 검증하려면 임시 포트를 사용한다.

```bat
set PORT=5211&&npm start
```

다른 터미널에서:

```bat
set SMOKE_ORIGIN=http://localhost:5211&&npm test
```

정상 marker:

```txt
http ok
save contract ok
ui contract ok
ws ok
room list ok
map vote ok
bot ok
spectator ok
```

## Internal IP Access

1. 서버 PC에서 IPv4 확인:

```bat
ipconfig
```

2. 같은 네트워크의 다른 기기에서 접속:

```txt
http://<IPv4>:5173/
```

3. 접속 실패 시 확인:

- Windows 방화벽에서 Node.js 허용
- PC와 접속 기기가 같은 네트워크에 있는지 확인
- 포트가 바뀌었다면 URL 포트도 함께 변경

## Port Conflict

증상:

```txt
Error: listen EADDRINUSE: address already in use :::5173
```

해결 1: 다른 포트 사용

```bat
set PORT=5211&&npm start
```

해결 2: 점유 프로세스 확인

```bat
netstat -ano -p tcp | findstr :5173
```

필요 시 종료:

```bat
taskkill /PID <PID> /F
```

## Static Asset Checks

`npm test`는 다음 정적 파일 회귀를 확인한다.

- `index.html`이 참조하는 내부 JS/CSS 200 응답
- JS/CSS HTML fallback 방지
- `/vendor/pixi.js`
- `/client.js`
- `/pixi-renderer.js`
- Pixi split runtime files
- visual asset manifest
- `client-save.js`
- UI controller bridge files

## Runtime Checks

`npm test`는 다음 런타임 계약을 확인한다.

- WebSocket join
- lobby action test
- class change
- ready/start
- map vote
- room list visibility
- bot run
- spectator bot-only run
- client save load/export/import/recovery
- choice/result/map UI controller rendering

## Build Notes

현재 `public/*.js`는 legacy script로 유지하면서 TypeScript 모듈을 점진 도입 중이다.

따라서 Vite build 중 다음 유형의 경고는 현재 단계에서 허용된다.

```txt
<script src="/client.js"> in "/index.html" can't be bundled without type="module" attribute
```

이 경고는 Phase 2 이후의 점진 ESM 이전 전략 때문에 발생하며, build 실패가 아니다.

## Release Checklist

```txt
npm install
npm run check
npm run build
npm test
npm start
```

수동 확인:

- 브라우저 콘솔 에러 없음
- 메인 화면 진입
- 방 생성
- 방 목록 표시
- 대기방 직업 변경
- 봇 추가
- READY 후 시작
- 지도 투표
- 전투 진입
- 스킬 이펙트 표시
- 결과/로비 복귀

## Current Deferred Checks

- Playwright 기반 canvas non-blank 자동 검증
- 장시간 memory growth 자동 측정
- 실제 브라우저 2인/4인 멀티 입력 E2E
- 모바일 실기기 레이아웃 자동 스냅샷
