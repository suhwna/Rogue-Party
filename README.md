# Rogue Party

PixiJS 기반 최대 4인 협동 2D 로그라이크 액션 RPG입니다. 기본 런은 9분 생존전이며, 몰려오는 적과 미니보스를 정리하면서 3분마다 등장하는 체크포인트 보스를 돌파합니다.

## 현재 게임 루프

- 최대 4인 협동, 봇 파티원과 관전자 모드 지원
- 전사, 궁수, 마법사, 기계공 4개 시작 직업
- 레벨 15까지 성장하며 `Q/E/R/F` 스킬 강화 선택
- 3분, 6분, 9분에 챕터 보스 등장
- 보스가 살아 있는 동안 생존 타이머와 일반 적 스폰 정지
- 9분 보스 처치 시 남은 적이 정리되고 일반 적 스폰 종료
- 이후 최종 적 `운명의 집행자`만 출현
- 운명의 집행자 처치 시 히든 클리어 및 심연 진입 선택

### 생존 미니보스

| 생존 시간 | 출현 수 |
| --- | ---: |
| 1분, 2분 | 각 1마리 |
| 4분, 5분 | 각 2마리 |
| 7분, 8분 | 각 3마리 |
| 3분, 6분, 9분 | 체크포인트 보스만 출현 |

생존 미니보스는 각각 렐릭 상자를 100% 드롭합니다. 체크포인트 보스가 등장하면 일반 적, 적 투사체, 장판은 정리되지만 살아 있는 미니보스는 유지됩니다.

## 조작

| 동작 | 기본 입력 |
| --- | --- |
| 이동 | `WASD` 또는 방향키 |
| 조준 | 마우스 |
| 기본 공격 | 마우스 왼쪽 버튼 |
| 스킬 | `Q`, `E`, `R`, `F` |
| 대시 | `Space` |

키 설정은 게임 내 옵션에서 변경할 수 있습니다.

## 장기 성장

- 직업별 숙련 노드와 최대 25단계 승천. 승천은 방장이 선택하며 `N`단계 승리 시 참가자 모두 `N+1`단계를 해금
- 장비, 룬, 강화, 옵션 재설정, 2/4세트 효과
- 보스 재료 제작과 장비·룬·몬스터·보스·유물 상세 도감
- 현재값과 단계별 진행 막대를 제공하는 업적
- 모든 원정에서 개인 전투 기록으로 자동 누적되는 일일·주간 임무와 시즌 보상

진행도는 서버 권위 계정에 저장됩니다. 기본 저장 위치는 `.data/accounts.json`이며 `ROGUE_DATA_DIR`로 데이터 디렉터리를 변경할 수 있습니다. 브라우저 `localStorage`에는 계정 세션 정보, 설정, 호환용 로컬 진행 데이터가 저장됩니다.

계정 생성 시 표시되는 복구 키는 다른 브라우저에서 계정을 복구할 때 필요합니다.

## 요구 사항

- Node.js 18 이상
- npm

## 설치 및 실행

```bat
npm install
npm start
```

기본 접속 주소:

```txt
http://localhost:5173/
```

다른 포트에서 실행하려면:

```bat
set PORT=5211&&npm start
```

PowerShell:

```powershell
$env:PORT=5211; npm start
```

## 개발 서버

Vite 개발 서버는 기본적으로 `5174` 포트를 사용하고 `5173`의 게임 서버로 API와 WebSocket을 프록시합니다. 두 터미널을 사용합니다.

```bat
rem terminal 1
npm start

rem terminal 2
npm run dev
```

백엔드 포트를 바꿨다면 Vite 대상도 함께 지정합니다.

```bat
set VITE_BACKEND_TARGET=http://localhost:5211&&npm run dev
```

Production build:

```bat
npm run build
```

## 검증

```bat
npm run check
npm run smoke
npm test
npm run release:check
```

- `check`: Node.js 문법 검사와 TypeScript `tsc --noEmit`
- `smoke`: HTTP, WebSocket, 계정/저장, UI, 생존 시작, 보스 패턴, 봇/관전자 계약 검사
- `test`: `check`와 `smoke` 연속 실행
- `release:check`: Production build 후 전체 테스트

다른 포트의 실행 서버를 검사하려면:

```bat
set SMOKE_ORIGIN=http://localhost:5211&&npm run smoke
```

주요 정상 마커:

```txt
collision contract ok
boss pattern contract ok
survival contract ok
long-term progression contract ok
http ok
save contract ok
ui contract ok
ws ok
weekly progression state ok
survival start ok
bot ok
spectator ok
```

## 같은 네트워크에서 접속

실행 PC의 IPv4 주소를 확인합니다.

```bat
ipconfig
```

IPv4가 `192.168.0.10`이라면 다른 기기에서 다음 주소로 접속합니다.

```txt
http://192.168.0.10:5173/
```

접속되지 않으면 Windows 방화벽에서 Node.js의 사설 네트워크 접근을 허용해야 합니다.

## 프로젝트 구조

```txt
server.js                     게임 서버 및 전투 오케스트레이션
server-*-system.js            보스, 적, 충돌, 투사체, 방, 보상 시스템
server-account-store.js       서버 계정 저장 및 복구
server-progression-service.js 장기 성장 검증 및 반영
public/client*.js             브라우저 UI, 입력, 저장, 계정, 진행도
public/pixi-*.js              PixiJS 렌더러와 이펙트 파이프라인
src/                          TypeScript 데이터·렌더링·서버 경계
smoke-check.js                HTTP/WebSocket 런타임 계약 검사
docs/                         현대화 단계 기록과 회귀 체크리스트
```

런타임 소스는 현재 `public/*.js`와 서버 JavaScript이며, `src/`의 TypeScript 경계는 타입 검사와 구현 동기화에 사용됩니다.

## 포트 충돌

`EADDRINUSE: address already in use`가 나오면 해당 포트를 사용 중인 프로세스를 확인합니다.

```bat
netstat -ano -p tcp | findstr :5173
```

필요한 경우 확인한 PID를 종료합니다.

```bat
taskkill /PID <PID> /F
```

## 현재 범위

- 서버 권위 전투·진행 판정
- PixiJS 기반 액터, 투사체, 위험 구역, 스킬 이펙트 렌더링
- 키 설정과 그래픽 품질 설정
- SFX/BGM은 현재 포함하지 않음
- 세부 회귀 항목은 `docs/regression-checklist.md` 참고
