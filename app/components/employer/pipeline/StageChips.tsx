import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const STAGES = [
  { key: 'new_matches', label: 'New Matches' },
  { key: 'testing',     label: 'Testing' },
  { key: 'interview',   label: 'Interview' },
  { key: 'hired',       label: 'Hired' },
];

interface StageChipsProps {
  activeStage: string;
  counts: Record<string, number>;
  onSelect: (stage: string) => void;
}

export default function StageChips({ activeStage, counts, onSelect }: StageChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {STAGES.map((s) => {
        const active = activeStage === s.key;
        const count = counts[s.key] ?? 0;
        return (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            onPress={() => onSelect(s.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
              {s.label} {count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipActive: { backgroundColor: '#4C59D7' },
  chipInactive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF' },
  chipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  chipTextActive: { color: '#FFFFFF' },
  chipTextInactive: { color: '#6B7280' },
});
