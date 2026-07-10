import { TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { Button } from "../../../../components/ui/button";
import { diffMinutesWithinDay } from "../../orders/lib/orderFormatters";
import type { SettingsState, SoundOption } from "../../types";

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
  const breaktimeRangeStart = dayjs().hour(settings.breaktime.startHour).minute(settings.breaktime.startMinute).second(0);
  const breaktimeRangeValue: [Dayjs, Dayjs] = [
    breaktimeRangeStart,
    breaktimeRangeStart.add(settings.breaktime.durationMinutes, "minute"),
  ];

  return (
    <section className="kds-panel kds-panel--settings" aria-label="설정">
      <div className="kds-panel-header">
        <div>
          <h2 className="kds-panel-title">설정</h2>
          <p className="kds-panel-subtitle">운영 환경 및 알림 설정</p>
        </div>
      </div>

      <div className="kds-section-divider">
        <span className="kds-section-label">알림</span>
      </div>
      <div className="kds-settings-rows flex flex-col">
        <div className="kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5">
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">알림 활성화</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">주문 도착 시 알림을 받습니다</span>
          </div>
          <button
            className={`kds-toggle relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
              settings.notificationsEnabled
                ? "on border-[var(--color-accent-border)] bg-[var(--color-accent)]"
                : "border-border bg-[var(--color-surface-3)]"
            }`}
            disabled={disabled}
            onClick={() => onUpdate({ notificationsEnabled: !settings.notificationsEnabled })}
            type="button"
            role="switch"
            aria-checked={settings.notificationsEnabled}
          >
            <span
              className={`kds-toggle-knob block h-5 w-5 rounded-full shadow-sm transition-transform ${
                settings.notificationsEnabled
                  ? "translate-x-5 bg-white"
                  : "translate-x-0 bg-[#b4b9c2]"
              }`}
            />
          </button>
        </div>

        <div className="kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5 last:border-b-0">
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">알림 사운드</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">주문 도착 시 재생할 사운드</span>
          </div>
          <div className="kds-segmented inline-flex rounded-md border border-border bg-muted p-0.5">
            {SOUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`kds-segmented-btn h-7 rounded-sm px-2.5 text-xs font-medium transition-colors ${
                  settings.sound === opt.value
                    ? "active bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
                disabled={disabled || !settings.notificationsEnabled}
                onClick={() => onUpdate({ sound: opt.value })}
                type="button"
              >{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="kds-section-divider">
        <span className="kds-section-label">브레이크타임</span>
      </div>
      <div className="kds-settings-rows flex flex-col">
        <div className="kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5">
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">브레이크타임 사용</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">설정한 시간 동안 주문 접수를 일시 중지합니다</span>
          </div>
          <button
            className={`kds-toggle relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
              settings.breaktime.enabled
                ? "on border-[var(--color-accent-border)] bg-[var(--color-accent)]"
                : "border-border bg-[var(--color-surface-3)]"
            }`}
            disabled={disabled}
            onClick={() => onUpdate({ breaktime: { ...settings.breaktime, enabled: !settings.breaktime.enabled } })}
            type="button"
            role="switch"
            aria-checked={settings.breaktime.enabled}
            aria-label="브레이크타임 사용"
          >
            <span
              className={`kds-toggle-knob block h-5 w-5 rounded-full shadow-sm transition-transform ${
                settings.breaktime.enabled
                  ? "translate-x-5 bg-white"
                  : "translate-x-0 bg-[#b4b9c2]"
              }`}
            />
          </button>
        </div>

        <div
          className={`kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5 last:border-b-0 ${
            !settings.breaktime.enabled ? "kds-settings-row--disabled opacity-45 pointer-events-none" : ""
          }`}
        >
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">브레이크타임 시간</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">주문 접수를 중지할 시간 설정</span>
          </div>
          <div className="kds-settings-inline-picker ml-auto min-w-0 max-w-80 flex-1">
            <TimePicker.RangePicker
              id="bt-range"
              allowClear={false}
              className="kds-time-range-picker"
              disabled={disabled || !settings.breaktime.enabled}
              format="HH:mm"
              inputReadOnly
              minuteStep={5}
              needConfirm
              placeholder={["Start time", "End time"]}
              value={breaktimeRangeValue}
              onChange={(value) => {
                if (!value || !value[0] || !value[1]) {
                  return;
                }
                const nextStartHour = value[0].hour();
                const nextStartMinute = value[0].minute();
                const nextDuration = diffMinutesWithinDay(value[0], value[1]);
                onUpdate({
                  breaktime: {
                    ...settings.breaktime,
                    startHour: nextStartHour,
                    startMinute: nextStartMinute,
                    durationMinutes: Math.max(5, nextDuration),
                  },
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="kds-section-divider">
        <span className="kds-section-label">주문 처리</span>
      </div>
      <div className="kds-settings-rows flex flex-col">
        <div className="kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5 last:border-b-0">
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">주문 자동수락</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">
              {settings.autoAccept ? "주문 수신 즉시 진행중 표시" : "수락 버튼을 눌러야 진행중 표시"}
            </span>
          </div>
          <button
            className={`kds-toggle relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
              settings.autoAccept
                ? "on border-[var(--color-accent-border)] bg-[var(--color-accent)]"
                : "border-border bg-[var(--color-surface-3)]"
            }`}
            disabled={disabled}
            onClick={() => onUpdate({ autoAccept: !settings.autoAccept })}
            type="button"
            role="switch"
            aria-checked={settings.autoAccept}
          >
            <span
              className={`kds-toggle-knob block h-5 w-5 rounded-full shadow-sm transition-transform ${
                settings.autoAccept
                  ? "translate-x-5 bg-white"
                  : "translate-x-0 bg-[#b4b9c2]"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="kds-section-divider">
        <span className="kds-section-label">계정</span>
      </div>
      <div className="kds-settings-rows flex flex-col">
        <div className="kds-settings-row flex items-center justify-between gap-3 border-b border-border py-3.5 last:border-b-0">
          <div className="kds-settings-row-info flex flex-col gap-0.5">
            <span className="kds-settings-row-label text-[13px] font-medium text-foreground">비밀번호 변경</span>
            <span className="kds-settings-row-desc text-xs text-muted-foreground">변경 후 자동 로그아웃됩니다</span>
          </div>
          <Button className="kds-btn-ghost kds-btn-sm h-8 rounded-md border border-border bg-background px-3 text-xs font-medium text-[var(--color-text-subtle)] hover:bg-muted" disabled={disabled} onClick={onChangePasswordClick} type="button" variant="outline">변경</Button>
        </div>
      </div>
    </section>
  );
}
