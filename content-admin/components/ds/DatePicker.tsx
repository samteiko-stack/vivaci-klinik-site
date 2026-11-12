"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  formatDisplayDate,
  formatMonthLabel,
  getCalendarDays,
  getWeekdayLabels,
  isAfterIso,
  isBeforeIso,
  parseIso,
  todayIso,
} from "@/lib/date-utils";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  clearable?: boolean;
  /** Inline expands the calendar in document flow (for nested menus). Default is popover. */
  mode?: "popover" | "inline";
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled,
  id,
  className,
  clearable = true,
  mode = "popover",
}: DatePickerProps) {
  const t = useTranslations("common");
  const resolvedPlaceholder = placeholder ?? t("selectDate");
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseIso(value);
  const initialMonth = selected ?? parseIso(min ?? "") ?? new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  useEffect(() => {
    if (!open || !selected) return;
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [open, value, selected]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayIso();
  const displayValue = value ? formatDisplayDate(value) : "";

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function isDisabledDay(iso: string): boolean {
    if (min && isBeforeIso(iso, min)) return true;
    if (max && isAfterIso(iso, max)) return true;
    return false;
  }

  function selectDay(iso: string) {
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
  }

  const isInline = mode === "inline";

  return (
    <div ref={rootRef} className={cn("ds-date-picker", isInline && "ds-date-picker--inline", className)}>
      <div className={cn("ds-date-picker__trigger", open && "ds-date-picker__trigger--open", disabled && "ds-date-picker__trigger--disabled")}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="ds-date-picker__trigger-btn"
          onClick={() => setOpen((current) => !current)}
        >
          <span className={cn("ds-date-picker__value", !displayValue && "ds-date-picker__value--placeholder")}>
            {displayValue || resolvedPlaceholder}
          </span>
          <CalendarDays className="ds-date-picker__icon" strokeWidth={1.75} aria-hidden />
        </button>
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label={t("clearDate")}
            className="ds-date-picker__clear"
            onClick={() => onChange("")}
          >
            <X className="ds-icon-2xs" />
          </button>
        )}
      </div>

      {open && (
        <div className="ds-date-picker__panel" role="dialog" aria-label="Choose date">
          <div className="ds-date-picker__header">
            <button
              type="button"
              className="ds-date-picker__nav"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="ds-icon-sm" />
            </button>
            <span className="ds-date-picker__month">{formatMonthLabel(viewYear, viewMonth)}</span>
            <button
              type="button"
              className="ds-date-picker__nav"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="ds-icon-sm" />
            </button>
          </div>

          <div className="ds-date-picker__weekdays" aria-hidden>
            {getWeekdayLabels().map((label) => (
              <span key={label} className="ds-date-picker__weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="ds-date-picker__grid">
            {days.map((day) => {
              const isSelected = day.iso === value;
              const isToday = day.iso === today;
              const isDisabled = isDisabledDay(day.iso);

              return (
                <button
                  key={day.iso}
                  type="button"
                  disabled={isDisabled}
                  aria-label={formatDisplayDate(day.iso)}
                  aria-pressed={isSelected}
                  className={cn(
                    "ds-date-picker__day",
                    !day.inMonth && "ds-date-picker__day--muted",
                    isSelected && "ds-date-picker__day--selected",
                    isToday && !isSelected && "ds-date-picker__day--today",
                  )}
                  onClick={() => selectDay(day.iso)}
                >
                  {parseIso(day.iso)?.getDate()}
                </button>
              );
            })}
          </div>

          <div className="ds-date-picker__footer">
            <button
              type="button"
              className="ds-date-picker__today"
              disabled={isDisabledDay(today)}
              onClick={() => selectDay(today)}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
