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
  updateDoc,
  type DocumentSnapshot,
  type Timestamp,
} from '@react-native-firebase/firestore';
import { getTransactionsRef } from './firebase';
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
function timestampToDate(ts: Timestamp): Date {
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

/** Add a new transaction */
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
  return docRef.id;
}

/** Update an existing transaction */
export async function updateTransaction(
  groupId: string,
  transactionId: string,
  data: Partial<AddTransactionData>
): Promise<void> {
  const ref = doc(getTransactionsRef(groupId), transactionId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a transaction */
export async function deleteTransaction(
  groupId: string,
  transactionId: string
): Promise<void> {
  const ref = doc(getTransactionsRef(groupId), transactionId);
  await deleteDoc(ref);
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
