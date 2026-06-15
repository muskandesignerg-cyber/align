import React, { useRef, useCallback } from 'react';
import { Animated, View, Dimensions, StyleSheet } from 'react-native';
import { Job } from '../../types/jobs';
import JobCard from './JobCard';
import SwipeableCard from './SwipeableCard';
import StampOverlay from './StampOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cap at 358 so cards never overflow on wide web viewports
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 358);

interface CardStackProps {
  /** Filtered feed — already excludes applied and passed jobs */
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
 * No longer uses currentIndex — the parent filters applied/passed jobs
 * so jobs[0] is always the next unseen card.
 *
 * Animated.ValueXY is used instead of Reanimated SharedValue so that:
 *   • SwipeableCard can use PanResponder (Animated-based, not RNGH)
 *   • StampOverlay can read the same value for APPLY/PASS overlays
 *   • TouchableOpacity (card tap, Pass, Save) works correctly
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

  // Always show the first job in the feed
  const currentJob = jobs[0] ?? null;

  const handleSwipeLeft = useCallback(() => {
    if (currentJob) onSwipeLeft(currentJob.id);
  }, [currentJob, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    if (currentJob) onSwipeRight(currentJob.id);
  }, [currentJob, onSwipeRight]);

  const handleSwipeUp = useCallback(() => {
    if (currentJob && onSwipeUp) onSwipeUp(currentJob.id);
  }, [currentJob, onSwipeUp]);

  const handleTap = useCallback(() => {
    if (currentJob) onTap(currentJob);
  }, [currentJob, onTap]);

  const handlePass = useCallback(() => {
    if (currentJob && onPass) onPass(currentJob.id);
  }, [currentJob, onPass]);

  const handleSave = useCallback(() => {
    if (currentJob && onSave) onSave(currentJob.id);
  }, [currentJob, onSave]);

  if (!currentJob) return null;

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <SwipeableCard
          position={position}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeUp={handleSwipeUp}
        >
          <StampOverlay position={position} />
          <JobCard
            job={currentJob}
            cardWidth={CARD_WIDTH}
            onPassPress={handlePass}
            onSavePress={handleSave}
            onPress={handleTap}
          />
        </SwipeableCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              0,
    alignItems:        'center',
    justifyContent:    'flex-start',
    paddingTop:        16,
    paddingHorizontal: 16,
    paddingBottom:     16,
    backgroundColor:   '#FFFFFF',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});
