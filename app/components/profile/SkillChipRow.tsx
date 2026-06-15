import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VerifiedSkill } from '../../types/candidateProfile';
import { ShieldCheckIcon } from '../ui/AppIcons';

interface SkillChipRowProps {
  verifiedSkills: VerifiedSkill[];
  onChipPress: (skillName: string) => void;
  onAddSkill: () => void;
}

export default function SkillChipRow({ verifiedSkills, onChipPress, onAddSkill }: SkillChipRowProps) {
  const verified = verifiedSkills.filter((s) => s.isVerified);
  const unverified = verifiedSkills.filter((s) => !s.isVerified);

  return (
    <View style={styles.container}>
      {/* Verified chips */}
      {verified.map((skill) => (
        <TouchableOpacity
          key={skill.id}
          style={styles.verifiedChip}
          onPress={() => onChipPress(skill.name)}
          activeOpacity={0.75}
        >
          <ShieldCheckIcon size={14} color="#FFFFFF" />
          <Text style={styles.verifiedText}>{skill.name}</Text>
        </TouchableOpacity>
      ))}

      {/* Unverified chips */}
      {unverified.map((skill) => (
        <TouchableOpacity
          key={skill.id}
          style={styles.unverifiedChip}
          onPress={() => onChipPress(skill.name)}
          activeOpacity={0.75}
        >
          <Text style={styles.unverifiedText}>{skill.name}</Text>
        </TouchableOpacity>
      ))}

      {/* Add Skill chip */}
      <TouchableOpacity style={styles.addChip} onPress={onAddSkill} activeOpacity={0.75}>
        <Text style={styles.addText}>+ Add Skill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C59D7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#FFFFFF',
  },
  unverifiedChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  unverifiedText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#6B7280',
  },
  addChip: {
    backgroundColor: '#F4F6FF',
    borderWidth: 1.5,
    borderColor: '#849CFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
});
