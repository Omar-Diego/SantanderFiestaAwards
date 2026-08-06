import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

/** Current month label, capitalized in Spanish (e.g. "Julio 2026") */
export function getCurrentMonthLabel(): string {
  const now = new Date();
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

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
export function getCurrentPeriodRange(cutoffDay: number, now: Date = new Date()): PeriodRange {
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

/** Human label for a period range, e.g. "19 jul – 18 ago" */
export function getPeriodLabel(range: PeriodRange): string {
  const inclusiveEnd = new Date(range.end.getTime() - 1);
  const startLabel = format(range.start, 'd MMM', { locale: es });
  const endLabel = format(inclusiveEnd, 'd MMM', { locale: es });
  return `${startLabel} – ${endLabel}`;
}
