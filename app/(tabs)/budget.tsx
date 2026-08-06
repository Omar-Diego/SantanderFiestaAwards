import { useState, useEffect, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import { getPeriodLabel } from '../../src/utils/date';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { Transaction } from '../../src/types';

// ─── Currency formatter ─────────────────────────────────
const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return fmt.format(amount);
}

function formatDate(date: Date): string {
  return format(date, 'd MMM', { locale: es });
}

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

// ─── Main Screen ────────────────────────────────────────
export default function BudgetScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  const { transactions, loading: txLoading } = useTransactions(groupId);
  const {
    config,
    loading: budgetLoading,
    error,
    period,
    periodTransactions,
    spent,
    remaining,
    saveBudget,
  } = useBudget(groupId, transactions);

  const loading = !storageLoaded || txLoading || budgetLoading;

  // Form state (used both for first-time setup and editing)
  const [editing, setEditing] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [cutoffDayText, setCutoffDayText] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function openEdit() {
    setAmountText(config ? String(config.amount) : '');
    setCutoffDayText(config ? String(config.cutoffDay) : '1');
    setFormError('');
    setEditing(true);
  }

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
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el presupuesto. Verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  const progress = useMemo(() => {
    if (!config || config.amount <= 0) return 0;
    return Math.min(1, Math.max(0, spent / config.amount));
  }, [config, spent]);

  const isOverBudget = remaining < 0;

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error state ──────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorSubtitle}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Setup / edit form ──────────────────────────────
  if (!config || editing) {
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
            <View style={styles.header}>
              <Text style={styles.greeting}>Presupuesto</Text>
              <Text style={styles.groupName}>
                {config ? 'Editar presupuesto' : '¿Cuánto quieres gastar?'}
              </Text>
            </View>

            <View style={styles.formCard}>
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
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  autoFocus
                />
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
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />

              {formError !== '' && <Text style={styles.errorText}>{formError}</Text>}

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSave}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color={colors.textOnGold} />
                  <Text style={styles.submitText}>
                    {submitting ? 'Guardando...' : 'GUARDAR PRESUPUESTO'}
                  </Text>
                </TouchableOpacity>

                {config && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditing(false)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Budget overview ──────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Presupuesto</Text>
              <Text style={styles.groupName}>Te queda</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
              <Ionicons name="pencil" size={18} color={colors.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.monthLabel}>{getPeriodLabel(period)}</Text>
        </View>

        {/* ── Summary Card ────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text
            style={[
              styles.summaryAmount,
              isOverBudget && styles.summaryAmountNegative,
            ]}
          >
            {formatCurrency(remaining)}
          </Text>
          <Text style={styles.summarySubtitle}>de {formatCurrency(config.amount)}</Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                isOverBudget && styles.progressFillOver,
              ]}
            />
          </View>

          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatCurrency(spent)} gastado</Text>
            </View>
          </View>

          {isOverBudget && (
            <Text style={styles.overBudgetText}>Te pasaste del presupuesto</Text>
          )}
        </View>

        {/* ── Period Transactions ─────────────────── */}
        {periodTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos de este período</Text>
            <View style={styles.recentList}>
              {periodTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          </View>
        )}

        {periodTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={48} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Sin gastos en este período</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Transaction Row Component ──────────────────────────
function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <View style={txStyles.row}>
      <View style={txStyles.iconWrap}>
        <Ionicons name="receipt-outline" size={20} color={colors.gold} />
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={txStyles.date}>{formatDate(transaction.date)}</Text>
      </View>
      <Text style={txStyles.amount}>-{formatCurrency(transaction.amount)}</Text>
    </View>
  );
}

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.goldLight + '40',
  },
  info: {
    flex: 1,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
  },
  date: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyBold,
    color: colors.error,
  },
});

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  groupName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  monthLabel: {
    ...typography.body,
    color: colors.gold,
    marginTop: spacing.xs,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.md,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: -0.5,
  },
  summaryAmountNegative: {
    color: colors.error,
  },
  summarySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.divider,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold,
  },
  progressFillOver: {
    backgroundColor: colors.error,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.small,
    color: colors.textMuted,
  },
  overBudgetText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.sm,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  recentList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.goldLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // Error State
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Form (setup / edit)
  formCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    ...shadows.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.small,
    color: colors.textMuted,
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
    color: colors.gold,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 160,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.goldLight,
    paddingBottom: spacing.sm,
  },
  dayInput: {
    height: 52,
    width: 100,
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    ...typography.h3,
    color: colors.textPrimary,
  },
  formButtons: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...typography.bodyBold,
    color: colors.textOnGold,
    fontSize: 16,
    letterSpacing: 1,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },

  // Error
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
