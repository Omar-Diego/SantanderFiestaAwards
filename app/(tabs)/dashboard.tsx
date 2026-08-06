import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId, getGroupName } from '../../src/utils/storage';
import { getCurrentMonthLabel } from '../../src/utils/date';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
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

// ─── Main Dashboard ─────────────────────────────────────
export default function DashboardScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load group info from storage
  useEffect(() => {
    (async () => {
      const [gid, gname] = await Promise.all([getGroupId(), getGroupName()]);
      setGroupId(gid);
      setGroupName(gname);
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
    spent: periodSpent,
    remaining: budgetRemaining,
    periodTransactions,
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
  const monthLabel = getCurrentMonthLabel();

  const monthTotal = useMemo(
    () => getMonthTotal(year, month),
    [getMonthTotal, year, month]
  );

  const recentTransactions = useMemo(
    () => getRecentTransactions(5),
    [getRecentTransactions]
  );

  const transactionCount = useMemo(
    () =>
      transactions.filter((t) => {
        const d = t.date;
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    [transactions, year, month]
  );

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

  // ─── Empty state (no transactions) ────────────────
  const hasBudget = budgetConfig !== null;
  const isFirstTime = hasBudget
    ? periodSpent === 0 && periodTransactions.length === 0
    : monthTotal === 0 && transactionCount === 0;
  const isOverBudget = hasBudget && budgetRemaining < 0;

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
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* ── Header ───────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Tus gastos</Text>
          <Text style={styles.groupName}>{groupName || 'Grupo'}</Text>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>

        {/* ── Summary Card ────────────────────────── */}
        <View style={styles.summaryCard}>
          {hasBudget ? (
            <>
              <Text style={styles.summaryLabel}>TE QUEDA</Text>
              <Text
                style={[
                  styles.summaryAmount,
                  isOverBudget && styles.summaryAmountNegative,
                ]}
              >
                {formatCurrency(budgetRemaining)}
              </Text>
              <View style={styles.spentRow}>
                <Text style={styles.spentLabel}>GASTADO</Text>
                <Text style={styles.spentAmount}>{formatCurrency(periodSpent)}</Text>
              </View>
              <View style={styles.summaryMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {periodTransactions.length}{' '}
                    {periodTransactions.length === 1 ? 'gasto' : 'gastos'}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>Tiempo real</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.summaryLabel}>GASTO TOTAL</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(monthTotal)}</Text>
              <View style={styles.summaryMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {transactionCount} {transactionCount === 1 ? 'gasto' : 'gastos'}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>Tiempo real</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Recent Transactions ─────────────────── */}
        {!isFirstTime && recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos gastos</Text>
            <View style={styles.recentList}>
              {recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          </View>
        )}

        {/* ── Empty State ─────────────────────────── */}
        {isFirstTime && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={48} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Sin gastos este mes</Text>
          </View>
        )}

        {/* Bottom spacing for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Floating Action Button ──────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/add')}
      >
        <Ionicons name="add" size={28} color={colors.textOnGold} />
      </TouchableOpacity>
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
      <Text style={txStyles.amount}>{formatCurrency(transaction.amount)}</Text>
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
    color: colors.textPrimary,
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

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.md,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.gold,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  summaryAmountNegative: {
    color: colors.error,
  },
  spentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  spentLabel: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  spentAmount: {
    ...typography.bodyBold,
    color: colors.textSecondary,
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
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.divider,
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
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
