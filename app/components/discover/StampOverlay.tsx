import React from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily } from '../../theme/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface StampOverlayProps {
  /** Animated.ValueXY — x drives APPLY/PASS opacity via interpolation */
  position: Animated.ValueXY;
}

/**
 * StampOverlay — APPLY / PASS stamps that appear during swipe.
 * Driven by react-native Animated.Value (matching PanResponder in SwipeableCard).
 */
export default function StampOverlay({ position }: StampOverlayProps) {
  const applyOpacity = position.x.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 0.9],
    extrapolate: 'clamp',
  });

  const passOpacity = position.x.interpolate({
    inputRange: [-120, -60],
    outputRange: [0.9, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
      {/* APPLY stamp — visible on right swipe */}
      <Animated.View style={[styles.stampContainer, styles.applyStamp, { opacity: applyOpacity }]}>
        <Animated.Text style={[styles.stampText, styles.applyText]}>APPLY</Animated.Text>
      </Animated.View>

      {/* PASS stamp — visible on left swipe */}
      <Animated.View style={[styles.stampContainer, styles.passStamp, { opacity: passOpacity }]}>
        <Animated.Text style={[styles.stampText, styles.passText]}>PASS</Animated.Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  stampContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  applyStamp: { transform: [{ rotate: '-15deg' }] },
  passStamp:  { transform: [{ rotate: '15deg' }] },
  stampText: {
    fontSize: 48,
    fontFamily: FontFamily.bold,
    borderWidth: 3,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  applyText: { color: Colors.primary,  borderColor: Colors.primary },
  passText:  { color: Colors.error,    borderColor: Colors.error },
});
