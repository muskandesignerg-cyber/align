import React, { useRef, useCallback } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Job } from '../../types/jobs';
import JobCard from './JobCard';
import SwipeableCard from './SwipeableCard';
import StampOverlay from './StampOverlay';

interface CardStackProps {
  jobs:         Job[];
  onSwipeLeft:  (jobId: string) => void;
  onSwipeRight: (jobId: string) => void;
  onSwipeUp?:   (jobId: string) => void;
  onTap:        (job: Job)      => void;
  onPass?:      (jobId: string) => void;
  onSave?:      (jobId: string) => void;
}

/**
 * CardStack — renders the first job from the (already-filtered) feed.
 *
 * Card is 16px from each edge (marginHorizontal: 16).
 * No absolute positioning — lives inside a ScrollView.
 */
export default function CardStack({
  jobs,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  onPass,
  onSave,
}: CardStackProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const currentJob = jobs[0] ?? null;

  const handleSwipeLeft  = useCallback(() => { if (currentJob) onSwipeLeft(currentJob.id); },  [currentJob, onSwipeLeft]);
  const handleSwipeRight = useCallback(() => { if (currentJob) onSwipeRight(currentJob.id); }, [currentJob, onSwipeRight]);
  const handleSwipeUp    = useCallback(() => { if (currentJob && onSwipeUp) onSwipeUp(currentJob.id); }, [currentJob, onSwipeUp]);
  const handleTap        = useCallback(() => { if (currentJob) onTap(currentJob); },            [currentJob, onTap]);
  const handlePass       = useCallback(() => { if (currentJob && onPass) onPass(currentJob.id); }, [currentJob, onPass]);
  const handleSave       = useCallback(() => { if (currentJob && onSave) onSave(currentJob.id); }, [currentJob, onSave]);

  if (!currentJob) return null;

  return (
    <View style={styles.container}>
      <SwipeableCard
        position={position}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
      >
        <StampOverlay position={position} />
        <JobCard
          job={currentJob}
          cardWidth={0}  // ignored — card uses width:'100%' inside container
          onPassPress={handlePass}
          onSavePress={handleSave}
          onPress={handleTap}
        />
      </SwipeableCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 20px margin on each side = 40px total subtracted from screen width.
    // Card uses width:'100%' and fills this container — no fixed pixel math needed.
    marginHorizontal: 20,
    alignSelf: 'stretch',
  },
});
