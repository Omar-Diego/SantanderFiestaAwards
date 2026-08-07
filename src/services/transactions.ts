import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentSnapshot,
  type Timestamp,
} from '@react-native-firebase/firestore';
import { db, getEventsRef, getTransactionsRef } from './firebase';
import { getOrCreateDeviceId } from '../utils/storage';
import type { GroupEventType, Transaction } from '../types';

/** Cache the device ID in memory for speed (persisted in AsyncStorage) */
let _deviceId: string | null = null;
async function ensureDeviceId(): Promise<string> {
  if (!_deviceId) {
    _deviceId = await getOrCreateDeviceId();
  }
  return _deviceId;
}

/** Convert Firestore timestamp to Date (falls back to now while a server
 *  timestamp is still pending — the local snapshot can briefly carry null) */
function timestampToDate(ts: Timestamp | null | undefined): Date {
  if (!ts || typeof ts.toDate !== 'function') return new Date();
  return ts.toDate();
}

/** Convert a Firestore document to our Transaction model */
function docToTransaction(doc: DocumentSnapshot): Transaction | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    date: timestampToDate(data.date),
    amount: data.amount,
    description: data.description,
    createdAt: timestampToDate(data.createdAt),
    deviceId: data.deviceId,
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined,
  };
}

interface AddTransactionData {
  date: Timestamp;
  amount: number;
  description: string;
}

/** Client-generated id (no reliance on doc(col) auto-id inside a batch) */
function newEventId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build the event payload written alongside every expense mutation */
async function expenseEventData(
  type: GroupEventType,
  data: { description: string; amount: number }
) {
  return {
    type,
    description: data.description,
    amount: data.amount,
    createdAt: serverTimestamp(),
    deviceId: await ensureDeviceId(),
  };
}

/** Add a new transaction, then a best-effort "expense added" event */
export async function addTransaction(
  groupId: string,
  data: AddTransactionData
): Promise<string> {
  const ref = getTransactionsRef(groupId);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    deviceId: await ensureDeviceId(),
  });

  // Best-effort companion event — never fail the expense write because of it
  try {
    await setDoc(
      doc(getEventsRef(groupId), newEventId()),
      await expenseEventData('expense_added', data)
    );
  } catch {
    // ignore: the expense itself was already saved
  }
  return docRef.id;
}

/** Update an existing transaction + an "expense updated" event (atomic) */
export async function updateTransaction(
  groupId: string,
  transactionId: string,
  data: Partial<AddTransactionData>
): Promise<void> {
  const ref = doc(getTransactionsRef(groupId), transactionId);

  const batch = writeBatch(db);
  batch.update(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  if (data.description != null && data.amount != null) {
    batch.set(
      doc(getEventsRef(groupId), newEventId()),
      await expenseEventData('expense_updated', {
        description: data.description,
        amount: data.amount,
      })
    );
  }
  await batch.commit();
}

/** Delete a transaction + an "expense deleted" event (atomic) */
export async function deleteTransaction(
  groupId: string,
  transactionId: string,
  meta?: { description: string; amount: number }
): Promise<void> {
  const ref = doc(getTransactionsRef(groupId), transactionId);

  // If the caller didn't pass the expense details, fetch them for the event
  let eventData;
  if (meta) {
    eventData = meta;
  } else {
    const snap = await getDoc(ref);
    const d = snap.data();
    eventData = d ? { description: d.description ?? '', amount: d.amount ?? 0 } : null;
  }

  const batch = writeBatch(db);
  batch.delete(ref);
  if (eventData) {
    batch.set(
      doc(getEventsRef(groupId), newEventId()),
      await expenseEventData('expense_deleted', eventData)
    );
  }
  await batch.commit();
}

/** Get a single transaction by ID */
export async function getTransaction(
  groupId: string,
  transactionId: string
): Promise<Transaction | null> {
  const ref = doc(getTransactionsRef(groupId), transactionId);
  const snapshot = await getDoc(ref);
  return docToTransaction(snapshot);
}

/** Get all transactions for a group */
export async function getTransactions(groupId: string): Promise<Transaction[]> {
  const q = query(getTransactionsRef(groupId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => docToTransaction(d))
    .filter((t): t is Transaction => t !== null);
}

/** Subscribe to real-time transaction updates */
export function subscribeToTransactions(
  groupId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(getTransactionsRef(groupId), orderBy('date', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs
        .map((d) => docToTransaction(d))
        .filter((t): t is Transaction => t !== null);
      onUpdate(transactions);
    },
    (error) => {
      console.error('[Firestore] Subscription error:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}
