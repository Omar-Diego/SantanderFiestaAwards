import { View, Text, Image, StyleSheet } from 'react-native';
import { darkColors, typography, spacing } from '../theme';

/**
 * Shared screen header: Santander logo in a white circle + title + optional
 * subtitle (e.g. period label). Mirrors the Home header identity so every tab
 * feels like the same family.
 */
export default function TabHeader({
  title,
  subtitle,
  logoSize = 44,
}: {
  title: string;
  subtitle?: string;
  logoSize?: number;
}) {
  return (
    <View style={styles.header}>
      <View
        style={[
          styles.logoCircle,
          { width: logoSize, height: logoSize, borderRadius: logoSize / 2 },
        ]}
      >
        <Image
          source={require('../../assets/SantanderLogo.png')}
          style={{ width: logoSize * 0.72, height: logoSize * 0.72 }}
          resizeMode="contain"
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: darkColors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.small,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
});
