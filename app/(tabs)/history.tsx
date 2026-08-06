import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTransactions } from '../../src/hooks/useTransactions';
import { getGroupId } from '../../src/utils/storage';
import MerchantAvatar from '../../src/components/MerchantAvatar';
import { deleteTransaction } from '../../src/services/transactions';
import { darkColors, typography, spacing, borderRadius, shadows } from '../../src/theme';
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

// ─── History Screen (Activity) ──────────────────────────
export default function HistoryScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth());

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
      return true;
    });
  }, [transactions, filterYear, filterMonth]);

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
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ──────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividad</Text>
      </View>

      {/* ── Month Filter ─────────────────────── */}
      <View style={styles.monthFilter}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(-1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={darkColors.red}
          />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>
            {MONTHS[filterMonth]} {filterYear}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={darkColors.red}
          />
        </TouchableOpacity>
      </View>

      {/* ── Summary Bar ──────────────────────── */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'gasto' : 'gastos'}
        </Text>
        <Text style={styles.summaryTotal}>{formatCurrency(monthTotal)}</Text>
      </View>

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
          <MaterialCommunityIcons
            name="receipt-outline"
            size={48}
            color={darkColors.textMuted}
          />
          <Text style={styles.emptyTitle}>Sin gastos</Text>
          <Text style={styles.emptySubtitle}>
            No hay gastos registrados este mes
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
        <MerchantAvatar description={transaction.description} />
        <View style={txStyles.info}>
          <Text style={txStyles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={txStyles.date}>{dateFormatted}</Text>
        </View>
        <Text style={txStyles.amount}>-{formatCurrency(transaction.amount)}</Text>
      </View>
    </ReanimatedSwipeable>
  );
}

const swipeStyles = StyleSheet.create({
  action: {
    backgroundColor: darkColors.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    marginRight: spacing.xxl,
  },
  actionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  actionText: {
    ...typography.small,
    color: '#FFFFFF',
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
    paddingHorizontal: spacing.xl,
    backgroundColor: darkColors.background,
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
    marginTop: 2,
    ...typography.small,
    color: darkColors.textMuted,
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
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h1,
    color: darkColors.textPrimary,
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
    ...shadows.sm,
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
    color: darkColors.textPrimary,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: darkColors.textSecondary,
  },
  summaryTotal: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },

  // List
  listContent: {
    paddingBottom: 160,
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
    color: darkColors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
});
