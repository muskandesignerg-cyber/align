/**
 * CandidateDetailSheet — Mobile-first redesign.
 *
 * Fixes applied:
 *  - Radar chart: size = W - 80 (fills phone width)
 *  - Close btn: absolute, outside ScrollView
 *  - Assessment always shown with mock 87/100
 *  - Peer endorsements: 2 rows + level chip
 *  - Blind mode card with border
 *  - Match score 32px
 *  - Section titles #1A1A2E
 *  - Safe-area bottom padding on action bar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PipelineCandidate } from '../../../types/employer';
import RadarChart from '../../profile/RadarChart';

// ─── Dimensions ────────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window');
const SHEET_HEIGHT = H * 0.92;
const RADAR_SIZE   = W - 80;          // fills phone width minus 40px each side

// ─── Static mock data ─────────────────────────────────────────────────────────

const MOCK_RADAR_DATA = [
  { axis: 'UI Design',       value: 85 },
  { axis: 'UX Research',     value: 70 },
  { axis: 'Prototyping',     value: 80 },
  { axis: 'Figma',           value: 90 },
  { axis: 'HTML/CSS',        value: 65 },
  { axis: 'Design Systems',  value: 75 },
];

const ENDORSEMENTS = [
  { initials: 'RM', name: 'Rahul M.',  skill: 'Figma',     level: 'Expert'   },
  { initials: 'NS', name: 'Neha S.',   skill: 'UI Design', level: 'Advanced' },
];

const STAGE_LABELS: Record<string, string> = {
  new_matches: 'New Match',
  testing:     'Testing',
  interview:   'Interview',
  hired:       'Hired',
  rejected:    'Rejected',
};

const STAGE_COLORS: Record<string, string> = {
  new_matches: '#4C59D7',
  testing:     '#F57C00',
  interview:   '#849CFF',
  hired:       '#22C55E',
  rejected:    '#EF4444',
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('');
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CandidateDetailSheetProps {
  visible:             boolean;
  candidate:           PipelineCandidate | null;
  onClose:             () => void;
  onScheduleInterview: (candidate: PipelineCandidate) => void;
  onSendAssessment:    (candidate: PipelineCandidate) => void;
  onPass:              (candidate: PipelineCandidate) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CandidateDetailSheet({
  visible,
  candidate,
  onClose,
  onScheduleInterview,
  onSendAssessment,
  onPass,
}: CandidateDetailSheetProps) {
  const insets    = useSafeAreaInsets();
  const [blindMode, setBlindMode] = useState(false);
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    if (visible) {
      setBlindMode(false);
      translateY.value = withSpring(0, { mass: 1, damping: 22, stiffness: 200 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 280 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 280 }, () => runOnJS(onClose)());
  };

  const handlePass = () => {
    if (!candidate) return;
    Alert.alert(
      'Pass on Candidate',
      `Are you sure you want to pass on ${candidate.candidateName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pass', style: 'destructive', onPress: () => { onPass(candidate); handleClose(); } },
      ],
    );
  };

  if (!visible || !candidate) return null;

  const stageColor   = STAGE_COLORS[candidate.stage] ?? '#6B7280';
  const stageLabel   = STAGE_LABELS[candidate.stage] ?? candidate.stage;
  const displayName  = blindMode
    ? `Candidate #${candidate.candidateId.slice(-4).toUpperCase()}`
    : candidate.candidateName;
  const initials     = getInitials(candidate.candidateName);
  const matchScore   = candidate.matchScore;

  // Verified skills: first 2 shown as blue filled, rest as overflow chip
  const verifiedSkills = candidate.skills.slice(0, 2);
  const extraSkills    = candidate.skills.length > 2 ? candidate.skills.length - 2 : 0;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={S.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet */}
      <Animated.View style={[S.sheet, sheetStyle]}>

        {/* ── Handle bar ── */}
        <View style={S.handle} />

        {/* ── Close button (absolute, outside scroll) ── */}
        <TouchableOpacity style={S.closeBtn} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color="#6B7280" />
        </TouchableOpacity>

        {/* ── Scrollable content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <View style={S.hero}>
            <View style={[S.avatar, blindMode && S.avatarBlind]}>
              {blindMode
                ? <Ionicons name="help-outline" size={26} color="#D0D7FF" />
                : <Text style={S.avatarText}>{initials}</Text>}
            </View>
            <Text style={S.heroName}>{displayName}</Text>
            <Text style={S.heroTitle}>{candidate.candidateTitle}</Text>
            <View style={[S.stageBadge, { backgroundColor: `${stageColor}18`, borderColor: stageColor }]}>
              <Text style={[S.stageBadgeText, { color: stageColor }]}>{stageLabel}</Text>
            </View>
          </View>

          {/* ── BLIND MODE CARD ────────────────────────────────────────── */}
          <View style={S.section}>
            <View style={S.blindCard}>
              <View style={S.blindTextBlock}>
                <Text style={S.blindTitle}>Blind Mode</Text>
                <Text style={S.blindSub}>Hide identity during screening</Text>
              </View>
              <Switch
                value={blindMode}
                onValueChange={setBlindMode}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#D0D7FF', true: '#4C59D7' }}
              />
            </View>
          </View>

          {/* ── MATCH SCORE + RADAR ────────────────────────────────────── */}
          <View style={S.section}>
            <Text style={S.matchScore}>{matchScore}% Match</Text>
            <View style={S.radarWrap}>
              <RadarChart data={MOCK_RADAR_DATA} size={RADAR_SIZE} />
            </View>
          </View>

          {/* ── VERIFIED SKILLS ────────────────────────────────────────── */}
          <View style={[S.section, S.borderTop]}>
            <Text style={S.sectionTitle}>Verified Skills</Text>
            <View style={S.chipRow}>
              {verifiedSkills.map((skill) => (
                <View key={skill} style={S.chipVerified}>
                  <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                  <Text style={S.chipVerifiedText}>{skill}</Text>
                </View>
              ))}
              {extraSkills > 0 && (
                <View style={S.chipExtra}>
                  <Text style={S.chipExtraText}>+{extraSkills} more</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── PEER ENDORSEMENTS ──────────────────────────────────────── */}
          <View style={[S.section, S.borderTop]}>
            <Text style={S.sectionTitle}>Peer Endorsements</Text>
            <View style={S.endorseList}>
              {ENDORSEMENTS.map((e) => (
                <View key={e.initials} style={S.endorseRow}>
                  <View style={S.endorseAvatar}>
                    <Text style={S.endorseAvatarText}>{e.initials}</Text>
                  </View>
                  <Text style={S.endorseText}>
                    <Text style={{ fontWeight: '600' }}>{e.name}</Text>
                    {' endorsed '}
                    <Text style={{ fontWeight: '600' }}>{e.skill}</Text>
                  </Text>
                  <View style={S.levelChip}>
                    <Text style={S.levelChipText}>{e.level}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── ASSESSMENT SCORES (always shown with mock data) ────────── */}
          <View style={[S.section, S.borderTop]}>
            <Text style={S.sectionTitle}>Assessment Scores</Text>
            <View style={S.assessCard}>
              <View style={S.assessRow}>
                <Text style={S.assessLabel}>Problem Solving Challenge</Text>
                <Text style={S.assessScore}>
                  {candidate.assessmentScore ?? 87}/100
                </Text>
              </View>
              <View style={S.progressTrack}>
                <View
                  style={[
                    S.progressFill,
                    { width: `${candidate.assessmentScore ?? 87}%` as any },
                  ]}
                />
              </View>
            </View>
          </View>

        </ScrollView>

        {/* ── STICKY ACTION BAR ─────────────────────────────────────────── */}
        <View style={[S.actionBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <TouchableOpacity
            style={S.scheduleBtn}
            onPress={() => { onScheduleInterview(candidate); handleClose(); }}
            activeOpacity={0.85}
          >
            <Text style={S.scheduleBtnText}>Schedule Interview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.assessBtn}
            onPress={() => { onSendAssessment(candidate); handleClose(); }}
            activeOpacity={0.85}
          >
            <Text style={S.assessBtnText}>Send Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.passBtn} onPress={handlePass} activeOpacity={0.85}>
            <Text style={S.passBtnText}>Pass</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,26,46,0.42)',
  },

  // Sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Handle
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D0D7FF',
    alignSelf: 'center', marginTop: 12,
  },

  // Close button (absolute, outside scroll)
  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 32, height: 32,
    backgroundColor: '#F4F6FF', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── HERO ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#F0F2FF',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EEF0FF',
    borderWidth: 2.5, borderColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBlind: { borderColor: '#D0D7FF', backgroundColor: '#F4F6FF' },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#4C59D7' },
  heroName: {
    fontSize: 20, fontWeight: '700', color: '#1A1A2E',
    marginTop: 12, textAlign: 'center',
  },
  heroTitle: {
    fontSize: 14, color: '#6B7280',
    marginTop: 4, textAlign: 'center',
  },
  stageBadge: {
    marginTop: 10, borderRadius: 20, borderWidth: 1,
    paddingVertical: 5, paddingHorizontal: 14,
  },
  stageBadgeText: { fontSize: 12, fontWeight: '500' },

  // ── BLIND MODE CARD ───────────────────────────────────────────────────────
  section:        { paddingHorizontal: 20, marginTop: 20 },
  borderTop:      { borderTopWidth: 1, borderTopColor: '#F4F6FF', paddingTop: 20, marginTop: 0 },
  blindCard: {
    backgroundColor: '#F8F9FF',
    borderWidth: 1, borderColor: '#E8EAFF',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  blindTextBlock: { flex: 1 },
  blindTitle:     { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  blindSub:       { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // ── MATCH SCORE + RADAR ───────────────────────────────────────────────────
  matchScore: {
    fontSize: 32, fontWeight: '700',
    color: '#4C59D7', textAlign: 'center', marginBottom: 8,
  },
  radarWrap: { alignItems: 'center' },

  // ── SKILLS ────────────────────────────────────────────────────────────────
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 10 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#4C59D7', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 14,
  },
  chipVerifiedText: { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  chipExtra: {
    backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14,
  },
  chipExtraText: { fontSize: 13, fontWeight: '500', color: '#4C59D7' },

  // ── ENDORSEMENTS ──────────────────────────────────────────────────────────
  endorseList:       { gap: 10 },
  endorseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F4F6FF', borderRadius: 10, padding: 12,
  },
  endorseAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  endorseAvatarText: { fontSize: 11, fontWeight: '700', color: '#4C59D7' },
  endorseText:       { fontSize: 13, color: '#1A1A2E', flex: 1 },
  levelChip: {
    backgroundColor: '#EEF0FF', borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 8, flexShrink: 0,
  },
  levelChipText: { fontSize: 11, fontWeight: '500', color: '#4C59D7' },

  // ── ASSESSMENT ────────────────────────────────────────────────────────────
  assessCard: {
    backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#E8EAFF',
    borderRadius: 12, padding: 14, marginTop: 4,
  },
  assessRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assessLabel:   { fontSize: 13, color: '#6B7280', flex: 1 },
  assessScore:   { fontSize: 13, fontWeight: '700', color: '#4C59D7' },
  progressTrack: {
    height: 4, backgroundColor: '#E8EAFF', borderRadius: 2,
    marginTop: 8, overflow: 'hidden',
  },
  progressFill:  { height: '100%', backgroundColor: '#4C59D7', borderRadius: 2 },

  // ── ACTION BAR ────────────────────────────────────────────────────────────
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 8,
  },
  scheduleBtn: {
    flex: 2, height: 52, borderRadius: 14,
    backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web:     { boxShadow: '0 4px 12px rgba(76,89,215,0.25)' } as any,
      default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    }),
  },
  scheduleBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  assessBtn: {
    flex: 1.5, height: 52, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#D0D7FF',
    alignItems: 'center', justifyContent: 'center',
  },
  assessBtnText: { fontSize: 12, fontWeight: '500', color: '#4C59D7' },
  passBtn: {
    flex: 0.8, height: 52, borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1, borderColor: '#FCA5A5',
    alignItems: 'center', justifyContent: 'center',
  },
  passBtnText: { fontSize: 13, fontWeight: '500', color: '#EF4444' },
});
