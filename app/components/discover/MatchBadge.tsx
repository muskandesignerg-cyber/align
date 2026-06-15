import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';

interface MatchBadgeProps {
  score: number;
}

/**
 * MatchBadge – "88% Match" pill indicator.
 * White background with primary border and subtle shadow.
 */
export default function MatchBadge({ score }: MatchBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.label}>{score}% Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        // @ts-ignore web-only
        boxShadow: '0px 2px 8px rgba(76, 89, 215, 0.15)',
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  icon: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
});
