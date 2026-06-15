import { Platform } from 'react-native';

export const Spacing = {
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s12: 12,
  s14: 14,
  s16: 16,
  s20: 20,
  s24: 24,
  s28: 28,
  s32: 32,
  s40: 40,
  s48: 48,
  s64: 64,

  // Screen-specific layout tokens (iPhone 15 Pro target)
  hPad: 24,         // horizontal page padding
  cardGap: 12,      // gap between cards
  sectionGap: 24,   // gap between sections
} as const;

export const BorderRadius = {
  chip: 8,
  button: 12,
  card: 16,
  icon: 32,
} as const;

export const Shadow = Platform.select({
  web: {
    card: {
      // @ts-ignore web-only
      boxShadow: '0 4px 12px rgba(76, 89, 215, 0.10)',
    },
    button: {
      // @ts-ignore web-only
      boxShadow: '0 6px 16px rgba(76, 89, 215, 0.18)',
    },
  },
  default: {
    card: {
      shadowColor: '#4C59D7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
    button: {
      shadowColor: '#4C59D7',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
  },
})!;

export const TouchTarget = 44;
