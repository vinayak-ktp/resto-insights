// ============================================================
// Date Utilities
// ============================================================

import { parse, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid, addDays } from 'date-fns';

// Parse Zomato CSV date formats
const MONTHLY_REGEX = /^([A-Za-z]{3})\s+(\d{4})$/;       // "Mar 2026"
const DAILY_REGEX = /^(\d{1,2})\s+([A-Za-z]{3}),\s*(\d{4})$/;  // "09 Jun, 2026"

export function parseCsvDate(dateStr: string): { date: Date; isMonthly: boolean } | null {
  const trimmed = dateStr.trim();

  // Try monthly format: "Mar 2026"
  const monthMatch = trimmed.match(MONTHLY_REGEX);
  if (monthMatch) {
    const date = parse(`01 ${monthMatch[1]} ${monthMatch[2]}`, 'dd MMM yyyy', new Date());
    if (isValid(date)) {
      return { date, isMonthly: true };
    }
  }

  // Try daily format: "09 Jun, 2026"
  const dayMatch = trimmed.match(DAILY_REGEX);
  if (dayMatch) {
    const date = parse(`${dayMatch[1]} ${dayMatch[2]} ${dayMatch[3]}`, 'd MMM yyyy', new Date());
    if (isValid(date)) {
      return { date, isMonthly: false };
    }
  }

  return null;
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(isoDate: string, granularity: 'daily' | 'weekly' | 'monthly'): string {
  const date = new Date(isoDate);
  switch (granularity) {
    case 'daily':
      return format(date, 'dd MMM yyyy');
    case 'weekly':
      return `${format(date, 'dd MMM')} – ${format(addDays(date, 6), 'dd MMM yyyy')}`;
    case 'monthly':
      return format(date, 'MMM yyyy');
  }
}

export function getWeekKey(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return toISODate(weekStart);
}

export function getMonthKey(date: Date): string {
  const monthStart = startOfMonth(date);
  return toISODate(monthStart);
}

export function getWeekRange(weekKey: string): { start: Date; end: Date } {
  const date = new Date(weekKey);
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(monthKey: string): { start: Date; end: Date } {
  const date = new Date(monthKey);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function isDateColumn(columnName: string): boolean {
  return parseCsvDate(columnName) !== null;
}

export function sortDatesAsc(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}
