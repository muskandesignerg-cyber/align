import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { CandidateProfile } from '../../types/candidateProfile';
import { VerifiedBadgeIcon } from '../ui/AppIcons';

interface ProfileHeroProps {
  profile: CandidateProfile;
  onEditPress: () => void;
  onToggleOpenToWork: () => void;
}

function useCountUp(target: number, duration: number) {
  const sv = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    sv.value = withTiming(target, { duration });
  }, [target]);

  useAnimatedReaction(
    () => Math.round(sv.value),
    (cur) => runOnJS(setDisplay)(cur),
  );

  return display;
}

function PencilIcon({ size = 20, color = '#3B43A7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <Path d="M15 5l4 4" />
    </Svg>
  );
}

export default function ProfileHero({ profile, onEditPress, onToggleOpenToWork }: ProfileHeroProps) {
  const matchDisplay = useCountUp(profile.avgMatchScore, 1000);
  const skillDisplay = useCountUp(profile.stats.verifiedSkillCount, 600);

  // Pulse animation for "open to work" dot
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (profile.isOpenToWork) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.4, { duration: 900 }), withTiming(1.0, { duration: 900 })),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 900 }), withTiming(1.0, { duration: 900 })),
        -1,
        true,
      );
    }
  }, [profile.isOpenToWork]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const initials = profile.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <View style={styles.container}>
      {/* Edit pencil */}
      <TouchableOpacity style={styles.editBtn} onPress={onEditPress} activeOpacity={0.7}>
        <PencilIcon size={24} color="#3B43A7" />
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        {/* Verification badge */}
        <View style={styles.verifyBadge}>
          <VerifiedBadgeIcon size={24} color="#4C59D7" />
        </View>
      </View>

      {/* Name + title */}
      <Text style={styles.name}>{profile.fullName}</Text>
      <Text style={styles.title}>
        {profile.professionalTitle} • {profile.tagline}
      </Text>

      {/* Open to work badge */}
      <TouchableOpacity
        style={[styles.badge, profile.isOpenToWork ? styles.badgeOpen : styles.badgeClosed]}
        onPress={onToggleOpenToWork}
        activeOpacity={0.8}
      >
        {profile.isOpenToWork ? (
          <Animated.View style={[styles.dot, styles.dotGreen, dotStyle]} />
        ) : (
          <View style={[styles.dot, styles.dotGray]} />
        )}
        <Text
          style={[styles.badgeText, profile.isOpenToWork ? styles.badgeTextOpen : styles.badgeTextClosed]}
        >
          {profile.isOpenToWork ? 'Open to work' : 'Not looking'}
        </Text>
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>AVG MATCH</Text>
          <Text style={styles.statValue}>{matchDisplay}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>VERIFIED SKILLS</Text>
          <Text style={styles.statValue}>{skillDisplay}</Text>
        </View>
      </View>
    </View>
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
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  editBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#4C59D7',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { fontSize: 24, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  verifyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 12,
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  title: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  badge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  badgeOpen: { backgroundColor: '#4C59D7' },
  badgeClosed: { backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#6B7280' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: '#4ADE80' },
  dotGray: { backgroundColor: '#6B7280' },
  badgeText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' },
  badgeTextOpen: { color: '#FFFFFF' },
  badgeTextClosed: { color: '#6B7280' },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    alignSelf: 'stretch',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7',
    marginTop: 4,
  },
});
