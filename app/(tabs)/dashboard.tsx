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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId, getGroupName } from '../../src/utils/storage';
import { darkColors, typography, spacing, borderRadius, shadows } from '../../src/theme';
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

/** Payment due date: cutoff day of the current month, e.g. "05/07" */
function formatPaymentDue(cutoffDay: number): string {
  const now = new Date();
  // Clamp to the last day of the month (e.g. day 31 in February)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.min(cutoffDay, lastDay);
  return format(new Date(now.getFullYear(), now.getMonth(), day), 'dd/MM');
}

// ─── Main Dashboard (Home) ──────────────────────────────
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

  // ─── Derived values ────────────────────────────────
  const limit = budgetConfig?.amount ?? null;
  const limitPercent =
    limit && limit > 0 ? Math.min(100, (monthTotal / limit) * 100) : 0;
  const isOverBudget = budgetConfig !== null && budgetRemaining < 0;
  const available = budgetConfig !== null ? budgetRemaining : null;
  const paymentDue = budgetConfig ? formatPaymentDue(budgetConfig.cutoffDay) : null;

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
        {/* ── Account Top Bar ───────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountTitle} numberOfLines={1}>
              {groupName || 'Santander Fiesta'}
            </Text>
            <Text style={styles.accountSubtitle}>Tarjeta Fiesta Awards</Text>
          </View>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyPillText}>MXN</Text>
          </View>
        </View>

        {/* ── Balance Block (Spent this month) ──────── */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>SPENT THIS MONTH</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(monthTotal)}</Text>
          {limit !== null ? (
            <Text style={styles.balanceLimit}>
              {Math.round(limitPercent)}% of {formatCurrency(limit)} limit
            </Text>
          ) : (
            <Text style={styles.balanceLimit}>Define tu límite en Credit</Text>
          )}
        </View>

        {/* ── Quick Info Widgets ────────────────────── */}
        <View style={styles.widgetsRow}>
          <View style={styles.widget}>
            <Text style={styles.widgetLabel}>Available</Text>
            <Text
              style={[
                styles.widgetValue,
                { color: isOverBudget ? darkColors.red : darkColors.green },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {available !== null ? formatCurrency(available) : '—'}
            </Text>
          </View>
          <View style={styles.widget}>
            <Text style={styles.widgetLabel}>Payment due</Text>
            <Text style={styles.widgetValue}>{paymentDue ?? '—'}</Text>
          </View>
        </View>

        {/* ── Divider ───────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Recent Activity ───────────────────────── */}
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          {recentTransactions.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/history')}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length > 0 ? (
          <View style={styles.activityList}>
            {recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-outline"
              size={48}
              color={darkColors.textMuted}
            />
            <Text style={styles.emptyText}>No expenses yet this month</Text>
          </View>
        )}

        {/* Bottom spacing for floating nav */}
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
        <MaterialCommunityIcons
          name="receipt-outline"
          size={20}
          color={darkColors.textSecondary}
        />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: darkColors.divider,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkColors.surfaceElevated,
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

  // Account top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: darkColors.red,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
    fontSize: 17,
  },
  accountSubtitle: {
    ...typography.small,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  currencyPill: {
    backgroundColor: darkColors.pill,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  currencyPillText: {
    ...typography.small,
    color: darkColors.textPrimary,
    fontWeight: '600',
  },

  // Balance block
  balanceBlock: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  balanceLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.2,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  balanceLimit: {
    ...typography.small,
    color: darkColors.textSecondary,
    marginTop: spacing.xs,
  },

  // Widgets
  widgetsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  widget: {
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  widgetLabel: {
    ...typography.small,
    color: darkColors.textSecondary,
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginTop: spacing.xs,
    letterSpacing: -0.3,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: darkColors.divider,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  // Recent activity
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  activityTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  seeAll: {
    ...typography.bodyBold,
    color: darkColors.red,
    fontSize: 14,
  },
  activityList: {
    backgroundColor: darkColors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
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
