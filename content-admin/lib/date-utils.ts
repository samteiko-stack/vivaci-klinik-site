const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatDisplayDate(value: string): string {
  const date = parseIso(value);
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export interface CalendarDay {
  iso: string;
  inMonth: boolean;
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: toLocalIso(date),
      inMonth: date.getMonth() === month,
    };
  });
}

export function isBeforeIso(a: string, b: string): boolean {
  return a < b;
}

export function isAfterIso(a: string, b: string): boolean {
  return a > b;
}

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAYS;
}

export function todayIso(): string {
  return toLocalIso(new Date());
}

/** Absolute local date + time for CRM logs, e.g. "5 Aug 2026, 17:08". */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time for activity timelines, e.g. "12 hours ago". */
export interface RelativeTimeLabels {
  justNow?: string;
  minutesAgo?: (count: number) => string;
  hoursAgo?: (count: number) => string;
  daysAgo?: (count: number) => string;
  formatDateTime?: (value: Date) => string;
}

export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  labels?: RelativeTimeLabels
): string {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return labels?.justNow ?? "just now";
  if (mins < 60) {
    return labels?.minutesAgo?.(mins) ?? `${mins} minute${mins === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return labels?.hoursAgo?.(hours) ?? `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return labels?.daysAgo?.(days) ?? `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return labels?.formatDateTime?.(date) ?? formatDateTime(date);
}
