/**
 * screenSize.ts — iPhone 15 Pro target dimensions
 *
 * iPhone 15 Pro logical points (what React Native uses):
 *   Width:  393pt
 *   Height: 852pt
 *
 * Safe areas (Dynamic Island):
 *   Top:    59pt  (Dynamic Island area)
 *   Bottom: 34pt  (home indicator)
 *
 * Usable content: 852 - 59 - 34 = 759pt
 *
 * USAGE:
 *   scale(n)  → horizontal sizes, border radii
 *   vScale(n) → vertical sizes, heights
 *   fScale(n) → font sizes (mild scaling)
 */

import { Dimensions } from 'react-native';

// ─── iPhone 15 Pro constants ──────────────────────────────────────────────────

export const SCREEN = {
  /** Logical width on iPhone 15 Pro */
  WIDTH: 393,
  /** Logical height on iPhone 15 Pro */
  HEIGHT: 852,

  /** Top safe area — Dynamic Island device */
  SAFE_TOP: 59,
  /** Bottom safe area — home indicator */
  SAFE_BOTTOM: 34,

  /** Usable content area height (852 - 59 - 34) */
  CONTENT_HEIGHT: 759,
  /** Usable content area width (full) */
  CONTENT_WIDTH: 393,

  /** Dynamic Island dimensions */
  DYNAMIC_ISLAND_WIDTH: 126,
  DYNAMIC_ISLAND_HEIGHT: 37,

  // ── Standard layout tokens ──────────────────────────────────────────────
  /** Horizontal page padding */
  H_PADDING: 24,
  /** Standard card border radius */
  CARD_RADIUS: 20,
  /** Standard button border radius */
  BTN_RADIUS: 16,
  /** Standard CTA button height */
  BTN_HEIGHT: 56,
  /** Bottom tab bar height (excluding home indicator) */
  TAB_HEIGHT: 64,
  /** Total tab bar height including 34pt home indicator */
  TAB_TOTAL_HEIGHT: 98,
  /** Top navigation bar content height */
  NAV_HEIGHT: 56,
} as const;

// ─── Runtime device dimensions ────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window');

/**
 * Horizontal scale — for widths, paddings, border radii.
 * e.g. scale(24) → 24pt at 393w, larger on wider devices.
 */
export const scale = (size: number): number => (W / 393) * size;

/**
 * Vertical scale — for heights, vertical margins.
 * e.g. vScale(56) → 56pt at 852h, larger on taller devices.
 */
export const vScale = (size: number): number => (H / 852) * size;

/**
 * Font scale — subtle scaling so text doesn't get huge on large screens.
 * Scales up by only 30% of the excess ratio.
 */
export const fScale = (size: number): number => {
  const s = W / 393;
  return Math.round(size * (s < 1 ? s : 1 + (s - 1) * 0.3));
};

// ─── Pre-computed card height for discover feed ───────────────────────────────

/**
 * Job card height for the discover feed.
 * 72% of usable content area, dynamically computed.
 * On iPhone 15 Pro: ~547pt
 */
export const JOB_CARD_HEIGHT = Math.floor(((H - SCREEN.SAFE_TOP - SCREEN.SAFE_BOTTOM) * 0.72));

/**
 * Kanban column width: 82% of screen width.
 * On iPhone 15 Pro: ~323pt
 */
export const KANBAN_COLUMN_WIDTH = Math.floor(W * 0.82);

/**
 * Kanban snap interval: column + 16px gap.
 * On iPhone 15 Pro: ~339pt
 */
export const KANBAN_SNAP_INTERVAL = KANBAN_COLUMN_WIDTH + 16;
