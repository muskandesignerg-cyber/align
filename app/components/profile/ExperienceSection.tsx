import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Experience } from '../../types/candidateProfile';
import ExperienceCard from './ExperienceCard';
import { BriefcaseIcon } from '../ui/AppIcons';

interface ExperienceSectionProps {
  experiences: Experience[];
  onAddPress: () => void;
}

export default function ExperienceSection({ experiences, onAddPress }: ExperienceSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BriefcaseIcon size={24} color="#1A1A2E" />
          <Text style={styles.headerTitle}>Experience</Text>
        </View>
        <TouchableOpacity onPress={onAddPress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {experiences.map((exp, index) => (
          <ExperienceCard key={exp.id} experience={exp} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: { fontSize: 20 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
  },
  addBtn: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
});
