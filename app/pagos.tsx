import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

// ─── Regla de pagos ─────────────────────────────────────
// Omar cubre los primeros $1,000 de gasto de cada período; Isa el restante.
const OMAR_BASE = 1000;

type Person = 'isa' | 'omar';

const PERSON_META: Record<Person, { name: string; paysLabel: string }> = {
  isa: { name: 'Isa', paysLabel: 'ISA PAGA' },
  omar: { name: 'Omar', paysLabel: 'OMAR PAGA' },
};

// ─── Payments Screen (Pagos) ────────────────────────────
export default function PaymentsScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  // Isa siempre se muestra primero.
  const [active, setActive] = useState<Person>('isa');

  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  const { transactions, loading: txLoading } = useTransactions(groupId);
  const { period, spent, loading: budgetLoading } = useBudget(groupId, transactions);

  const loading = !storageLoaded || txLoading || budgetLoading;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </SafeAreaView>
    );
  }

  const omarPays = Math.min(OMAR_BASE, spent);
  const isaPays = Math.max(0, spent - OMAR_BASE);
  const pays = active === 'isa' ? isaPays : omarPays;
  const meta = PERSON_META[active];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AmbientGlow height={200} intensity={0.7} />

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pagos</Text>
          <View style={styles.periodPill}>
            <MaterialCommunityIcons
              name="calendar-range"
              size={13}
              color={darkColors.textMuted}
            />
            <Text style={styles.periodPillText}>{getPeriodLabel(period)}</Text>
          </View>
        </View>

        {/* Tabs — Isa siempre primero */}
        <View style={styles.segmentRow}>
          {(['isa', 'omar'] as const).map((who) => {
            const isActive = active === who;
            return (
              <TouchableOpacity
                key={who}
                style={[styles.segment, isActive && styles.segmentActive]}
                onPress={() => setActive(who)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {PERSON_META[who].name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Monto (persona activa) */}
        <View style={styles.amountCard}>
          <Text style={styles.payEyebrow}>{meta.paysLabel}</Text>
          <Text style={styles.payAmount}>{formatCurrency(pays)}</Text>
        </View>

        {/* Reparto */}
        <View style={styles.breakdownCard}>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Omar</Text>
            <Text style={styles.splitAmount}>{formatCurrency(omarPays)}</Text>
          </View>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Isa</Text>
            <Text style={styles.splitAmount}>{formatCurrency(isaPays)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.splitRow}>
            <Text style={styles.splitLabelTotal}>Total</Text>
            <Text style={styles.splitAmountTotal}>{formatCurrency(spent)}</Text>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: darkColors.surfaceElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
  },
  periodPillText: {
    ...typography.caption,
    color: darkColors.textSecondary,
    fontWeight: '600',
  },

  // Segmented tabs (Isa · Omar)
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: darkColors.surfaceElevated,
    borderRadius: borderRadius.full,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  segmentActive: {
    backgroundColor: darkColors.red,
  },
  segmentText: {
    ...typography.bodyBold,
    color: darkColors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // Amount
  amountCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  payEyebrow: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  payAmount: {
    fontSize: 44,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },

  // Reparto
  breakdownCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  splitLabel: {
    ...typography.body,
    color: darkColors.textSecondary,
  },
  splitLabelTotal: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
  splitAmount: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
  splitAmountTotal: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
    fontSize: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.divider,
    marginVertical: spacing.sm,
  },
});
