import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { PipelineCandidate, PipelineStage } from '../../../types/employer';
import CandidateMiniCard from './CandidateMiniCard';

const STAGE_CONFIG: Record<
  string,
  { label: string; dot: string; count: number }
> = {
  new_matches: { label: 'New Matches', dot: '#4C59D7', count: 0 },
  testing:     { label: 'Testing',     dot: '#F57C00', count: 0 },
  interview:   { label: 'Interview',   dot: '#849CFF', count: 0 },
  hired:       { label: 'Hired',       dot: '#22C55E', count: 0 },
  rejected:    { label: 'Rejected',    dot: '#EF4444', count: 0 },
};

interface KanbanColumnProps {
  stage: PipelineStage;
  candidates: PipelineCandidate[];
  columnWidth: number;
  onCandidatePress: (c: PipelineCandidate) => void;
  onMoveCandidate: (id: string, from: PipelineStage, to: PipelineStage) => void;
  onDismissCandidate: (id: string) => void;
}

export default function KanbanColumn({
  stage,
  candidates,
  columnWidth,
  onCandidatePress,
  onMoveCandidate,
  onDismissCandidate,
}: KanbanColumnProps) {
  const cfg = STAGE_CONFIG[stage] ?? { label: stage, dot: '#6B7280', count: 0 };

  return (
    <View style={[styles.column, { width: columnWidth }, cardShadow]}>
      {/* Column header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={styles.headerTitle}>{cfg.label}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{candidates.length}</Text>
        </View>
      </View>

      {/* Candidate cards */}
      <View style={styles.cardList}>
        {candidates.map((c, index) => (
          <CandidateMiniCard
            key={c.id}
            candidate={c}
            index={index}
            onViewProfile={onCandidatePress}
            onThreeDot={(c) => {
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
                    options: ['View Profile', 'Move to Stage', 'Reject', 'Cancel'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 3,
                  },
                  (idx: number) => {
                    if (idx === 0) onCandidatePress(c);
                    if (idx === 1) {
                      ActionSheetIOS.showActionSheetWithOptions(
                        {
                          options: [...moveStages.filter(s => s !== c.stage).map(s => stageLabels[s]), 'Cancel'],
                          cancelButtonIndex: moveStages.length - 1,
                        },
                        (stageIdx: number) => {
                          const stagesFiltered = moveStages.filter(s => s !== c.stage);
                          if (stageIdx < stagesFiltered.length) {
                            onMoveCandidate(c.id, c.stage, stagesFiltered[stageIdx]);
                          }
                        }
                      );
                    }
                    if (idx === 2) onDismissCandidate(c.id);
                  }
                );
              } else {
                Alert.alert(
                  c.candidateName,
                  'Choose an action',
                  [
                    { text: 'View Profile', onPress: () => onCandidatePress(c) },
                    { text: 'Reject', style: 'destructive', onPress: () => onDismissCandidate(c.id) },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }
            }}
          />
        ))}
        {candidates.length === 0 && (
          <Text style={styles.emptyText}>No candidates in this stage</Text>
        )}
      </View>
    </View>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0px 4px 16px rgba(76,89,215,0.08)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  column: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingHorizontal: 16,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
  },
  countBadge: {
    backgroundColor: '#4C59D7',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  cardList: { marginTop: 16, gap: 10 },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#D0D7FF',
    textAlign: 'center',
    marginTop: 24,
  },
});
