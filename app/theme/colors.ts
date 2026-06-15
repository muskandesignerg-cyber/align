export const Colors = {
  primary: '#4C59D7',
  secondary: '#849CFF',
  tertiary: '#3B43A7',
  surface: '#F4F6FF',
  surfaceLight: '#EEF0FF',
  white: '#FFFFFF',
  bodyText: '#1A1A2E',
  muted: '#6B7280',
  error: '#EF4444',
  success: '#22C55E',
  border: '#D0D7FF',
  linkedInBlue: '#0A66C2',
  // Phase 2 — Discover feed
  pageBg: '#FFFFFF',
  cardBorder: '#E8EAFF',
  pass: '#EF4444',
} as const;

export type ColorKey = keyof typeof Colors;
