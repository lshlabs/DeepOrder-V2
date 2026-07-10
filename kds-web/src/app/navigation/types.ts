import type { LucideIcon } from "lucide-react";

export type KdsSectionId =
  | "RECEIVED"
  | "DONE"
  | "MY_TASKS"
  | "STAFF"
  | "STATS"
  | "SETTINGS"
  | "SUPPORT";

export type KdsSectionMetadata = {
  id: KdsSectionId;
  label: string;
  sidebarLabel: string;
  icon: LucideIcon;
  managerOnly: boolean;
  showInTopbar: boolean;
  showInSidebar: boolean;
  sidebarRootId: KdsSectionId;
};
