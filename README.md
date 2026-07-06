# Four Player Rogue RPG

PixiJS 기반 4인 협동 2D 로그라이크 RPG 웹게임입니다.

## Requirements

- Node.js 18 이상
- npm

## Install

```bat
npm install
```

## Run

기본 포트는 `5173`입니다.

```bat
npm start
```

접속:

```txt
http://localhost:5173/
```

포트를 바꿔 실행하려면 Windows cmd에서 다음처럼 실행합니다.

```bat
set PORT=5211&&npm start
```

PowerShell에서는 다음처럼 실행합니다.

```powershell
$env:PORT=5211; npm start
```

## Same Network Access

같은 Wi-Fi 또는 LAN에 있는 다른 기기에서 접속하려면 실행 중인 PC의 IPv4 주소를 확인합니다.

```bat
ipconfig
```

예를 들어 IPv4가 `192.168.0.10`이면 다른 기기에서 다음 주소를 엽니다.

```txt
http://192.168.0.10:5173/
```

접속이 안 되면 Windows 방화벽에서 Node.js 사설 네트워크 접근을 허용해야 합니다.

## Development Build

Vite 개발 서버:

```bat
npm run dev
```

Production build:

```bat
npm run build
```

현재 `public/*.js`는 점진 이전 중인 legacy script 방식입니다. Vite build의 `type="module"` 경고는 알려진 단계적 이전 경고입니다.

## Verification

```bat
npm run check
npm run build
npm test
```

임시 포트에서 smoke를 돌릴 때:

```bat
set PORT=5211&&npm start
set SMOKE_ORIGIN=http://localhost:5211&&npm test
```

정상 smoke marker:

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

## Port Conflict

`EADDRINUSE: address already in use :::5173`가 나오면 이미 5173 포트를 쓰는 서버가 실행 중입니다.

다른 포트로 실행:

```bat
set PORT=5211&&npm start
```

5173을 쓰는 프로세스 확인:

```bat
netstat -ano -p tcp | findstr :5173
```

프로세스를 종료해야 한다면 PID를 확인한 뒤 종료합니다.

```bat
taskkill /PID <PID> /F
```

## Project Notes

- 서버 권위 판정 유지
- PixiJS visual renderer 사용
- SFX/BGM은 현재 범위에서 제외
- 시각 특수효과와 particle/effect pipeline은 유지
- 저장/설정은 localStorage 기반
- 상세 현대화 기록은 `docs/phase-status.md`와 `docs/v2-prompt-application.md` 참고
