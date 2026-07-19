import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../src/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.goldBar} />
      <Text style={styles.title}>Santander</Text>
      <Text style={styles.subtitle}>Fiesta Awards</Text>
      <View style={styles.divider} />
      <Text style={styles.tagline}>Track your expenses in style</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  goldBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.h2,
    color: colors.gold,
    marginTop: spacing.xs,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.goldLight,
    marginVertical: spacing.xl,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
