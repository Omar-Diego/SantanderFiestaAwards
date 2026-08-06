import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Avatar, Style, type StyleDefinition } from '@dicebear/core';
import blobs from '../../assets/blobs.json';
import { merchantColor } from '../utils/merchant';

/** Module-level cache: the same seed always renders the same SVG, and lists
 *  (FlashList) often contain rows that re-render — avoid regenerating. */
const avatarCache = new Map<string, string>();

/**
 * DiceBear v10 "Blobs" style definition. The official @dicebear/blobs npm
 * package does not exist — the style is only published as a JSON definition
 * in @dicebear/styles, so we vendor that JSON here for a fully offline build
 * (no network, no runtime fetch).
 */
const blobsStyle = new Style(blobs as unknown as StyleDefinition);

function getAvatarSvg(seed: string): string {
  let svg = avatarCache.get(seed);
  if (!svg) {
    const raw = new Avatar(blobsStyle, { seed }).toString();
    // The Blobs style paints its own full-canvas background rectangle (a
    // solid color). Remove it so the merchant-colored circle shows through as
    // the avatar background and the blob shapes become the icon itself.
    svg = raw.replace(
      /<rect width="100" height="100" fill="#[0-9a-fA-F]+"\/>/g,
      ''
    );
    avatarCache.set(seed, svg);
  }
  return svg;
}

/**
 * DiceBear avatar: a solid colored circle with a unique Blob generated
 * offline from a seed (deterministic — the same seed always produces the
 * same blob). The circle keeps the deterministic merchant color, so
 * merchants stay recognizable across screens.
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
      {/* Rendered larger than the circle (the circle clips with overflow
          hidden) so the blob fills it edge to edge instead of floating on a
          background ring */}
      <SvgXml xml={svgXml} width={size * 1.3} height={size * 1.3} />
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
