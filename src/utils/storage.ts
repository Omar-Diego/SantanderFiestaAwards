import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys used across the app.
 */
const KEYS = {
  GROUP_ID: '@fiesta/groupId',
  GROUP_NAME: '@fiesta/groupName',
  DEVICE_ID: '@fiesta/deviceId',
} as const;

// ─── Group ID ───────────────────────────────────────────

/** Save the group code so the user doesn't have to re-enter it */
export async function saveGroupId(groupId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.GROUP_ID, groupId);
}

/** Retrieve the saved group code */
export async function getGroupId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.GROUP_ID);
}

/** Remove the saved group code (e.g. on reset) */
export async function removeGroupId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.GROUP_ID);
}

// ─── Group Name ─────────────────────────────────────────

/** Save the group display name */
export async function saveGroupName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.GROUP_NAME, name);
}

/** Retrieve the group display name */
export async function getGroupName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.GROUP_NAME);
}

// ─── Device ID ──────────────────────────────────────────

/**
 * Get or create a persistent device ID.
 * Unlike generating it each session with Date.now(),
 * this saves it to AsyncStorage so the same phone
 * always reports the same device ID, even after
 * restarting the app.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEYS.DEVICE_ID);
  if (existing) return existing;

  // Generate a random ID (8 hex chars)
  const random = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const deviceId = `android_${random}`;

  await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
  return deviceId;
}

/** Remove stored device ID (for testing / reset) */
export async function removeDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DEVICE_ID);
}

// ─── Reset all ──────────────────────────────────────────

/** Clear all stored data (logs the user out of the group) */
export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.GROUP_ID);
  await AsyncStorage.removeItem(KEYS.GROUP_NAME);
  await AsyncStorage.removeItem(KEYS.DEVICE_ID);
}
