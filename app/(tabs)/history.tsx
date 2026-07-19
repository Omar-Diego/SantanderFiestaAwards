import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTransactions } from '../../src/hooks/useTransactions';
import { getGroupId } from '../../src/utils/storage';
import { deleteTransaction } from '../../src/services/transactions';
import { CATEGORIES, getCategory } from '../../src/utils/categories';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── History Screen ─────────────────────────────────────
export default function HistoryScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

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

  const loading = !storageLoaded || txLoading;

  // ─── Filtered & sorted data ─────────────────────────
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.date;
      if (d.getFullYear() !== filterYear || d.getMonth() !== filterMonth) {
        return false;
      }
      if (filterCategory && t.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [transactions, filterYear, filterMonth, filterCategory]);

  const monthTotal = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  // ─── Month navigation ───────────────────────────────
  function changeMonth(delta: number) {
    setFilterMonth((prev) => {
      const newMonth = prev + delta;
      if (newMonth < 0) {
        setFilterYear((y) => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setFilterYear((y) => y + 1);
        return 0;
      }
      return newMonth;
    });
  }

  // ─── Delete handler ─────────────────────────────────
  const confirmDelete = useCallback(
    (transactionId: string) => {
      Alert.alert(
        'Eliminar gasto',
        '¿Estás seguro de eliminar este gasto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              if (!groupId) return;
              setDeleting(transactionId);
              try {
                await deleteTransaction(groupId, transactionId);
              } catch {
                Alert.alert('Error', 'No se pudo eliminar el gasto');
              } finally {
                setDeleting(null);
              }
            },
          },
        ],
      );
    },
    [groupId]
  );

  // ─── Render Swipeable Item ────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      return (
        <SwipeableRow
          transaction={item}
          onDelete={() => confirmDelete(item.id)}
          isDeleting={deleting === item.id}
        />
      );
    },
    [confirmDelete, deleting]
  );

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accentBar} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.accentBar} />

      {/* ── Header ──────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      {/* ── Month Filter ─────────────────────── */}
      <View style={styles.monthFilter}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(-1)}
        >
          <Ionicons name="chevron-back" size={22} color={colors.gold} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>
            {MONTHS[filterMonth]} {filterYear}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(1)}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.gold} />
        </TouchableOpacity>
      </View>

      {/* ── Summary Bar ──────────────────────── */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'gasto' : 'gastos'}
        </Text>
        <Text style={styles.summaryTotal}>
          {formatCurrency(monthTotal)}
        </Text>
      </View>

      {/* ── Category Filter Chips (horizontal) ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContent}
        style={styles.categoryFilterScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            filterCategory === null && styles.categoryChipActive,
          ]}
          onPress={() => setFilterCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              filterCategory === null && styles.categoryChipTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              filterCategory === cat.id && {
                backgroundColor: cat.color + '20',
                borderColor: cat.color,
              },
            ]}
            onPress={() =>
              setFilterCategory((prev) => (prev === cat.id ? null : cat.id))
            }
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={filterCategory === cat.id ? cat.color : colors.textMuted}
            />
            <Text
              style={[
                styles.categoryChipText,
                filterCategory === cat.id && {
                  color: cat.color,
                  fontWeight: '600',
                },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Transaction List ──────────────────── */}
      {filteredTransactions.length > 0 ? (
        <FlashList
          data={filteredTransactions}
          keyExtractor={(item: Transaction) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin gastos</Text>
          <Text style={styles.emptySubtitle}>
            {filterCategory
              ? 'No hay gastos de esta categoría este mes'
              : 'No hay gastos registrados este mes'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Swipeable Row Component ───────────────────────────
function SwipeableRow({
  transaction,
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const category = getCategory(transaction.category);
  const dateFormatted = format(transaction.date, 'd MMM', { locale: es });

  const renderRightActions = useCallback(
    () => (
      <View style={swipeStyles.action}>
        <TouchableOpacity
          onPress={onDelete}
          style={swipeStyles.actionInner}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.textOnGold} size="small" />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={22}
                color={colors.textOnGold}
              />
              <Text style={swipeStyles.actionText}>Eliminar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    ),
    [onDelete, isDeleting]
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <View style={txStyles.row}>
        <View
          style={[
            txStyles.iconWrap,
            { backgroundColor: category.color + '20' },
          ]}
        >
          <Ionicons
            name={category.icon as any}
            size={20}
            color={category.color}
          />
        </View>
        <View style={txStyles.info}>
          <Text style={txStyles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={txStyles.meta}>
            <Text style={txStyles.categoryLabel}>{category.name}</Text>
            <Text style={txStyles.dot}>·</Text>
            <Text style={txStyles.date}>{dateFormatted}</Text>
          </View>
        </View>
        <Text style={txStyles.amount}>{formatCurrency(transaction.amount)}</Text>
      </View>
    </ReanimatedSwipeable>
  );
}

const swipeStyles = StyleSheet.create({
  action: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  actionText: {
    ...typography.small,
    color: colors.textOnGold,
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Transaction Row Styles ─────────────────────────────
const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  categoryLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  dot: {
    ...typography.small,
    color: colors.textMuted,
  },
  date: {
    ...typography.small,
    color: colors.textMuted,
  },
  amount: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
});

// ─── Main Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.gold,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },

  // Month Filter
  monthFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  monthArrow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryTotal: {
    ...typography.bodyBold,
    color: colors.gold,
  },

  // Category Filter Chips
  categoryFilterScroll: {
    marginBottom: spacing.sm,
  },
  categoryFilterContent: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  categoryChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: colors.textOnGold,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
