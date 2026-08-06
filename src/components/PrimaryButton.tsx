import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors, typography, borderRadius, spacing, shadows } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  compact?: boolean;
}

/**
 * Primary action button — the app's "essential action" control.
 * Solid red (Santander accent) by default; outline variant for secondary
 * essentials. Icon + label, centered, full width.
 */
export default function PrimaryButton({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  icon,
  compact = false,
}: PrimaryButtonProps) {
  const solid = variant === 'solid';
  const isDisabled = disabled || loading;
  const fg = solid ? '#FFFFFF' : darkColors.red;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact ? styles.buttonCompact : styles.buttonRegular,
        solid ? styles.solid : styles.outline,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons name={icon as any} size={compact ? 18 : 20} color={fg} />
          ) : null}
          <Text
            style={[
              styles.text,
              compact ? styles.textCompact : styles.textRegular,
              { color: fg },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  buttonRegular: {
    height: 56,
  },
  buttonCompact: {
    height: 44,
    ...shadows.sm,
  },
  solid: {
    backgroundColor: darkColors.red,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: darkColors.red,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    letterSpacing: 0.8,
  },
  textRegular: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  textCompact: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});
