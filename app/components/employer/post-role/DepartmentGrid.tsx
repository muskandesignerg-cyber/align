import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';

const PRIMARY_DEPTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales'];
const MORE_DEPTS = ['Finance', 'Operations', 'Data', 'Legal', 'HR', 'Customer Success'];

interface DepartmentGridProps {
  selected: string | null;
  onSelect: (dept: string) => void;
}

export default function DepartmentGrid({ selected, onSelect }: DepartmentGridProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  const allDepts = expanded ? [...PRIMARY_DEPTS, ...MORE_DEPTS] : PRIMARY_DEPTS;

  // Build rows of 2
  const rows: string[][] = [];
  for (let i = 0; i < allDepts.length; i += 2) {
    if (i + 1 < allDepts.length) {
      rows.push([allDepts[i], allDepts[i + 1]]);
    } else {
      rows.push([allDepts[i]]);
    }
  }

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((dept) => {
            const active = selected === dept;
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelect(dept)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{dept}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* More... chip */}
      {!expanded && (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, styles.moreChip]} onPress={toggleMore} activeOpacity={0.75}>
            <Text style={styles.chipText}>More...</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          <View style={styles.chipPlaceholder} />
        </View>
      )}
      {expanded && (
        <TouchableOpacity style={[styles.chip, styles.moreChip, { alignSelf: 'flex-start', flex: undefined }]} onPress={toggleMore} activeOpacity={0.75}>
          <Text style={styles.chipText}>Less ↑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  chipActive: { backgroundColor: '#EEF0FF', borderWidth: 1.5, borderColor: '#4C59D7' },
  chipText: { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A1A2E' },
  chipTextActive: { color: '#4C59D7' },
  chevron: { fontSize: 14, color: '#6B7280' },
  moreChip: {},
  chipPlaceholder: { flex: 1 },
});
