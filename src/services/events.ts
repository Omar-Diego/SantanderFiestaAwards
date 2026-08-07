import {
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
  type DocumentSnapshot,
} from '@react-native-firebase/firestore';
import { getEventsRef } from './firebase';
import { getOrCreateDeviceId } from '../utils/storage';
import type { GroupEvent, GroupEventType } from '../types';

/** Firestore timestamp → Date (falls back to now while a server timestamp is pending) */
function timestampToDate(ts: { toDate?: () => Date } | null | undefined): Date {
  if (!ts || typeof ts.toDate !== 'function') return new Date();
  return ts.toDate();
}

/** Convert a Firestore event document to our GroupEvent model */
function docToEvent(doc: DocumentSnapshot): GroupEvent | null {
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    type: data.type as GroupEventType,
    description: data.description,
    amount: data.amount,
    budgetAmount: data.budgetAmount,
    createdAt: timestampToDate(data.createdAt),
    deviceId: data.deviceId ?? '',
  };
}

export interface EventInput {
  type: GroupEventType;
  description?: string;
  amount?: number;
  budgetAmount?: number;
}

/** Write an event with a deterministic id — used to de-duplicate budget
 *  events per period (both phones computing the same crossing write the
 *  same doc, so the feed never shows duplicates). */
export async function setEventWithId(
  groupId: string,
  eventId: string,
  data: EventInput
): Promise<void> {
  await setDoc(doc(getEventsRef(groupId), eventId), {
    ...data,
    createdAt: serverTimestamp(),
    deviceId: await getOrCreateDeviceId(),
  });
}

/** Client-generated id (no reliance on doc(col) auto-id inside a batch) */
function newEventId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Subscribe to the group's activity feed, newest first */
export function subscribeToEvents(
  groupId: string,
  onUpdate: (events: GroupEvent[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(getEventsRef(groupId), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map((d) => docToEvent(d))
        .filter((e): e is GroupEvent => e !== null);
      onUpdate(events);
    },
    (error) => {
      console.error('[Firestore] Events subscription error:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}
