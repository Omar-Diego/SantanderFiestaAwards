import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import { darkColors, typography, spacing } from '../../src/theme';

// ─── Main Screen (Alertas) — en construcción ────────────
export default function AlertsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientGlow height={240} intensity={0.8} />

      <View style={styles.header}>
        <TabHeader title="Alertas" />
      </View>

      <View style={styles.centerContent}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="hammer-wrench"
            size={40}
            color={darkColors.red}
          />
        </View>
        <Text style={styles.title}>En construcción</Text>
        <Text style={styles.subtitle}>
          Las alertas automáticas llegarán muy pronto.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkColors.red + '1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: darkColors.textSecondary,
    textAlign: 'center',
  },
});
