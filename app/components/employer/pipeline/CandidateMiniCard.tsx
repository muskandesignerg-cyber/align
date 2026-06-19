import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_COLORS = [
  { bg: '#EEF0FF', text: '#4C59D7' },
  { bg: '#FFF0F6', text: '#C2185B' },
  { bg: '#F0FFF4', text: '#2E7D32' },
  { bg: '#FFF8E6', text: '#E65100' },
  { bg: '#F3E5FF', text: '#6A1B9A' },
  { bg: '#E0F7FA', text: '#00695C' },
];

const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

const getMatchStyle = (score: number) => {
  if (score >= 85) return {
    color: '#22C55E',
    bg: '#F0FFF4',
    border: '#86EFAC',
  };
  if (score >= 70) return {
    color: '#4C59D7',
    bg: '#EEF0FF',
    border: '#849CFF',
  };
  return {
    color: '#F57C00',
    bg: '#FFF8E6',
    border: '#FCD34D',
  };
};

interface Candidate {
  id: string
  candidateName: string
  candidateTitle: string
  skills: string[]
  matchScore: number
  stage: string
  initials?: string
}

interface Props {
  candidate: Candidate
  index: number
  onViewProfile: (c: Candidate) => void
  onThreeDot: (c: Candidate) => void
}

export default function CandidateMiniCard({
  candidate,
  index,
  onViewProfile,
  onThreeDot,
}: Props) {

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (
        parts[0][0] + parts[1][0]
      ).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(
    candidate.candidateName
  );
  const avatarColor = getAvatarColor(index);
  const matchStyle = getMatchStyle(
    candidate.matchScore
  );
  const visibleSkills = candidate.skills
    .slice(0, 2);
  const extra = candidate.skills.length - 2;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewProfile(candidate)}
      activeOpacity={0.75}
    >

      {/* ROW 1: Avatar + Name + 3-dot */}
      <View style={styles.row1}>

        <View style={[
          styles.avatar,
          { backgroundColor: avatarColor.bg }
        ]}>
          <Text style={[
            styles.initials,
            { color: avatarColor.text }
          ]}>
            {initials}
          </Text>
        </View>

        <View style={styles.nameBlock}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {candidate.candidateName}
          </Text>
          <Text
            style={styles.jobTitle}
            numberOfLines={1}
          >
            {candidate.candidateTitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.threeDotBtn}
          onPress={() => onThreeDot(candidate)}
          hitSlop={{
            top: 10, bottom: 10,
            left: 10, right: 10,
          }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color="#9CA3AF"
          />
        </TouchableOpacity>

      </View>

      {/* ROW 2: Skills + Match */}
      <View style={styles.row2}>

        <View style={styles.skillsWrap}>
          {visibleSkills.map((s, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>
                {s}
              </Text>
            </View>
          ))}
          {extra > 0 && (
            <View style={styles.chip}>
              <Text style={[
                styles.chipText,
                { color: '#6B7280' }
              ]}>
                +{extra}
              </Text>
            </View>
          )}
        </View>

        <View style={[
          styles.matchBadge,
          {
            backgroundColor: matchStyle.bg,
            borderColor: matchStyle.border,
          }
        ]}>
          <Ionicons
            name="star"
            size={10}
            color={matchStyle.color}
            style={{ marginRight: 3 }}
          />
          <Text style={[
            styles.matchText,
            { color: matchStyle.color }
          ]}>
            {candidate.matchScore}% Match
          </Text>
        </View>

      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  initials: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  nameBlock: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  jobTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },

  threeDotBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  skillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },

  chip: {
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E8EAFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4C59D7',
  },

  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexShrink: 0,
  },

  matchText: {
    fontSize: 12,
    fontWeight: '700',
  },

});
