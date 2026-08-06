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
import { router } from 'expo-router';
import { useTransactions } from '../../src/hooks/useTransactions';
import { getGroupId } from '../../src/utils/storage';
import { groupTransactionsByDay, type DayGroupItem } from '../../src/utils/date';
import MerchantAvatar from '../../src/components/MerchantAvatar';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── History Screen (Actividad) ──────────────────────────
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

  // ─── Grouped list (by day, newest first) ────────────
  const groupedItems = useMemo(
    () => groupTransactionsByDay(filteredTransactions),
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

  // ─── Render grouped item ─────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: DayGroupItem }) => {
      if (item.kind === 'header') {
        return <Text style={sharedStyles.dayHeader}>{item.label}</Text>;
      }
      return (
        <SwipeableRow
          transaction={item.transaction}
          onDelete={() => confirmDelete(item.transaction.id)}
          isDeleting={deleting === item.transaction.id}
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

  const monthLabel = `${MONTHS[filterMonth]} ${filterYear}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Ambient glow ──────────────────────────── */}
      <AmbientGlow height={280} intensity={0.8} />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TabHeader title="Actividad" />
      </View>

      {/* ── Month Filter ───────────────────────────── */}
      <View style={styles.monthFilter}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(-1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={darkColors.red} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>{monthLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => changeMonth(1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={darkColors.red} />
        </TouchableOpacity>
      </View>

      {/* ── Month summary card ─────────────────────── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          GASTADO EN {MONTHS[filterMonth].toUpperCase()}
        </Text>
        <Text style={styles.summaryAmount}>{formatCurrency(monthTotal)}</Text>
        <Text style={styles.summaryMeta}>
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'gasto' : 'gastos'}
        </Text>
      </View>

      {/* ── Essential action: registrar gasto ──────── */}
      <View style={styles.ctaWrap}>
        <PrimaryButton
          title="Registrar gasto"
          icon="plus"
          onPress={() => router.push('/add')}
        />
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
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onDelete: () => void;
  isDeleting: boolean;
}) {
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
      {/* Each expense is its own card */}
      <View style={txStyles.card}>
        <MerchantAvatar description={transaction.description} />
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
  action: {
    backgroundColor: darkColors.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm, // matches the card's bottom margin so the pill aligns with the card
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
    marginBottom: spacing.sm,
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

  // Essential CTA
  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  // Grouped list
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },
  // Empty (igual que Crédito: justo debajo de la acción, sin gap)
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
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
