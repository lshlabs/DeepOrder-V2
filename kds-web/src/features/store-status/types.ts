export type StoreStatus = "OPEN" | "PAUSED" | "CLOSED";
export type StoreStatusSource = "MANUAL" | "BREAKTIME";
export type KdsStoreContext = { storeId: string; storeName: string; operatingStatus: StoreStatus; pausedUntil: string | null; statusSource: StoreStatusSource };
export type UpdateStoreStatusRequest = { operatingStatus: StoreStatus; pauseMinutes?: number };
