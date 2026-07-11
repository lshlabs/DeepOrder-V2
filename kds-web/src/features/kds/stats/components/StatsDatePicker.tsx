import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { DatePicker, type PickerMode } from "../dashboard/components/DatePicker";

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
      mode={mode}
      onModeChange={handleModeChange}
      date={date}
      onDateChange={setDate}
      dateRange={range}
      onDateRangeChange={setRange}
      placeholder="클릭하여 날짜를 선택하세요"
    />
  );
}
