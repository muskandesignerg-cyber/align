import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function CustomToggle({ value, onValueChange, disabled }: CustomToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);
  const thumbX = useSharedValue(value ? 22 : 2);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
    thumbX.value = withSpring(value ? 22 : 2, { mass: 1, damping: 15, stiffness: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#E5E7EB', '#4C59D7']),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const checkOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(value ? 1 : 0, { duration: 150 }),
  }));

  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.85}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Animated.View style={[styles.checkWrap, checkOpacity]}>
            <Svg width={12} height={12} viewBox="0 0 12 12">
              <Path
                d="M2 6L5 9L10 3"
                stroke="#4C59D7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    justifyContent: 'center',
  },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  checkWrap: { alignItems: 'center', justifyContent: 'center' },
});
