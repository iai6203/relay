# Wedding


## 1. 소개

Claude Code를 GUI로 쓸 수 있는 Electron 데스크톱 앱입니다.
사용자가 로컬 프로젝트를 열고 AI와 대화하며 코드 탐색, 파일 편집, 터미널 명령 실행 등을 수행할 수 있는 통합 개발 환경을 제공합니다.

## 2. 데모

https://github.com/user-attachments/assets/29734d88-83e8-46a4-9644-3b4ed7ca1d51

## 3. 기술 스택

| 분류                | 기술                                     |
| ------------------- | ---------------------------------------- |
| **프레임워크**      | Electron, React, TypeScript              |
| **빌드**            | Vite, Electron Forge                     |
| **라우팅**          | TanStack React Router (파일 기반 라우팅) |
| **상태 관리**       | TanStack React Query, electron-store     |
| **스타일링**        | Tailwind CSS, shadcn/ui                  |
| **AI**              | claude-agent-sdk                         |
| **IPC 통신**        | @orpc/client & @orpc/server              |
| **터미널**          | xterm.js, node-pty                       |
| **코드 하이라이팅** | Shiki                                    |
| **CI/CD**           | GitHub Actions (Lint, Format)            |

## 4. 주요 기능

### 4.1 AI 채팅

- claude-agent-sdk를 활용한 실시간 AI 채팅
- SSE 기반 스트리밍 응답 처리로 실시간 메시지 렌더링
- HITL 패턴 적용: 도구 실행 전에 사용자 승인을 받는 인터럽트 흐름
- 사용자가 실행 중인 AI 응답을 중단할 수 있는 제어 기능
- 세션 저장/불러오기/삭제
- 이전 대화 재개 기능

### 4.2 도구 실행 및 권한

- AI Tool(Read, Write, Edit, Bash) UI
- AI Tool 실행 결과 UI (Bash 출력, 파일 diff 등)
- Pub-Sub 기반 비동기 권한 요청/승인 시스템 (PermissionBus)
- AI Tool 자동 승인 토글

### 4.3 코드 탐색

- 프로젝트 파일 트리
- Shiki 기반 구문 강조 코드 뷰어
- 코드 블록 선택 후 AI 채팅 컨텍스트로 전달
- 이미지 미리보기
- 파일 변경 시 실시간 UI 갱신

### 4.4 터미널

- xterm.js + node-pty 기반 내장 터미널
- 프로젝트 디렉토리 컨텍스트 내 쉘 실행

### 4.5 프로젝트 관리

- 로컬 프로젝트 디렉토리 열기/삭제
- 프로젝트 목록 영구 저장 (electron-store)

### 4.6 UI/UX

- 리사이즈 가능한 패널 레이아웃 (파일 트리 / 코드 뷰어 / 채팅)
