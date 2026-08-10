import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTransactions } from '../src/hooks/useTransactions';
import { useBudget } from '../src/hooks/useBudget';
import { getGroupId } from '../src/utils/storage';
import { getPeriodLabel } from '../src/utils/date';
import AmbientGlow from '../src/components/AmbientGlow';
import { darkColors, typography, spacing, borderRadius } from '../src/theme';

// ─── Currency formatter ─────────────────────────────────
const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return fmt.format(amount);
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// ─── Simulation Screen (Simular gasto) ───────────────────
// "Si hoy gasto $X → ¿cuánto me queda este fin de semana, el próximo y
// al corte?" Pure local math over the live budget — nothing is saved.
export default function SimulateScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [amountText, setAmountText] = useState('');

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
    period,
    available,
    carryOver,
    weekendsInPeriod,
    currentWeekend,
    weekendAllowance,
    weekendAvailable,
  } = useBudget(groupId, transactions);

  const loading = !storageLoaded || txLoading || budgetLoading;
  const spend = parseAmount(amountText);

  // ─── Simulation math ─────────────────────────────────
  // This weekend: the weekend pool minus what you'd spend today.
  const thisWeekendAfter =
    weekendAvailable !== null ? weekendAvailable - spend : null;

  // Next weekend: the guaranteed floor (one allowance) adjusted by today's
  // spending — spend more than this weekend's pool and you dip into the
  // next one.
  const nextWeekendAfter =
    config && weekendAvailable !== null && currentWeekend < weekendsInPeriod
      ? weekendAllowance + weekendAvailable - spend
      : null;

  // Full pool left at the end of the cutoff period.
  const periodAfter = config ? available - spend : null;

  const delta =
    nextWeekendAfter !== null ? nextWeekendAfter - weekendAllowance : null;

  // Quick chips: half / one / double the weekend slice (or fixed values)
  const quickAmounts = useMemo(() => {
    if (weekendAllowance > 0) {
      return [
        Math.round(weekendAllowance / 2),
        Math.round(weekendAllowance),
        Math.round(weekendAllowance * 2),
      ];
    }
    return [100, 500, 1000];
  }, [weekendAllowance]);

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AmbientGlow height={220} intensity={0.7} />

          {/* Back to Home */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={darkColors.red}
            />
            <Text style={styles.backText}>Atrás</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Simular gasto</Text>
          </View>

          {!config ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="credit-card-off-outline"
                size={40}
                color={darkColors.textMuted}
              />
              <Text style={styles.emptyTitle}>Sin presupuesto</Text>
              <Text style={styles.emptySubtitle}>
                Configura una meta en Crédito para poder simular tu gasto.
              </Text>
            </View>
          ) : (
            <>
              {/* Amount input */}
              <Text style={styles.sectionLabel}>SI HOY GASTO</Text>
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
                  }}
                  placeholder="0"
                  placeholderTextColor={darkColors.textMuted}
                  keyboardType="number-pad"
                  keyboardAppearance="dark"
                  autoFocus
                />
              </View>

              <View style={styles.quickRow}>
                {quickAmounts.map((val) => {
                  const active = spend === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.quickChip, active && styles.quickChipActive]}
                      onPress={() => setAmountText(String(val))}
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

              {/* Results */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
                QUEDARÍA
              </Text>

              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Este fin de semana</Text>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color:
                          thisWeekendAfter !== null && thisWeekendAfter < 0
                            ? darkColors.red
                            : darkColors.green,
                      },
                    ]}
                  >
                    {thisWeekendAfter !== null
                      ? formatCurrency(thisWeekendAfter)
                      : '—'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.resultRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultLabel}>El próximo fin de semana</Text>
                    {delta !== null && (
                      <Text style={styles.resultHint}>
                        {delta > 0.005
                          ? `${formatCurrency(delta)} más que tu tope`
                          : delta < -0.005
                            ? `${formatCurrency(Math.abs(delta))} menos que tu tope`
                            : 'tu tope exacto'}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color:
                          nextWeekendAfter !== null && nextWeekendAfter < 0
                            ? darkColors.red
                            : darkColors.green,
                      },
                    ]}
                  >
                    {nextWeekendAfter !== null
                      ? formatCurrency(nextWeekendAfter)
                      : '—'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Al corte del período</Text>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color:
                          periodAfter !== null && periodAfter < 0
                            ? darkColors.red
                            : darkColors.textPrimary,
                      },
                    ]}
                  >
                    {periodAfter !== null ? formatCurrency(periodAfter) : '—'}
                  </Text>
                </View>
              </View>

              {/* ── How the period is split ────────────── */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
                CÓMO SE DIVIDE EL PERÍODO
              </Text>
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownPerWeekend}>
                  {formatCurrency(weekendAllowance)}{' '}
                  <Text style={styles.breakdownPerWeekendUnit}>
                    por fin de semana
                  </Text>
                </Text>
                <Text style={styles.breakdownMeta}>
                  {weekendsInPeriod}{' '}
                  {weekendsInPeriod === 1 ? 'fin de semana' : 'fines de semana'}{' '}
                  en total · {getPeriodLabel(period)}
                  {carryOver > 0
                    ? `\nEl sobrante (${formatCurrency(
                        carryOver
                      )}) se suma completo al siguiente fin de semana (no se reparte)`
                    : ''}
                </Text>
                <View style={styles.weekendDots}>
                  {Array.from({ length: weekendsInPeriod }, (_, i) => i + 1).map(
                    (n) => (
                      <View
                        key={n}
                        style={[
                          styles.weekendDot,
                          n === currentWeekend && styles.weekendDotActive,
                          n < currentWeekend && styles.weekendDotDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekendDotText,
                            n <= currentWeekend && styles.weekendDotTextActive,
                          ]}
                        >
                          {n}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>

              {thisWeekendAfter !== null && thisWeekendAfter < 0 && (
                <Text style={styles.warning}>
                  Ojo: estás gastando de más — {formatCurrency(spend)} hoy
                  dejaría {formatCurrency(Math.abs(thisWeekendAfter))} para
                  salir de los próximos fines de semana.
                </Text>
              )}
            </>
          )}
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
  content: {
    paddingBottom: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Back
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.bodyBold,
    color: darkColors.red,
    fontSize: 15,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
  },
  // Section labels
  sectionLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.5,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // Amount input
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
    paddingHorizontal: spacing.xl,
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

  // Results
  resultCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    paddingHorizontal: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  resultLabel: {
    ...typography.body,
    color: darkColors.textPrimary,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  resultHint: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.divider,
  },

  // Period breakdown
  breakdownCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
  },
  breakdownPerWeekend: {
    fontSize: 28,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
  },
  breakdownPerWeekendUnit: {
    fontSize: 15,
    fontWeight: '400',
    color: darkColors.textSecondary,
  },
  breakdownMeta: {
    ...typography.caption,
    color: darkColors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  weekendDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  weekendDot: {
    minWidth: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: 1,
    borderColor: darkColors.divider,
  },
  weekendDotActive: {
    backgroundColor: darkColors.red,
    borderColor: darkColors.red,
  },
  weekendDotDone: {
    backgroundColor: darkColors.green,
    borderColor: darkColors.green,
  },
  weekendDotText: {
    ...typography.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },
  weekendDotTextActive: {
    color: '#FFFFFF',
  },

  // Warning
  warning: {
    ...typography.caption,
    color: darkColors.red,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    lineHeight: 18,
    fontWeight: '600',
  },

  // Empty state (no budget)
  emptyCard: {
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
  },
  emptySubtitle: {
    ...typography.caption,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
