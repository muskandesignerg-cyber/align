/**
 * ApplicationCard — Individual application card with stagger entrance animation.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import {
  Application,
  ApplicationStatus,
  getStatusColors,
} from '../../types/applications';
import { ProgressTracker } from './ProgressTracker';

interface ApplicationCardProps {
  application: Application;
  onViewDetails: (id: string) => void;
  isHighlighted: boolean;
  isFiltered: boolean;
  index: number;
}

/** Format an ISO date string to "X days ago" */
function formatDaysAgo(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(diffDays / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

const MAX_CHIPS = 3;

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onViewDetails,
  isHighlighted,
  isFiltered,
  index,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const filterOpacity = useSharedValue(isFiltered ? 1 : 0.4);
  const filterTranslateX = useSharedValue(isFiltered ? 0 : 8);

  // Entrance stagger
  useEffect(() => {
    opacity.value = withDelay(
      index * 80,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      index * 80,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  // Filter state change
  useEffect(() => {
    filterOpacity.value = withTiming(isFiltered ? 1 : 0.4, { duration: 200 });
    filterTranslateX.value = withTiming(isFiltered ? 0 : 8, { duration: 200 });
  }, [isFiltered]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * filterOpacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: filterTranslateX.value },
    ],
  }));

  const statusColors = getStatusColors(application.status);
  const overflowCount = Math.max(0, application.skills.length - MAX_CHIPS);
  const visibleSkills = application.skills.slice(0, MAX_CHIPS);

  return (
    <Animated.View
      style={[
        styles.card,
        isHighlighted && styles.highlightedCard,
        entranceStyle,
      ]}
    >
      {/* Top row: Logo + Status badge */}
      <View style={styles.topRow}>
        {/* Company logo / fallback */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            {application.companyName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColors.bg,
              borderColor: statusColors.border,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {application.status}
          </Text>
        </View>
      </View>

      {/* Role title */}
      <Text style={styles.roleTitle} numberOfLines={2}>
        {application.roleTitle}
      </Text>

      {/* Company + Location */}
      <Text style={styles.companyLocation}>
        {application.companyName} • {application.location}
      </Text>

      {/* Skill chips */}
      {visibleSkills.length > 0 && (
        <View style={styles.chipsRow}>
          {visibleSkills.map((skill, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{skill}</Text>
            </View>
          ))}
          {overflowCount > 0 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>+{overflowCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Progress tracker */}
      <View style={styles.progressContainer}>
        <ProgressTracker
          status={application.status}
          size="small"
          showLabels={false}
        />
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <Text style={styles.appliedDate}>
          Applied {formatDaysAgo(application.appliedAt)}
        </Text>
        <Pressable
          onPress={() => onViewDetails(application.id)}
          hitSlop={8}
        >
          <Text style={styles.viewDetails}>View Details →</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.s16,
    shadowColor: 'rgba(76,89,215,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  highlightedCard: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: '#FAFBFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FontSize.bodyLg,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
  roleTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.bodyText,
    marginTop: 12,
  },
  companyLocation: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.primary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.muted,
  },
  progressContainer: {
    marginTop: 14,
  },
  bottomRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderStyle: 'dashed',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedDate: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.muted,
  },
  viewDetails: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
});

export default ApplicationCard;
