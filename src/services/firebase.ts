import firestore from '@react-native-firebase/firestore';

/**
 * Firebase initialization for Santander Fiesta Awards.
 *
 * On Android, @react-native-firebase automatically reads
 * google-services.json, so no manual config is needed here.
 * The SDK auto-initializes when the app starts.
 */

/** Singleton Firestore instance */
export const db = firestore();

/** Enable offline persistence so the app works without internet */
db.settings({
  persistence: true,
});

/** Collection paths */
export const COLLECTIONS = {
  groups: 'groups',
} as const;

/** Helper to get a group's transactions subcollection reference */
export function getTransactionsRef(groupId: string) {
  return db.collection(COLLECTIONS.groups).doc(groupId).collection('transactions');
}

/** Helper to get a group document reference */
export function getGroupRef(groupId: string) {
  return db.collection(COLLECTIONS.groups).doc(groupId);
}
