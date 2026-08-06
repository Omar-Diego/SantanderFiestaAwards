/**
 * Deterministic merchant-style icon colors (Revolut-inspired).
 * The same description always maps to the same color across screens,
 * giving each merchant a recognizable identity in the UI.
 */
const MERCHANT_COLORS = [
  '#FF3B30', '#FF9F0A', '#AF52DE', '#0A84FF',
  '#30D158', '#FF6482', '#64D2FF', '#FFD60A',
];

export function merchantColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return MERCHANT_COLORS[hash % MERCHANT_COLORS.length];
}
