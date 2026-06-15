import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { formatSalary } from '../../../utils/salaryFormatter';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRACK_PADDING = 48; // left/right margin so thumbs don't clip edge
const TRACK_WIDTH = SCREEN_WIDTH - 48; // full width inside 24px padding each side
const THUMB_SIZE = 22;
const MAX_VAL = 50;
const MIN_VAL = 0;

interface DualRangeSliderProps {
  min: number;
  max: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}

function valToPercent(val: number) {
  return (val - MIN_VAL) / (MAX_VAL - MIN_VAL);
}

function percentToVal(pct: number) {
  return Math.round(pct * (MAX_VAL - MIN_VAL) + MIN_VAL);
}

export default function DualRangeSlider({ min, max, onMinChange, onMaxChange }: DualRangeSliderProps) {
  const trackRef = useRef<View>(null);
  const trackX = useRef(0);
  const trackW = useRef(TRACK_WIDTH);

  const leftPct = valToPercent(min);
  const rightPct = valToPercent(max);

  const clampMin = useCallback(
    (pct: number) => Math.max(0, Math.min(pct, valToPercent(max) - 0.05)),
    [max],
  );
  const clampMax = useCallback(
    (pct: number) => Math.min(1, Math.max(pct, valToPercent(min) + 0.05)),
    [min],
  );

  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newPct = clampMin((gs.moveX - trackX.current) / trackW.current);
        onMinChange(percentToVal(newPct));
      },
    }),
  ).current;

  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newPct = clampMax((gs.moveX - trackX.current) / trackW.current);
        onMaxChange(percentToVal(newPct));
      },
    }),
  ).current;

  const leftPos = leftPct * (TRACK_WIDTH - THUMB_SIZE);
  const rightPos = rightPct * (TRACK_WIDTH - THUMB_SIZE);
  const fillLeft = leftPct * TRACK_WIDTH;
  const fillWidth = (rightPct - leftPct) * TRACK_WIDTH;

  return (
    <View style={styles.container}>
      {/* Track */}
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={(e) => {
          e.target;
          trackW.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Background track */}
        <View style={styles.trackBg} />
        {/* Fill between thumbs */}
        <View style={[styles.trackFill, { left: fillLeft, width: Math.max(fillWidth, 0) }]} />

        {/* Left thumb */}
        <View
          style={[styles.thumb, { left: leftPos }]}
          {...leftPanResponder.panHandlers}
        />
        {/* Right thumb */}
        <View
          style={[styles.thumb, { left: rightPos }]}
          {...rightPanResponder.panHandlers}
        />
      </View>

      {/* Min / Max labels */}
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{formatSalary(MIN_VAL)}</Text>
        <Text style={styles.labelText}>{formatSalary(MAX_VAL, true)}</Text>
      </View>
    </View>
  );
}

const thumbShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(76,89,215,0.25)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  track: { height: THUMB_SIZE, justifyContent: 'center', position: 'relative' },
  trackBg: {
    position: 'absolute',
    left: 0, right: 0,
    height: 3,
    backgroundColor: '#D0D7FF',
    borderRadius: 2,
    top: (THUMB_SIZE - 3) / 2,
  },
  trackFill: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#4C59D7',
    borderRadius: 2,
    top: (THUMB_SIZE - 3) / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4C59D7',
    ...thumbShadow,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  labelText: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
});
