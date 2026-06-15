/**
 * StatCard — Displays a single statistic with an animated count-up.
 */

import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  Easing,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface StatCardProps {
  count: number;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const StatCard: React.FC<StatCardProps> = ({
  count,
  label,
  isActive,
  onPress,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const animatedCount = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    animatedCount.value = 0;
    animatedCount.value = withTiming(count, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [count]);

  useAnimatedReaction(
    () => Math.round(animatedCount.value),
    (rounded) => {
      runOnJS(setDisplayCount)(rounded);
    },
    [count]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        isActive && styles.activeCard,
        animatedStyle,
      ]}
    >
      <Text style={styles.count}>{displayCount}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 110,
    height: 88,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.s16,
    justifyContent: 'center',
  },
  activeCard: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  count: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: Colors.tertiary,
  },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.muted,
    marginTop: 2,
  },
});

export default StatCard;
