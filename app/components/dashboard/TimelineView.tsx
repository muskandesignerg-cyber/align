import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { TimelineEvent } from '../../types/applications';

interface TimelineViewProps {
  events: TimelineEvent[];
}

/** Format relative date from ISO string */
function formatRelativeDate(isoString: string): string {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
}

/**
 * TimelineView — Vertical timeline for application detail modal.
 */
export default function TimelineView({ events }: TimelineViewProps) {
  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const nextCompleted = !isLast && events[index + 1]?.isCompleted;

        return (
          <View key={event.id} style={styles.row}>
            {/* Left column — dot + line */}
            <View style={styles.leftCol}>
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  event.isCompleted ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
              {/* Connecting line */}
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    event.isCompleted && nextCompleted
                      ? styles.lineFilled
                      : styles.lineEmpty,
                  ]}
                />
              )}
            </View>

            {/* Right column — label + date */}
            <View style={styles.rightCol}>
              <Text
                style={[
                  styles.label,
                  event.isCompleted ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {event.label}
              </Text>
              {event.date ? (
                <Text style={styles.date}>{formatRelativeDate(event.date)}</Text>
              ) : (
                !event.isCompleted && (
                  <Text style={styles.datePending}>Pending</Text>
                )
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    minHeight: 48,
    paddingBottom: 8,
  },
  leftCol: {
    width: 32,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#D0D7FF',
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  lineFilled: {
    backgroundColor: Colors.primary,
  },
  lineEmpty: {
    backgroundColor: '#D0D7FF',
  },
  rightCol: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 0,
  },
  label: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.medium,
  },
  labelActive: {
    color: Colors.bodyText,
  },
  labelInactive: {
    color: Colors.muted,
  },
  date: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.muted,
    marginTop: 2,
  },
  datePending: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#D0D7FF',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
