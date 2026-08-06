import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { darkColors } from '../theme';

// Unique gradient IDs per mounted instance (react-native-svg can clash on
// Android when several SVGs with the same defs ids are on screen).
let glowCounter = 0;

/**
 * Ambient background glow — the visual signature of the app (Revolut-style
 * fluid red/purple gradients). Rendered behind the content, non-interactive.
 *
 * @param height    Height of the glow zone (default 320)
 * @param intensity Multiplier for the gradient opacity (1 = Home hero, less on
 *                  inner screens so Home stays the star)
 */
export default function AmbientGlow({
  height = 320,
  intensity = 1,
}: {
  height?: number;
  intensity?: number;
}) {
  const [id] = useState(() => {
    glowCounter += 1;
    return `glow${glowCounter}`;
  });
  const redId = `${id}Red`;
  const purpleId = `${id}Purple`;

  return (
    <View pointerEvents="none" style={[styles.glow, { height }]}>
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id={redId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={darkColors.red} stopOpacity={0.16 * intensity} />
            <Stop offset="100%" stopColor={darkColors.red} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={purpleId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#7B3FE4" stopOpacity={0.12 * intensity} />
            <Stop offset="100%" stopColor="#7B3FE4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="85%" cy="12%" r="150" fill={`url(#${redId})`} />
        <Circle cx="8%" cy="60%" r="190" fill={`url(#${purpleId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
