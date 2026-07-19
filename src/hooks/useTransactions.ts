import { useState, useEffect, useCallback } from 'react';
import { subscribeToTransactions } from '../services/transactions';
import type { Transaction } from '../types';

/**
 * Custom hook that subscribes to real-time transaction updates
 * for a given group. Automatically cleans up the subscription
 * when the component unmounts or the groupId changes.
 */
export function useTransactions(groupId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTransactions(
      groupId,
      (updatedTransactions) => {
        setTransactions(updatedTransactions);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [groupId]);

  /** Get total expenses for a given month */
  const getMonthTotal = useCallback(
    (year: number, month: number): number => {
      return transactions
        .filter((t) => {
          const d = t.date;
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    },
    [transactions]
  );

  /** Get expenses grouped by category for a given month */
  const getCategoryTotals = useCallback(
    (year: number, month: number): Record<string, number> => {
      const totals: Record<string, number> = {};
      transactions
        .filter((t) => {
          const d = t.date;
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .forEach((t) => {
          totals[t.category] = (totals[t.category] || 0) + t.amount;
        });
      return totals;
    },
    [transactions]
  );

  /** Get the most recent transactions */
  const getRecentTransactions = useCallback(
    (count: number = 5): Transaction[] => {
      return transactions.slice(0, count);
    },
    [transactions]
  );

  return {
    transactions,
    loading,
    error,
    getMonthTotal,
    getCategoryTotals,
    getRecentTransactions,
  };
}
