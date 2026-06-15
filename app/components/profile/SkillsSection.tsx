import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { RadarSkill, VerifiedSkill } from '../../types/candidateProfile';
import RadarChart from './RadarChart';
import SkillChipRow from './SkillChipRow';

interface SkillsSectionProps {
  radarData: RadarSkill[];
  verifiedSkills: VerifiedSkill[];
  onChipPress: (skillName: string) => void;
  onAddSkill: () => void;
}

// Radar chart: full width minus 40pt padding, but clamped to a maximum of 280pt
// so it matches the compact reference design and doesn't become overwhelmingly large.
const WINDOW_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = Math.min(WINDOW_WIDTH - 40, 280);

export default function SkillsSection({
  radarData,
  verifiedSkills,
  onChipPress,
  onAddSkill,
}: SkillsSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Verified Skills</Text>
      <View style={styles.chartWrap}>
        <RadarChart data={radarData} size={CHART_SIZE} />
      </View>
      <View style={styles.chipsWrap}>
        <SkillChipRow
          verifiedSkills={verifiedSkills}
          onChipPress={onChipPress}
          onAddSkill={onAddSkill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7',
    textAlign: 'center',
  },
  chartWrap: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  chipsWrap: {
    marginTop: 20,
    width: '100%',
  },
});
