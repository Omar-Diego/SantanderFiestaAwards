import { useState, useEffect, useMemo, useCallback } from 'react';
import { subscribeToBudgetConfig, setBudgetConfig } from '../services/budget';
import { getCurrentPeriodRange } from '../utils/date';
import type { BudgetConfig, Transaction } from '../types';

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

  const period = useMemo(
    () => getCurrentPeriodRange(config?.cutoffDay ?? 1),
    [config?.cutoffDay]
  );

  const periodTransactions = useMemo(
    () => transactions.filter((t) => t.date >= period.start && t.date < period.end),
    [transactions, period]
  );

  const spent = useMemo(
    () => periodTransactions.reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const remaining = (config?.amount ?? 0) - spent;

  const saveBudget = useCallback(
    async (amount: number, cutoffDay: number) => {
      if (!groupId) return;
      await setBudgetConfig(groupId, { amount, cutoffDay });
    },
    [groupId]
  );

  return {
    config,
    loading,
    error,
    period,
    periodTransactions,
    spent,
    remaining,
    saveBudget,
  };
}
