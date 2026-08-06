import { getDoc, onSnapshot, updateDoc, type DocumentData } from '@react-native-firebase/firestore';
import { getGroupRef } from './firebase';
import type { BudgetConfig } from '../types';

const DEFAULT_CUTOFF_DAY = 1;

function docToBudgetConfig(data: DocumentData | undefined): BudgetConfig | null {
  if (!data || typeof data.budgetAmount !== 'number') return null;
  return {
    amount: data.budgetAmount,
    cutoffDay: data.budgetCutoffDay ?? DEFAULT_CUTOFF_DAY,
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
  await updateDoc(getGroupRef(groupId), {
    budgetAmount: config.amount,
    budgetCutoffDay: config.cutoffDay,
  });
}
