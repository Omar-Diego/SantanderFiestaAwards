import {
  deleteField,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  type DocumentData,
} from '@react-native-firebase/firestore';
import { getGroupRef } from './firebase';
import type { BudgetAmountEntry, BudgetConfig } from '../types';

const DEFAULT_CUTOFF_DAY = 1;

function timestampToDate(ts: unknown): Date | undefined {
  if (!ts || typeof ts !== 'object' || typeof (ts as Timestamp).toDate !== 'function') {
    return undefined;
  }
  return (ts as Timestamp).toDate();
}

function docToAmountHistory(data: DocumentData | undefined): BudgetAmountEntry[] | undefined {
  if (!Array.isArray(data?.budgetAmountHistory)) return undefined;
  const entries: BudgetAmountEntry[] = [];
  for (const raw of data.budgetAmountHistory) {
    const since = timestampToDate(raw?.budgetSince);
    if (typeof raw?.budgetAmount !== 'number' || !since) continue;
    entries.push({ amount: raw.budgetAmount, since });
  }
  return entries.length > 0 ? entries : undefined;
}

function docToBudgetConfig(data: DocumentData | undefined): BudgetConfig | null {
  if (!data || typeof data.budgetAmount !== 'number') return null;
  return {
    amount: data.budgetAmount,
    cutoffDay: data.budgetCutoffDay ?? DEFAULT_CUTOFF_DAY,
    createdAt: timestampToDate(data.budgetCreatedAt),
    amountHistory: docToAmountHistory(data),
    manualCarryOver:
      typeof data.budgetManualCarryOver === 'number'
        ? data.budgetManualCarryOver
        : undefined,
    manualCarryOverSince: timestampToDate(data.budgetManualCarryOverSince),
  };
}

/** Get the group's budget goal (null if not configured yet) */
export async function getBudgetConfig(groupId: string): Promise<BudgetConfig | null> {
  const snap = await getDoc(getGroupRef(groupId));
  return docToBudgetConfig(snap.data());
}

/** Subscribe to real-time updates of the group's budget goal */
export function subscribeToBudgetConfig(
  groupId: string,
  onUpdate: (config: BudgetConfig | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    getGroupRef(groupId),
    (snap) => onUpdate(docToBudgetConfig(snap.data())),
    (error) => {
      console.error('[Firestore] Budget subscription error:', error);
      onError?.(error);
    }
  );
}

/** Set (or update) the group's budget goal, shared by everyone in the group */
export async function setBudgetConfig(groupId: string, config: BudgetConfig): Promise<void> {
  const ref = getGroupRef(groupId);
  const snap = await getDoc(ref);
  const existing = snap.data();

  const update: DocumentData = {
    budgetAmount: config.amount,
    budgetCutoffDay: config.cutoffDay,
  };
  // Set the creation timestamp only once — it anchors the carry-over of
  // unspent budget, so periods before the budget existed never count.
  if (!existing?.budgetCreatedAt) {
    update.budgetCreatedAt = serverTimestamp();
  }
  // Keep the amount history (monto + período desde el que aplicó) so each
  // past period's leftover is computed with the amount in effect then.
  if (config.amountHistory && config.amountHistory.length > 0) {
    update.budgetAmountHistory = config.amountHistory.map((entry) => ({
      budgetAmount: entry.amount,
      budgetSince: Timestamp.fromDate(entry.since),
    }));
  }
  // Manual carry-over base from Crédito (or clear it when not provided).
  if (config.manualCarryOver !== undefined) {
    update.budgetManualCarryOver = config.manualCarryOver;
    update.budgetManualCarryOverSince = config.manualCarryOverSince
      ? Timestamp.fromDate(config.manualCarryOverSince)
      : deleteField();
  } else {
    update.budgetManualCarryOver = deleteField();
    update.budgetManualCarryOverSince = deleteField();
  }

  await updateDoc(ref, update);
}
