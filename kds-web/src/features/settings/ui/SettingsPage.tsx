import { PageHeader, PageSection } from "@/components/blocks";

import type { SettingsState } from "../types";
import { SettingsPanel } from "./SettingsPanel";

type SettingsPageProps = {
  disabled?: boolean;
  settings: SettingsState;
  onChangePasswordClick: () => void;
  onUpdate: (partial: Partial<SettingsState>) => void;
};

export function SettingsPage(props: SettingsPageProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader description="운영 환경과 알림, 브레이크타임을 관리합니다." title="설정" />
        <PageSection>
          <SettingsPanel {...props} />
        </PageSection>
      </div>
    </main>
  );
}
