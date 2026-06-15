import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, LayoutAnimation } from 'react-native';
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Experience } from '../../types/candidateProfile';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
}

export default function ExperienceCard({ experience, index }: ExperienceCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Stagger entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 300 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Animated.View style={[styles.card, animStyle]}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.roleTitle} numberOfLines={2}>
            {experience.roleTitle}
          </Text>
          <Text style={styles.dateRange}>
            {experience.startDate} - {experience.endDate}
          </Text>
        </View>

        {/* Company */}
        <Text style={styles.company}>{experience.company}</Text>

        {/* Description */}
        <Text
          style={styles.description}
          numberOfLines={expanded ? undefined : 3}
          ellipsizeMode="tail"
        >
          {experience.description}
        </Text>

        {/* Show more / less */}
        {experience.description.length > 120 && (
          <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
            <Text style={styles.showMore}>{expanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        )}
      </View>

    </Animated.View>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 12px rgba(76,89,215,0.06)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    backgroundColor: '#4C59D7',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingLeft: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  roleTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
  },
  dateRange: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    flexShrink: 0,
  },
  company: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  showMore: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
});
