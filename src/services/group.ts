import { getDoc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getGroupRef } from './firebase';
import type { GroupInfo } from '../types';

/**
 * Generate a short, human-readable group code.
 * Format: 4 uppercase letters + 4 digits = easy to share verbally
 */
export function generateGroupCode(): string {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  const digits = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('');
  return `${letters}${digits}`;
}

/** Validate a group code format */
export function isValidGroupCode(code: string): boolean {
  return /^[A-Z]{4}\d{4}$/.test(code);
}

/** Create a new group and return its info */
export async function createGroup(name: string = 'Gastos Casa'): Promise<GroupInfo> {
  const code = generateGroupCode();

  // Use the code as the document ID for easy lookup
  const ref = getGroupRef(code);

  await setDoc(ref, {
    name,
    createdAt: serverTimestamp(),
  });

  return {
    id: code,
    name,
    createdAt: new Date(),
  };
}

/** Check if a group code exists */
export async function groupExists(code: string): Promise<boolean> {
  if (!isValidGroupCode(code)) return false;
  const ref = getGroupRef(code);
  const snap = await getDoc(ref);
  return snap.data() !== undefined;
}

/** Get group info by code */
export async function getGroupInfo(code: string): Promise<GroupInfo | null> {
  if (!isValidGroupCode(code)) return null;
  const ref = getGroupRef(code);
  const doc = await getDoc(ref);
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  return {
    id: code,
    name: data.name,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
  };
}

/** Join / validate a group exists */
export async function joinGroup(code: string): Promise<{ success: boolean; group: GroupInfo | null }> {
  const exists = await groupExists(code);
  if (!exists) {
    return { success: false, group: null };
  }

  const info = await getGroupInfo(code);
  return { success: true, group: info };
}
