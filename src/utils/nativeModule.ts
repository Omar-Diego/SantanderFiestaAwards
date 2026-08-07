import { NativeModules } from 'react-native';

/**
 * Lazy loaders for native Expo modules.
 *
 * expo-modules-core logs a console.error (and LogBox shows a red box) whenever
 * a native module is required but missing from the running binary, even if the
 * require is wrapped in try/catch. So we FIRST check whether the native module
 * exists (without throwing), and only then require the JS package — which never
 * fails once the native side is present.
 *
 * Native modules need a rebuild to appear: `npx expo run:android`.
 */

export interface CryptoModule {
  getRandomBytes: (length: number) => Uint8Array;
}

export interface ClipboardModule {
  setStringAsync: (text: string) => Promise<boolean>;
}

/** True when the native module is present in the running app binary. */
function hasNativeModule(name: string): boolean {
  const expoModules = (
    globalThis as { expo?: { modules?: Record<string, unknown> } }
  ).expo?.modules;
  const native = NativeModules as Record<string, unknown>;
  return expoModules?.[name] != null || native[name] != null;
}

export function loadCryptoModule(): CryptoModule | null {
  if (!hasNativeModule('ExpoCrypto')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-crypto') as CryptoModule;
  } catch {
    return null;
  }
}

export function loadClipboardModule(): ClipboardModule | null {
  if (!hasNativeModule('ExpoClipboard')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-clipboard') as ClipboardModule;
  } catch {
    return null;
  }
}
