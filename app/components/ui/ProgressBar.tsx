/**
 * ProgressBar — onboarding step indicator
 *
 * Uses a clean 1-based API:
 *   currentStep={1} → first segment filled (Step 1 active)
 *   currentStep={2} → first segment completed, second active
 *   etc.
 *
 * Props:
 *   currentStep  — 1-based active step number
 *   totalSteps   — total number of steps (default 5)
 *
 * Legacy props (total / current / completed) still supported
 * so existing callers don't break.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR_ACTIVE    = '#4C59D7';  // current step
const COLOR_DONE      = '#849CFF';  // completed steps before current
const COLOR_INACTIVE  = '#D0D7FF';  // future steps

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** 1-based: which step is currently active */
  currentStep?: number;
  /** total number of steps */
  totalSteps?: number;

  // ── Legacy props (backward compat) ──────────────────────────────────────
  /** @deprecated use currentStep instead */
  current?: number;
  /** @deprecated use totalSteps instead */
  total?: number;
  /** @deprecated handled automatically via currentStep */
  completed?: number;
}

// ─── Single animated segment ──────────────────────────────────────────────────

const Segment: React.FC<{
  color: string;
  animateIn: boolean;
  delay: number;
}> = ({ color, animateIn, delay }) => {
  const width = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (animateIn) {
      Animated.timing(width, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, []);

  return (
    <View style={styles.segmentTrack}>
      <Animated.View
        style={[
          styles.segmentFill,
          {
            backgroundColor: color,
            // Only animate the active segment; others are instant
            width: animateIn
              ? width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
              : '100%',
          },
        ]}
      />
    </View>
  );
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 5,
  // Legacy
  current,
  total,
  completed,
}) => {
  // ── Resolve to 1-based currentStep ──────────────────────────────────────
  let step: number;
  let steps: number;

  if (currentStep !== undefined) {
    // New clean API
    step  = currentStep;
    steps = totalSteps;
  } else if (current !== undefined) {
    // Legacy 3-state API: completed + current (0-based index of active)
    // e.g. current=1, completed=1 meant "segment index 1 is active" → step 2
    // We map: step = current + 1 (since legacy `current` was 0-based index)
    if (completed !== undefined) {
      // Legacy ProfileBuilder call: current={1} completed={1} → should show step 1 active
      // The original intent was: completed segments before current, current is active
      // But the actual active segment index was `current`, so step = current (1-based)
      step = current; // e.g. current=1 → step 1 active ✓
    } else {
      // Pure legacy 2-state: index < current is filled
      step = current;
    }
    steps = total ?? totalSteps;
  } else {
    step  = 1;
    steps = total ?? totalSteps;
  }

  const getColor = (i: number): string => {
    // i is 0-based segment index
    // step is 1-based active step
    if (i + 1 < step)  return COLOR_DONE;     // past step
    if (i + 1 === step) return COLOR_ACTIVE;   // current step
    return COLOR_INACTIVE;                      // future step
  };

  return (
    <View style={styles.wrapper}>
      {/* Segment row */}
      <View style={styles.row}>
        {Array.from({ length: steps }).map((_, i) => {
          const color = getColor(i);
          const isActive = i + 1 === step;
          return (
            <Segment
              key={i}
              color={color}
              animateIn={isActive}   // Only animate the currently-active segment
              delay={200}
            />
          );
        })}
      </View>

      {/* Step label */}
      <Text style={styles.label}>Step {step} of {steps}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLOR_INACTIVE,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '400',
  },
});
