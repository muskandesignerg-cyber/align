/**
 * ProgressTracker — 4-dot progress indicator with connecting lines.
 * Fixed: Hooks extracted into sub-components to follow Rules of Hooks.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import {
  ApplicationStatus,
  getProgressForStatus,
} from '../../types/applications';

interface ProgressTrackerProps {
  status: ApplicationStatus;
  size?: 'small' | 'large';
  showLabels?: boolean;
}

const LABELS = ['Applied', 'Viewed', 'Interview', 'Decision'];
const DOT_COUNT = 4;

// ─── Sub-component: single animated dot ──────────────────────────────────────
interface DotProps {
  isFilled: boolean;
  isCurrent: boolean;
  dotSize: number;
  activeDotSize: number;
  filledColor: string;
  emptyColor: string;
  scaleValue: SharedValue<number>;
  label?: string;
  showLabel: boolean;
}

function TrackerDot({ isFilled, isCurrent, dotSize, activeDotSize, filledColor, emptyColor, scaleValue, label, showLabel }: DotProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const currentSize = isCurrent ? activeDotSize : dotSize;

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            width: currentSize,
            height: currentSize,
            borderRadius: currentSize / 2,
            backgroundColor: isFilled ? filledColor : emptyColor,
          },
          isCurrent && {
            shadowColor: 'rgba(76,89,215,0.4)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 4,
          },
          animatedStyle,
        ]}
      />
      {showLabel && label && (
        <Text
          style={[
            styles.label,
            {
              marginTop: 6,
              color: Colors.muted,
              fontSize: FontSize.xs,
              fontFamily: FontFamily.regular,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

// ─── Sub-component: animated connecting line ──────────────────────────────────
interface LineProps {
  lineHeight: number;
  filledColor: string;
  emptyColor: string;
  fillValue: SharedValue<number>;
  size: 'small' | 'large';
}

function TrackerLine({ lineHeight, filledColor, emptyColor, fillValue, size }: LineProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    flex: fillValue.value,
  }));

  const emptyStyle = useAnimatedStyle(() => ({
    flex: 1 - fillValue.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        height: lineHeight,
        flexDirection: 'row',
        alignSelf: 'center',
        marginHorizontal: size === 'large' ? 4 : 2,
        borderRadius: lineHeight / 2,
        overflow: 'hidden',
        backgroundColor: emptyColor,
      }}
    >
      <Animated.View
        style={[
          { height: lineHeight, backgroundColor: filledColor },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          { height: lineHeight, backgroundColor: emptyColor },
          emptyStyle,
        ]}
      />
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  status,
  size = 'small',
  showLabels = false,
}) => {
  const progress = getProgressForStatus(status);
  const isRejected = status === 'Rejected';
  const isOffer = status === 'Offer';

  const dotSize = size === 'large' ? 16 : 10;
  const activeDotSize = size === 'large' ? 16 : 12;
  const lineHeight = size === 'large' ? 3 : 2;

  const filledColor = isRejected ? Colors.error : Colors.primary;
  const emptyColor = Colors.border;

  // Shared values — always called at top level (hooks rules satisfied)
  const dot0 = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const dotScales = [dot0, dot1, dot2, dot3];

  const line0 = useSharedValue(0);
  const line1 = useSharedValue(0);
  const line2 = useSharedValue(0);
  const lineFills = [line0, line1, line2];

  useEffect(() => {
    dotScales.forEach((scale, i) => {
      scale.value = withDelay(
        i * 120,
        withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 })
      );
    });

    const filledLines = isRejected || isOffer ? DOT_COUNT - 1 : Math.max(0, progress - 1);
    lineFills.forEach((fill, i) => {
      fill.value = withDelay(
        i * 120 + 60,
        withTiming(i < filledLines ? 1 : 0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );
    });
  }, [status]);

  const filledDots = isRejected || isOffer ? DOT_COUNT : progress;

  return (
    <View style={styles.container}>
      <View style={styles.trackRow}>
        {dotScales.map((scaleValue, i) => (
          <React.Fragment key={i}>
            <TrackerDot
              isFilled={i < filledDots}
              isCurrent={!isRejected && !isOffer && i === progress - 1}
              dotSize={dotSize}
              activeDotSize={activeDotSize}
              filledColor={filledColor}
              emptyColor={emptyColor}
              scaleValue={scaleValue}
              label={LABELS[i]}
              showLabel={showLabels && size === 'large'}
            />
            {i < DOT_COUNT - 1 && (
              <TrackerLine
                lineHeight={lineHeight}
                filledColor={filledColor}
                emptyColor={emptyColor}
                fillValue={lineFills[i]}
                size={size}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    textAlign: 'center',
  },
});
