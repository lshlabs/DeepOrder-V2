import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { DatePicker, type PickerMode } from "./dashboard/DatePicker";

export function StatsDatePicker() {
  const [mode, setMode] = useState<PickerMode>("single");
  const [date, setDate] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();

  function handleModeChange(nextMode: PickerMode) {
    setMode(nextMode);
    setDate(undefined);
    setRange(undefined);
  }

  return (
    <DatePicker
      date={date}
      dateRange={range}
      mode={mode}
      onDateChange={setDate}
      onDateRangeChange={setRange}
      onModeChange={handleModeChange}
      placeholder="클릭하여 날짜를 선택하세요"
    />
  );
}
