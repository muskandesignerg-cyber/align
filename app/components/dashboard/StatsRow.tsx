/**
 * StatsRow — Section header + horizontal scroll of StatCards.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { DashboardStats, ApplicationStatus } from '../../types/applications';
import StatCard from './StatCard';

interface StatsRowProps {
  stats: DashboardStats;
  activeFilter: ApplicationStatus | null;
  onFilterPress: (status: ApplicationStatus) => void;
}

interface StatEntry {
  status: ApplicationStatus;
  count: number;
  label: string;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  stats,
  activeFilter,
  onFilterPress,
}) => {
  const allEntries: StatEntry[] = [
    { status: 'Applied', count: stats.applied, label: 'Applied' },
    { status: 'In Review', count: stats.inReview, label: 'In Review' },
    { status: 'Interviewing', count: stats.interviewing, label: 'Interviewing' },
    { status: 'Offer', count: stats.offer, label: 'Offer' },
    { status: 'Rejected', count: stats.rejected, label: 'Rejected' },
  ];

  // Show Applied always; others only if count > 0
  const visibleEntries = allEntries.filter(
    (entry) => entry.status === 'Applied' || entry.count > 0
  );

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Your Applications</Text>
        <Pressable hitSlop={8}>
          <Text style={{ fontSize: 18, color: Colors.primary }}>⊞</Text>
        </Pressable>
      </View>

      {/* Horizontal scrolling stat cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleEntries.map((entry) => (
          <StatCard
            key={entry.status}
            count={entry.count}
            label={entry.label}
            isActive={activeFilter === entry.status}
            onPress={() => onFilterPress(entry.status)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.s12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s20,
    marginBottom: Spacing.s12,
  },
  headerText: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: Colors.tertiary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.s20,
    gap: Spacing.s12,
  },
});

export default StatsRow;
