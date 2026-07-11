/* MOCK_MODE: 백엔드 미연결시 사용하는 mock 데이터. 제거하려면 이 파일과 tasks-api.ts의 networkError 핸들링 부분을 함께 삭제 */
import type { AssignedMenuListResponse } from "../types";

let nextMenuId = 50;

export const mockAssignedMenusResponse: AssignedMenuListResponse = {
  menus: [
    { id: 1, menuName: "김치찌개", normalizedMenuName: "김치찌개", sortOrder: 0 },
    { id: 2, menuName: "된장찌개", normalizedMenuName: "된장찌개", sortOrder: 1 },
    { id: 3, menuName: "제육볶음", normalizedMenuName: "제육볶음", sortOrder: 2 },
  ],
};

export function mockCreateMenuId(): number {
  return nextMenuId++;
}
