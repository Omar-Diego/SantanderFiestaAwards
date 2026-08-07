import { getFirestore, collection, doc } from '@react-native-firebase/firestore';

/**
 * Firebase initialization for Santander Fiesta Awards.
 *
 * On Android, @react-native-firebase automatically reads
 * google-services.json, so no manual config is needed here.
 * The SDK auto-initializes when the app starts.
 *
 * Offline persistence is enabled by default in React Native Firebase.
 */

/** Singleton Firestore instance */
export const db = getFirestore();

/** Collection paths */
export const COLLECTIONS = {
  groups: 'groups',
} as const;

/** Helper to get a group's transactions subcollection reference */
export function getTransactionsRef(groupId: string) {
  return collection(doc(collection(db, COLLECTIONS.groups), groupId), 'transactions');
}

/** Helper to get a group's activity events subcollection reference */
export function getEventsRef(groupId: string) {
  return collection(doc(collection(db, COLLECTIONS.groups), groupId), 'events');
}

/** Helper to get a group document reference */
export function getGroupRef(groupId: string) {
  return doc(collection(db, COLLECTIONS.groups), groupId);
}
