import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withDelay,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useEmployer } from '../../context/EmployerContext';
import { PipelineCandidate, PipelineStage } from '../../types/employer';
import CandidateMiniCard from '../../components/employer/pipeline/CandidateMiniCard';
import CandidateDetailSheet from '../../components/employer/candidate-detail/CandidateDetailSheet';
import PostRoleSheet from '../../components/employer/post-role/PostRoleSheet';
import EmployerTopBar from '../../components/employer/EmployerTopBar';
import EmployerProfileSheet from '../../components/employer/EmployerProfileSheet';
import { getOrCreateConversation } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import ChatScreen from '../ChatScreen';

// ─── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; dot: string }> = {
  new_matches: { label: 'New Matches', dot: '#4C59D7' },
  testing:     { label: 'Testing',     dot: '#F59E0B' },
  interview:   { label: 'Interview',   dot: '#8B5CF6' },
  hired:       { label: 'Hired',       dot: '#10B981' },
  rejected:    { label: 'Rejected',    dot: '#EF4444' },
};

const STAGE_KEYS: { key: PipelineStage; label: string }[] = [
  { key: 'new_matches', label: 'New Matches' },
  { key: 'testing',     label: 'Testing' },
  { key: 'interview',   label: 'Interview' },
  { key: 'hired',       label: 'Hired' },
  { key: 'rejected',    label: 'Rejected' },
];

// ─── Inner screen ──────────────────────────────────────────────────────────────
function JobsInner() {
  const { state, dispatch, stageCounts, moveCandidate } = useEmployer();
  const { user } = useAuth();

  const [chatOpen, setChatOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatCandidate, setChatCandidate] = useState<PipelineCandidate | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [companyName, setCompanyName] = useState('Exposys');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.company_name;
      if (name) setCompanyName(name);
    });
  }, []);

  const handleCandidatePress = useCallback((c: PipelineCandidate) => {
    dispatch({ type: 'SELECT_CANDIDATE', candidate: c });
    dispatch({ type: 'SET_SHOW_CANDIDATE_DETAIL', value: true });
  }, [dispatch]);

  const handleMoveCandidate = useCallback(
    (id: string, from: PipelineStage, to: PipelineStage) => moveCandidate(id, from, to),
    [moveCandidate],
  );

  const handleDismiss = useCallback(
    (id: string) => dispatch({ type: 'DISMISS_CANDIDATE', candidateId: id }),
    [dispatch],
  );

  const handleMessage = useCallback(async (c: PipelineCandidate) => {
    if (!user) return;
    try {
      const conv = await getOrCreateConversation(user.id, c.candidateId, c.jobId);
      setActiveConvId(conv.id);
      setChatCandidate(c);
      setChatOpen(true);
    } catch (e) {
      console.error('[Jobs] Failed to open chat:', e);
    }
  }, [user]);

  const handleThreeDot = useCallback((c: PipelineCandidate) => {
    const { Alert, ActionSheetIOS, Platform } = require('react-native');
    const moveStages = ['new_matches', 'testing', 'interview', 'hired', 'rejected'] as PipelineStage[];
    const stageLabels: Record<PipelineStage, string> = {
      new_matches: 'New Matches',
      testing: 'Testing',
      interview: 'Interview',
      hired: 'Hired',
      rejected: 'Rejected',
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['View Profile', 'Move to Stage', 'Message Candidate', 'Reject', 'Cancel'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 4,
        },
        (idx: number) => {
          if (idx === 0) handleCandidatePress(c);
          if (idx === 1) {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...moveStages.filter(s => s !== c.stage).map(s => stageLabels[s]), 'Cancel'],
                cancelButtonIndex: moveStages.length - 1,
              },
              (stageIdx: number) => {
                const filtered = moveStages.filter(s => s !== c.stage);
                if (stageIdx < filtered.length) handleMoveCandidate(c.id, c.stage, filtered[stageIdx]);
              }
            );
          }
          if (idx === 2) handleMessage(c);
          if (idx === 3) handleDismiss(c.id);
        }
      );
    } else {
      Alert.alert(c.candidateName, 'Choose an action', [
        { text: 'View Profile', onPress: () => handleCandidatePress(c) },
        { text: 'Message Candidate', onPress: () => handleMessage(c) },
        { text: 'Reject', style: 'destructive', onPress: () => handleDismiss(c.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [handleCandidatePress, handleMessage, handleDismiss, handleMoveCandidate]);

  const selectedJob = state.jobPostings.find((j) => j.id === state.selectedJobId);
  const activeStage = state.activeStageFilter as PipelineStage;
  const stageCfg = STAGE_CONFIG[activeStage] ?? { label: activeStage, dot: '#4C59D7' };
  const candidates = state.pipeline[activeStage] ?? [];

  // All candidates across all stages (for chip counts)
  const allCandidates = Object.values(state.pipeline).flat();

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#4C59D7" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!selectedJob) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <EmployerTopBar
          hasNotification={true}
          onProfilePress={() => setShowProfileSheet(true)}
          onBellPress={() => {}}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No roles posted yet</Text>
          <Text style={styles.emptyBody}>
            Post your first role and start matching with top candidates.
          </Text>
        </View>
        <PostRoleSheet
          visible={state.showPostRole}
          onClose={() => dispatch({ type: 'SET_SHOW_POST_ROLE', value: false })}
        />
        <EmployerProfileSheet
          visible={showProfileSheet}
          onClose={() => setShowProfileSheet(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <EmployerTopBar
        hasNotification={true}
        onProfilePress={() => setShowProfileSheet(true)}
        onBellPress={() => {}}
      />

      {/* ── ROLE SECTION ── */}
      <View style={styles.roleSection}>
        <Text style={styles.roleName}>{selectedJob.roleTitle}</Text>
        <View style={styles.roleMetaRow}>
          <Text style={styles.metaText}>{companyName}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{selectedJob.candidateCount} candidates</Text>
        </View>
      </View>

      {/* ── FILTER CHIPS ── horizontal scroll, fixed height */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {STAGE_KEYS.map((s) => {
          const count = stageCounts[s.key] ?? 0;
          const isActive = activeStage === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => dispatch({ type: 'SET_STAGE_FILTER', stage: s.key })}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {s.label} {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── DIVIDER — zero margin ── */}
      <View style={styles.divider} />

      {/* ── SECTION HEADER — fixed padding, never changes ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View style={[styles.stageDot, { backgroundColor: stageCfg.dot }]} />
          <Text style={styles.sectionLabel}>{stageCfg.label}</Text>
        </View>
        <Text style={styles.sectionCount}>{candidates.length} candidates</Text>
      </View>

      {/* ── CANDIDATE LIST ── */}
      <FlatList
        data={candidates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <CandidateMiniCard
            candidate={item}
            index={index}
            onViewProfile={handleCandidatePress}
            onThreeDot={handleThreeDot}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyCol}>
            <Text style={styles.emptyColText}>No candidates in this stage</Text>
          </View>
        )}
      />

      {/* Sheets */}
      <CandidateDetailSheet
        visible={state.showCandidateDetail}
        candidate={state.selectedCandidate}
        onClose={() => dispatch({ type: 'SET_SHOW_CANDIDATE_DETAIL', value: false })}
        onScheduleInterview={() => {}}
        onSendAssessment={() => {}}
        onPass={(c) => dispatch({ type: 'DISMISS_CANDIDATE', candidateId: c.id })}
      />
      <PostRoleSheet
        visible={state.showPostRole}
        onClose={() => dispatch({ type: 'SET_SHOW_POST_ROLE', value: false })}
      />
      <ChatScreen
        visible={chatOpen}
        conversationId={activeConvId}
        currentUserId={user?.id ?? ''}
        otherUserName={chatCandidate?.candidateName ?? 'Candidate'}
        jobTitle={selectedJob.roleTitle}
        onClose={() => { setChatOpen(false); setActiveConvId(null); setChatCandidate(null); }}
      />
      <EmployerProfileSheet
        visible={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />
    </SafeAreaView>
  );
}

// ─── Exported screen ──────────────────────────────────────────────────────────
export default function JobsScreen() {
  return <JobsInner />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  // Role section
  roleSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  roleName: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    lineHeight: 28,
  },
  roleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },

  // Filter chips — fixed height, NO flex stretching
  filterScroll: {
    flexGrow: 0,         // ← key: prevents vertical expansion
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 10,
    gap: 8,
    // NO alignItems here — that was causing the huge gap
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0EC',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',  // ← prevents vertical stretch
  },
  chipActive: {
    backgroundColor: '#4C59D7',
    borderColor: '#4C59D7',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Divider — zero margin
  divider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    // NO marginTop, NO marginBottom
  },

  // Section header — fixed padding, NEVER changes
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,    // fixed — same on all tabs
    paddingBottom: 8,  // fixed — same on all tabs
    backgroundColor: '#FFFFFF',
    // NO marginTop
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A2E',
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },

  // FlatList content
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,      // fixed — same on all tabs
    paddingBottom: 160,
  },

  // Empty states
  emptyCol: { paddingTop: 40, alignItems: 'center' },
  emptyColText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
