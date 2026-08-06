import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import { merchantColor } from '../utils/merchant';

/** Module-level cache: the same seed always renders the same SVG, and lists
 *  (FlashList) often contain rows that re-render — avoid regenerating. */
const avatarCache = new Map<string, string>();

function getAvatarSvg(seed: string): string {
  let svg = avatarCache.get(seed);
  if (!svg) {
    svg = createAvatar(adventurer, { seed }).toString();
    avatarCache.set(seed, svg);
  }
  return svg;
}

/**
 * DiceBear avatar: a solid colored circle with a unique illustrated icon
 * generated offline from a seed (deterministic — the same seed always
 * produces the same avatar). The circle keeps the deterministic merchant
 * color, so merchants stay recognizable across screens.
 */
export default function MerchantAvatar({
  description,
  seed,
  size = 42,
}: {
  description: string;
  seed?: string;
  size?: number;
}) {
  const avatarSeed = seed ?? description;

  const svgXml = useMemo(() => getAvatarSvg(avatarSeed), [avatarSeed]);

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
      <SvgXml xml={svgXml} width={size * 0.9} height={size * 0.9} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
