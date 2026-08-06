import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDay(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, '');
  const n = parseInt(cleaned, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(31, Math.max(0, n));
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// ─── Main Screen (Crédito) — formulario directo ─────────
// Reached from Home's quick action (and Alerts). There is no summary view:
// the screen IS the edit/setup form, prefilled with the current budget.
export default function SettingsScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  const { config, loading: budgetLoading, error, saveBudget } = useBudget(
    groupId,
    []
  );

  const loading = !storageLoaded || budgetLoading;

  // ─── Form state ─────────────────────────────────────
  const [amountText, setAmountText] = useState('');
  const [cutoffDayText, setCutoffDayText] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Prefill the form once the current config arrives
  useEffect(() => {
    if (config) {
      setAmountText(String(config.amount));
      setCutoffDayText(String(config.cutoffDay));
    }
  }, [config]);

  async function handleSave() {
    const amount = parseAmount(amountText);
    const cutoffDay = parseDay(cutoffDayText);

    if (amount <= 0) {
      setFormError('Ingresa un monto válido');
      return;
    }
    if (cutoffDay < 1 || cutoffDay > 31) {
      setFormError('El día de corte debe estar entre 1 y 31');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      await saveBudget(amount, cutoffDay);
    } catch (err) {
      setSubmitting(false);
      Alert.alert(
        'Error',
        'No se pudo guardar el presupuesto. Verifica tu conexión.'
      );
      return;
    }
    setSubmitting(false);
    // This screen has no summary anymore — return to where we came from
    router.back();
  }

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error state ──────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={48}
            color={darkColors.textMuted}
          />
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorSubtitle}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentAmount = parseAmount(amountText);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AmbientGlow height={220} intensity={0.7} />

          <View style={styles.header}>
            <TabHeader
              title="Crédito"
              subtitle={config ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            />
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionLabel}>MONTO POR PERÍODO</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) return;
                  if (parts[1]?.length > 2) return;
                  setAmountText(cleaned);
                  if (formError) setFormError('');
                }}
                placeholder="0"
                placeholderTextColor={darkColors.textMuted}
                keyboardType="number-pad"
                keyboardAppearance="dark"
                autoFocus
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((val) => {
                const active = currentAmount === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.quickChip, active && styles.quickChipActive]}
                    onPress={() => {
                      setAmountText(val.toString());
                      if (formError) setFormError('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        active && styles.quickChipTextActive,
                      ]}
                    >
                      ${val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
              DÍA DE CORTE (1-31)
            </Text>
            <Text style={styles.hint}>
              Cada mes, en este día se reinicia el presupuesto.
            </Text>
            <TextInput
              style={styles.dayInput}
              value={cutoffDayText}
              onChangeText={(t) => {
                setCutoffDayText(t.replace(/[^0-9]/g, '').slice(0, 2));
                if (formError) setFormError('');
              }}
              placeholder="1"
              placeholderTextColor={darkColors.textMuted}
              keyboardType="number-pad"
              keyboardAppearance="dark"
              maxLength={2}
            />

            {formError !== '' && <Text style={styles.errorText}>{formError}</Text>}

            <View style={styles.formButtons}>
              <PrimaryButton
                title={submitting ? 'Guardando...' : 'Guardar presupuesto'}
                icon="check-circle-outline"
                onPress={handleSave}
                loading={submitting}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Error State
  errorTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.caption,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Form (setup / edit) — directo sobre el fondo de la app, sin card
  form: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: darkColors.textPrimary,
    minWidth: 160,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: darkColors.red,
    paddingBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: 1,
    borderColor: darkColors.divider,
  },
  quickChipActive: {
    backgroundColor: darkColors.red,
    borderColor: darkColors.red,
  },
  quickChipText: {
    ...typography.caption,
    color: darkColors.textSecondary,
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayInput: {
    height: 52,
    width: 100,
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: 1,
    borderColor: darkColors.divider,
    borderRadius: borderRadius.md,
    ...typography.h3,
    color: darkColors.textPrimary,
  },
  formButtons: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: darkColors.textMuted,
  },

  // Error
  errorText: {
    ...typography.small,
    color: darkColors.red,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
