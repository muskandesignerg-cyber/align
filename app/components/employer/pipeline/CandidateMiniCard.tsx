import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { PipelineCandidate, PipelineStage } from '../../../types/employer';
import Svg, { Circle, Path } from 'react-native-svg';
import { getMatchColor } from '../../../utils/matchEngine';

interface CandidateMiniCardProps {
  candidate: PipelineCandidate;
  onPress: (candidate: PipelineCandidate) => void;
  onMove: (candidateId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  onDismiss: (candidateId: string) => void;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  new_matches: 'New Matches',
  testing: 'Testing',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
};

const MOVE_STAGES: PipelineStage[] = ['new_matches', 'testing', 'interview', 'hired', 'rejected'];

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('');

function DotsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#C9D0F5" stroke="none">
      <Circle cx="12" cy="5" r="2" />
      <Circle cx="12" cy="12" r="2" />
      <Circle cx="12" cy="19" r="2" />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="#4C59D7" stroke="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

export default function CandidateMiniCard({
  candidate,
  onPress,
  onMove,
  onDismiss,
}: CandidateMiniCardProps) {
  const handleDots = () => {
    const { Alert, ActionSheetIOS } = require('react-native');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['View Profile', 'Move to Stage', 'Send Message', 'Schedule Interview', 'Reject', 'Cancel'],
          destructiveButtonIndex: 4,
          cancelButtonIndex: 5,
        },
        (idx: number) => {
          if (idx === 0) onPress(candidate);
          if (idx === 1) showMoveSheet();
          if (idx === 4) onDismiss(candidate.id);
        },
      );
    } else {
      Alert.alert(
        candidate.candidateName,
        'Choose an action',
        [
          { text: 'View Profile', onPress: () => onPress(candidate) },
          { text: 'Move to Stage', onPress: showMoveSheet },
          { text: 'Reject', style: 'destructive', onPress: () => onDismiss(candidate.id) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  const showMoveSheet = () => {
    const { Alert, ActionSheetIOS } = require('react-native');
    const options = MOVE_STAGES.filter((s) => s !== candidate.stage).map((s) => STAGE_LABELS[s]);
    const stagesFiltered = MOVE_STAGES.filter((s) => s !== candidate.stage);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, 'Cancel'], cancelButtonIndex: options.length },
        (idx: number) => {
          if (idx < stagesFiltered.length) {
            onMove(candidate.id, candidate.stage, stagesFiltered[idx]);
          }
        },
      );
    } else {
      Alert.alert(
        'Move to Stage',
        undefined,
        [
          ...stagesFiltered.map((s) => ({
            text: STAGE_LABELS[s],
            onPress: () => onMove(candidate.id, candidate.stage, s),
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      );
    }
  };

  const visibleSkills = candidate.skills.slice(0, 2);
  const overflow = candidate.skills.length - 2;

  return (
    <TouchableOpacity
      style={[styles.card, cardShadow]}
      onPress={() => onPress(candidate)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(candidate.candidateName)}</Text>
        </View>

        {/* Name + title */}
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>{candidate.candidateName}</Text>
          <Text style={styles.title} numberOfLines={1}>{candidate.candidateTitle}</Text>
        </View>

        {/* Three-dot menu */}
        <TouchableOpacity style={styles.dotsBtn} onPress={handleDots} activeOpacity={0.7}>
          <DotsIcon />
        </TouchableOpacity>
      </View>

      {/* Bottom row — skills + match */}
      <View style={styles.bottomRow}>
        <View style={styles.skillsRow}>
          {visibleSkills.map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
            </View>
          ))}
          {overflow > 0 && (
            <View style={styles.skillChip}>
              <Text style={styles.skillText}>+{overflow}</Text>
            </View>
          )}
        </View>

        <View style={[styles.matchBadge, {
          backgroundColor: getMatchColor(candidate.matchScore) + '18',
          marginLeft: 8,
          flexShrink: 0,
        }]}>
          <StarIcon />
          <Text style={[styles.matchText, { color: getMatchColor(candidate.matchScore) }]}>
            {candidate.matchScore}% Match
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(76,89,215,0.06)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4C59D7',
  },
  textBlock: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  title: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 2 },
  dotsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  skillsRow: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  skillChip: {
    backgroundColor: '#F4F6FF',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  skillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#4C59D7' },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0FF',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
    flexShrink: 0,
  },
  matchText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
});
