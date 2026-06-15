import React, { useRef, ReactNode } from 'react';
import {
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';

const SCREEN_WIDTH       = Dimensions.get('window').width;
const SWIPE_THRESHOLD    = 80;
const VELOCITY_THRESHOLD = 0.3;
const SWIPE_UP_THRESHOLD = 100;

/**
 * Minimum pixels the finger must move before PanResponder claims the responder.
 *
 * This is THE critical setting that makes everything work simultaneously:
 *
 *   Tap  (< 10px movement) → PanResponder does NOT claim responder
 *                           → RN Responder system handles it
 *                           → TouchableOpacity fires (card tap, Pass, Save) ✓
 *
 *   Drag (≥ 10px movement) → PanResponder claims responder
 *                           → Swipe animation runs
 *                           → Card flies off screen ✓
 *
 * Why this works vs GestureDetector:
 *   PanResponder is PART of React Native's Responder system.
 *   TouchableOpacity is ALSO part of it. They coexist and yield to each other.
 *   GestureDetector (RNGH) is a SEPARATE native system that blocks the RN
 *   Responder system entirely on web — which is why taps, Pass, and Save
 *   all broke when GestureDetector was present.
 */
const PAN_ACTIVATION_DISTANCE = 10;

export interface SwipeableCardProps {
  children:     ReactNode;
  onSwipeLeft:  () => void;
  onSwipeRight: () => void;
  onSwipeUp?:   () => void;
  /** Animated.ValueXY shared with StampOverlay and CardStack */
  position:     Animated.ValueXY;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  position,
}: SwipeableCardProps) {

  const panResponder = useRef(
    PanResponder.create({
      /**
       * Only claim the responder once the finger has moved.
       * This lets taps pass through to TouchableOpacity.
       * Using onMoveShouldSetPanResponder (not onStartShould...) is essential.
       */
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > PAN_ACTIVATION_DISTANCE ||
        Math.abs(gs.dy) > PAN_ACTIVATION_DISTANCE,

      onPanResponderMove: (_, gs) => {
        position.setValue({ x: gs.dx, y: gs.dy });
      },

      onPanResponderRelease: (_, gs) => {
        const { dx, dy, vx } = gs;

        // ── Right swipe ──────────────────────────────────────────────
        if (dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.5, y: dy },
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipeRight();
          });
          return;
        }

        // ── Left swipe ───────────────────────────────────────────────
        if (dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.5, y: dy },
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipeLeft();
          });
          return;
        }

        // ── Up swipe ─────────────────────────────────────────────────
        if (dy < -SWIPE_UP_THRESHOLD && onSwipeUp) {
          Animated.timing(position, {
            toValue: { x: dx, y: -SCREEN_WIDTH * 1.5 },
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipeUp();
          });
          return;
        }

        // ── Snap back ────────────────────────────────────────────────
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
});
