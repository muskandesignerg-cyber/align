/**
 * CandidatesScreen — Pipeline with full tab state management.
 *
 * - 4 tabs: New Matches · Testing · Interview · Hired
 * - Dynamic candidate arrays (Move to Testing updates both lists)
 * - Status strips per tab
 * - Fade transition on tab switch
 * - Stats driven by array lengths
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PipelineCandidate } from '../../types/employer';
import CandidateDetailSheet from '../../components/employer/candidate-detail/CandidateDetailSheet';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'newMatches' | 'testing' | 'interview' | 'hired';

interface Candidate {
  id:       string;
  letter:   string;
  avatarBg: string;
  name:     string;
  role:     string;
  skills:   string[];
  overflow: number;
  match:    number;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_NEW_MATCHES: Candidate[] = [
  { id: 'c1', letter: 'M', avatarBg: '#1A1A2E', name: 'Muskan Sharma', role: 'UI/UX Designer · 2 yrs exp',    skills: ['Figma', 'UI Design'],    overflow: 3, match: 91 },
  { id: 'c2', letter: 'R', avatarBg: '#0F4C75', name: 'Riya Mehta',    role: 'Product Designer · 3 yrs exp', skills: ['Figma', 'Prototyping'],   overflow: 2, match: 87 },
  { id: 'c3', letter: 'A', avatarBg: '#134E4A', name: 'Arjun Kapoor',  role: 'UX Researcher · 1 yr exp',     skills: ['User Research', 'Sketch'], overflow: 1, match: 78 },
  { id: 'c4', letter: 'P', avatarBg: '#3B1F5E', name: 'Priya Nair',    role: 'Visual Designer · 4 yrs exp',  skills: ['Adobe XD', 'Branding'],   overflow: 4, match: 82 },
];

const INITIAL_TESTING: Candidate[] = [
  { id: 't1', letter: 'S', avatarBg: '#0F4C75', name: 'Sneha Patel', role: 'UI Designer · 2 yrs exp',        skills: ['Figma', 'Sketch'],       overflow: 2, match: 85 },
  { id: 't2', letter: 'K', avatarBg: '#134E4A', name: 'Karan Singh', role: 'Product Designer · 3 yrs exp',   skills: ['Adobe XD', 'UI Design'], overflow: 1, match: 79 },
];

const TESTING_STATUS: Record<string, string> = {
  t1: 'Assessment sent · 1 day ago',
  t2: 'Assessment sent · 3 hrs ago',
};

const INTERVIEW: Candidate[] = [
  { id: 'i1', letter: 'D', avatarBg: '#3B1F5E', name: 'Divya Rao',    role: 'Senior UX Designer · 4 yrs exp', skills: ['Figma', 'Research'],   overflow: 3, match: 93 },
];

const HIRED: Candidate[] = [
  { id: 'h1', letter: 'V', avatarBg: '#1A1A2E', name: 'Vikram Joshi', role: 'UI/UX Designer · 3 yrs exp',     skills: ['Figma', 'Prototyping'], overflow: 4, match: 96 },
];

// ─── Tab config ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<TabKey, string> = {
  newMatches: 'New Matches',
  testing:    'Testing',
  interview:  'Interview',
  hired:      'Hired',
};

// ─── Candidate Card ────────────────────────────────────────────────────────────

interface CardProps {
  c: Candidate;
  statusStrip?:   React.ReactNode;
  actionLeft:     { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; moving?: boolean };
  actionRight:    { icon: keyof typeof Ionicons.glyphMap; label: string; color?: string; bg?: string; border?: string; onPress?: () => void };
  movingId?:      string;
}

function CandidateCard({ c, statusStrip, actionLeft, actionRight, movingId }: CardProps) {
  const moving = movingId === c.id;

  return (
    <View style={[card.wrap, moving && card.wrapMoving]}>
      {/* Row 1 — avatar + info + menu */}
      <View style={card.row1}>
        <View style={[card.avatar, { backgroundColor: c.avatarBg }]}>
          <Text style={card.avatarLetter}>{c.letter}</Text>
        </View>
        <View style={card.info}>
          <Text style={card.name}>{c.name}</Text>
          <Text style={card.role}>{c.role}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={card.menuBtn}>
          <Ionicons name="ellipsis-vertical-outline" size={18} color="#CCCCCC" />
        </TouchableOpacity>
      </View>

      {/* Row 2 — skills + match */}
      <View style={card.row2}>
        <View style={card.skillsRow}>
          {c.skills.map((s) => (
            <View key={s} style={card.chip}>
              <Text style={card.chipText}>{s}</Text>
            </View>
          ))}
          {c.overflow > 0 && (
            <View style={card.overflowChip}>
              <Text style={card.overflowText}>+{c.overflow}</Text>
            </View>
          )}
        </View>
        <View style={card.matchBadge}>
          <Ionicons name="star" size={11} color="#4F46E5" />
          <Text style={card.matchText}>{c.match}% Match</Text>
        </View>
      </View>

      {/* Status strip (Testing / Interview / Hired) */}
      {statusStrip && (
        <View style={{ marginTop: 10 }}>{statusStrip}</View>
      )}

      {/* Divider */}
      <View style={card.divider} />

      {/* Quick Actions */}
      <View style={card.actions}>
        <TouchableOpacity
          style={card.actionGray}
          activeOpacity={0.8}
          onPress={actionLeft.onPress}
        >
          <Ionicons name={actionLeft.icon} size={13} color="#555555" />
          <Text style={card.actionGrayText}>{actionLeft.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[card.actionBlue, actionRight.bg ? { backgroundColor: actionRight.bg, borderColor: actionRight.border } : null]}
          activeOpacity={0.8}
          onPress={actionRight.onPress}
        >
          <Ionicons name={actionRight.icon} size={13} color={actionRight.color ?? '#4F46E5'} />
          <Text style={[card.actionBlueText, actionRight.color ? { color: actionRight.color } : null]}>
            {actionRight.label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Status strip ─────────────────────────────────────────────────────────────

function StatusStrip({
  icon, text, bg, border, color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <View style={[strip.wrap, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[strip.text, { color }]}>{text}</Text>
    </View>
  );
}

const strip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 8, paddingHorizontal: 12 },
  text: { fontSize: 12, fontWeight: '500' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function CandidatesScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('newMatches');
  const [newMatches, setNewMatches] = useState<Candidate[]>(INITIAL_NEW_MATCHES);
  const [testing,    setTesting]    = useState<Candidate[]>(INITIAL_TESTING);
  const [movingId,   setMovingId]   = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [detailVisible,     setDetailVisible]     = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Convert local Candidate → PipelineCandidate for the detail sheet
  const toPipelineCandidate = (c: Candidate): PipelineCandidate => ({
    id:                  c.id,
    jobId:               'pipeline-job',
    candidateId:         c.id,
    candidateName:       c.name,
    candidateTitle:      c.role,
    skills:              [...c.skills, ...(c.overflow > 0 ? [`+${c.overflow} more`] : [])],
    matchScore:          c.match,
    stage:               'new_matches',
    hasAssessment:       false,
    hasVideoPitch:       false,
    appliedAt:           new Date().toISOString(),
    isVerified:          true,
  });

  const openDetail = (c: Candidate) => {
    setSelectedCandidate(toPipelineCandidate(c));
    setDetailVisible(true);
  };

  // Fade transition on tab switch
  const switchTab = (tab: TabKey) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // Move candidate from New Matches → Testing
  const moveToTesting = (c: Candidate) => {
    setMovingId(c.id);
    setTimeout(() => {
      setNewMatches((prev) => prev.filter((x) => x.id !== c.id));
      setTesting((prev) => [{ ...c, id: 'moved-' + c.id }, ...prev]);
      setMovingId(null);
    }, 350);
  };

  // Dynamic tab counts
  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'newMatches', label: 'New Matches', count: newMatches.length },
    { key: 'testing',    label: 'Testing',     count: testing.length },
    { key: 'interview',  label: 'Interview',   count: INTERVIEW.length },
    { key: 'hired',      label: 'Hired',       count: HIRED.length },
  ];

  // Section header config per tab
  const sectionConfig: Record<TabKey, { dot: string; label: string; badge: string }> = {
    newMatches: { dot: '#4F46E5', label: 'New Matches', badge: '#4F46E5' },
    testing:    { dot: '#F59E0B', label: 'In Testing',  badge: '#F59E0B' },
    interview:  { dot: '#22C55E', label: 'Interviewing', badge: '#22C55E' },
    hired:      { dot: '#4F46E5', label: 'Hired',       badge: '#4F46E5' },
  };
  const sec = sectionConfig[activeTab];
  const activeCount = TABS.find((t) => t.key === activeTab)?.count ?? 0;

  // Content renderer
  const renderContent = () => {
    if (activeTab === 'newMatches') {
      return newMatches.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          movingId={movingId ?? undefined}
          actionLeft={{ icon: 'flask-outline', label: 'Move to Testing', onPress: () => moveToTesting(c) }}
          actionRight={{ icon: 'person-outline', label: 'View Profile', onPress: () => openDetail(c) }}
        />
      ));
    }

    if (activeTab === 'testing') {
      return testing.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          statusStrip={
            <StatusStrip
              icon="flask-outline"
              text={TESTING_STATUS[c.id] ?? 'Assessment sent'}
              bg="#FFF7ED" border="#FED7AA" color="#F59E0B"
            />
          }
          actionLeft={{ icon: 'time-outline', label: 'Awaiting Results' }}
          actionRight={{ icon: 'person-outline', label: 'View Profile', onPress: () => openDetail(c) }}
        />
      ));
    }

    if (activeTab === 'interview') {
      return INTERVIEW.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          statusStrip={
            <StatusStrip
              icon="videocam-outline"
              text="Interview scheduled · Tomorrow 3:00 PM"
              bg="#F0FDF4" border="#BBF7D0" color="#22C55E"
            />
          }
          actionLeft={{ icon: 'calendar-outline', label: 'Reschedule' }}
          actionRight={{ icon: 'checkmark-circle-outline', label: 'Move to Hired', onPress: () => openDetail(c) }}
        />
      ));
    }

    if (activeTab === 'hired') {
      return HIRED.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          statusStrip={
            <StatusStrip
              icon="ribbon-outline"
              text="Offer accepted · Joining 1st Feb"
              bg="#EEF2FF" border="#C7D2FE" color="#4F46E5"
            />
          }
          actionLeft={{ icon: 'mail-outline', label: 'Send Onboarding' }}
          actionRight={{ icon: 'document-text-outline', label: 'View Contract', onPress: () => openDetail(c) }}
        />
      ));
    }

    return null;
  };

  return (
    <SafeAreaView style={S.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Text style={S.headerTitle}>Hi, Rahul 👋</Text>
          <Text style={S.headerSub}>Exposys Data Labs</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={S.bellWrap}>
          <Ionicons name="notifications-outline" size={22} color="#0A0A0A" />
          <View style={S.redDot} />
        </TouchableOpacity>
      </View>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
      <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* SECTION A — Stats row (dynamic) */}
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={[S.statNum, { color: '#4F46E5' }]}>{newMatches.length}</Text>
            <Text style={S.statLabel}>New Matches</Text>
          </View>
          <View style={S.statCard}>
            <Text style={[S.statNum, { color: '#F59E0B' }]}>{testing.length}</Text>
            <Text style={S.statLabel}>Testing</Text>
          </View>
          <View style={S.statCard}>
            <Text style={[S.statNum, { color: '#22C55E' }]}>{INTERVIEW.length}</Text>
            <Text style={S.statLabel}>Interviews</Text>
          </View>
        </View>

        {/* SECTION B — Pipeline tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[S.tab, active ? S.tabActive : S.tabInactive]}
                onPress={() => switchTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[S.tabLabel, active ? S.tabLabelActive : S.tabLabelInactive]}>
                  {tab.label}
                </Text>
                <View style={[S.tabBadge, active ? S.tabBadgeActive : S.tabBadgeInactive]}>
                  <Text style={[S.tabBadgeText, active ? S.tabBadgeTextActive : S.tabBadgeTextInactive]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SECTION C — Section header */}
        <View style={S.sectionHeader}>
          <View style={S.sectionLeft}>
            <View style={[S.dot, { backgroundColor: sec.dot }]} />
            <Text style={S.sectionTitle}>{sec.label}</Text>
          </View>
          <View style={[S.countBadge, { backgroundColor: sec.badge }]}>
            <Text style={S.countBadgeText}>{activeCount}</Text>
          </View>
        </View>

        {/* SECTION D — Candidate cards with fade */}
        <Animated.View style={[S.cardList, { opacity: fadeAnim }]}>
          {renderContent()}
        </Animated.View>

      </ScrollView>

      {/* ── CANDIDATE DETAIL SHEET ────────────────────────────── */}
      <CandidateDetailSheet
        visible={detailVisible}
        candidate={selectedCandidate}
        onClose={() => setDetailVisible(false)}
        onScheduleInterview={() => setDetailVisible(false)}
        onSendAssessment={() => setDetailVisible(false)}
        onPass={() => setDetailVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Card styles ───────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#4F46E5',
    borderRadius: 16, padding: 14,
    marginBottom: 10,
    ...Platform.select({
      web:     { boxShadow: '0 2px 12px rgba(79,70,229,0.08)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    }),
  },
  wrapMoving: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBF0',
  },
  row1:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  info:         { flex: 1, gap: 3 },
  name:         { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  role:         { fontSize: 12, color: '#888888' },
  menuBtn:      { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  row2:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skillsRow:    { flexDirection: 'row', gap: 6 },
  chip:         { height: 26, paddingHorizontal: 10, backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 6, justifyContent: 'center' },
  chipText:     { fontSize: 11, fontWeight: '500', color: '#555555' },
  overflowChip: { height: 26, paddingHorizontal: 10, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 6, justifyContent: 'center' },
  overflowText: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },
  matchBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  matchText:    { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  divider:      { height: 1, backgroundColor: '#F0F0F0', marginTop: 10, marginBottom: 10 },
  actions:        { flexDirection: 'row', gap: 8 },
  actionGray:     { flex: 1, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 8 },
  actionGrayText: { fontSize: 11, fontWeight: '600', color: '#555555' },
  actionBlue:     { flex: 1, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 8 },
  actionBlueText: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:  { flex: 1 },
  content: { paddingBottom: 110 },

  header: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerLeft:  { gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  headerSub:   { fontSize: 13, color: '#888888' },
  bellWrap:    { position: 'relative', padding: 2 },
  redDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E63946', borderWidth: 2, borderColor: '#FFFFFF',
  },

  statsRow:  { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, marginBottom: 20 },
  statCard:  { flex: 1, backgroundColor: '#F8F8FF', borderWidth: 1, borderColor: '#E8E8FF', borderRadius: 14, padding: 14 },
  statNum:   { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#888888', marginTop: 2 },

  tabsRow:          { paddingHorizontal: 20, gap: 8, paddingBottom: 20 },
  tab:              { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  tabActive:        { backgroundColor: '#4F46E5' },
  tabInactive:      { backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB' },
  tabLabel:         { fontSize: 13 },
  tabLabelActive:   { fontWeight: '600', color: '#FFFFFF' },
  tabLabelInactive: { fontWeight: '500', color: '#555555' },
  tabBadge:              { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tabBadgeActive:        { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeInactive:      { backgroundColor: '#EBEBEB' },
  tabBadgeText:          { fontSize: 11, fontWeight: '700' },
  tabBadgeTextActive:    { color: '#FFFFFF' },
  tabBadgeTextInactive:  { color: '#888888' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  countBadge:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countBadgeText:{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  cardList: { paddingHorizontal: 20 },
});
