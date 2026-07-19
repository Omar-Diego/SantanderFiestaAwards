import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows, borderRadius } from '../../src/theme';
import { getGroupId, getGroupName } from '../../src/utils/storage';

export default function DashboardScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      const gname = await getGroupName();
      setGroupId(gid);
      setGroupName(gname);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gold accent bar */}
      <View style={styles.accentBar} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Tus gastos</Text>
        <Text style={styles.groupName}>{groupName || 'Grupo'}</Text>
        <Text style={styles.groupCode}>Código: {groupId}</Text>
      </View>

      {/* Monthly summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>GASTOS DEL MES</Text>
        <Text style={styles.summaryAmount}>$0.00</Text>
        <Text style={styles.summaryHint}>
          Registra tu primer gasto para empezar
        </Text>
      </View>

      {/* Empty state */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Sin gastos aún</Text>
        <Text style={styles.emptySubtitle}>
          Los gastos que registres aparecerán aquí{'\n'}
          y se sincronizarán en tiempo real con{'\n'}
          el otro teléfono.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.gold,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  groupCode: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
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
    ...typography.h1,
    fontSize: 36,
    color: colors.gold,
    marginTop: spacing.sm,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
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
});
