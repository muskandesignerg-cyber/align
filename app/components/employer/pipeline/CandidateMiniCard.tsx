import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onViewProfile: (c: Candidate) => void
  onThreeDot: (c: Candidate) => void
}

export default function CandidateMiniCard({
  candidate,
  onViewProfile,
  onThreeDot,
}: Props) {

  // Always show initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (
        parts[0].charAt(0) +
        parts[1].charAt(0)
      ).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const initials = getInitials(
    candidate.candidateName
  );

  // Show max 2 skills + overflow count
  const visibleSkills = candidate.skills
    .slice(0, 2);
  const extraCount = candidate.skills.length - 2;

  // Match score color logic
  const getMatchColor = (score: number) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#4C59D7';
    return '#F57C00';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewProfile(candidate)}
      activeOpacity={0.75}
    >

      {/* ── ROW 1: Avatar + Name + 3-dot ── */}
      <View style={styles.topRow}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials}
          </Text>
        </View>

        {/* Name + Title */}
        <View style={styles.nameBlock}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {candidate.candidateName}
          </Text>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {candidate.candidateTitle}
          </Text>
        </View>

        {/* Three dot menu */}
        <TouchableOpacity
          style={styles.threeDot}
          onPress={() => onThreeDot(candidate)}
          hitSlop={{
            top: 8, bottom: 8,
            left: 8, right: 8
          }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>

      </View>

      {/* ── ROW 2: Skills + Match Score ── */}
      <View style={styles.bottomRow}>

        {/* Skills */}
        <View style={styles.skillsRow}>
          {visibleSkills.map((skill, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>
                {skill}
              </Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                +{extraCount}
              </Text>
            </View>
          )}
        </View>

        {/* Match Score */}
        <View style={[
          styles.matchBadge,
          {
            backgroundColor:
              getMatchColor(candidate.matchScore)
                + '15'
          }
        ]}>
          <Ionicons
            name="star"
            size={10}
            color={
              getMatchColor(candidate.matchScore)
            }
            style={{ marginRight: 3 }}
          />
          <Text style={[
            styles.matchText,
            {
              color: getMatchColor(
                candidate.matchScore
              )
            }
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
    borderColor: '#E8EAFF',
    padding: 16,
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },

  // Row 1
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4C59D7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  nameBlock: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 22,
  },

  title: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },

  threeDot: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  // Row 2
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  skillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },

  chip: {
    backgroundColor: '#F4F6FF',
    borderWidth: 1,
    borderColor: '#E8EAFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4C59D7',
  },

  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },

  matchText: {
    fontSize: 12,
    fontWeight: '700',
  },

});
