import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useBudget } from '../../src/hooks/useBudget';
import { getGroupId } from '../../src/utils/storage';
import {
  groupTransactionsByDay,
  getPeriodLabel,
  getPreviousPeriodRange,
  getNextPeriodRange,
  type DayGroupItem,
} from '../../src/utils/date';
import MerchantAvatar from '../../src/components/MerchantAvatar';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import { useToast } from '../../src/components/ToastProvider';
import { deleteTransaction } from '../../src/services/transactions';
import { darkColors, typography, spacing, borderRadius, sharedStyles } from '../../src/theme';
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

// ─── History Screen (Actividad) ──────────────────────────
export default function HistoryScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showToast, confirm } = useToast();

  // Filters
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current cutoff period
  const [searchText, setSearchText] = useState('');

  // Load group
  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setStorageLoaded(true);
    })();
  }, []);

  // Real-time transactions
  const { transactions, loading: txLoading } = useTransactions(groupId);

  // Budget config gives us the cutoff day that shapes each period
  const {
    config: budgetConfig,
    loading: budgetLoading,
    period,
  } = useBudget(groupId, transactions);
  const cutoffDay = budgetConfig?.cutoffDay ?? 1;

  const loading = !storageLoaded || txLoading || budgetLoading;

  // ─── Filtered period (offset 0 = current cutoff period) ──
  // Computed on every render so it self-heals across a period boundary.
  const filterPeriod = (() => {
    let range = period;
    const steps = Math.abs(periodOffset);
    for (let i = 0; i < steps; i++) {
      range =
        periodOffset < 0
          ? getPreviousPeriodRange(range.start, cutoffDay)
          : getNextPeriodRange(range.end, cutoffDay);
    }
    return range;
  })();

  const periodTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => t.date >= filterPeriod.start && t.date < filterPeriod.end
      ),
    [transactions, filterPeriod]
  );

  const periodTotal = useMemo(
    () => periodTransactions.reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  // ─── List data (period + search) ────────────────────
  const filteredTransactions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return periodTransactions;
    return periodTransactions.filter((t) =>
      t.description.toLowerCase().includes(query)
    );
  }, [periodTransactions, searchText]);

  // ─── Grouped list (by day, newest first) ────────────
  const groupedItems = useMemo(
    () => groupTransactionsByDay(filteredTransactions),
    [filteredTransactions]
  );

  // ─── Period navigation (never into the future) ──────
  function changePeriod(delta: number) {
    setPeriodOffset((prev) => Math.min(0, prev + delta));
  }

  // ─── Delete handler ─────────────────────────────────
  const confirmDelete = useCallback(
    async (transaction: Transaction) => {
      const confirmed = await confirm({
        title: 'Eliminar gasto',
        message: '¿Estás seguro de eliminar este gasto?',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        destructive: true,
      });
      if (!confirmed) return;
      if (!groupId) return;

      setDeleting(transaction.id);
      try {
        await deleteTransaction(groupId, transaction.id, {
          description: transaction.description,
          amount: transaction.amount,
        });
      } catch {
        showToast('error', 'No se pudo eliminar el gasto');
      } finally {
        setDeleting(null);
      }
    },
    [confirm, groupId, showToast]
  );

  // ─── Render grouped item ─────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: DayGroupItem }) => {
      if (item.kind === 'header') {
        return <Text style={sharedStyles.dayHeader}>{item.label}</Text>;
      }
      return (
        // Spacing lives on the wrapper so the swipeable row measures exactly
        // the card height → the delete button stretches to match it
        <View style={styles.rowWrap}>
          <SwipeableRow
            transaction={item.transaction}
            onEdit={() => router.push(`/add?edit=${item.transaction.id}`)}
            onDelete={() => confirmDelete(item.transaction)}
            isDeleting={deleting === item.transaction.id}
          />
        </View>
      );
    },
    [confirmDelete, deleting]
  );

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

  const periodLabel = getPeriodLabel(filterPeriod);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Ambient glow ──────────────────────────── */}
      <AmbientGlow height={280} intensity={0.8} />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TabHeader title="Actividad" />
      </View>

      {/* ── Search ──────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={darkColors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar gasto..."
          placeholderTextColor={darkColors.textMuted}
          keyboardAppearance="dark"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            hitSlop={8}
            accessibilityLabel="Limpiar búsqueda"
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={darkColors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Period Filter ──────────────────────────── */}
      <View style={styles.monthFilter}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changePeriod(-1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={darkColors.red} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>{periodLabel}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.monthArrow,
            periodOffset >= 0 && styles.monthArrowDisabled,
          ]}
          onPress={() => changePeriod(1)}
          disabled={periodOffset >= 0}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={
              periodOffset >= 0 ? darkColors.textMuted : darkColors.red
            }
          />
        </TouchableOpacity>
      </View>

      {/* ── Period summary card ────────────────────── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>GASTADO EN EL PERÍODO</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(periodTotal)}</Text>
        <Text style={styles.summaryMeta}>
          {periodTransactions.length}{' '}
          {periodTransactions.length === 1 ? 'gasto' : 'gastos'}
        </Text>
      </View>

      {/* ── Transactions (own card per expense) ────── */}
      {groupedItems.length > 0 ? (
        <FlashList
          data={groupedItems}
          keyExtractor={(item: DayGroupItem) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : searchText.trim().length > 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="magnify-close"
            size={48}
            color={darkColors.textMuted}
          />
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptySubtitle}>
            Ningún gasto coincide con tu búsqueda
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="receipt-outline"
            size={48}
            color={darkColors.textMuted}
          />
          <Text style={styles.emptyTitle}>Sin gastos</Text>
          <Text style={styles.emptySubtitle}>
            Aún no hay gastos registrados
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Swipeable Row Component ───────────────────────────
function SwipeableRow({
  transaction,
  onEdit,
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => {
      // Actions are fully invisible while the row is closed and only fade in
      // as the user swipes left (progress goes 0 → 1). This guarantees they
      // never appear behind/under a card when idle.
      const actionStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
      }));

      return (
        <Animated.View style={[swipeStyles.actions, actionStyle]}>
          <TouchableOpacity
            onPress={onEdit}
            style={[swipeStyles.action, swipeStyles.actionEdit]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={22}
              color="#FFFFFF"
            />
            <Text style={swipeStyles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={[swipeStyles.action, swipeStyles.actionDelete]}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={swipeStyles.actionText}>Eliminar</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [onEdit, onDelete, isDeleting]
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      {/* Each expense is its own card */}
      <View style={txStyles.card}>
        <MerchantAvatar
          description={transaction.description}
          seed={transaction.id}
        />
        <View style={txStyles.info}>
          <Text style={txStyles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
        </View>
        <Text style={txStyles.amount}>-{formatCurrency(transaction.amount)}</Text>
      </View>
    </ReanimatedSwipeable>
  );
}

const swipeStyles = StyleSheet.create({
  // Row of action buttons revealed on swipe. Overflow hidden + the same corner
  // radius as the card guarantees no colored slivers peek behind the card.
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
    alignSelf: 'stretch',
    gap: 2,
    paddingVertical: spacing.md,
  },
  actionEdit: {
    backgroundColor: darkColors.green,
  },
  actionDelete: {
    backgroundColor: darkColors.red,
    marginLeft: spacing.sm,
  },
  actionText: {
    ...typography.small,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Transaction Card Styles ────────────────────────────
const txStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
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
  amount: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
});

// ─── Main Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: darkColors.textPrimary,
    paddingVertical: 0,
  },

  // Month Filter
  monthFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    marginBottom: spacing.md,
  },
  monthArrow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  monthArrowDisabled: {
    opacity: 0.4,
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },

  // Summary (sin fondo de card — directo sobre el fondo de la app)
  summaryCard: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.xl,
  },
  summaryLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.2,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: darkColors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  summaryMeta: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: spacing.xs,
  },

  // Grouped list
  list: {
    flex: 1,
  },
  // Extra bottom padding so the last row can scroll clear of the floating
  // pill nav bar (height 68 + safe-area inset + 16px offset)
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 160,
  },
  // Spacing between rows lives here (see renderItem) so the swipeable
  // measures the exact card height and the delete button matches it
  rowWrap: {
    marginBottom: spacing.sm,
  },
  // Empty (justo debajo del resumen, sin gap centrado)
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
});
