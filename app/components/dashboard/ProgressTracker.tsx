/**
 * ProgressTracker — 4-dot progress indicator with connecting lines.
 * Small variant for cards, large variant for detail modal.
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

  // Shared values for each dot and line
  const dotScales = Array.from({ length: DOT_COUNT }, () =>
    useSharedValue(0)
  );
  const lineFills = Array.from({ length: DOT_COUNT - 1 }, () =>
    useSharedValue(0)
  );

  useEffect(() => {
    const filledDots = isRejected || isOffer ? DOT_COUNT : progress;

    // Animate dots with stagger
    dotScales.forEach((scale, i) => {
      const delay = i * 120;
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 12,
          stiffness: 180,
          mass: 0.8,
          overshootClamping: false,
        })
      );
    });

    // Animate line fills
    const filledLines = isRejected || isOffer ? DOT_COUNT - 1 : Math.max(0, progress - 1);
    lineFills.forEach((fill, i) => {
      const delay = i * 120 + 60;
      fill.value = withDelay(
        delay,
        withTiming(i < filledLines ? 1 : 0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );
    });
  }, [status]);

  const renderDot = (index: number) => {
    const filledDots = isRejected || isOffer ? DOT_COUNT : progress;
    const isFilled = index < filledDots;
    const isCurrent = !isRejected && !isOffer && index === progress - 1;

    const currentSize = isCurrent ? activeDotSize : dotSize;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: dotScales[index].value }],
    }));

    return (
      <View key={`dot-wrapper-${index}`} style={{ alignItems: 'center' }}>
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
        {showLabels && size === 'large' && (
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
            {LABELS[index]}
          </Text>
        )}
      </View>
    );
  };

  const renderLine = (index: number) => {
    const animatedStyle = useAnimatedStyle(() => ({
      flex: lineFills[index].value,
    }));

    const emptyStyle = useAnimatedStyle(() => ({
      flex: 1 - lineFills[index].value,
    }));

    return (
      <View
        key={`line-${index}`}
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
            {
              height: lineHeight,
              backgroundColor: filledColor,
            },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              height: lineHeight,
              backgroundColor: emptyColor,
            },
            emptyStyle,
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.trackRow}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <React.Fragment key={i}>
            {renderDot(i)}
            {i < DOT_COUNT - 1 && renderLine(i)}
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
  },
  label: {
    textAlign: 'center',
  },
});

export default ProgressTracker;
