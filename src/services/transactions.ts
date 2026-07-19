import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db, getTransactionsRef } from './firebase';
import { getOrCreateDeviceId } from '../utils/storage';
import type { Transaction } from '../types';

/** Cache the device ID in memory for speed (persisted in AsyncStorage) */
let _deviceId: string | null = null;
async function ensureDeviceId(): Promise<string> {
  if (!_deviceId) {
    _deviceId = await getOrCreateDeviceId();
  }
  return _deviceId;
}

/** Convert Firestore timestamp to Date */
function timestampToDate(ts: FirebaseFirestoreTypes.Timestamp): Date {
  return ts.toDate();
}

/** Convert a Firestore document to our Transaction model */
function docToTransaction(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): Transaction | null {
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    date: timestampToDate(data.date),
    amount: data.amount,
    description: data.description,
    category: data.category,
    notes: data.notes,
    createdAt: timestampToDate(data.createdAt),
    deviceId: data.deviceId,
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined,
  };
}

interface AddTransactionData {
  date: FirebaseFirestoreTypes.Timestamp;
  amount: number;
  description: string;
  category: string;
  notes?: string;
}

/** Add a new transaction */
export async function addTransaction(
  groupId: string,
  data: AddTransactionData
): Promise<string> {
  const ref = getTransactionsRef(groupId);
  const doc = await ref.add({
    ...data,
    createdAt: firestore.FieldValue.serverTimestamp(),
    deviceId: await ensureDeviceId(),
  });
  return doc.id;
}

/** Update an existing transaction */
export async function updateTransaction(
  groupId: string,
  transactionId: string,
  data: Partial<AddTransactionData>
): Promise<void> {
  const ref = getTransactionsRef(groupId).doc(transactionId);
  await ref.update({
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

/** Delete a transaction */
export async function deleteTransaction(
  groupId: string,
  transactionId: string
): Promise<void> {
  const ref = getTransactionsRef(groupId).doc(transactionId);
  await ref.delete();
}

/** Get a single transaction by ID */
export async function getTransaction(
  groupId: string,
  transactionId: string
): Promise<Transaction | null> {
  const ref = getTransactionsRef(groupId).doc(transactionId);
  const doc = await ref.get();
  return docToTransaction(doc);
}

/** Get all transactions for a group */
export async function getTransactions(
  groupId: string
): Promise<Transaction[]> {
  const ref = getTransactionsRef(groupId);
  const snapshot = await ref.orderBy('date', 'desc').get();
  return snapshot.docs
    .map((doc) => docToTransaction(doc))
    .filter((t): t is Transaction => t !== null);
}

/** Subscribe to real-time transaction updates */
export function subscribeToTransactions(
  groupId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = getTransactionsRef(groupId);
  const query = ref.orderBy('date', 'desc');

  const unsubscribe = query.onSnapshot(
    (snapshot) => {
      const transactions = snapshot.docs
        .map((doc) => docToTransaction(doc))
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
