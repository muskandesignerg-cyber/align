import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Application, ApplicationStatus } from '../../types/applications';
import ApplicationCard from './ApplicationCard';

interface ApplicationsListProps {
  applications: Application[];
  allApplications: Application[];
  statusFilter: ApplicationStatus | null;
  onViewDetails: (id: string) => void;
  onClearFilter?: () => void;
}

/**
 * ApplicationsList — List of application cards with optional filter chip.
 */
export default function ApplicationsList({
  applications,
  allApplications,
  statusFilter,
  onViewDetails,
  onClearFilter,
}: ApplicationsListProps) {
  return (
    <View style={styles.container}>
      {/* Section header */}
      <Text style={styles.header}>Active Applications</Text>

      {/* Filter chip */}
      {statusFilter && (
        <View style={styles.filterRow}>
          <Text style={styles.filterText}>Showing: {statusFilter}</Text>
          <TouchableOpacity
            onPress={onClearFilter}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.filterClear}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Application cards */}
      <View style={styles.list}>
        {allApplications.map((app, index) => {
          const isFiltered = !statusFilter || app.status === statusFilter;
          const isHighlighted =
            app.status === 'Assessment Sent' || app.status === 'Interviewing';

          return (
            <ApplicationCard
              key={app.id}
              application={app}
              onViewDetails={onViewDetails}
              isHighlighted={isHighlighted}
              isFiltered={isFiltered}
              index={index}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.bodyText,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  filterText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  filterClear: {
    fontSize: 12,
    color: Colors.muted,
  },
  list: {
    gap: 12,
  },
});
