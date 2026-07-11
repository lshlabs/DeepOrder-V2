import { createAuthHeaders, request } from "@/lib/api";

import type {
  ArchiveCompletedOrdersResponse,
  HideOrderResponse,
  KdsOrdersResponse,
  OrderItemProgressResponse,
  OrderStatus,
  UpdateOrderItemProgressRequest,
} from "../types";

/* MOCK_MODE_START: 백엔드 미연결시 mock fallback. 제거하려면 이 import와 각 함수의 catch 블록을 삭제 */
import {
  mockArchiveCompletedOrdersResponse,
  mockHideOrderResponse,
  mockKdsOrdersResponse,
  mockOrderItemProgressResponse,
  mockUpdateOrderStatusResponse,
} from "./mock-orders-data";

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}
/* MOCK_MODE_END */

export async function apiGetKdsOrders(accessToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<KdsOrdersResponse>("/api/kds/orders", { headers: createAuthHeaders(accessToken) });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockKdsOrdersResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateOrderStatus(accessToken: string, orderId: number, status: OrderStatus) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<{ id: number; status: OrderStatus }>(`/api/orders/${orderId}/status`, {
    method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify({ status }),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockUpdateOrderStatusResponse(orderId, status);
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiHideOrder(accessToken: string, orderId: number) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<HideOrderResponse>(`/api/kds/orders/${orderId}/hide`, {
    method: "PATCH", headers: createAuthHeaders(accessToken),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return { ...mockHideOrderResponse, orderId };
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiArchiveCompletedOrders(accessToken: string) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<ArchiveCompletedOrdersResponse>("/api/kds/orders/archive-completed", {
    method: "POST", headers: createAuthHeaders(accessToken),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockArchiveCompletedOrdersResponse;
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateOrderItemProgress(accessToken: string, orderItemId: number, payload: UpdateOrderItemProgressRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<OrderItemProgressResponse>(`/api/kds/order-items/${orderItemId}/progress`, {
    method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockOrderItemProgressResponse(orderItemId, payload);
    throw error;
  }
  /* MOCK_MODE_END */
}
export async function apiUpdateOrderItemOptionProgress(accessToken: string, orderItemId: number, optionIndex: number, payload: UpdateOrderItemProgressRequest) {
  /* MOCK_MODE_START */
  try {
  /* MOCK_MODE_END */
  return await request<OrderItemProgressResponse>(`/api/kds/order-items/${orderItemId}/options/${optionIndex}/progress`, {
    method: "PATCH", headers: createAuthHeaders(accessToken), body: JSON.stringify(payload),
  });
  /* MOCK_MODE_START */
  } catch (error) {
    if (isNetworkError(error)) return mockOrderItemProgressResponse(orderItemId, payload, optionIndex);
    throw error;
  }
  /* MOCK_MODE_END */
}
