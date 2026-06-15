import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Pipeline, PipelineCandidate, PipelineStage } from '../../../types/employer';
import KanbanColumn from './KanbanColumn';

import { KANBAN_COLUMN_WIDTH, KANBAN_SNAP_INTERVAL } from '../../../../constants/screenSize';

const COLUMN_WIDTH = KANBAN_COLUMN_WIDTH;
const GAP = 16;

const STAGES: PipelineStage[] = ['new_matches', 'testing', 'interview', 'hired'];

interface KanbanBoardProps {
  pipeline: Pipeline;
  onCandidatePress: (c: PipelineCandidate) => void;
  onMoveCandidate: (id: string, from: PipelineStage, to: PipelineStage) => void;
  onDismissCandidate: (id: string) => void;
}

export default function KanbanBoard({
  pipeline,
  onCandidatePress,
  onMoveCandidate,
  onDismissCandidate,
}: KanbanBoardProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={KANBAN_SNAP_INTERVAL}
      decelerationRate="fast"
      contentContainerStyle={styles.content}
    >
      {STAGES.map((stage) => (
        <KanbanColumn
          key={stage}
          stage={stage}
          candidates={pipeline[stage]}
          columnWidth={COLUMN_WIDTH}
          onCandidatePress={onCandidatePress}
          onMoveCandidate={onMoveCandidate}
          onDismissCandidate={onDismissCandidate}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: GAP,
    paddingBottom: 24,
    paddingTop: 8,
  },
});
