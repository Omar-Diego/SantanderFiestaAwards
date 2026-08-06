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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import MerchantAvatar from '../../src/components/MerchantAvatar';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { getPeriodLabel } from '../../src/utils/date';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';
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

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// ─── Main Screen (Crédito) ───────────────────────────────
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

  // ─── Setup / edit form ──────────────────────────────
  if (!config || editing) {
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
                  title={submitting ? 'Guardando...' : 'GUARDAR PRESUPUESTO'}
                  icon="check-circle-outline"
                  onPress={handleSave}
                  loading={submitting}
                />

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
        <AmbientGlow height={300} intensity={0.8} />

        {/* ── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <TabHeader title="Crédito" subtitle={getPeriodLabel(period)} />
        </View>

        {/* ── Summary Card ────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {isOverBudget ? 'TE PASAS POR' : 'TE QUEDA'}
          </Text>
          <Text
            style={[
              styles.summaryAmount,
              isOverBudget ? styles.summaryAmountNegative : styles.summaryAmountPositive,
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
              <MaterialCommunityIcons
                name="receipt-outline"
                size={14}
                color={darkColors.textMuted}
              />
              <Text style={styles.metaText}>{formatCurrency(spent)} gastado</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={14}
                color={darkColors.textMuted}
              />
              <Text style={styles.metaText}>
                {periodTransactions.length}{' '}
                {periodTransactions.length === 1 ? 'gasto' : 'gastos'}
              </Text>
            </View>
          </View>

          {isOverBudget && (
            <Text style={styles.overBudgetText}>Te pasaste del presupuesto</Text>
          )}
        </View>

        {/* ── Essential action: editar presupuesto ─── */}
        <View style={styles.ctaWrap}>
          <PrimaryButton
            title="Editar presupuesto"
            icon="pencil-outline"
            onPress={openEdit}
          />
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
              <MaterialCommunityIcons
                name="wallet-outline"
                size={48}
                color={darkColors.red}
              />
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
      <MerchantAvatar description={transaction.description} size={40} />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.divider,
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  description: {
    ...typography.body,
    color: darkColors.textPrimary,
  },
  date: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: 2,
  },
  amount: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
});

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

  // Summary Card
  summaryCard: {
    backgroundColor: darkColors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.xl,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.2,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  summaryAmountPositive: {
    color: darkColors.green,
  },
  summaryAmountNegative: {
    color: darkColors.red,
  },
  summarySubtitle: {
    ...typography.caption,
    color: darkColors.textMuted,
    marginTop: spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surfaceElevated,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.green,
  },
  progressFillOver: {
    backgroundColor: darkColors.red,
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
    color: darkColors.textMuted,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: darkColors.divider,
  },
  overBudgetText: {
    ...typography.small,
    color: darkColors.red,
    marginTop: spacing.sm,
    fontWeight: '600',
  },

  // Essential CTA
  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },

  // Sections
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  recentList: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    paddingHorizontal: spacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
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
