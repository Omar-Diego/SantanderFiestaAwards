import { StyleSheet, Text, View } from 'react-native';
import { merchantColor } from '../utils/merchant';

/**
 * Revolut-style merchant avatar: a solid colored circle with the first
 * letter of the description. The color is deterministic per merchant,
 * so it looks the same across all screens.
 */
export default function MerchantAvatar({
  description,
  size = 42,
}: {
  description: string;
  size?: number;
}) {
  const initial = description.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: merchantColor(description),
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.38) }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
