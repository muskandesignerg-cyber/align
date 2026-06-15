import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  topMargin?: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  topMargin = 28,
}) => (
  <View style={[styles.container, { marginTop: topMargin }]}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
});
