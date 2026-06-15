/**
 * AssessmentBanner — CTA card for pending skill assessments.
 * Features a pulsing accent bar and fade-out dismiss animation.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface AssessmentBannerProps {
  companyName: string;
  applicationId: string;
  onStartPress: () => void;
  onDismiss: (id: string) => void;
}

export const AssessmentBanner: React.FC<AssessmentBannerProps> = ({
  companyName,
  applicationId,
  onStartPress,
  onDismiss,
}) => {
  // Pulse animation for accent bar
  const accentOpacity = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  React.useEffect(() => {
    accentOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      false
    );
  }, []);

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const handleDismiss = useCallback(() => {
    cardOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(applicationId);
      }
    });
  }, [applicationId, onDismiss]);

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Left accent bar */}
      <Animated.View style={[styles.accentBar, accentStyle]} />

      {/* Dismiss X */}
      <Pressable
        style={styles.dismissBtn}
        onPress={handleDismiss}
        hitSlop={8}
      >
        <Text style={styles.dismissIcon}>✕</Text>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.titleLine1}>Skill Assessment from</Text>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.subtitle}>
          Complete a 3-min challenge to move forward
        </Text>

        <Pressable style={styles.startButton} onPress={onStartPress}>
          <Text style={styles.startButtonText}>Start Now</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.card,
    padding: Spacing.s16,
    paddingLeft: Spacing.s20,
    shadowColor: 'rgba(76,89,215,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.card,
    borderBottomLeftRadius: BorderRadius.card,
  },
  dismissBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dismissIcon: {
    fontSize: 16,
    color: Colors.muted,
    fontFamily: FontFamily.regular,
  },
  content: {
    paddingRight: Spacing.s24,
  },
  titleLine1: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  companyName: {
    fontSize: FontSize.heading3,
    fontFamily: FontFamily.bold,
    color: Colors.tertiary,
    marginTop: 2,
  },
  subtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.muted,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: 'rgba(76,89,215,0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.white,
  },
});

export default AssessmentBanner;
