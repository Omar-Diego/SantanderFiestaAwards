import { getDoc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getGroupRef } from './firebase';
import { loadCryptoModule } from '../utils/nativeModule';
import type { GroupInfo } from '../types';

/**
 * Secure alphabet: 32 chars, no ambiguous 0/O, 1/I/L.
 * 32^16 ≈ 2^80 — practically unguessable by brute force.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NEW_CODE_LENGTH = 16;

/**
 * Generate a secure group code.
 * Cryptographically random bytes (expo-crypto). Each byte (0-255) mod 32 is
 * perfectly uniform (256 % 32 === 0), so every character is equally likely.
 * The code is embedded in a shareable link (no need to say it aloud),
 * so we favor entropy over brevity.
 */
export function generateGroupCode(): string {
  const bytes = getSecureRandomBytes(NEW_CODE_LENGTH);
  const chars = Array.from(
    bytes,
    (b) => CODE_ALPHABET.charAt(b % CODE_ALPHABET.length)
  );
  return chars.join('');
}

/**
 * Crypto-random bytes when expo-crypto is available in the running binary;
 * otherwise falls back to Math.random so the app keeps working until the
 * native app is rebuilt (`npx expo run:android`).
 */
function getSecureRandomBytes(length: number): Uint8Array {
  const cryptoModule = loadCryptoModule();
  if (cryptoModule?.getRandomBytes) {
    try {
      return cryptoModule.getRandomBytes(length);
    } catch {
      // fall through to the JS fallback
    }
  }
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

/** Uppercase and keep only A-Z/0-9 (strips dashes/spaces the user may paste) */
export function normalizeGroupCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Validate a group code format (accepts legacy and secure formats) */
export function isValidGroupCode(code: string): boolean {
  const normalized = normalizeGroupCode(code);
  // Legacy: 4 letters + 4 digits (e.g. ABCD1234) — still joinable
  if (/^[A-Z]{4}\d{4}$/.test(normalized)) return true;
  // Secure: 16 chars from the safe alphabet
  if (/^[A-Z0-9]{16}$/.test(normalized)) return true;
  return false;
}

/** Format a code for display/typing: groups of 4 separated by dashes */
export function formatGroupCode(code: string): string {
  const normalized = normalizeGroupCode(code);
  return normalized.replace(/(.{4})/g, '$1-').replace(/-$/, '');
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
