import { TextStyle } from 'react-native';
import { fScale } from '../../constants/screenSize';

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * FontSize — raw numeric values (for backward compat).
 * Use these when you need a static number.
 * For responsive scaling, use ScaledFontSize below.
 */
export const FontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  body: 15,
  bodyLg: 16,
  subtitle: 17,
  heading3: 20,
  heading2: 26,
  heading1: 28,
} as const;

/**
 * ScaledFontSize — iPhone 15 Pro-relative font sizes.
 * Uses fScale() for subtle cross-device scaling.
 * On 393pt devices these return the same values as FontSize.
 */
export const ScaledFontSize = {
  xs: fScale(11),
  sm: fScale(12),
  base: fScale(13),
  md: fScale(14),
  body: fScale(15),
  bodyLg: fScale(16),
  subtitle: fScale(17),
  heading4: fScale(18),
  heading3: fScale(20),
  heading2: fScale(26),
  heading1: fScale(28),
  heading0: fScale(30),
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/**
 * Typography — pre-composed text style objects.
 * Uses fScale for responsive font sizing.
 */
export const Typography = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: fScale(FontSize.heading1),
    lineHeight: fScale(FontSize.heading1 * 1.2),
  } as TextStyle,
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: fScale(FontSize.heading2),
    lineHeight: fScale(FontSize.heading2 * 1.2),
  } as TextStyle,
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: fScale(FontSize.heading3),
    lineHeight: fScale(FontSize.heading3 * 1.2),
  } as TextStyle,
  h4: {
    fontFamily: FontFamily.bold,
    fontSize: fScale(18),
    lineHeight: fScale(18 * 1.2),
  } as TextStyle,
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: fScale(FontSize.subtitle),
    lineHeight: fScale(FontSize.subtitle * 1.4),
  } as TextStyle,
  bodyMd: {
    fontFamily: FontFamily.medium,
    fontSize: fScale(FontSize.bodyLg),
    lineHeight: fScale(FontSize.bodyLg * 1.4),
  } as TextStyle,
  body: {
    fontFamily: FontFamily.regular,
    fontSize: fScale(FontSize.body),
    lineHeight: fScale(FontSize.body * 1.4),
  } as TextStyle,
  bodySm: {
    fontFamily: FontFamily.regular,
    fontSize: fScale(FontSize.md),
    lineHeight: fScale(FontSize.md * 1.4),
  } as TextStyle,
  label: {
    fontFamily: FontFamily.medium,
    fontSize: fScale(FontSize.md),
    lineHeight: fScale(FontSize.md * 1.4),
  } as TextStyle,
  labelSm: {
    fontFamily: FontFamily.medium,
    fontSize: fScale(FontSize.sm),
    lineHeight: fScale(FontSize.sm * 1.4),
  } as TextStyle,
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: fScale(FontSize.sm),
    lineHeight: fScale(FontSize.sm * 1.4),
  } as TextStyle,
  micro: {
    fontFamily: FontFamily.regular,
    fontSize: fScale(FontSize.xs),
    lineHeight: fScale(FontSize.xs * 1.4),
  } as TextStyle,
} as const;
