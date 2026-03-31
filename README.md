# Relay


## 1. 소개

Claude Code를 GUI로 쓸 수 있는 Electron 데스크톱 앱입니다.
사용자가 로컬 프로젝트를 열고 AI와 대화하며 코드 탐색, 파일 편집, 터미널 명령 실행 등을 수행할 수 있는 통합 개발 환경을 제공합니다.

## 2. 데모

https://github.com/user-attachments/assets/29734d88-83e8-46a4-9644-3b4ed7ca1d51

## 3. 기술 스택

| 분류                | 기술                                           |
| ------------------- | ---------------------------------------------- |
| **프레임워크**      | Electron, React, TypeScript                    |
| **빌드**            | Vite, Electron Forge                           |
| **라우팅**          | TanStack React Router (파일 기반 라우팅)      |
| **상태 관리**       | TanStack React Query, electron-store           |
| **스타일링**        | Tailwind CSS, shadcn/ui                        |
| **AI**              | claude-agent-sdk                               |
| **IPC 통신**        | @orpc/client & @orpc/server                    |
| **터미널**          | xterm.js, node-pty                             |
| **코드 하이라이팅** | Shiki (100+ 언어 지원)                         |
| **다국어 지원**     | i18next, react-i18next (영어, 포르투갈어)      |
| **검증**            | Zod (쿼리 파라미터, 런타임 검증)               |
| **유틸리티**        | lucide-react (아이콘), nanoid (ID 생성)        |
| **UI 향상**         | use-stick-to-bottom (채팅 자동 스크롤)         |
| **자동 업데이트**   | update-electron-app                            |
| **CI/CD**           | GitHub Actions (Lint, Format)                  |

## 4. 주요 기능

### 4.1 AI 채팅 & 에이전트

- **Claude Agent SDK 통합**: claude-agent-sdk를 통한 AI 에이전트 실행
  - 모델: Claude Sonnet 4.5
  - 스트리밍 응답 처리: AsyncGenerator로 실시간 이벤트 렌더링 (init → text → tool_call → tool_result → result)

- **HITL(Human-in-the-Loop) 권한 검증 시스템**
  - 도구 실행 전 사용자 승인 요청
  - EventPublisher 기반 Pub-Sub 패턴으로 권한 요청/응답 관리
  - AI Tool(Read, Write, Edit, Bash) 선택적 활성화
  - AI Tool 자동 승인(Auto-approve) 토글로 사용자 선택 제공

- **세션 관리**
  - 세션별 UUID 기반 대화 저장/불러오기/삭제/컨펌
  - 이전 대화 재개 기능 (sessionId 복구)
  - 세션 파일은 ~/.claude/projects/<project-path>/ 에 JSONL 형식으로 저장
  - 세션 삭제 시 확인 다이얼로그로 실수 방지

### 4.2 도구 실행

- **AI Tool 실행**
  - Read: 파일 읽기 (항상 활성화)
  - Write/Edit: 파일 작성 및 편집 (선택적)
  - Bash: 셸 명령어 실행 (선택적)

- **비동기 권한 요청/승인**
  - PermissionBus로 도구 호출마다 사용자 확인 요청
  - 제안사항, 차단된 경로, 결정 사유 등 컨텍스트 정보 제공

- **Tool 실행 결과 렌더링**
  - Bash 출력, 파일 diff, 에러 메시지 등 UI 표현

### 4.3 코드 탐색

- **프로젝트 파일 트리**
  - 디렉토리 구조 재귀적 표현
  - .gitignore 자동 준수로 불필요한 파일/디렉토리 제외
  - 디렉토리 먼저 정렬, 이름순 정렬

- **코드 뷰어**
  - Shiki 기반 구문 강조 (100+ 언어 지원)
  - 이진 파일은 base64 인코딩으로 이미지 미리보기 지원 (jpg, png, gif, webp, svg)
  - 라인 번호 표시 및 파일명 헤더 제공

- **코드 선택 및 컨텍스트 전달**
  - 코드 블록 선택 후 AI 채팅에 자동 참조 (`@filePath#L10-20` 형식)
  - 선택된 코드 뱃지로 시각화 및 삭제 가능
  - useCodeSelections 훅으로 선택 관리

- **파일 변경 감지**
  - 파일 변경 시 실시간 UI 갱신
  - .gitignore 자동 준수로 불필요한 파일 제외

### 4.4 터미널 & 쉘

- **멀티 터미널 지원**
  - xterm.js + node-pty 기반 네이티브 터미널
  - 터미널마다 독립적인 PTY(pseudoterminal) 할당
  - 동시에 여러 터미널 실행/관리 가능

- **쉘 설정**
  - Windows: PowerShell (기본)
  - Unix/macOS: SHELL 환경변수 또는 /bin/zsh (기본)
  - 터미널 크기 조정, 텍스트 입력, 종료 제어 가능

- **외부 링크 열기**
  - shell.openExternalLink()로 URL을 기본 브라우저에서 열기

### 4.5 프로젝트 관리

- **프로젝트 열기/삭제**
  - 로컬 디렉토리 선택 (Electron 파일 다이얼로그)
  - 최근 열기 순서 자동 추적

- **프로젝트 메타데이터 저장**
  - electron-store로 OS별 설정 디렉토리에 저장
  - 데이터 형식: `{ path, name, lastOpened }`
  - macOS: ~/Library/Application Support/relay/
  - Windows: %APPDATA%/relay/
  - Linux: ~/.config/relay/

### 4.6 테마 & UI/UX

- **테마 관리**
  - Light / Dark / System 모드 선택
  - Electron nativeTheme API로 시스템 테마 자동 감지
  - 토글 기능으로 즉시 전환

- **반응형 UI**
  - 리사이즈 가능한 패널 레이아웃 (파일 트리 / 코드 뷰어 / 채팅)
  - TanStack React Router로 파일 기반 라우팅

- **상태 관리**
  - TanStack React Query로 서버 상태 캐싱
  - electron-store로 클라이언트 상태 영구 저장

### 4.7 다국어 지원

- **지원 언어**: 영어 (EN-US), 포르투갈어 (PT-BR)
- **i18next 통합**: 동적 언어 전환
- **LangToggle**: 상단 네비게이션에서 언어 선택

## 5. 프로젝트 구조

```
src/
├── main.ts                  # Electron 메인 프로세스 진입점
├── preload.ts               # Preload 스크립트 (IPC 브릿지)
├── renderer.ts              # 렌더러 진입점
├── App.tsx                  # React 루트 컴포넌트
├── store.ts                 # electron-store 설정
├── ipc/                     # @orpc 기반 IPC 모듈
│   ├── ai/                  # AI 에이전트 실행
│   ├── chat/                # 세션 관리
│   ├── terminal/            # PTY 터미널
│   ├── project/             # 프로젝트 관리
│   ├── fs/                  # 파일시스템 탐색
│   ├── shell/               # 외부 링크/쉘
│   ├── theme/               # 테마 관리
│   ├── window/              # 윈도우 제어
│   └── app/                 # 앱 정보
├── components/
│   ├── ai/                  # FileTree, CodeViewer, SessionList 등
│   ├── ai-elements/         # Conversation, Message, PromptInput 등
│   ├── projects/            # ProjectTerminal, ProjectDeleteButton
│   └── ui/                  # shadcn/ui 기본 컴포넌트
├── routes/                  # TanStack Router (파일 기반 라우팅)
├── hooks/                   # useChat, useFileExplorer, useCodeSelections 등
├── actions/                 # IPC 액션 (app, language, shell, theme, window)
├── layouts/                 # BaseLayout
├── localization/            # i18next 다국어 (EN, PT-BR)
├── utils/                   # 유틸리티 함수
├── types/                   # TypeScript 타입 정의
├── constants/               # 상수 (IPC 채널, LocalStorage 키)
├── styles/                  # 전역 스타일
└── tests/
    ├── unit/                # Vitest
    └── e2e/                 # Playwright
```

## 6. 시작하기

### 요구사항

- Node.js 18 이상
- npm

### 설치

```bash
npm install
```

### 개발 환경 실행

```bash
npm start
```

Electron Forge를 통해 Vite HMR과 함께 개발 서버가 실행됩니다.

### 빌드 및 패키징

```bash
npm run package   # 앱 패키징
npm run make      # 배포용 인스톨러 생성
```

### 테스트

```bash
npm test          # 단위 테스트 (Vitest)
npm run test:e2e  # E2E 테스트 (Playwright)
npm run test:all  # 전체 테스트
```

### 린트 및 포맷팅

```bash
npm run lint      # ESLint
npm run format    # Prettier 검사
```

## 7. 아키텍처

### Main Process (메인 프로세스)

Electron 애플리케이션의 진입점으로 다음을 관리합니다:

- **Window 생성 및 관리**: BrowserWindow 인스턴스 생성, 라이프사이클 관리
- **ORPC 서버**: @orpc/server 기반 타입-안전 RPC 통신 설정
- **IPC 통신**: MessageChannel을 통한 고성능 양방향 통신
- **자동 업데이트**: update-electron-app을 통한 버전 관리
- **데이터 저장**: electron-store를 통한 프로젝트 메타데이터 저장

### Renderer Process (렌더러 프로세스)

React 기반 UI 레이어로 다음을 처리합니다:

- **파일 탐색**: FileTree 컴포넌트로 프로젝트 구조 표시
- **코드 뷰어**: Shiki 기반 문법 강조로 100+ 언어 지원
- **AI 채팅**: 스트리밍 기반 실시간 메시지 처리
- **터미널**: xterm.js + node-pty로 네이티브 쉘 실행
- **세션 관리**: 대화 히스토리 저장/복구

### IPC 통신 구조 (@orpc)

@orpc (Object-RPC) 프레임워크를 사용하여 타입-안전한 양방향 통신:

```
Renderer (Client)           Main (Server)
    IPCManager        ↔        rpcHandler
    MessageChannel             RPCHandler<Router>
    RPCLink                    Router (모든 IPC 핸들러)
  createORPCClient()
```

**초기화 프로세스:**
1. Renderer에서 MessageChannel 생성 → port1(client), port2(server)
2. RPCLink와 ORPC client 설정
3. server port를 Main으로 전달 (`window.postMessage()`)
4. Main에서 server port 활성화 → RPC 호출 처리 가능

### 보안 모델

- **contextIsolation: true**: Renderer 스크립트 격리로 보안 강화
- **Preload 스크립트**: IPC 브릿지로 제한된 API만 노출
- **HITL 권한 시스템**: 도구 실행 전 사용자 승인 요청
- **allowedTools 제한**: Read, Write, Edit, Bash 중 선택적 허용

### 데이터 저장 (electron-store)

프로젝트 메타데이터 저장 위치:

- **macOS**: `~/Library/Application Support/relay/`
- **Windows**: `%APPDATA%/relay/`
- **Linux**: `~/.config/relay/`

저장 형식:
```typescript
interface StoreSchema {
  projects: Array<{
    path: string;           // 프로젝트 절대 경로
    name: string;           // 프로젝트 디렉토리명
    lastOpened: number;     // 마지막 열기 시간 (timestamp)
  }>
}
```
