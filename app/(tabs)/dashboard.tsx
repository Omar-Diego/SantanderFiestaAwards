import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AmbientGlow from '../../src/components/AmbientGlow';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import { getPeriodLabel } from '../../src/utils/date';
import MerchantAvatar from '../../src/components/MerchantAvatar';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

/** Payment due date: cutoff day of the current month, e.g. "01/09" */
function formatPaymentDue(cutoffDay: number): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.min(cutoffDay, lastDay);
  return format(new Date(now.getFullYear(), now.getMonth(), day), 'dd/MM');
}

// ─── Quick actions (Revolut-style circular shortcuts) ───
const QUICK_ACTIONS = [
  { label: 'Registrar', icon: 'plus', route: '/add' },
  { label: 'Historial', icon: 'format-list-bulleted', route: '/history' },
  { label: 'Presupuesto', icon: 'finance', route: '/budget' },
  { label: 'Alertas', icon: 'bell-outline', route: '/alerts' },
] as const;

// ─── Main Dashboard (Home) ──────────────────────────────
export default function DashboardScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load group info from storage
  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  // Real-time transaction subscription
  const {
    transactions,
    loading: txLoading,
    error,
    getMonthTotal,
    getRecentTransactions,
  } = useTransactions(groupId);

  // Budget goal for the current cutoff period (shared by the group)
  const {
    config: budgetConfig,
    loading: budgetLoading,
    period,
    remaining: budgetRemaining,
  } = useBudget(groupId, transactions);

  const loading = !storageLoaded || txLoading || budgetLoading;

  // Pull to refresh (complement to real-time sync)
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Brief visual feedback — real-time already keeps data fresh
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  // Current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthTotal = useMemo(
    () => getMonthTotal(year, month),
    [getMonthTotal, year, month]
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(5),
    [getRecentTransactions]
  );

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

  const isOverBudget = budgetConfig !== null && budgetRemaining < 0;
  const availableColor = !budgetConfig
    ? darkColors.textMuted
    : isOverBudget
      ? darkColors.red
      : darkColors.green;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkColors.red}
            colors={[darkColors.red]}
          />
        }
      >
        {/* ── Ambient glow (Revolut-style fluid background) ── */}
        <AmbientGlow />

        {/* ── Header (logo Santander) ──────────────── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image
              source={require('../../assets/SantanderLogo.png')}
              style={styles.avatarLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ── Balance ───────────────────────────────── */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceEyebrow}>SALDO TOTAL</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(monthTotal)}</Text>
          <Text style={styles.availableText}>
            Disponible:{' '}
            <Text style={{ color: availableColor, fontWeight: '600' }}>
              {budgetConfig ? formatCurrency(budgetRemaining) : 'Sin presupuesto'}
            </Text>
          </Text>
        </View>

        {/* ── Quick actions ─────────────────────────── */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.quickItem}
              onPress={() => router.push(action.route)}
              activeOpacity={0.7}
              accessibilityLabel={action.label}
            >
              <View style={styles.quickCircle}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={22}
                  color={darkColors.textPrimary}
                />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent activity ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVIDAD</Text>
          <View style={styles.activityCard}>
            {recentTransactions.length > 0 ? (
              <>
                {recentTransactions.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
                <TouchableOpacity
                  style={styles.seeAll}
                  onPress={() => router.push('/history')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>Ver todo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="receipt-outline"
                  size={44}
                  color={darkColors.textMuted}
                />
                <Text style={styles.emptyText}>Sin gastos</Text>
                <Text style={styles.emptySubtitle}>
                  Aún no hay gastos registrados
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Period (Próximo) ──────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.periodCard}
            onPress={() => router.push('/budget')}
            activeOpacity={0.7}
          >
            <View style={styles.periodLeft}>
              <Text style={styles.sectionTitle}>PERÍODO</Text>
              <Text style={styles.periodLabel}>{getPeriodLabel(period)}</Text>
            </View>
            {budgetConfig ? (
              <View style={styles.duePill}>
                <Text style={styles.duePillText}>
                  Corte el {formatPaymentDue(budgetConfig.cutoffDay)}
                </Text>
              </View>
            ) : (
              <View style={styles.duePill}>
                <Text style={styles.duePillText}>Define presupuesto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for floating nav */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Transaction Row (Revolut-style colored initials) ───
function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <View style={txStyles.row}>
      <MerchantAvatar description={transaction.description} />
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
    fontWeight: '600',
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

  // Header — Santander logo in a white circle
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLogo: {
    width: 36,
    height: 36,
  },

  // Balance
  balanceSection: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  balanceEyebrow: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 46,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  availableText: {
    ...typography.body,
    color: darkColors.textSecondary,
    marginTop: spacing.xs,
  },
  // Quick actions
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    justifyContent: 'space-between',
  },
  quickItem: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  quickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    ...typography.small,
    color: darkColors.textSecondary,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  activityCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  seeAll: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  seeAllText: {
    ...typography.bodyBold,
    color: darkColors.red,
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.small,
    color: darkColors.textMuted,
    textAlign: 'center',
  },

  // Period card
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
  },
  periodLeft: {
    flex: 1,
  },
  periodLabel: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
    marginTop: spacing.xs,
  },
  duePill: {
    backgroundColor: darkColors.pill,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  duePillText: {
    ...typography.small,
    color: darkColors.textPrimary,
    fontWeight: '600',
  },

  // Error state
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
});
