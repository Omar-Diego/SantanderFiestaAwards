import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import { getPeriodLabel } from '../../src/utils/date';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';

// ─── Currency formatter ─────────────────────────────────
const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return fmt.format(amount);
}

// ─── Alert card model ───────────────────────────────────
type AlertTone = 'red' | 'green' | 'warning';

interface AlertItem {
  key: string;
  icon: string;
  tone: AlertTone;
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: '/budget';
}

const toneColors: Record<AlertTone, string> = {
  red: darkColors.red,
  green: darkColors.green,
  warning: darkColors.warning,
};

// ─── Main Screen ────────────────────────────────────────
export default function AlertsScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  const { transactions, loading: txLoading, error } = useTransactions(groupId);
  const {
    config,
    loading: budgetLoading,
    period,
    periodTransactions,
    spent,
    remaining,
  } = useBudget(groupId, transactions);

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
        </View>
      </SafeAreaView>
    );
  }

  const progress =
    config && config.amount > 0 ? Math.min(1, Math.max(0, spent / config.amount)) : 0;
  const isOver = config !== null && remaining < 0;
  const nearLimit = config !== null && !isOver && progress >= 0.8;

  // Summary card values (handles the no-budget case)
  const summaryTone = !config ? null : isOver ? 'red' : 'green';
  const summaryAmount = !config
    ? spent
    : isOver
      ? Math.abs(remaining)
      : remaining;
  const summaryLabel = !config
    ? 'GASTADO EN EL PERÍODO'
    : isOver
      ? 'TE PASAS POR'
      : 'DISPONIBLE';

  // ─── Build alert cards from real data ─────────────────
  const alerts: AlertItem[] = [];

  if (!config) {
    alerts.push({
      key: 'no-budget',
      icon: 'alert-circle-outline',
      tone: 'warning',
      title: 'Sin presupuesto',
      body: 'Define una meta de gasto para recibir alertas automáticas.',
      actionLabel: 'Ir a Crédito',
      actionRoute: '/budget',
    });
  } else if (isOver) {
    alerts.push({
      key: 'over',
      icon: 'alert-octagon',
      tone: 'red',
      title: 'Presupuesto excedido',
      body: `Te pasaste por ${formatCurrency(Math.abs(remaining))} de tu meta de ${formatCurrency(config.amount)}.`,
      actionLabel: 'Ver presupuesto',
      actionRoute: '/budget',
    });
  } else if (nearLimit) {
    alerts.push({
      key: 'near',
      icon: 'alert',
      tone: 'warning',
      title: 'Cerca del límite',
      body: `Ya gastaste el ${Math.round(progress * 100)}% de tu presupuesto (${formatCurrency(spent)} de ${formatCurrency(config.amount)}).`,
      actionLabel: 'Ver presupuesto',
      actionRoute: '/budget',
    });
  } else if (config) {
    alerts.push({
      key: 'ok',
      icon: 'check-circle-outline',
      tone: 'green',
      title: 'Todo en orden',
      body: `Te quedan ${formatCurrency(remaining)} de ${formatCurrency(config.amount)} para este período.`,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ambient glow ──────────────────────────── */}
        <AmbientGlow height={260} intensity={0.8} />

        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <TabHeader title="Alertas" subtitle={getPeriodLabel(period)} />
        </View>

        {/* ── Balance summary ────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{summaryLabel}</Text>
          <Text
            style={[
              styles.summaryAmount,
              summaryTone ? { color: toneColors[summaryTone] } : null,
            ]}
          >
            {formatCurrency(summaryAmount)}
          </Text>
          {config && (
            <Text style={styles.summarySubtitle}>
              de {formatCurrency(config.amount)} · {Math.round(progress * 100)}%
            </Text>
          )}
        </View>

        {/* ── Alert cards ────────────────────────────── */}
        <View style={styles.alertsSection}>
          {alerts.map((alert) => (
            <View key={alert.key} style={styles.alertCard}>
              <View
                style={[
                  styles.alertIconWrap,
                  { backgroundColor: toneColors[alert.tone] + '1F' },
                ]}
              >
                <MaterialCommunityIcons
                  name={alert.icon as any}
                  size={24}
                  color={toneColors[alert.tone]}
                />
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertText}>{alert.body}</Text>
                {alert.actionLabel && alert.actionRoute && (
                  <View style={styles.alertActionWrap}>
                    <PrimaryButton
                      title={alert.actionLabel}
                      icon="chevron-right"
                      compact
                      onPress={() => router.push(alert.actionRoute!)}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Period stats ───────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GASTOS</Text>
            <Text style={styles.statValue}>{periodTransactions.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GASTADO</Text>
            <Text style={styles.statValue}>{formatCurrency(spent)}</Text>
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
  scrollContent: {
    paddingBottom: 170,
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

  // Balance summary
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
  summarySubtitle: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: spacing.xs,
  },

  // Alerts
  alertsSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
  alertText: {
    ...typography.caption,
    color: darkColors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
  alertActionWrap: {
    marginTop: spacing.md,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
  },
  statLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1,
  },
  statValue: {
    ...typography.h3,
    color: darkColors.textPrimary,
    marginTop: spacing.xs,
  },

  // Error
  errorTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
    marginTop: spacing.md,
  },
});
