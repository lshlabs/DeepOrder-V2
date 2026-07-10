import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addMinutes, durationWithinDay, formatTime, parseTime } from "../lib/time-range";

type TimeRangeFieldProps = {
  disabled?: boolean;
  durationMinutes: number;
  startHour: number;
  startMinute: number;
  onChange: (value: { startHour: number; startMinute: number; durationMinutes: number }) => void;
};

export function TimeRangeField({
  disabled = false,
  durationMinutes,
  startHour,
  startMinute,
  onChange,
}: TimeRangeFieldProps) {
  const canonicalStart = formatTime(startHour, startMinute);
  const canonicalEnd = addMinutes(startHour, startMinute, durationMinutes);
  const [start, setStart] = useState(canonicalStart);
  const [end, setEnd] = useState(canonicalEnd);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStart(canonicalStart);
    setEnd(canonicalEnd);
    setError(null);
  }, [canonicalEnd, canonicalStart]);

  function commit(nextStart: string, nextEnd: string) {
    const parsedStart = parseTime(nextStart);
    const nextDuration = durationWithinDay(nextStart, nextEnd);
    if (!parsedStart || !nextDuration) {
      setError("시작과 종료 시간은 서로 달라야 합니다.");
      return;
    }
    setError(null);
    onChange({
      startHour: parsedStart.hour,
      startMinute: parsedStart.minute,
      durationMinutes: Math.max(5, nextDuration),
    });
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="breaktime-start">시작</Label>
          <Input
            disabled={disabled}
            id="breaktime-start"
            onChange={(event) => {
              const value = event.target.value;
              setStart(value);
              commit(value, end);
            }}
            step={300}
            type="time"
            value={start}
          />
        </div>
        <span className="pb-2 text-sm text-muted-foreground">—</span>
        <div className="space-y-1.5">
          <Label htmlFor="breaktime-end">종료</Label>
          <Input
            disabled={disabled}
            id="breaktime-end"
            onChange={(event) => {
              const value = event.target.value;
              setEnd(value);
              commit(start, value);
            }}
            step={300}
            type="time"
            value={end}
          />
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
