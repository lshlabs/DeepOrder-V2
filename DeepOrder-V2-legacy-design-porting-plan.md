# DeepOrder-V2 최신본 ↔ 레거시 디자인 완전 이식 작업계획서

## 0. 문서 목적과 기준본

이 문서는 `DeepOrder_V2-latest.zip`의 아키텍처와 기능을 유지하면서 `DeepOrder_V2-lagacy.zip`의 디자인을 이식하기 위한 Codex 실행 계획서다.

이번 비교는 GitHub 원격 저장소나 이전에 전달된 `DeepOrder_V2.zip`을 기준으로 하지 않는다. 아래 두 첨부 ZIP의 실제 파일만 기준으로 다시 조사했다.

| 역할 | 첨부파일 | 사용자가 작업할 로컬 경로 | SHA-256 |
| --- | --- | --- | --- |
| 구현 대상·아키텍처 기준 | `DeepOrder_V2-latest.zip` | `/Users/mac/Documents/DeepOrder_V2/kds-web` | `3b61bc748d1d1c4e88caded54ca3a0e4082ed7100ec5329bd7961762566ba860` |
| 디자인 기준·읽기 전용 참조 | `DeepOrder_V2-lagacy.zip` | `/Users/mac/Documents/DeepOrder-V2-lagacy/kds-web` | `52c6b8d9a35b432a6c3d5b34ed8ca8b69bd0373897efc3d269046d69289930ac` |

ZIP에는 `.git` 이력이 포함되어 있지 않으므로 원래 Git 커밋은 완전하게 증명할 수 없다. 이후 비교와 검증은 위 SHA-256으로 식별한 파일 상태를 기준으로 한다.

저장소 이름의 `lagacy` 표기는 실제 폴더명을 그대로 사용한다.

## 1. 최종 결론

이 작업은 레거시 파일을 최신본에 복사하거나 두 폴더를 일반 merge하는 작업이 아니다.

정확한 이식 방식은 다음과 같다.

> 최신본의 앱 구조, feature 경계, 상태관리, API, 타입, shadcn/Radix 접근성 동작을 그대로 유지하고, 레거시에서 추출한 시각 계약을 최신본의 semantic token, Tailwind utility, CVA variant와 현재 UI 컴포넌트에 다시 구현한다.

판단 기준은 다음과 같이 분리한다.

- 기능·데이터·아키텍처 기준: `DeepOrder_V2-latest.zip`
- 일반 화면의 디자인 기준: `DeepOrder_V2-lagacy.zip`
- 통계 페이지 디자인 기준: 이식 전 `DeepOrder_V2-latest.zip`
- 통계 페이지 허용 변경: 여백, 크기, grid, breakpoint, overflow, 타이포그래피 등 layout 관련 속성만

따라서 레거시 `StatsPanel`과 `stats.css`는 최신 통계 dashboard에 이식하지 않는다.

## 2. 첨부본 실제 비교 결과

### 2.1 규모 비교

| 항목 | 최신본 | 레거시 |
| --- | ---: | ---: |
| `src` CSS 파일 | 1개 | 14개 |
| CSS 줄 수 | 54줄 | 4,745줄 |
| TypeScript `.ts` | 61개 | 25개 |
| React `.tsx` | 86개 | 27개 |
| TS/TSX/CSS 총 줄 수 | 12,245줄 | 13,383줄 |
| UI 기반 | Tailwind + shadcn/Radix + CVA | 전역/feature CSS + raw DOM + Ant Design 일부 |
| 전체 검사 | `typecheck`, `lint`, `check:architecture`, `build` | `typecheck`, `lint`, `build` |

레거시는 CSS에 화면별 시각 정보가 집중되어 있고, 최신본은 같은 책임이 JSX utility와 공용 primitive/blocks에 분산되어 있다. 그러므로 CSS 줄 단위 복사로는 이식할 수 없다.

### 2.2 최신본의 현재 아키텍처

```text
src/
  app/                  앱 조립, provider, navigation, KDS workspace
  pages/                얇은 route/page entry
  components/
    ui/                 domain-neutral shadcn/Radix primitive
    blocks/             공용 loading/error/empty/dialog/table/header 조합
    layout/             KDS shell/sidebar/topbar/account menu
  features/
    auth/
    orders/
    settings/
    staff/
    stats/
    store-status/
    support/
    tasks/
  lib/                  API client, date, notification, utility
```

최신본의 `docs/architecture/frontend.md`와 `scripts/check-frontend-architecture.mjs`가 실제 현재 구조를 설명한다.

`docs/frontend-rearchitecture/baseline.md`는 아키텍처 전환 전 상태를 기록한 역사 문서다. 그 문서에 적힌 다중 CSS, Ant Design, `src/shared`, `features/kds` 구조를 현재 상태로 오해하거나 복원하면 안 된다.

### 2.3 최신본이 강제하는 구조 규칙

현재 아키텍처 검사는 다음 항목을 실패 처리하며, 첨부 최신본에서 직접 실행한 결과 PASS였다.

- `src/app/styles/globals.css` 외 CSS 파일 추가
- `src/main.tsx` 외 CSS import
- Ant Design import 또는 `.ant-*` selector
- `src/shared`, `src/features/kds`, `src/types` 재생성
- `--color-*`, `--kds-ui-*` 레거시 token 재도입
- `kds-*`, `auth-*`, `settings-*`, `support-*` 등 레거시 className 재도입
- feature 외부에서 `features/<name>/ui|model|api|lib` deep import
- 공용 component에서 feature import
- 공용 primitive 밖에서 raw `button`, `input`, `select`, `textarea` 사용
- Tailwind preflight 비활성화

이 규칙은 디자인 이식 중에도 완화하거나 우회하지 않는다. 검사 스크립트를 수정해 실패를 숨기는 행위도 금지한다.

### 2.4 실제 기능 소유권 변화

| 레거시 책임 | 최신본 책임 | 이식 시 처리 |
| --- | --- | --- |
| 큰 `App.tsx` | `app/App.tsx`, `features/auth/model/use-auth-session.ts` | 최신 인증 조립 유지 |
| 큰 `pages/KdsPage.tsx` | 얇은 page + `app/kds/**` | 최신 workspace 조립 유지 |
| `features/kds/orders/**` | `features/orders/{api,model,lib,ui}` | `ui`만 시각 이식 |
| `features/kds/settings/**` | `features/settings/**` | 최신 TimeRangeField/primitive 유지 |
| `features/kds/staff/**` | `features/staff/**` | 최신 API/CRUD 유지, 표면만 복원 |
| `features/kds/tasks/**` | `features/tasks/**` | 최신 model 유지, tile/table 복원 |
| `features/kds/support/**` | 분리된 support/chatbot 컴포넌트 | 분할 구조 유지, 각 UI에 외형 적용 |
| 자체 toast | Sonner + `lib/notifications.ts` | 최신 notification 유지 |
| 자체 modal/popover | Radix dialog/dropdown/popover/sheet | focus/portal 유지, 외형만 복원 |
| 공용 `types/index.ts` | feature별 `types.ts` | 최신 타입 소유권 유지 |
| 큰 `lib/api.ts` | feature API + `lib/api/http-client.ts` | 최신 요청 계약 유지 |

## 3. 이식의 절대 원칙

### 3.1 최신본이 최종 기준인 영역

다음은 디자인을 맞추기 위해 변경하거나 레거시 구현으로 되돌리지 않는다.

- 인증 session boot, refresh, logout, approval 분기
- API URL, method, request/response mapping
- feature별 `api`, `model`, `lib`, `types`, `data`, `session`
- `app/kds/model/use-kds-workspace.ts`의 상태 조립
- `features/*/index.ts`를 통한 public API
- 주문 polling, sorting, status transition, item/option progress
- 주문 카드 높이 측정과 column 배치 알고리즘
- 역할별 sidebar 노출 규칙
- Radix portal, focus trap, keyboard navigation, escape/outside dismiss
- shadcn primitive를 통한 form control
- Sonner 알림 체계
- 최신 통계 dashboard의 차트, 카드 시각, 색상, 데이터와 동작

### 3.2 레거시가 최종 기준인 영역

통계를 제외한 다음 항목은 레거시 렌더링을 기준으로 한다.

- 색상과 surface hierarchy
- border, radius, shadow
- font size, weight, line-height, letter-spacing
- margin, padding, gap, control height
- sidebar/topbar 크기와 열림 상태
- 주문 board column 폭과 card/row 밀도
- panel, table, tile, dialog, context menu의 시각 구조
- FAQ와 chatbot의 크기·배치·bubble 표현
- 360/768/1024 breakpoint별 layout 의도
- hover, focus, active, disabled, loading, empty, error 상태의 외형

### 3.3 충돌 시 우선순위

1. 기능 정확성과 데이터 계약
2. 접근성 및 keyboard/focus 동작
3. 최신 아키텍처 규칙
4. 레거시 시각 충실도

시각 충실도를 위해 레거시의 접근성 부족이나 자체 overlay 구현까지 되살리지는 않는다. 같은 외형을 현재 primitive 위에서 재현한다.

## 4. 수정 범위 계약

### 4.1 기본 수정 허용 영역

```text
kds-web/src/app/styles/globals.css
kds-web/tailwind.config.js
kds-web/src/components/ui/**
kds-web/src/components/blocks/**
kds-web/src/components/layout/**
kds-web/src/features/*/ui/**
kds-web/src/app/kds/KdsWorkspaceChrome.tsx   # slot/wrapper가 필요할 때만
kds-web/src/app/kds/KdsSectionRenderer.tsx  # 화면 wrapper가 필요할 때만
```

공용 primitive는 기본값을 무조건 변경하지 않고 opt-in variant를 우선 추가한다. 통계 등 다른 소비자의 렌더링이 바뀌는 공용 기본값 수정은 금지한다.

### 4.2 기본 수정 금지 영역

```text
kds-web/src/features/*/api/**
kds-web/src/features/*/model/**
kds-web/src/features/*/lib/**
kds-web/src/features/*/types*
kds-web/src/features/*/data/**
kds-web/src/features/*/session/**
kds-web/src/lib/api/**
kds-web/src/app/kds/model/**
kds-web/scripts/check-frontend-architecture.mjs
```

시각 작업 때문에 위 파일을 수정해야 한다고 판단되면 즉시 진행하지 말고, 필요 이유와 대안을 기록한다. 승인된 예외 없이 이 영역에 diff가 있으면 완전 이식 실패다.

### 4.3 절대 금지

- 레거시 CSS 파일 복사
- `features/kds` 또는 `src/shared` 복원
- raw form control로 회귀
- Ant Design 재설치
- `preflight: false`
- architecture check 완화
- 최신 UI 기능 삭제로 화면을 레거시와 맞추는 방식
- 통계를 레거시 `StatsPanel`로 교체
- 동작을 검증하지 않은 대규모 일괄 className 교체

## 5. 레거시 디자인 계약

### 5.1 색상과 token

레거시 token은 최신 semantic token 이름으로 흡수한다. 레거시 이름을 재도입하지 않는다.

| 의미 | 레거시 계산값 | 최신 표현 |
| --- | --- | --- |
| 앱 배경 | `#f4f5f7` | `background` |
| 기본 surface | `#ffffff` | `card`, `popover` |
| 보조 surface | `#f4f5f7` | `secondary`, `muted` |
| 강한 보조 surface | `#e8eaed` | `accent` 또는 국소 utility |
| 본문 | `#111318` | `foreground` |
| muted text | `#6b7280` | `muted-foreground` |
| subtle text | `#4b5563` | 필요한 semantic 보완 또는 opacity 조합 |
| primary | `#e8650a` | `primary` |
| primary hover | `#d45a06` | variant hover |
| success | `#16a34a` | `success` |
| warning | `#b45309` | `warning` |
| destructive | `#dc2626` | `destructive` |
| border | `rgba(0,0,0,0.09)` | `border` |
| border hover | `rgba(0,0,0,0.18)` | hover variant |

최신 token은 레거시 값과 가깝지만 완전히 같지는 않다. 완전 이식 단계에서는 실제 브라우저 computed RGB를 비교한다. 색상 차이는 CIEDE2000 `ΔE00 ≤ 2.0`이어야 한다.

통계가 사용하는 generic semantic token의 계산값이 달라질 경우에는 통계 root와 portal에 이식 전 최신 token을 scoped theme으로 고정한다. 통계 결과 화면의 색을 바꾸는 방식으로 해결해서는 안 된다.

### 5.2 공통 크기

| 항목 | 목표값 |
| --- | ---: |
| 화면 margin | 모바일 16px, 768px 이상 24px |
| 기본 control | 38px |
| 작은 button | 32px |
| 매우 작은 button | 26px |
| 작은 icon button | 30px |
| 주문 action | 44px |
| menu item | 40px |
| select item | 44px |
| radius small/medium/large | 5/8/12px |
| topbar | 48px |
| mobile 작업 FAB | 56px |
| chatbot FAB | 52px |

### 5.3 KDS chrome

- sidebar 접힘 폭: 0~767px `42px`, 768px 이상 `48px`
- sidebar 열림 surface 폭: `192px`
- 열림 surface는 본문 폭을 재계산하지 않고 위로 확장
- sidebar toggle 높이: `48px`
- sidebar item 높이: `36px`
- topbar 높이: `48px`
- 모바일 업무 탭: available width를 균등 분배
- 데스크톱 업무 탭: topbar 중앙 정렬
- account popover: 약 `220~232px`, menu row 40px

### 5.4 인증

- 1024px 이상 1:1 split layout
- hero padding `40px 48px`
- form 영역 padding `40px 64px`
- form 최대 폭 `400px`
- hero headline `48px`, line-height `1.1`
- auth tab 높이 `32px`, outer inset `3px`
- input/button 높이 `38px`
- label `12px`, form field gap `5px`, form row gap `11px`

### 5.5 주문 board와 card

- board padding: 모바일 `10px`, 768px 이상 `14px 16px`
- card/column gap: `10px`
- 768~1023px column: base/wide/xwide `280/320/384px`
- 1024px 이상 column: `280/360/440px`
- card radius `12px`, 기본 shadow 없음, 1px border
- header padding `10px 12px 9px`
- 주문번호 `20px / 800`
- item padding `9px 12px`
- quantity 최소 폭 `24px`
- option left padding `24px`
- request padding `9px 12px`
- request label `9px / 700`, chip `11px / 600`
- action 높이 `44px`
- completed card opacity `0.6`

### 5.6 panel, tile, table

- 일반 관리 화면 padding `14px 16px`
- panel header `18px 22px 16px`; 독립 화면에서는 bottom `14px`
- panel title `17px / 700`, subtitle `12px`
- section label `10px / 700 / uppercase`
- table header `10px / 700`, sticky, uppercase
- table body 기본 `12~13px`
- task tile grid `minmax(148px, 1fr)`, separator 1px
- task tile 최소 높이 `96px`
- task count `36px / 800`
- settings row 수직 padding `13~14px`
- settings label/description `13px/12px`

### 5.7 store status와 chatbot

- store status trigger 높이 `28px`
- store popover 폭 `248px` 기준, viewport 최대폭 적용
- status option 높이 `44px`
- pause stepper `40×40px`
- chatbot mobile panel `80dvh`, bottom sheet
- chatbot desktop panel `360×520px`, right 24px, bottom 88px
- chatbot header `52px`
- message gap `10px`, message area padding `12px`
- message max-width `82%`
- bubble padding `9px 12px`
- chatbot composer send button `34×34px`

## 6. 레거시 → 최신 파일 대응표

| 레거시 디자인 소유자 | 최신 구현 소유자 | 이식 방법 |
| --- | --- | --- |
| `styles/tokens.css`, `base.css` | `app/styles/globals.css`, `tailwind.config.js` | semantic 값과 animation만 흡수 |
| `pages/auth.css`, `pages/AuthPage.tsx` | `features/auth/ui/**` | 분할 구조 유지, utility 조정 |
| `layout/kds-layout.css` | `components/layout/**` | shell/sidebar/topbar/account 복원 |
| `layout/kds-actions.css` | `components/ui`, `blocks`, feature overlay | opt-in compact variant |
| `orders/orders.css` | `features/orders/ui/**` | card/row/board/request 시각 복원 |
| 자체 modal/context menu | Radix dialog/dropdown/alert-dialog | 동작 유지, density만 복원 |
| `shared/kds-shared.css` | `components/blocks`, `ui/table` | flat panel/table 조합 |
| `tasks/tasks.css` | `features/tasks/ui/TasksPage.tsx` | tile/history/dialog 복원 |
| `staff/staff.css` | `features/staff/ui/StaffPage.tsx` | compact table/dialog 복원 |
| `settings/settings.css` | `features/settings/ui/**` | shadcn control 위에 flat row 적용 |
| `store-status.css` | `features/store-status/ui/**` | Radix popover 외형 조정 |
| `support/support.css` | `features/support/ui/**` | 분할된 각 chatbot UI에 재표현 |
| 레거시 `stats.css` | 최신 `features/stats/ui/dashboard/**` | 이식하지 않음 |

## Feature Slice 단위 이식 원칙

레거시 디자인 전체를 한 번에 이식하지 않는다. 공통 기반을 먼저 확정한 뒤, 하나의 feature slice만 열어 최신본의 대응 feature에 이식하고 검증까지 완료한 후 다음 slice로 이동한다.

### 1. 작업 단위

각 작업 단위는 반드시 다음 네 가지로 제한한다.

1. 레거시 참조 경로
2. 최신본 수정 경로
3. 해당 slice가 사용하는 공용 컴포넌트
4. 해당 slice의 검증 항목

현재 작업 중인 slice와 관계없는 레거시 파일은 참고하지 않는다. 최신본의 다른 feature도 공용 컴포넌트 영향 확인 외에는 수정하지 않는다.

### 2. Slice 완료 조건

하나의 slice는 다음 조건을 모두 만족해야 완료된다.

- 레거시 JSX와 CSS의 상태·selector·반응형 규칙을 모두 확인함
- 최신 feature의 API, model, lib, types는 변경하지 않음
- 기본·hover·focus·active·disabled·loading·empty·error 상태를 이식함
- 해당 slice의 모바일·태블릿·데스크톱 layout을 확인함
- `typecheck`, `lint`, `check:architecture`, `build` 통과
- 다른 완료 slice와 통계 페이지에 시각적 회귀가 없음
- 남은 차이와 미검증 상태가 기록됨

검증되지 않은 상태가 하나라도 있으면 다음 slice로 넘어가지 않는다.

### 3. 공용 스타일 처리 규칙

feature 작업 중 반복되는 디자인이 발견되어도 즉시 공용 primitive의 기본값을 변경하지 않는다.

처리 순서:

1. feature 내부 Tailwind utility 또는 CVA로 먼저 재현
2. 두 개 이상의 feature에서 동일 패턴이 확인되면 공용화 검토
3. 기존 consumer 영향 범위를 조사
4. 기본값 변경 대신 opt-in variant 추가
5. 이미 완료된 slice와 통계 페이지 회귀 검증

공용 컴포넌트 변경은 독립 작업으로 취급한다. 공용 변경과 feature 화면 이식을 같은 커밋에 섞지 않는다.

### 4. Slice별 참조·수정 경로

| Slice | 레거시 참조 경로 | 최신본 수정 경로 |
| --- | --- | --- |
| 공통 token | `src/styles/tokens.css`, `src/styles/base.css` | `src/app/styles/globals.css`, `tailwind.config.js` |
| 공통 floating/action | `src/features/kds/layout/kds-actions.css`, `src/features/kds/shared/kds-shared.css` | `src/components/ui/**`, `src/components/blocks/**` |
| KDS layout | `src/features/kds/layout/**` | `src/components/layout/**`, 필요 시 `src/app/kds/KdsWorkspaceChrome.tsx` |
| 인증 | `src/pages/AuthPage.tsx`, `src/pages/auth.css` | `src/features/auth/ui/**` |
| 주문 | `src/features/kds/orders/**` | `src/features/orders/ui/**` |
| 매장 상태 | `src/features/kds/store-status/**` | `src/features/store-status/ui/**` |
| 내 업무 | `src/features/kds/tasks/**` | `src/features/tasks/ui/TasksPage.tsx` |
| 직원 | `src/features/kds/staff/**` | `src/features/staff/ui/StaffPage.tsx` |
| 설정 | `src/features/kds/settings/**` | `src/features/settings/ui/**` |
| 고객지원 | `src/features/kds/support/components/FaqSection.tsx`, `support.css`의 FAQ 영역 | `src/features/support/ui/FaqSection.tsx`, `SupportPage.tsx` |
| 챗봇 | `src/features/kds/support/components/ChatbotFab.tsx`, `support.css`의 chatbot 영역 | `src/features/support/ui/chatbot/**` |
| 통계 | 이식 대상으로 사용하지 않음 | 최신 통계의 layout·타이포그래피만 조정 |

고객지원과 챗봇은 같은 레거시 feature에 있지만 작업량과 상태 수가 많으므로 서로 다른 slice로 분리한다.

### 5. 권장 Slice 실행 순서

의존성이 낮은 순서가 아니라 공통 기반의 영향 범위를 닫을 수 있는 순서로 진행한다.

1. 공통 token
2. 공용 primitive와 block의 opt-in variant
3. KDS shell/sidebar/topbar/account
4. 인증
5. 주문 board/card/request
6. 주문 overlay
7. 매장 상태
8. 내 업무
9. 직원
10. 설정
11. FAQ
12. 챗봇
13. 통계 layout-only
14. 전체 통합 회귀 검증

주문 화면도 한 번에 처리하지 않고 `board → card → request → overlay`로 나눈다. 고객지원도 `FAQ → chatbot shell → message → choice/composer` 순서로 나눈다.

### 6. Codex에 제공할 Slice별 작업 지시 형식

매 slice마다 아래 형식으로 작업을 지시한다.

> 레거시 참조 범위는 `[레거시 경로]`로 제한한다.  
> 최신본 수정 범위는 `[최신 경로]`와 필요한 공용 opt-in variant로 제한한다.  
> 레거시의 JSX 구조, CSS selector, 상태 variant, media query를 먼저 목록화한다.  
> 최신본의 API/model/lib/types와 아키텍처 경계는 변경하지 않는다.  
> 레거시 className이나 CSS 파일을 복사하지 않고 Tailwind/shadcn/CVA로 변환한다.  
> 구현 후 해당 slice의 모든 상태와 반응형을 검증한다.  
> 검증을 통과하기 전에는 다음 slice를 작업하지 않는다.  
> 완료 시 변경 파일, 이식한 디자인 규칙, 검증 결과, 남은 차이와 공용 컴포넌트 영향 범위를 보고한다.

### 7. Slice 간 회귀 방지

완료된 slice는 이후 작업의 보호 대상이 된다.

각 slice 종료 시 다음을 누적 실행한다.

- 현재 slice 검증
- 이전에 완료된 slice의 대표 상태 smoke 검증
- 통계 페이지 보호 검증
- architecture 검사
- 변경 허용 경로 감사

후속 slice 때문에 완료된 slice의 디자인이 달라지면 후속 작업을 완료로 인정하지 않는다.

## 7. 단계별 작업계획

각 Phase는 독립 커밋과 독립 검증이 가능한 크기로 진행한다. Phase 완료 전에 다음 Phase를 시작하지 않는다.

### Phase 0. 기준본 고정과 작업 보호

목표: 잘못된 ZIP 또는 잘못된 폴더를 작업하는 사고를 방지한다.

작업:

1. 두 ZIP SHA-256을 문서의 값과 재확인한다.
2. `/Users/mac/Documents/DeepOrder-V2-lagacy/kds-web`를 읽기 전용 reference로 취급한다.
3. `/Users/mac/Documents/DeepOrder_V2/kds-web`의 Git branch와 dirty 상태를 기록한다.
4. unrelated 변경은 보존하고 덮어쓰지 않는다.
5. `node scripts/check-frontend-architecture.mjs`와 전체 `npm run check` baseline을 기록한다.
6. `tsconfig.tsbuildinfo`, `dist`, `node_modules`는 비교 대상에서 제외한다.

완료물:

- `source-baseline.md`
- archive checksum 기록
- 시작 commit/branch/dirty file 목록
- baseline validation 결과

### Phase 1. 결정적 시각 비교 환경 구성

목표: 사람의 기억이 아니라 동일 데이터와 동일 브라우저로 비교한다.

작업:

1. 레거시는 5175, 최신본은 5173에서 동시에 실행한다.
2. 두 앱이 같은 API fixture를 사용하도록 request mock을 구성한다.
3. `Date.now`, timezone, locale과 주문 시간을 고정한다.
4. animation과 caret을 snapshot 시 비활성화한다.
5. Pretendard 또는 동일 fallback font를 두 앱에 동일하게 적용한다.
6. 로그인, 주문, 직원, 설정, support 상태별 fixture를 만든다.
7. 통계는 레거시가 아니라 이식 전 최신본 screenshot을 별도 baseline으로 만든다.

QA 도구는 product `src` 밖에 둔다. production에 preview route나 test-only 분기를 추가하지 않는다.

완료물:

- fixture 목록
- screenshot naming 규칙
- viewport matrix
- dynamic mask 목록
- 이식 전 최신 통계 baseline

### Phase 2. token 변환과 통계 보호막

목표: 모든 화면이 공유할 레거시 시각 값을 최신 semantic system에 정확히 매핑한다.

주요 파일:

- `src/app/styles/globals.css`
- `tailwind.config.js`
- 필요한 경우 통계 root 및 portal wrapper

작업:

1. 레거시 색을 semantic token으로 변환한다.
2. browser computed RGB와 레거시 reference의 `ΔE00 ≤ 2.0`을 확인한다.
3. floating shadow와 필요한 animation만 Tailwind config로 옮긴다.
4. radius 전역 변경으로 통계가 달라지지 않게 한다.
5. global token 변경이 통계에 전파되면 통계에 이식 전 최신 token scope를 설정한다.
6. chart token은 변경하지 않는다.

완료 게이트:

- CSS는 계속 1개다.
- 통계의 색/카드/차트 snapshot은 baseline과 동일하다.
- architecture check PASS.

### Phase 3. 공용 primitive와 block의 opt-in density

목표: 화면별 중복 arbitrary class를 줄이되 공용 기본값 변경으로 회귀시키지 않는다.

검토 파일:

- `components/ui/button.tsx`
- `input.tsx`, `tabs.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
- `card.tsx`, `table.tsx`, `popover.tsx`, `sheet.tsx`
- `components/blocks/PageHeader.tsx`
- `PageSection.tsx`, `DataTableShell.tsx`, `ConfirmDialog.tsx`, `StatusBadge.tsx`

작업:

1. 38px control, 32px small, 30px icon, 26px xs 등 반복값만 variant화한다.
2. `compact`, `flat`, `dense` 등 역할 기반 이름을 사용한다.
3. feature 이름을 공용 variant에 넣지 않는다.
4. Card 기본 shadow/radius는 통계 때문에 유지하고 주문/flat panel에서 opt-in으로 제거한다.
5. Dialog/Dropdown의 Radix structure는 변경하지 않는다.

완료 게이트:

- 모든 기존 consumer를 조사하지 않은 default 변경이 없다.
- 통계와 아직 작업하지 않은 화면에 unapproved visual diff가 없다.

### Phase 4. KDS shell과 navigation chrome

주요 파일:

- `components/layout/KdsShell.tsx`
- `KdsSidebar.tsx`
- `KdsTopbar.tsx`
- `KdsAccountMenu.tsx`
- 필요 시 `app/kds/KdsWorkspaceChrome.tsx`

작업:

1. shell의 `100dvh`, overflow와 min-width 계약을 유지한다.
2. sidebar를 42/48px 접힘, 192px overlay 확장 방식으로 맞춘다.
3. navigation metadata, manager filter와 count badge 로직은 그대로 사용한다.
4. topbar 48px, 중앙 업무 탭, 좌측 store status, 우측 action을 맞춘다.
5. 통계 `rightContent` date picker slot을 유지한다.
6. account menu를 현재 DropdownMenu 위에서 레거시 크기로 맞춘다.
7. 모바일 56px 작업 FAB와 menu를 맞춘다.

검증:

- sidebar 접힘/열림, backdrop, escape, outside click
- 모든 section 이동
- manager/employee별 menu 노출
- 320/360/768/1024/1280 viewport
- topbar/tab/FAB 겹침 없음

### Phase 5. 인증 전체 상태

주요 파일:

- `features/auth/ui/AuthShell.tsx`
- `AuthForms.tsx`, `LoginForm.tsx`, `SignupForm.tsx`
- `PasswordField.tsx`, `ApprovalPendingView.tsx`, `AuthExperience.tsx`

작업:

1. 1024px split hero와 form geometry를 복원한다.
2. tab/input/button/label/gap을 레거시 값으로 맞춘다.
3. booting, pending, rejected summary의 density를 맞춘다.
4. 최신 Checkbox, Input, Tabs와 validation 접근성은 유지한다.
5. 주소 검색, 아이디 중복 확인, 저장/자동 로그인 로직은 수정하지 않는다.

검증:

- booting, login, login error, register, identifier result, pending, rejected
- password show/hide와 keyboard tab order
- 320px 가로 overflow 0

### Phase 6. 주문 board, card, request

주요 파일:

- `features/orders/ui/OrderBoard.tsx`
- `OrderCard.tsx`
- `RequestPanel.tsx`

작업:

1. board padding, gap, breakpoint별 column 폭을 복원한다.
2. card를 shadow 없는 12px flat card로 맞춘다.
3. header/number/elapsed/type badge geometry를 맞춘다.
4. item과 option을 연속 flat row로 맞춘다.
5. partial progress green tint를 유지한다.
6. allergy, completed, warning/urgent 표현을 맞춘다.
7. request panel, action chip, raw request를 맞춘다.
8. 조리 시작/완료 action 44px을 맞춘다.
9. `ResizeObserver`, long press, Button semantics는 유지한다.

검증:

- empty/loading/pull states
- NEW/COOKING/DONE
- pinned, urgent, warning, allergy
- delivery/takeout/dine badge
- 긴 메뉴명/다중 option/부분 진행
- short card stacking, wide/xwide column

### Phase 7. 주문 overlay와 store status

주요 파일:

- `features/orders/ui/OrderContextMenu.tsx`
- `OrderDetailDialog.tsx`
- `ClearCompletedDialog.tsx`, `RemoveOrderDialog.tsx`
- `features/store-status/ui/StoreStatusControl.tsx`
- `StoreStatusDot.tsx`
- `components/blocks/ConfirmDialog.tsx`

작업:

1. context menu 152px+, 40px row, floating shadow를 맞춘다.
2. dialog size, mobile inset, header/body/footer density를 맞춘다.
3. order detail section과 item row를 레거시와 맞춘다.
4. store trigger 28px, popover 248px, option 44px을 맞춘다.
5. pause stepper/confirm과 세 상태의 색을 맞춘다.
6. Radix portal/focus/dismiss는 유지한다.

검증:

- overlay z-index 조합
- keyboard open/close/focus return
- viewport 밖으로 잘리지 않음
- store pause cancel/confirm

### Phase 8. 내 업무, 직원, 설정

주요 파일:

- `features/tasks/ui/TasksPage.tsx`
- `features/staff/ui/StaffPage.tsx`
- `features/settings/ui/**`
- 필요한 공용 table/status/dialog variant

내 업무:

- 1px separator tile grid, 148px 최소 열, 96px tile 복원
- idle/selected/delayed/count/menu-name 상태 복원
- hover에서 option 노출, coarse pointer에서는 항상 노출
- history table 모바일 column과 badge 복원

직원:

- compact page header와 table 복원
- avatar, role/status badge와 mobile subtext를 reference에 맞춤
- add/edit/PIN/active dialog를 레거시 density로 맞춤
- 최신 CRUD와 PIN API는 유지

설정:

- 중첩 카드 강조를 줄이고 레거시 section label + flat row로 복원
- Switch/RadioGroup/TimeRangeField는 최신 primitive 유지
- Ant Design을 복원하지 않음
- disabled breaktime과 password dialog 복원

### Phase 9. 고객지원과 chatbot

주요 파일:

- `features/support/ui/FaqSection.tsx`
- `SupportPage.tsx`
- `features/support/ui/chatbot/**`

작업:

1. FAQ header/search/category/accordion/empty CTA를 복원한다.
2. chatbot FAB 52px과 label/badge를 맞춘다.
3. mobile bottom sheet 80dvh와 desktop 360×520px panel을 맞춘다.
4. header, breadcrumb, messages, avatars, bubbles, time을 맞춘다.
5. initial category, guided step, terminal action, typing, waiting, closed 상태를 맞춘다.
6. composer와 send button을 맞춘다.
7. 현재 session provider와 message merge 로직은 수정하지 않는다.

검증:

- FAQ category/search/no-result/open item
- chatbot open/minimize/close/end/new session
- user/bot/AI/agent/typing/waiting/closed
- 긴 메시지, mobile keyboard, scroll-to-bottom

### Phase 10. 통계 layout-only 정렬

기준: 이식 전 최신본 screenshot.

허용:

- margin, padding, gap
- width/min/max width
- grid column, flex, breakpoint
- overflow, scroll 영역
- font size, weight, line-height, letter-spacing
- topbar date picker 위치

금지:

- chart 종류, series, axis, tooltip 의미
- KPI/card/insight의 시각 컨셉
- chart/platform/status 색상
- gradient, icon, badge, progress 표현
- API/mock/data/type 변경
- 레거시 StatsPanel 반입

보호 게이트:

- `features/stats/api`, `data`, `model`, `types` hash 불변
- Recharts component 종류와 data prop 불변
- 색상 상수와 chart config 불변
- layout 허용 목록 밖 className 변경 0건

### Phase 11. 전체 정리와 최종 판정

작업:

1. dead import/variant 제거
2. 비UI 영역 diff 감사
3. architecture/type/lint/build 실행
4. screenshot 전체 matrix 실행
5. functional/API matrix 실행
6. keyboard/axe 검증
7. 통계 보호 audit
8. 승인되지 않은 deviation 0건 확인

## 8. “완벽히 이식됨”의 정확한 판정 기준

완전 이식은 점수제가 아니라 아래 모든 Gate를 통과하는 이진 판정이다. 8개 중 7개를 통과해도 완료가 아니다.

### Gate A. 기준본 동일성

- 두 ZIP SHA-256이 문서와 일치한다.
- 비교 실행 시 legacy/latest build 환경, font, browser, locale, timezone이 동일하다.
- fixture data와 `Date.now`가 고정되어 있다.
- dynamic mask는 clock/elapsed/caret/animation처럼 승인된 항목만 포함한다.

실패 조건: 다른 ZIP, 다른 데이터, 광범위 mask, 서로 다른 font로 비교.

### Gate B. 아키텍처 무결성

필수:

```bash
npm run typecheck
npm run lint
npm run check:architecture
npm run build
npm run check
git diff --check
```

추가 정적 기준:

- CSS 파일 정확히 1개: `src/app/styles/globals.css`
- forbidden legacy token/class/import 0건
- raw control 위반 0건
- architecture 검사 완화 diff 0건
- 새 runtime dependency 0개

하나라도 실패하면 미완료다.

### Gate C. 수정 범위 무결성

- `api`, `model`, `lib`, `types`, `data`, `session`, `lib/api`, `app/kds/model`은 baseline hash와 동일하다.
- 허용되지 않은 파일 변경은 deviation register에 사유와 승인이 있어야 한다.
- 기능 삭제, prop 축소, API 호출 제거를 디자인 이식으로 인정하지 않는다.

승인 없는 비UI diff 1줄도 실패다.

### Gate D. 시각 일치

동일 Chromium, 동일 viewport, 동일 fixture에서 비교한다.

자동 기준:

- 일반 정적 화면: `maxDiffPixelRatio ≤ 0.005` (0.5%)
- dialog/popover/chatbot처럼 antialiasing과 portal 영향이 큰 화면: `≤ 0.01` (1.0%)
- pixelmatch threshold: `0.1`
- major landmark의 `x/y/width/height` 차이: 각 `≤ 2px`
- control/card 높이와 border 폭 차이: `≤ 1px`
- font-size, font-weight, line-height: reference와 정확히 일치
- radius 차이: `≤ 1px`
- 색상: `ΔE00 ≤ 2.0`

수동 기준:

- diff heatmap에 하나의 눈에 띄는 미승인 mismatch 영역도 없어야 한다.
- 0.5% 안에 들어가더라도 특정 button, badge, card가 명확히 다른 경우 실패다.
- mask로 layout mismatch를 가리는 것은 금지한다.

통계는 legacy가 아니라 이식 전 latest baseline과 비교한다.

### Gate E. 기능과 API 무회귀

모든 interaction test가 PASS하고 다음이 baseline과 같아야 한다.

- 호출 endpoint, method, query, request body
- 호출 조건과 사용자 action 순서
- loading/disabled/error state
- optimistic/pending 상태
- 성공 후 UI state
- unauthorized refresh/retry 흐름

각 기능 flow에서 console error, unhandled rejection, React key/hydration warning은 0건이어야 한다.

### Gate F. 반응형 완전성

필수 viewport:

- `320×720`
- `360×800`
- `768×1024`
- `1024×768`
- `1280×800`

각 viewport에서 다음을 모두 만족한다.

- document-level horizontal overflow 0
- 고정 UI와 content 겹침 0
- 화면 밖으로 접근 불가능한 action 0
- dialog/popover/menu clipping 0
- sidebar/topbar/FAB/chatbot safe-area 충돌 0
- 주문 lane scroll 방향과 snap 정상
- breakpoint 직전/직후 1px에서도 layout 급락 없음

추가 경계 검증: 359/360, 767/768, 1023/1024, 1279/1280px.

### Gate G. 접근성 무회귀

- axe critical/serious violation 0건
- 모든 interactive element keyboard 도달 가능
- focus-visible 확인 가능
- dialog focus trap과 close 후 trigger focus 복귀
- tab/radio/pressed/expanded ARIA와 시각 상태 일치
- icon-only button에 한국어 accessible name 존재
- 색만으로 status를 구분하지 않음
- reduced-motion에서 주요 animation 비활성 또는 축소

### Gate H. 통계 보호

- 통계의 chart, color, data, icon, gradient, badge, KPI 구성은 이식 전 latest와 동일하다.
- 허용된 layout/typography diff만 존재한다.
- date picker와 chart popover portal도 baseline 색을 유지한다.
- 공용 token/primitive 변경이 통계에 전파되지 않는다.
- `features/stats/api|data|model|types` 변경 0건.

이 Gate는 다른 화면이 완벽해도 단독으로 완료를 막는다.

## 9. 필수 화면·상태 검증표

아래 상태를 빠뜨리지 않고 reference screenshot과 interaction test를 만든다.

### 9.1 인증

- `AUTH-01` booting
- `AUTH-02` 로그인 기본
- `AUTH-03` 로그인 오류
- `AUTH-04` 가입 기본/긴 form
- `AUTH-05` 아이디 중복 가능/불가
- `AUTH-06` 승인 대기
- `AUTH-07` 승인 거절 및 사유

### 9.2 chrome

- `CHR-01` sidebar 접힘
- `CHR-02` sidebar 열림/backdrop
- `CHR-03` account menu
- `CHR-04` 접수 topbar
- `CHR-05` 완료 topbar + archive
- `CHR-06` 관리 section title
- `CHR-07` mobile FAB 닫힘/열림

### 9.3 주문

- `ORD-01` loading/empty
- `ORD-02` NEW card
- `ORD-03` COOKING card
- `ORD-04` DONE card
- `ORD-05` pinned
- `ORD-06` elapsed warning/urgent
- `ORD-07` delivery/takeout/dine
- `ORD-08` allergy
- `ORD-09` AI action + human check + raw request
- `ORD-10` 긴 메뉴명/다중 option
- `ORD-11` 부분 progress
- `ORD-12` context menu
- `ORD-13` detail dialog
- `ORD-14` remove/clear dialog
- `ORD-15` pull-to-refresh pulling/ready/refreshing/done
- `ORD-16` short stack/wide/xwide columns

### 9.4 store/tasks/staff/settings

- `STORE-01` OPEN
- `STORE-02` PAUSED + stepper
- `STORE-03` CLOSED
- `TASK-01` loading/empty
- `TASK-02` normal/idle/selected/delayed tile
- `TASK-03` history normal/delayed/done
- `TASK-04` add/edit dialog
- `TASK-05` delete confirm
- `STAFF-01` loading/empty/error
- `STAFF-02` list desktop/mobile
- `STAFF-03` add/created PIN
- `STAFF-04` edit/reissue PIN
- `STAFF-05` activate/deactivate
- `SET-01` 기본 설정
- `SET-02` notification disabled
- `SET-03` breaktime disabled/enabled
- `SET-04` time range open/error
- `SET-05` change password

### 9.5 support/chatbot

- `SUP-01` FAQ 기본/category
- `SUP-02` search result/highlight
- `SUP-03` no result CTA
- `SUP-04` accordion open
- `CHAT-01` initial categories
- `CHAT-02` guided steps/terminal actions
- `CHAT-03` user/bot/AI/agent messages
- `CHAT-04` typing
- `CHAT-05` waiting/cancel
- `CHAT-06` closed/new session
- `CHAT-07` minimized
- `CHAT-08` mobile bottom sheet/desktop panel

### 9.6 통계

- `STAT-01` dashboard 전체
- `STAT-02` date picker single/range
- `STAT-03` chart compare popover/tooltip
- `STAT-04` loading
- `STAT-05` 5개 필수 viewport

모든 상태는 기본적으로 360×800과 1280×800에서 캡처한다. breakpoint 영향이 큰 대표 상태는 320, 768, 1024에서도 추가 캡처한다.

## 10. 검증 명령과 산출물

### 10.1 자동 검사

```bash
cd /Users/mac/Documents/DeepOrder_V2
npm --workspace kds-web run check
git diff --check
```

`kds-web` 단독 저장소라면:

```bash
cd /Users/mac/Documents/DeepOrder_V2/kds-web
npm run typecheck
npm run lint
npm run check:architecture
npm run build
```

### 10.2 Phase별 필수 산출물

- 변경 파일 목록
- reference/latest before/after screenshot
- pixel diff image와 비율
- 실행한 검사 명령과 결과
- 남은 mismatch 목록
- 승인된 deviation 목록
- 마지막 정상 commit

### 10.3 최종 산출물

- 변경 patch 또는 branch
- `design-port-validation-report.md`
- 화면 상태별 pass/fail matrix
- 통계 보호 audit
- architecture/static scan 결과
- 남은 미승인 deviation 0건 확인서

## 11. 브랜치와 커밋 권장안

```text
design/port-lagacy-ui-onto-latest-architecture
```

권장 커밋:

1. `docs: freeze attached design port baselines`
2. `test: add deterministic visual comparison fixtures`
3. `style: map legacy visual tokens without stats regression`
4. `style: add opt-in compact primitives and blocks`
5. `style: restore kds shell and navigation chrome`
6. `style: restore auth experience`
7. `style: restore order board and cards`
8. `style: restore overlays and store status`
9. `style: restore tasks staff and settings`
10. `style: restore support and chatbot`
11. `style: align stats layout without redesign`
12. `chore: close visual and architecture validation`

각 commit은 최소 `check:architecture` 통과 상태여야 한다. Phase 종료 commit은 전체 `check`까지 통과해야 한다.

## 12. 주요 위험과 차단 방법

| 위험 | 차단 방법 |
| --- | --- |
| 레거시 CSS 복사 | CSS 1개 gate와 architecture check |
| 공용 Card/Button default 변경으로 통계 변화 | opt-in variant, stats baseline screenshot |
| global token 변경으로 통계 portal 색 변화 | stats root와 portal scoped token guard |
| 주문 카드 높이 변화로 column 배치 회귀 | short/wide/xwide fixture와 bounding-box 검사 |
| sidebar를 레거시 DOM으로 되돌려 접근성 저하 | 현재 Button/Radix/ARIA 유지 |
| 자체 modal/popover 복원 | Radix 유지, visual class만 변경 |
| Ant Design TimePicker 복원 | 최신 TimeRangeField 유지 |
| support 컴포넌트 재결합 | 현재 하위 컴포넌트 책임 유지 |
| 화면 일부 상태 누락 | ID 기반 필수 상태 matrix, 미실행은 FAIL |
| pixel ratio만 맞추고 국소 mismatch 방치 | heatmap 수동 검토와 landmark 측정 병행 |
| 디자인 작업 중 API/model 수정 | baseline hash와 allowed-path audit |

## 13. 최종 완료 선언 문구

아래 조건이 전부 참일 때만 “레거시 디자인이 최신 아키텍처에 완전히 이식되었다”고 선언한다.

```text
1. 첨부 기준본 SHA-256이 일치한다.
2. 모든 architecture/type/lint/build 검사가 통과했다.
3. 금지 파일과 비UI 로직에 승인되지 않은 변경이 없다.
4. 필수 화면·상태 matrix가 전부 실행되어 PASS했다.
5. 시각 diff, geometry, typography, color 허용치를 모두 충족했다.
6. 기능/API/console 회귀가 없다.
7. 모든 필수 viewport와 breakpoint 경계가 통과했다.
8. critical/serious 접근성 위반이 없다.
9. 통계 페이지에는 허용된 layout/typography 변경만 존재한다.
10. 미승인 deviation과 미검증 상태가 0개다.
```

“대부분 비슷함”, “주요 화면만 확인”, “빌드만 성공”, “모바일은 추후 확인”, “통계는 공용 token이라 어쩔 수 없이 달라짐”은 완료로 인정하지 않는다.