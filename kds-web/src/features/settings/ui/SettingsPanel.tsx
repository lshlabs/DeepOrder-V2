import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
          <RadioGroup
            className="flex flex-wrap gap-2"
            disabled={disabled || !settings.notificationsEnabled}
            onValueChange={(value) => onUpdate({ sound: value as SoundOption })}
            value={settings.sound}
          >
            {SOUND_OPTIONS.map((option) => (
              <div className="flex items-center gap-2" key={option.value}>
                <RadioGroupItem id={`sound-${option.value}`} value={option.value} />
                <Label htmlFor={`sound-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
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
    <section aria-labelledby={`settings-${title}`} className="space-y-2">
      <h2 className="text-sm font-semibold" id={`settings-${title}`}>{title}</h2>
      <div className="rounded-lg border bg-card px-4">{children}</div>
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
      <div className={vertical ? "space-y-4 py-4" : "flex items-center justify-between gap-4 py-4"}>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={vertical ? "max-w-md" : "shrink-0"}>{children}</div>
      </div>
      <Separator className="last:hidden" />
    </>
  );
}
