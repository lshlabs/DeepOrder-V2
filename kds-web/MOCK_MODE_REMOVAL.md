# Mock mode 제거 가이드

백엔드가 연결된 이후에는 아래 4개 API 파일에서 `MOCK_MODE_START` / `MOCK_MODE_END` 주석 블록을 삭제하고,
mock 데이터 파일 4개를 제거하면 된다.

---

## 1. API 파일 수정 (4개)

각 파일마다 다음 작업을 수행:

### a) `src/features/auth/api/auth-api.ts`

- 상단 import에서 `mockAuthResponse`, `mockCurrentUserResponse` 등 5개 import 라인 삭제
- `isNetworkError` 함수 삭제
- 각 함수(`apiLogin`, `apiRegister`, `apiCheckIdentifier`, `apiRefresh`, `apiLogout`, `apiGetCurrentUser`)의
  `try {`, `} catch (error) { ... }` 및 주석을 제거하고 `return await request<T>(...)` 를 `return request<T>(...)` 로 되돌림

### b) `src/features/orders/api/orders-api.ts`

- 상단 import에서 `mock*` import 라인 삭제
- `isNetworkError` 함수 삭제
- 각 함수(`apiGetKdsOrders`, `apiUpdateOrderStatus`, `apiHideOrder`, `apiArchiveCompletedOrders`,
  `apiUpdateOrderItemProgress`, `apiUpdateOrderItemOptionProgress`)의 try/catch 및 주석 제거,
  `return await request<T>(...)` 를 `return request<T>(...)` 로 되돌림

### c) `src/features/staff/api/staff-api.ts`

- 상단 import에서 `mock*` import 라인 삭제
- `isNetworkError` 함수 삭제
- 각 함수(`apiGetStaff`, `apiCreateStaff`, `apiUpdateStaff`, `apiUpdateStaffActive`, `apiRegenerateStaffPin`)의
  try/catch 및 주석 제거, `return await request<T>(...)` 를 `return request<T>(...)` 로 되돌림

### d) `src/features/tasks/api/tasks-api.ts`

- 상단 import에서 `mockAssignedMenusResponse` import 라인 삭제
- `isNetworkError` 함수 삭제
- 각 함수(`apiGetAssignedMenus`, `apiCreateAssignedMenu`, `apiUpdateAssignedMenu`, `apiDeleteAssignedMenu`)의
  try/catch 및 주석 제거,
  - `apiGetAssignedMenus`: `return await request<T>(...)` → `return request<T>(...)`
  - 나머지 3개: `return await request<void>(...)` → `return request<void>(...)`, `return undefined as void` 제거

---

## 2. Mock 데이터 파일 삭제 (4개)

```
rm src/features/auth/api/mock-auth-data.ts
rm src/features/orders/api/mock-orders-data.ts
rm src/features/staff/api/mock-staff-data.ts
rm src/features/tasks/api/mock-tasks-data.ts
```

---

## 3. 최종 검증

```bash
npx tsc --noEmit
npx vite build
```
