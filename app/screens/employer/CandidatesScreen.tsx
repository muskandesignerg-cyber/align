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
import { PipelineCandidate, PipelineStage } from '../../types/employer';
import CandidateDetailSheet from '../../components/employer/candidate-detail/CandidateDetailSheet';
import { useEmployer } from '../../context/EmployerContext';
import { useAuth } from '../../context/AuthContext';
import CandidateCard from '../../components/employer/pipeline/CandidateCard';
import ChatScreen from '../ChatScreen';
import AppTopBar from '../../components/shared/AppTopBar';
import EmployerProfileSheet from '../../components/employer/EmployerProfileSheet';
import { getOrCreateConversation } from '../../lib/database';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EmployerStackParamList } from '../../navigation/EmployerNavigator';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'newMatches' | 'testing' | 'interview' | 'hired';

// ─── Tab config ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<TabKey, string> = {
  newMatches: 'New Matches',
  testing:    'Testing',
  interview:  'Interview',
  hired:      'Hired',
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function CandidatesScreen() {
  const { state, dispatch, moveCandidate, stageCounts } = useEmployer();
  const { user, profile } = useAuth();
  
  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'Rahul';
  const companyName = profile?.company_name || 'Company Name';
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();

  const [activeTab, setActiveTab] = useState<TabKey>('newMatches');
  const [movingId,   setMovingId]   = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [detailVisible,     setDetailVisible]     = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatCandidate, setChatCandidate] = useState<PipelineCandidate | null>(null);

  const newMatches = allCandidates.filter(c => c.stage === 'new_matches');
  const testing = allCandidates.filter(c => c.stage === 'testing');
  const interview = allCandidates.filter(c => c.stage === 'interview');
  const hired = allCandidates.filter(c => c.stage === 'hired');

  const openDetail = (c: PipelineCandidate) => {
    setSelectedCandidate(c);
    setDetailVisible(true);
  };

  const handleMessage = async (c: PipelineCandidate) => {
    if (!user) return;
    try {
      const conv = await getOrCreateConversation(user.id, c.candidateId, c.jobId);
      setActiveConvId(conv.id);
      setChatCandidate(c);
      setChatOpen(true);
    } catch (e) {
      console.error('[Candidates] Failed to open chat:', e);
    }
  };

  // Fade transition on tab switch
  const switchTab = (tab: TabKey) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // Move candidate from New Matches → open AssessmentBuilder
  const moveToTesting = (c: PipelineCandidate) => {
    // Build a minimal JobPosting from the candidate's job context
    const job = {
      id:             c.jobId,
      employerId:     user?.id ?? '',
      roleTitle:      c.candidateTitle || 'Software Engineer',
      companyName:    'Your Company',
      employmentType: 'Full-time',
      workModel:      'Remote',
      location:       'Remote',
      salaryMin:      0,
      salaryMax:      0,
      currency:       'USD',
      skills:         c.skills,
      description:    '',
      isActive:       true,
      requiresAssessment: true,
      blindAudition:  false,
      candidateCount: 1,
      postedAt:       new Date().toISOString(),
    };
    navigation.navigate('AssessmentBuilder', { candidate: c, job });
    // Stage update happens after employer sends the assessment
  };

  // Dynamic tab counts
  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'newMatches', label: 'New Matches', count: newMatches.length },
    { key: 'testing',    label: 'Testing',     count: testing.length },
    { key: 'interview',  label: 'Interview',   count: interview.length },
    { key: 'hired',      label: 'Hired',       count: hired.length },
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
          actionLeft={{ icon: 'chatbubble-outline', label: 'Message', onPress: () => handleMessage(c) }}
          actionRight={{
            icon: 'flask-outline',
            label: 'Send Assessment',
            onPress: () => moveToTesting(c),
          }}
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
              text={c.hasAssessment ? 'Assessment sent' : 'Assessment pending'}
              bg="#FFF7ED" border="#FED7AA" color="#F59E0B"
            />
          }
          actionLeft={{ icon: 'chatbubble-outline', label: 'Message', onPress: () => handleMessage(c) }}
          actionRight={{ icon: 'person-outline', label: 'View Profile', onPress: () => openDetail(c) }}
        />
      ));
    }

    if (activeTab === 'interview') {
      return interview.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          statusStrip={
            <StatusStrip
              icon="videocam-outline"
              text="Interview scheduled"
              bg="#F0FDF4" border="#BBF7D0" color="#22C55E"
            />
          }
          actionLeft={{ icon: 'chatbubble-outline', label: 'Message', onPress: () => handleMessage(c) }}
          actionRight={{ icon: 'checkmark-circle-outline', label: 'Move to Hired', onPress: () => moveCandidate(c.id, 'interview', 'hired') }}
        />
      ));
    }

    if (activeTab === 'hired') {
      return hired.map((c) => (
        <CandidateCard
          key={c.id}
          c={c}
          statusStrip={
            <StatusStrip
              icon="ribbon-outline"
              text="Offer accepted"
              bg="#EEF2FF" border="#C7D2FE" color="#4F46E5"
            />
          }
          actionLeft={{ icon: 'chatbubble-outline', label: 'Message', onPress: () => handleMessage(c) }}
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
      <AppTopBar
        hasNotification={true}
        onBellPress={() => {}}
        onAvatarPress={() => setShowProfileSheet(true)}
      />

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
      <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* SECTION A — Greeting */}
        <View style={S.greetingSection}>
          <View>
            <Text style={S.hiText}>Hi, {firstName}! 👋</Text>
            <Text style={S.companyText}>{companyName}</Text>
          </View>
        </View>

        {/* SECTION B — Stats row (dynamic) */}
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
            <Text style={[S.statNum, { color: '#22C55E' }]}>{interview.length}</Text>
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

      {/* ── CHAT OVERLAY ────────────────────────────── */}
      <ChatScreen
        visible={chatOpen}
        conversationId={activeConvId}
        currentUserId={user?.id ?? ''}
        otherUserName={chatCandidate?.candidateName ?? 'Candidate'}
        jobTitle={chatCandidate?.jobId === 'pipeline-job' ? undefined : chatCandidate?.jobId}
        onClose={() => { setChatOpen(false); setActiveConvId(null); setChatCandidate(null); }}
      />

      {/* ── PROFILE SHEET ────────────────────────────── */}
      <EmployerProfileSheet
        visible={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
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
  row2:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  skillsRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
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
  content: { paddingBottom: 160 },

  greetingSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4, backgroundColor: '#FFFFFF' },
  hiText:          { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  companyText:     { fontSize: 14, color: '#6B7280', marginTop: 2 },

  statsRow:  { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, marginBottom: 20 },
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
