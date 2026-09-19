// Design system for PocketBinder.
// Direction: warm, playful, "scrapbook/retro" feel inspired by NewJeans' Phoning app —
// cream backgrounds, punchy accent color, soft pastel tags, chunky rounded cards with
// offset "sticker" shadows instead of flat iOS-style cards.

export const COLORS = {
  bg: '#faf6f1',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1DE',

  text: '#2B2233',
  textMuted: '#7A7189',
  textFaint: '#B6ADC4',

  primary: '#FF5C7A',
  primaryDark: '#E64467',
  primarySoft: '#fef3f5',

  secondary: '#5B6EE8',
  secondarySoft: '#E3E7FE',

  accentYellow: '#FFC24B',
  accentYellowSoft: '#FFF1D2',
  accentGreen: '#3FC98B',
  accentGreenSoft: '#DFF7EB',
  accentBlue: '#4AB8E0',
  accentBlueSoft: '#DEF3FA',
  accentPurple: '#A56BFF',
  accentPurpleSoft: '#EEE1FF',

  danger: '#E5484D',
  dangerSoft: '#FDE4E4',

  border: '#F0E4D3',
  divider: '#F0E4D3',
  overlay: 'rgba(43, 34, 51, 0.45)',
};

// Palette students can pick for their ID card / schedule blocks / event tags.
export const SWATCHES = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accentYellow,
  COLORS.accentGreen,
  COLORS.accentBlue,
  COLORS.accentPurple,
];

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FONT = {
  title: { fontSize: 26, fontWeight: '800' as const, color: COLORS.text, letterSpacing: -0.3 },
  h2: { fontSize: 19, fontWeight: '800' as const, color: COLORS.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: COLORS.text },
  body: { fontSize: 14, fontWeight: '500' as const, color: COLORS.text },
  bodyMuted: { fontSize: 13, fontWeight: '500' as const, color: COLORS.textMuted },
  label: { fontSize: 12, fontWeight: '700' as const, color: COLORS.textMuted, letterSpacing: 0.3 },
  button: { fontSize: 15, fontWeight: '800' as const },
};

// Offset "sticker" shadow instead of a soft flat shadow.
export const STICKER_SHADOW = {
  shadowColor: '#2B2233',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 0,
  elevation: 3,
};

export const CARD_SHADOW = {
  shadowColor: '#2B2233',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};
