import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors, typography, spacing, borderRadius, shadows } from '../theme';

export type ToastType = 'success' | 'error';

interface ToastData {
  type: ToastType;
  message: string;
  duration: number;
  onDone?: () => void;
}

interface ConfirmData {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

interface ToastContextValue {
  showToast: (
    type: ToastType,
    message: string,
    options?: { onDone?: () => void; duration?: number }
  ) => void;
  /** Promise-based confirmation dialog. Resolves true if confirmed. */
  confirm: (options: Omit<ConfirmData, 'resolve'>) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return ctx;
}

/**
 * Global toast + confirm system with the app's dark theme.
 * Mount once at the root; any screen can call useToast().
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmData | null>(null);

  const queueRef = useRef<ToastData[]>([]);
  const showingRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  const animateOut = useCallback(
    (onEnd: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 16,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(onEnd);
    },
    [opacity, translateY]
  );

  const processQueue = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      showingRef.current = false;
      setToast(null);
      return;
    }

    showingRef.current = true;
    setToast(next);
    opacity.setValue(0);
    translateY.setValue(24);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideTimerRef.current = setTimeout(() => {
        animateOut(() => {
          next.onDone?.();
          processQueue();
        });
      }, next.duration);
    });
  }, [animateOut, opacity, translateY]);

  // Clear the pending hide timer if the provider unmounts
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showToast: ToastContextValue['showToast'] = useCallback(
    (type, message, options) => {
      const data: ToastData = {
        type,
        message,
        duration: options?.duration ?? (type === 'success' ? 2000 : 2600),
        onDone: options?.onDone,
      };
      queueRef.current.push(data);
      if (!showingRef.current) processQueue();
    },
    [processQueue]
  );

  const confirm = useCallback<ToastContextValue['confirm']>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...options, resolve });
      }),
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, confirm }),
    [showToast, confirm]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ── Toast ───────────────────────────────────── */}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastLayer,
            {
              bottom: insets.bottom + 84,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.toast}>
            <MaterialCommunityIcons
              name={
                toast.type === 'success' ? 'check-circle' : 'alert-circle-outline'
              }
              size={20}
              color={
                toast.type === 'success' ? darkColors.green : darkColors.red
              }
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* ── Confirm dialog ──────────────────────────── */}
      {confirmState ? (
        <ConfirmDialog
          data={confirmState}
          onCancel={() => {
            confirmState.resolve(false);
            setConfirmState(null);
          }}
          onConfirm={() => {
            confirmState.resolve(true);
            setConfirmState(null);
          }}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

// ─── Confirm dialog ─────────────────────────────────────
function ConfirmDialog({
  data,
  onCancel,
  onConfirm,
}: {
  data: ConfirmData;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.confirmOverlay}>
      <Pressable
        style={styles.confirmBackdrop}
        onPress={onCancel}
        accessibilityLabel="Cancelar"
      />
      <Animated.View
        style={[styles.confirmCard, { opacity, transform: [{ scale }] }]}
      >
        <MaterialCommunityIcons
          name={data.destructive ? 'trash-can-outline' : 'help-circle-outline'}
          size={34}
          color={darkColors.red}
        />
        <Text style={styles.confirmTitle}>{data.title}</Text>
        {data.message ? (
          <Text style={styles.confirmMessage}>{data.message}</Text>
        ) : null}
        <View style={styles.confirmButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              styles.confirmBtnCancel,
              pressed && styles.confirmBtnPressed,
            ]}
            onPress={onCancel}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnCancelText}>
              {data.cancelLabel ?? 'Cancelar'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              styles.confirmBtnConfirm,
              pressed && styles.confirmBtnPressed,
            ]}
            onPress={onConfirm}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnConfirmText}>
              {data.confirmLabel ?? 'Aceptar'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Toast
  toastLayer: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: 340,
    ...shadows.md,
  },
  toastText: {
    ...typography.body,
    color: darkColors.textPrimary,
    flexShrink: 1,
  },

  // Confirm dialog
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  confirmCard: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  confirmTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  confirmMessage: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnPressed: {
    opacity: 0.8,
  },
  confirmBtnCancel: {
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: 1,
    borderColor: darkColors.divider,
  },
  confirmBtnCancelText: {
    ...typography.bodyBold,
    color: darkColors.textSecondary,
  },
  confirmBtnConfirm: {
    backgroundColor: darkColors.red,
  },
  confirmBtnConfirmText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
});
