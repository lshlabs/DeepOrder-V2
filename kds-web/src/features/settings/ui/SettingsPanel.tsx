import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { SettingsState, SoundOption } from "../types";
import { TimeRangeField } from "./TimeRangeField";

const SOUND_OPTIONS: { value: SoundOption; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "bell", label: "벨" },
  { value: "chime", label: "차임" },
  { value: "beep", label: "비프" },
];

type SettingsPanelProps = {
  settings: SettingsState;
  onUpdate: (partial: Partial<SettingsState>) => void;
  onChangePasswordClick: () => void;
  disabled?: boolean;
};

export function SettingsPanel({
  settings,
  onUpdate,
  onChangePasswordClick,
  disabled = false,
}: SettingsPanelProps) {
  return (
    <div className="space-y-8">
      <SettingsGroup title="알림">
        <SettingsRow
          description="주문 도착 시 알림을 받습니다."
          label="알림 활성화"
        >
          <Switch
            aria-label="알림 활성화"
            checked={settings.notificationsEnabled}
            disabled={disabled}
            onCheckedChange={(checked) => onUpdate({ notificationsEnabled: checked })}
          />
        </SettingsRow>
        <SettingsRow
          description="주문 도착 시 재생할 사운드입니다."
          label="알림 사운드"
        >
          <SegmentedControl
            disabled={disabled || !settings.notificationsEnabled}
            onChange={(value) => onUpdate({ sound: value as SoundOption })}
            options={SOUND_OPTIONS}
            value={settings.sound}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="브레이크타임">
        <SettingsRow
          description="설정한 시간 동안 주문 접수를 일시 중지합니다."
          label="브레이크타임 사용"
        >
          <Switch
            aria-label="브레이크타임 사용"
            checked={settings.breaktime.enabled}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onUpdate({ breaktime: { ...settings.breaktime, enabled: checked } })
            }
          />
        </SettingsRow>
        <SettingsRow
          description="주문 접수를 중지할 시작과 종료 시간을 설정합니다."
          label="브레이크타임 시간"
          vertical
        >
          <TimeRangeField
            disabled={disabled || !settings.breaktime.enabled}
            durationMinutes={settings.breaktime.durationMinutes}
            onChange={(value) =>
              onUpdate({
                breaktime: {
                  ...settings.breaktime,
                  ...value,
                },
              })
            }
            startHour={settings.breaktime.startHour}
            startMinute={settings.breaktime.startMinute}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="주문 처리">
        <SettingsRow
          description={
            settings.autoAccept
              ? "주문 수신 즉시 진행중으로 표시합니다."
              : "수락 버튼을 눌러야 진행중으로 표시합니다."
          }
          label="주문 자동수락"
        >
          <Switch
            aria-label="주문 자동수락"
            checked={settings.autoAccept}
            disabled={disabled}
            onCheckedChange={(checked) => onUpdate({ autoAccept: checked })}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="계정">
        <SettingsRow
          description="변경이 완료되면 현재 세션에서 자동 로그아웃됩니다."
          label="비밀번호 변경"
        >
          <Button disabled={disabled} onClick={onChangePasswordClick} type="button" variant="outline">
            변경
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

type SettingsGroupProps = {
  children: React.ReactNode;
  title: string;
};

function SettingsGroup({ children, title }: SettingsGroupProps) {
  return (
    <section aria-labelledby={`settings-${title}`}>
      <div className="flex items-center border-b border-border pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground" id={`settings-${title}`}>
          {title}
        </span>
      </div>
      <div>{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  children: React.ReactNode;
  description: string;
  label: string;
  vertical?: boolean;
};

function SettingsRow({ children, description, label, vertical = false }: SettingsRowProps) {
  return (
    <>
      <div className={vertical ? "flex flex-col gap-3 py-[13px]" : "flex items-center justify-between gap-4 py-[13px]"}>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={vertical ? "" : "shrink-0"}>{children}</div>
      </div>
      <Separator className="last:hidden" />
    </>
  );
}

type SegmentedOption = { value: string; label: string };

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SegmentedControl({ options, value, onChange, disabled = false }: SegmentedControlProps) {
  return (
    <div className={`flex gap-0.5 rounded-[var(--radius)] border border-border bg-muted p-0.5 ${disabled ? "cursor-not-allowed opacity-35" : ""}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`rounded-[calc(var(--radius)-2px)] px-2.5 py-[3px] text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
