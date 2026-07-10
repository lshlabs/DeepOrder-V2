import {
  BarChart2,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  ListTodo,
  Settings,
  Users,
} from "lucide-react";

import type { KdsSectionId, KdsSectionMetadata } from "@/app/navigation/types";

export const KDS_SECTIONS = [
  {
    id: "RECEIVED",
    label: "접수",
    sidebarLabel: "업무",
    icon: ClipboardList,
    managerOnly: false,
    showInTopbar: true,
    showInSidebar: true,
    sidebarRootId: "RECEIVED",
  },
  {
    id: "DONE",
    label: "완료",
    sidebarLabel: "완료",
    icon: CheckCircle2,
    managerOnly: false,
    showInTopbar: true,
    showInSidebar: false,
    sidebarRootId: "RECEIVED",
  },
  {
    id: "MY_TASKS",
    label: "내 업무",
    sidebarLabel: "내 업무",
    icon: ListTodo,
    managerOnly: false,
    showInTopbar: true,
    showInSidebar: false,
    sidebarRootId: "RECEIVED",
  },
  {
    id: "STAFF",
    label: "직원 관리",
    sidebarLabel: "직원",
    icon: Users,
    managerOnly: true,
    showInTopbar: false,
    showInSidebar: true,
    sidebarRootId: "STAFF",
  },
  {
    id: "STATS",
    label: "통계",
    sidebarLabel: "통계",
    icon: BarChart2,
    managerOnly: true,
    showInTopbar: false,
    showInSidebar: true,
    sidebarRootId: "STATS",
  },
  {
    id: "SETTINGS",
    label: "설정",
    sidebarLabel: "설정",
    icon: Settings,
    managerOnly: true,
    showInTopbar: false,
    showInSidebar: true,
    sidebarRootId: "SETTINGS",
  },
  {
    id: "SUPPORT",
    label: "고객지원",
    sidebarLabel: "고객지원",
    icon: HelpCircle,
    managerOnly: false,
    showInTopbar: false,
    showInSidebar: true,
    sidebarRootId: "SUPPORT",
  },
] as const satisfies readonly KdsSectionMetadata[];

export const KDS_SECTION_BY_ID = Object.fromEntries(
  KDS_SECTIONS.map((section) => [section.id, section]),
) as Record<KdsSectionId, (typeof KDS_SECTIONS)[number]>;

export const KDS_SIDEBAR_SECTIONS = KDS_SECTIONS.filter(
  (section) => section.showInSidebar,
);

export const KDS_TOPBAR_SECTIONS = KDS_SECTIONS.filter(
  (section) => section.showInTopbar,
);

export function getKdsSection(sectionId: KdsSectionId) {
  return KDS_SECTION_BY_ID[sectionId];
}

export function isKdsWorkSection(sectionId: KdsSectionId) {
  return getKdsSection(sectionId).sidebarRootId === "RECEIVED";
}
