import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { Transaction } from '../types';

/** A budget period, [start, end) — end is exclusive */
export interface PeriodRange {
  start: Date;
  end: Date;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** The cutoff date for a given year/month, clamped to the last day if the month is shorter (e.g. day 31 in Feb) */
function cutoffDateFor(year: number, month: number, cutoffDay: number): Date {
  const day = Math.min(cutoffDay, lastDayOfMonth(year, month));
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Current budget period based on a monthly cutoff day (1-31).
 * The period runs from the most recent cutoff (inclusive) to the next one (exclusive).
 */
export function getCurrentPeriodRange(cutoffDay: number = 1, now: Date = new Date()): PeriodRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  const thisCutoff = cutoffDateFor(year, month, cutoffDay);

  if (now >= thisCutoff) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    return { start: thisCutoff, end: cutoffDateFor(nextYear, nextMonth, cutoffDay) };
  }

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return { start: cutoffDateFor(prevYear, prevMonth, cutoffDay), end: thisCutoff };
}

/** First Saturday at or after a date — each weekend is one (Sat, Sun) pair */
function firstSaturdayOnOrAfter(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const daysUntilSaturday = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d;
}

/**
 * Number of weekends (Sat+Sun pairs) that start inside the period.
 * Depending on how the calendar falls, a ~30-day period has 4 or 5.
 */
export function getWeekendsInPeriod(range: PeriodRange): number {
  const cursor = firstSaturdayOnOrAfter(range.start);
  let count = 0;
  while (cursor < range.end) {
    count += 1;
    cursor.setDate(cursor.getDate() + 7);
  }
  return Math.max(1, count);
}

/**
 * 1-based index of the weekend in progress: the MOST RECENT weekend whose
 * Saturday has already arrived, capped at the last weekend. Once the last
 * weekend passes, the index stays there — the trailing days before the
 * cutoff get no new allocation. Before the first weekend it returns 1, so
 * the first slice is available from the period start.
 */
export function getCurrentWeekendOfPeriod(range: PeriodRange, now: Date = new Date()): number {
  const count = getWeekendsInPeriod(range);
  const cursor = firstSaturdayOnOrAfter(range.start);
  let current = 1;
  let index = 0;
  while (cursor < range.end) {
    index += 1;
    if (cursor <= now) current = Math.min(index, count);
    cursor.setDate(cursor.getDate() + 7);
  }
  return current;
}


/**
 * The period immediately before the one ending at `endExclusive` (exclusive end),
 * assuming periods reset on `cutoffDay` of each month.
 */
export function getPreviousPeriodRange(endExclusive: Date, cutoffDay: number): PeriodRange {
  const year = endExclusive.getFullYear();
  const month = endExclusive.getMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return {
    start: cutoffDateFor(prevYear, prevMonth, cutoffDay),
    end: new Date(endExclusive),
  };
}

/**
 * The period starting at `startInclusive` (inclusive start), assuming periods
 * reset on `cutoffDay` of each month.
 */
export function getNextPeriodRange(startInclusive: Date, cutoffDay: number): PeriodRange {
  const year = startInclusive.getFullYear();
  const month = startInclusive.getMonth();
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  return {
    start: new Date(startInclusive),
    end: cutoffDateFor(nextYear, nextMonth, cutoffDay),
  };
}

/** Human label for a period range, e.g. "15 jun – 14 jul" (reflects the configured cutoff day) */
export function getPeriodLabel(range: PeriodRange): string {
  const inclusiveEnd = new Date(range.end.getTime() - 1);
  const startLabel = format(range.start, 'd MMM', { locale: es });
  const endLabel = format(inclusiveEnd, 'd MMM', { locale: es });
  return `${startLabel} – ${endLabel}`;
}

/** Friendly day header (shared by Actividad, Crédito and Home): "Hoy" / "Ayer" / "Lunes 12 de agosto" */
export function getDayLabel(date: Date): string {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  const label = format(date, 'EEEE d MMMM', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Flat list items for a date-grouped transaction list */
export type DayGroupItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'tx'; key: string; transaction: Transaction };

/** Group transactions by day (newest first) with friendly date headers */
export function groupTransactionsByDay(transactions: Transaction[]): DayGroupItem[] {
  const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  const items: DayGroupItem[] = [];
  let lastDayKey = '';
  for (const tx of sorted) {
    const dayKey = format(tx.date, 'yyyy-MM-dd');
    if (dayKey !== lastDayKey) {
      items.push({ kind: 'header', key: `h-${dayKey}`, label: getDayLabel(tx.date) });
      lastDayKey = dayKey;
    }
    items.push({ kind: 'tx', key: tx.id, transaction: tx });
  }
  return items;
}
