import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "../../../../../components/ui/button";
import { Calendar } from "../../../../../components/ui/calendar";
import { cn } from "../../../../../lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../../components/ui/popover";

export type PickerMode = "single" | "range";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  mode: PickerMode;
  onModeChange?: (mode: PickerMode) => void;
  placeholder?: string;
}

export function DatePicker({
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  mode,
  onModeChange,
  placeholder = "날짜를 선택하세요",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSingleSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    if (selectedDate) setOpen(false);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    onDateRangeChange?.(range);
    if (range?.from && range?.to) setOpen(false);
  };

  const getDisplayText = () => {
    if (mode === "single" && date) {
      return format(date, "PPP", { locale: ko });
    }
    if (mode === "range" && dateRange?.from) {
      if (!dateRange.to) {
        return `${format(dateRange.from, "M월 d일", { locale: ko })} ~`;
      }
      return `${format(dateRange.from, "M월 d일", { locale: ko })} ~ ${format(dateRange.to, "M월 d일", { locale: ko })}`;
    }
    return placeholder;
  };

  const hasValue = mode === "single" ? !!date : !!dateRange?.from;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex border-b border-border">
          <button
            onClick={() => onModeChange?.("single")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              mode === "single"
                ? "border-b-2 border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            단일 선택
          </button>
          <button
            onClick={() => onModeChange?.("range")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              mode === "range"
                ? "border-b-2 border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            기간 선택
          </button>
        </div>

        {mode === "single" ? (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSingleSelect}
            autoFocus
          />
        ) : (
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleRangeSelect}
            numberOfMonths={1}
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
