from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.models import (
    AccountType,
    AnalysisStatus,
    ApprovalStatus,
    OrderStatus,
    RiskLevel,
    StoreOperatingStatus,
    StoreStatusSource,
    SupportConversationMode,
    SupportConversationStatus,
    SupportEventActorType,
    SupportMessageSenderType,
    UserRole,
)


class WebhookOrderItemIn(BaseModel):
    name: str
    quantity: int = Field(gt=0)
    options: list[str] = Field(default_factory=list)
    unitPrice: int | None = Field(default=None, ge=0)
    totalPrice: int | None = Field(default=None, ge=0)


class WebhookOrderIn(BaseModel):
    orderId: str
    orderNumber: str
    customerRequest: str | None = None
    deliveryRequest: str | None = None
    orderedAt: datetime | None = None
    items: list[WebhookOrderItemIn] = Field(min_length=1)


class OrderWebhookIn(BaseModel):
    eventId: str
    eventType: Literal["ORDER_CREATED", "ORDER_CANCELLED"]
    platform: str
    storeId: str
    order: WebhookOrderIn


class WebhookResponse(BaseModel):
    result: Literal["PROCESSED", "DUPLICATE_EVENT"]
    eventId: str
    orderId: int | None = None
    message: str


class OrderItemOptionOut(BaseModel):
    id: str
    parentItemId: int
    label: str
    groupName: str | None = None
    optionName: str
    sortOrder: int
    targetQuantity: int
    completedQuantity: int
    done: bool = False
    doneAt: datetime | None = None
    doneByUserId: int | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    quantity: int
    targetQuantity: int
    completedQuantity: int
    options: list[OrderItemOptionOut]
    unit_price: int | None
    total_price: int | None
    done: bool = False
    doneAt: datetime | None = None
    doneByUserId: int | None = None


class OrderAIAnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    summary: str
    tags: list[str]
    cooking_notes: list[str] = Field(alias="cookingNotes")
    packing_notes: list[str] = Field(alias="packingNotes")
    delivery_notes: list[str] = Field(alias="deliveryNotes")
    kitchen_actions: list[dict[str, Any]] = Field(alias="kitchenActions")
    packing_actions: list[dict[str, Any]] = Field(alias="packingActions")
    ignored_requests: list[dict[str, Any]] = Field(alias="ignoredRequests")
    risk_level: RiskLevel = Field(alias="riskLevel")
    warnings: list[str]
    needs_human_check: bool = Field(alias="needsHumanCheck")
    analysis_status: AnalysisStatus = Field(alias="analysisStatus")


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    platform: str
    store_id: str
    external_order_id: str
    order_number: str
    status: OrderStatus
    customer_request: str | None
    delivery_request: str | None
    delivery_phone: str | None = Field(default=None, alias="deliveryPhone")
    delivery_zip_no: str | None = Field(default=None, alias="deliveryZipNo")
    delivery_road_address: str | None = Field(default=None, alias="deliveryRoadAddress")
    delivery_jibun_address: str | None = Field(default=None, alias="deliveryJibunAddress")
    delivery_address_detail: str | None = Field(default=None, alias="deliveryAddressDetail")
    ordered_at: datetime | None
    created_at: datetime
    updated_at: datetime
    hidden: bool = False
    hiddenAt: datetime | None = None
    archived: bool = False
    archivedAt: datetime | None = None
    items: list[OrderItemOut]
    ai_analysis: OrderAIAnalysisOut | None = Field(default=None, alias="aiAnalysis")


class KdsOrdersResponse(BaseModel):
    orders: list[OrderOut]


class KdsStatsSummaryOut(BaseModel):
    total_orders: int
    completed_orders: int
    completion_rate: float
    revenue: int
    average_completion_seconds: int | None = None
    delayed_orders: int
    peak_hour: str | None = None


class KdsStatsComparisonBucketOut(BaseModel):
    orders_delta: int | None = None
    orders_delta_rate: float | None = None
    revenue_delta: int | None = None
    revenue_delta_rate: float | None = None
    average_completion_seconds_delta: int | None = None


class KdsStatsComparisonOut(BaseModel):
    vs_yesterday: KdsStatsComparisonBucketOut
    vs_7d_average: KdsStatsComparisonBucketOut


class KdsStatsHourlyOut(BaseModel):
    hour: str
    orders: int
    revenue: int
    average_completion_seconds: int | None = None
    delayed_orders: int


class KdsStatsMenuOut(BaseModel):
    menu_name: str
    orders: int
    revenue: int
    average_completion_seconds: int | None = None
    delayed_orders: int
    yesterday_delta_rate: float | None = None
    seven_day_average_delta_rate: float | None = None


class KdsStatsKitchenOut(BaseModel):
    on_time_rate: float | None = None
    slowest_order_seconds: int | None = None
    bottleneck_hour: str | None = None
    bottleneck_menu: str | None = None


class KdsStatsResponse(BaseModel):
    date: str
    summary: KdsStatsSummaryOut
    comparison: KdsStatsComparisonOut
    hourly: list[KdsStatsHourlyOut]
    menus: list[KdsStatsMenuOut]
    kitchen: KdsStatsKitchenOut
    insights: list[str]


class UpdateOrderStatusIn(BaseModel):
    status: Literal["NEW", "COOKING", "DONE", "CANCELLED"]


class OrderStatusResponse(BaseModel):
    id: int
    status: OrderStatus


class ErrorResponse(BaseModel):
    detail: str | list[dict[str, Any]]


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    loginId: str = Field(min_length=4, max_length=32)
    password: str = Field(min_length=8, max_length=255)
    storeName: str = Field(min_length=1, max_length=120)
    storePhone: str | None = Field(default=None, max_length=32)
    zipNo: str | None = Field(default=None, max_length=16)
    roadAddress: str | None = Field(default=None, max_length=255)
    jibunAddress: str | None = Field(default=None, max_length=255)
    addressDetail: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    loginId: str = Field(min_length=4, max_length=32)
    password: str = Field(min_length=1, max_length=255)
    autoLogin: bool = False


class IdentifierAvailabilityResponse(BaseModel):
    available: bool
    message: str


class RefreshRequest(BaseModel):
    refreshToken: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refreshToken: str = Field(min_length=1)


class AuthUserOut(BaseModel):
    id: int
    loginId: str
    name: str
    role: UserRole
    accountType: AccountType | None = None
    approvalStatus: ApprovalStatus


class AuthStoreOut(BaseModel):
    id: int
    storeId: str
    storeName: str
    phone: str | None = None
    zipNo: str | None = None
    roadAddress: str | None = None
    jibunAddress: str | None = None
    addressDetail: str | None = None
    approvalStatus: ApprovalStatus


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    autoLogin: bool
    user: AuthUserOut
    store: AuthStoreOut


class CurrentUserResponse(BaseModel):
    user: AuthUserOut
    store: AuthStoreOut


class RegisterResponse(BaseModel):
    user: AuthUserOut
    store: AuthStoreOut


class RefreshResponse(BaseModel):
    accessToken: str


class AdminUserOut(BaseModel):
    id: int
    loginId: str
    name: str
    role: UserRole
    accountType: AccountType | None = None
    approvalStatus: ApprovalStatus
    createdAt: datetime
    store: AuthStoreOut


class UpdateApprovalStatusIn(BaseModel):
    approvalStatus: Literal["APPROVED", "REJECTED"]


class AdminStoreOptionOut(BaseModel):
    id: int | None = None
    storeId: str
    storeName: str
    approvalStatus: ApprovalStatus | None = None


class UpdateUserStoreIn(BaseModel):
    storeId: str = Field(min_length=1, max_length=64)
    storeName: str = Field(min_length=1, max_length=120)


class DeleteUserResponse(BaseModel):
    id: int
    deletedStoreId: str


class EmployeeLoginRequest(BaseModel):
    loginId: str = Field(min_length=4, max_length=32)
    pin: str = Field(min_length=4, max_length=32)
    autoLogin: bool = False


class ChangePasswordIn(BaseModel):
    currentPassword: str = Field(min_length=1, max_length=255)
    newPassword: str = Field(min_length=8, max_length=255)


class ChangePasswordResponse(BaseModel):
    message: str


class KdsStoreContextOut(BaseModel):
    storeId: str
    storeName: str
    operatingStatus: StoreOperatingStatus
    pausedUntil: datetime | None = None
    statusSource: StoreStatusSource


class UpdateStoreStatusIn(BaseModel):
    operatingStatus: Literal["OPEN", "PAUSED", "CLOSED"]
    pauseMinutes: int | None = Field(default=None, ge=1, le=1440)


class StoreSettingsOut(BaseModel):
    notificationsEnabled: bool
    notificationSound: str
    breaktimeEnabled: bool
    breaktimeStartHour: int
    breaktimeStartMinute: int
    breaktimeDurationMinutes: int
    autoAccept: bool


class UpdateStoreSettingsIn(BaseModel):
    notificationsEnabled: bool
    notificationSound: str = Field(min_length=1, max_length=32)
    breaktimeEnabled: bool
    breaktimeStartHour: int = Field(ge=0, le=23)
    breaktimeStartMinute: int = Field(ge=0, le=59)
    breaktimeDurationMinutes: int = Field(ge=5, le=1440)
    autoAccept: bool


class SupportMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_type: SupportMessageSenderType
    sender_id: int | None = None
    content: str
    metadata_json: dict[str, Any]
    client_message_id: str | None = None
    created_at: datetime
    read_at: datetime | None = None

    @field_serializer("created_at", "read_at")
    def serialize_datetime(self, value: datetime | None) -> str | None:
        return _serialize_utc_datetime(value)


class SupportConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: str
    user_id: int
    status: SupportConversationStatus
    mode: SupportConversationMode
    assigned_agent_id: int | None = None
    source: str
    summary: str | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    expires_at: datetime | None = None
    messages: list[SupportMessageOut] = Field(default_factory=list)

    @field_serializer("created_at", "updated_at", "closed_at", "expires_at")
    def serialize_datetime(self, value: datetime | None) -> str | None:
        return _serialize_utc_datetime(value)


def _serialize_utc_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat()


class CreateSupportConversationIn(BaseModel):
    source: str = Field(default="kds-web", min_length=1, max_length=64)


class SendSupportMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    client_message_id: str | None = Field(default=None, max_length=64)


class SupportConversationListOut(BaseModel):
    conversations: list[SupportConversationOut]


class SupportMessageListOut(BaseModel):
    messages: list[SupportMessageOut]


class CreateSupportEventIn(BaseModel):
    event_type: str = Field(min_length=1, max_length=64)
    payload: dict[str, Any] = Field(default_factory=dict)


class SupportEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    event_type: str
    payload_json: dict[str, Any]
    actor_type: SupportEventActorType
    actor_id: int | None = None
    created_at: datetime

    @field_serializer("created_at")
    def serialize_datetime(self, value: datetime | None) -> str | None:
        return _serialize_utc_datetime(value)


class SupportEventListOut(BaseModel):
    events: list[SupportEventOut]


class MarkSupportReadIn(BaseModel):
    last_read_message_id: int = Field(gt=0)


class SupportAgentQueueItemOut(BaseModel):
    conversation_id: int
    store_id: str
    user_id: int
    status: SupportConversationStatus
    mode: SupportConversationMode
    latest_message: SupportMessageOut | None = None
    latest_message_preview: str | None = None
    latest_message_sender_type: SupportMessageSenderType | None = None
    waiting_duration_seconds: int
    assigned_agent_id: int | None = None
    unread_count: int
    created_at: datetime
    updated_at: datetime
    summary: str | None = None

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: datetime | None) -> str | None:
        return _serialize_utc_datetime(value)


class SupportAgentQueueOut(BaseModel):
    conversations: list[SupportAgentQueueItemOut]


class AssignedMenuOut(BaseModel):
    id: int | str
    menuName: str
    normalizedMenuName: str
    sortOrder: int


class AssignedMenuListOut(BaseModel):
    menus: list[AssignedMenuOut]


class CreateAssignedMenuIn(BaseModel):
    menuName: str = Field(min_length=1, max_length=120)
    sortOrder: int | None = Field(default=None, ge=0)


class UpdateAssignedMenuIn(BaseModel):
    menuName: str = Field(min_length=1, max_length=120)
    sortOrder: int | None = Field(default=None, ge=0)


class StaffOut(BaseModel):
    id: int
    loginId: str
    name: str
    accountType: AccountType
    positionLabel: str | None = None
    active: bool


class StaffListOut(BaseModel):
    staff: list[StaffOut]


class StaffWithTemporaryPinOut(StaffOut):
    temporaryPin: str


class CreateStaffIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    loginId: str = Field(min_length=4, max_length=32)
    positionLabel: str | None = Field(default=None, max_length=120)


class UpdateStaffIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    loginId: str = Field(min_length=4, max_length=32)
    positionLabel: str | None = Field(default=None, max_length=120)


class UpdateStaffActiveIn(BaseModel):
    active: bool


class RegenerateStaffPinResponse(BaseModel):
    id: int
    temporaryPin: str


class HideOrderResponse(BaseModel):
    orderId: int
    hidden: bool


class ArchiveCompletedOrdersResponse(BaseModel):
    archivedCount: int


class UpdateOrderItemProgressIn(BaseModel):
    done: bool | None = None
    delta: int | None = None
    completedQuantity: int | None = Field(default=None, ge=0)


class OrderItemProgressOut(BaseModel):
    orderItemId: int
    optionIndex: int | None = None
    targetQuantity: int
    completedQuantity: int
    done: bool
    doneAt: datetime | None = None
    doneByUserId: int | None = None
