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

// ─── FAB ──────────────────────────────────────────────────────────────────────
function FAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(400, withSpring(1, { mass: 1, damping: 12, stiffness: 180 }));
  }, []);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.fab, fabStyle, fabShadow]}>
      <TouchableOpacity onPress={onPress} style={styles.fabInner} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const fabShadow = {
  shadowColor: '#4C59D7',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 24,
  elevation: 8,
} as any;

// ─── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; dot: string }> = {
  new_matches: { label: 'New Matches', dot: '#4C59D7' },
  testing:     { label: 'Testing',     dot: '#F57C00' },
  interview:   { label: 'Interview',   dot: '#849CFF' },
  hired:       { label: 'Hired',       dot: '#22C55E' },
  rejected:    { label: 'Rejected',    dot: '#EF4444' },
};

const STAGE_KEYS = [
  { key: 'new_matches' as PipelineStage, label: 'New Matches' },
  { key: 'testing'     as PipelineStage, label: 'Testing' },
  { key: 'interview'   as PipelineStage, label: 'Interview' },
  { key: 'hired'       as PipelineStage, label: 'Hired' },
  { key: 'rejected'    as PipelineStage, label: 'Rejected' },
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
  const stageCfg = STAGE_CONFIG[activeStage] ?? { label: activeStage, dot: '#6B7280' };
  const candidates = state.pipeline[activeStage] ?? [];

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
        <FAB onPress={() => dispatch({ type: 'SET_SHOW_POST_ROLE', value: true })} />
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
          <Text style={styles.companyName}>{companyName}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.candidateCount}>{selectedJob.candidateCount} candidates</Text>
        </View>
      </View>

      {/* ── FILTER CHIPS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
                {s.label}
                {'  '}
                <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>
                  {count}
                </Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── DIVIDER ── */}
      <View style={styles.divider} />

      {/* ── COUNT ROW ── */}
      <View style={styles.countRow}>
        <View style={styles.countLeft}>
          <View style={[styles.activeDot, { backgroundColor: stageCfg.dot }]} />
          <Text style={styles.activeLabel}>{stageCfg.label}</Text>
        </View>
        <Text style={styles.countNumber}>{candidates.length} candidates</Text>
      </View>

      {/* ── CANDIDATE LIST ── */}
      <FlatList
        data={candidates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 160,
        }}
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

      {/* FAB */}
      <FAB onPress={() => dispatch({ type: 'SET_SHOW_POST_ROLE', value: true })} />

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
  companyName: {
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
  candidateCount: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
  },

  // Filter chips
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0EC',
    backgroundColor: '#FFFFFF',
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
  chipCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#9CA3AF',
  },
  chipCountActive: {
    color: 'rgba(255,255,255,0.8)' as any,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F0F0F5',
  },

  // Count row
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  countLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A2E',
  },
  countNumber: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },

  // Empty states
  emptyCol: { paddingVertical: 48, alignItems: 'center' },
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', lineHeight: 28, marginTop: -2 },
});
