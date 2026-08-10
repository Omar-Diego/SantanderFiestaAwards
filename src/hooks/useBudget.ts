import { useState, useEffect, useMemo, useCallback } from 'react';
import { subscribeToBudgetConfig, setBudgetConfig } from '../services/budget';
import {
  getCurrentPeriodRange,
  getCurrentWeekendOfPeriod,
  getPreviousPeriodRange,
  getWeekendsInPeriod,
} from '../utils/date';
import type { BudgetAmountEntry, BudgetConfig, Transaction } from '../types';

/** Keep at most this many budget-amount history entries in the doc */
const MAX_AMOUNT_HISTORY = 24;

/**
 * Tracks the group's budget goal and how much of it remains in the
 * current cutoff period, given the group's live transaction list.
 */
export function useBudget(groupId: string | null, transactions: Transaction[]) {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToBudgetConfig(
      groupId,
      (cfg) => {
        setConfig(cfg);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  // Computed on every render so it self-heals if the app stays open
  // across a period boundary.
  const cutoffDay = config?.cutoffDay ?? 1;
  const period = getCurrentPeriodRange(cutoffDay);

  const spent = useMemo(
    () =>
      transactions
        .filter((t) => t.date >= period.start && t.date < period.end)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, period]
  );

  // ─── Carry-over from previous periods ──────────────────
  // Unspent budget accumulates: every completed period contributes
  // `amount - spentK`, so money you didn't spend is never lost. Each past
  // period uses the budget amount that was IN EFFECT when it ran (from
  // `amountHistory`), so changing the credit for a new month never
  // rewrites old leftovers.
  const carryOver = useMemo(() => {
    if (!config) return 0;
    // One-time manual correction from Crédito: it covers every completed
    // period up to the moment it was set; later periods keep accumulating
    // automatically.
    const manualBase = config.manualCarryOver ?? 0;
    if (transactions.length === 0) return manualBase;
    const earliest = transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0].date
    );
    // Anchor the count where budgeting actually started. `createdAt` is
    // only trustworthy when it predates the current period: it gets
    // stamped the first time the budget is saved after the carry-over
    // feature shipped, which can be the current period — trusting it then
    // would make the app think the budget just started and silently drop
    // every previous leftover. In that case (or when it's missing) fall
    // back to the earliest registered expense. When creation is genuine,
    // take the earlier of creation / first expense so periods where the
    // budget existed but nothing was spent also roll over. Trade-off: a
    // genuinely new budget created this period with older expenses will
    // also start from the earliest expense (generous, but corrects itself
    // as soon as a period completes).
    const anchor =
      config.createdAt && config.createdAt.getTime() < period.start.getTime()
        ? new Date(Math.min(config.createdAt.getTime(), earliest.getTime()))
        : earliest;
    const anchorStart = getCurrentPeriodRange(cutoffDay, anchor).start;

    // Amount in effect at a given moment: the newest history entry whose
    // `since` is at or before it. Without history (older groups), the
    // current amount is assumed to apply from the anchor onwards.
    const history = config.amountHistory ?? [
      { amount: config.amount, since: anchor },
    ];
    const amountInEffect = (at: Date): number => {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].since.getTime() <= at.getTime()) return history[i].amount;
      }
      // Periods before the oldest history entry used the oldest recorded
      // amount — never the current one, which after a save would rewrite
      // old leftovers.
      return history[0].amount;
    };

    // With a manual base, stop accumulating at the period it was set on —
    // everything older is already inside `manualBase`.
    const manualAnchor = config.manualCarryOverSince
      ? getCurrentPeriodRange(cutoffDay, config.manualCarryOverSince).start
      : config.manualCarryOver !== undefined
        ? period.start
        : null;

    let cursor = period.start; // end of the last completed period (exclusive)
    let total = 0;
    let guard = 0;
    while (cursor.getTime() > anchorStart.getTime() && guard < 60) {
      const prev = getPreviousPeriodRange(cursor, cutoffDay);
      if (
        manualAnchor !== null &&
        prev.start.getTime() < manualAnchor.getTime()
      ) {
        break;
      }
      const spentK = transactions
        .filter((t) => t.date >= prev.start && t.date < cursor)
        .reduce((sum, t) => sum + t.amount, 0);
      total += amountInEffect(prev.start) - spentK;
      cursor = prev.start;
      guard += 1;
    }
    return manualBase + total;
  }, [config, transactions, period]);

  // ─── One-time manual correction ─────────────────────────
  // The value set in Crédito is a one-time patch for the CURRENT period.
  // When the period it was anchored to ends, the resulting leftover
  // (correction + what accumulated) is absorbed back into the base and
  // re-anchored to the new period, so the app keeps calculating
  // automatically from there and the manual number is never pinned forever.
  useEffect(() => {
    if (!groupId || !config) return;
    const manual = config.manualCarryOver;
    if (manual === undefined || !config.manualCarryOverSince) return;
    // Wait for transactions to load: while they're empty, carryOver is only
    // the manual base and absorbing would drop the accumulated leftovers.
    if (transactions.length === 0) return;
    const manualAnchor = getCurrentPeriodRange(
      config.cutoffDay,
      config.manualCarryOverSince
    ).start;
    if (period.start.getTime() <= manualAnchor.getTime()) return;

    setBudgetConfig(groupId, {
      amount: config.amount,
      cutoffDay: config.cutoffDay,
      amountHistory: config.amountHistory,
      manualCarryOver: carryOver,
      manualCarryOverSince: period.start,
    });
  }, [groupId, config, period, transactions, carryOver]);

  /** Money actually available this period, including leftovers from previous ones */
  const available = config ? config.amount + carryOver - spent : 0;

  // ─── Weekend pacing (anchored to the cutoff day) ────────
  // The period is split by the ACTUAL weekends that fall inside it (4 or
  // 5, depending on the calendar). Only the FRESH month amount is divided
  // equally among them (`amount / weekends`), so the last weekend drains
  // the period budget right before the cutoff resets and the trailing
  // weekdays have no allocation. The carry-over from previous periods is
  // NOT divided: it lands in full on the next weekend and rolls forward
  // from there. Whatever isn't spent also rolls over, so money is never
  // lost.
  const weekendsInPeriod = useMemo(() => getWeekendsInPeriod(period), [period]);
  const currentWeekend = useMemo(() => getCurrentWeekendOfPeriod(period), [period]);
  const weekendAllowance = config ? config.amount / weekendsInPeriod : 0;
  const weekendAvailable =
    config && weekendsInPeriod > 0
      ? currentWeekend * weekendAllowance + carryOver - spent
      : null;

  const saveBudget = useCallback(
    async (amount: number, day: number, manualCarryOver: number | null) => {
      if (!groupId) return;
      // The new amount takes effect from the current period, so its history
      // entry is anchored to the period start (computed with the new cutoff
      // day). Completed periods keep using the amount they ran under.
      const since = getCurrentPeriodRange(day).start;

      let history: BudgetAmountEntry[];
      if (config?.amountHistory?.length) {
        history = [...config.amountHistory];
      } else if (config) {
        // Seed the history with the amount in effect up to now, so past
        // periods don't fall back to the new one.
        const earliest = transactions.reduce(
          (min, t) => (t.date < min ? t.date : min),
          transactions.length > 0 ? transactions[0].date : new Date()
        );
        const anchor =
          config.createdAt && config.createdAt.getTime() < since.getTime()
            ? new Date(Math.min(config.createdAt.getTime(), earliest.getTime()))
            : earliest;
        history = [{ amount: config.amount, since: anchor }];
      } else {
        history = [];
      }

      // Editing the amount within the same period replaces its entry.
      const last = history[history.length - 1];
      if (last && last.since.getTime() === since.getTime()) {
        history[history.length - 1] = { amount, since };
      } else {
        history.push({ amount, since });
      }
      // Keep the doc small — only the most recent entries matter.
      if (history.length > MAX_AMOUNT_HISTORY) {
        history = history.slice(history.length - MAX_AMOUNT_HISTORY);
      }

      await setBudgetConfig(groupId, {
        amount,
        cutoffDay: day,
        amountHistory: history,
        manualCarryOver: manualCarryOver ?? undefined,
        // Keep the anchor when the manual value didn't change, so periods
        // that accumulated after it was set are not wiped by a re-save.
        manualCarryOverSince:
          manualCarryOver === null
            ? undefined
            : config?.manualCarryOver === manualCarryOver &&
                config.manualCarryOverSince
              ? config.manualCarryOverSince
              : since,
      });
    },
    [groupId, config, transactions]
  );

  return {
    config,
    loading,
    error,
    period,
    spent,
    carryOver,
    available,
    weekendsInPeriod,
    currentWeekend,
    weekendAllowance,
    weekendAvailable,
    saveBudget,
  };
}
