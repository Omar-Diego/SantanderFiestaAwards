import { useEffect, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useBudget } from '../hooks/useBudget';
import { setEventWithId } from '../services/events';

/**
 * App-wide budget event detector (mounted at the root, always running).
 * Watches the group's live budget state and writes period-scoped events with
 * DETERMINISTIC doc ids, so even if both phones compute the same crossing at
 * the same time, they write the same doc and the feed never shows duplicates:
 *
 *  - budget_reached: spent crosses (or sits above) the goal → "Crédito alcanzado"
 *  - budget_reset:   a new cutoff period starts → "Crédito restablecido"
 *
 * Renders nothing.
 */
export default function GroupEventDetector({ groupId }: { groupId: string | null }) {
  const { transactions } = useTransactions(groupId);
  const { config, period, spent } = useBudget(groupId, transactions);

  const prevPeriodStartRef = useRef<number | null>(null);
  const writtenReachedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!groupId || !config) {
      prevPeriodStartRef.current = null;
      writtenReachedRef.current = null;
      return;
    }

    const periodStart = period.start.getTime();

    // New cutoff period → credit is restored (skip the very first evaluation)
    if (prevPeriodStartRef.current !== null && periodStart > prevPeriodStartRef.current) {
      setEventWithId(groupId, `reset-${periodStart}`, {
        type: 'budget_reset',
        amount: config.amount,
      });
      writtenReachedRef.current = null;
    }
    prevPeriodStartRef.current = periodStart;

    // Goal reached (on the crossing or already above) → write once per period
    if (
      config.amount > 0 &&
      spent >= config.amount &&
      writtenReachedRef.current !== periodStart
    ) {
      setEventWithId(groupId, `reached-${periodStart}`, {
        type: 'budget_reached',
        amount: spent,
        budgetAmount: config.amount,
      });
      writtenReachedRef.current = periodStart;
    }
  }, [groupId, config, period.start, spent]);

  return null;
}
