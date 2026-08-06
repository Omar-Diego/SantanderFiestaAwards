/**
 * Santander Fiesta Awards — Theme
 *
 * White & Gold color palette inspired by the Santander Fiesta Awards credit card.
 * All visual constants should be imported from here for consistency.
 */

export const colors = {
  // Core brand
  white: '#FFFFFF',
  gold: '#C8A84E',
  goldLight: '#E8D49E',
  goldDark: '#A68A3E',
  goldShimmer: '#D4B96A',

  // Backgrounds
  background: '#F5F5F0',       // Warm off-white
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF7',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#A3A3A3',
  textOnGold: '#FFFFFF',
  textOnWhite: '#1A1A1A',

  // Accents
  success: '#2E7D32',
  warning: '#E65100',
  error: '#C62828',
  info: '#1565C0',

  // Borders & Dividers
  border: '#E8E4DC',
  borderGold: '#C8A84E',
  divider: '#EFEBE3',

  // Shadows
  shadow: '#000000',
} as const;

/**
 * Dark mode palette (v2 design system).
 * See Design.md — dark banking-style UI.
 * Screens are being migrated from `colors` (white & gold) to `darkColors`.
 */
export const darkColors = {
  // Backgrounds
  background: '#000000',       // Pure black screen background
  surface: '#1C1C1E',          // Cards, widgets, floating nav
  surfaceElevated: '#2C2C2E',  // Raised surfaces

  // Accents
  red: '#FF3B30',              // Santander accent: avatar, links, alerts
  green: '#2EA071',            // Available / positive amounts
  greenBright: '#00E676',      // Bright variant
  warning: '#FF9F0A',          // Near-limit warnings

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',    // Medium gray
  textMuted: '#6B6B6B',

  // Borders & Dividers
  divider: '#2C2C2E',
  pill: '#3A3A3C',             // Pill backgrounds (e.g. "MXN")

  // Shadows
  shadow: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.8 },
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
