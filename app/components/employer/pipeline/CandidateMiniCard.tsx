import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_COLORS = [
  { bg: '#EEF0FF', text: '#4C59D7' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F3E8FF', text: '#7E22CE' },
  { bg: '#CFFAFE', text: '#0E7490' },
];

interface Candidate {
  id: string;
  candidateName: string;
  candidateTitle: string;
  skills: string[];
  matchScore: number;
  stage: string;
}

interface Props {
  candidate: Candidate;
  index: number;
  onViewProfile: (c: Candidate) => void;
  onThreeDot: (c: Candidate) => void;
}

export default function CandidateMiniCard({
  candidate,
  index,
  onViewProfile,
  onThreeDot,
}: Props) {
  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const initials = candidate.candidateName
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('');

  const skills = (candidate.skills ?? []).slice(0, 2);
  const extra = (candidate.skills ?? []).length - 2;

  const score = candidate.matchScore ?? 0;
  const matchColor =
    score >= 85 ? '#16A34A' :
    score >= 70 ? '#4C59D7' :
    '#D97706';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewProfile(candidate)}
      activeOpacity={0.72}
    >
      {/* TOP ROW: avatar + name/title + 3-dot */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
          <Text style={[styles.initials, { color: colors.text }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {candidate.candidateName}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {candidate.candidateTitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => onThreeDot(candidate)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={15} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM ROW: skills + match */}
      <View style={styles.bottomRow}>
        <View style={styles.skills}>
          {skills.map((s, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
          {extra > 0 && (
            <View style={styles.skillChip}>
              <Text style={[styles.skillText, { color: '#9CA3AF' }]}>+{extra}</Text>
            </View>
          )}
        </View>

        <View style={[styles.matchBadge, { borderColor: matchColor + '40' }]}>
          <Text style={[styles.matchText, { color: matchColor }]}>
            ★ {score}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBF0',
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  initials: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  title: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 1,
  },
  menuBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  skillChip: {
    backgroundColor: '#F5F5FA',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4C59D7',
  },
  matchBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
