import React, { useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import TopBar from '../components/discover/TopBar';
import CardStack from '../components/discover/CardStack';
import ActionButtons from '../components/discover/ActionButtons';
import EmptyFeed from '../components/discover/EmptyFeed';
import { ErrorState, OfflineState } from '../components/ui/StateScreens';
import { useDiscover } from '../context/DiscoverContext';
import { Job } from '../types/jobs';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

/**
 * FeedScreen — Main Discover feed with swipeable job cards.
 *
 * Interactions:
 *   • Swipe right → apply  (persisted to Supabase)
 *   • Swipe left  → pass   (persisted to Supabase)
 *   • Swipe up    → super-apply
 *   • Tap card    → open Job Detail screen
 */
export const FeedScreen: React.FC = () => {
  const { state, feedJobs, currentJob, applyToJob, passJob, saveJob, reload } = useDiscover();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // ── Swipe handlers ─────────────────────────────────────────────────────────

  const handleSwipeRight = useCallback(
    (jobId: string) => {
      applyToJob(jobId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [applyToJob],
  );

  const handleSwipeLeft = useCallback(
    (jobId: string) => {
      passJob(jobId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [passJob],
  );

  const handleSwipeUp = useCallback(
    (jobId: string) => {
      applyToJob(jobId); // super-apply = apply + flag
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
    [applyToJob],
  );

  const handleTapCard = useCallback(
    (job: Job) => { navigation.navigate('JobDetail', { job }); },
    [navigation],
  );

  const handleSave = useCallback(
    (jobId: string) => { saveJob(jobId); },
    [saveJob],
  );

  const handlePass = useCallback(
    (jobId: string) => { passJob(jobId); },
    [passJob],
  );

  const handlePassButton = useCallback(() => {
    if (!currentJob) return;
    passJob(currentJob.id);
  }, [currentJob, passJob]);

  const handleApplyButton = useCallback(() => {
    if (!currentJob) return;
    navigation.navigate('JobDetail', { job: currentJob });
  }, [currentJob, navigation]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const { isLoading, isScoring, errorType } = state;
  const isEmpty = !isLoading && !errorType && feedJobs.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TopBar />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4C59D7" />
          <Text style={styles.loadingText}>Finding matches...</Text>
        </View>
      ) : errorType === 'offline' ? (
        <OfflineState onRetry={reload} />
      ) : errorType === 'error' ? (
        <ErrorState onRetry={reload} onClose={() => {}} />
      ) : errorType === 'empty' ? (
        /* No jobs in DB yet */
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No jobs available yet</Text>
          <Text style={styles.emptyBody}>Check back soon — employers are posting roles now.</Text>
        </View>
      ) : isEmpty ? (
        /* Seen all available jobs */
        <EmptyFeed onUpdatePreferences={() => {}} />
      ) : (
        <>
          {/* Scoring indicator — subtle banner while Groq is working */}
          {isScoring && (
            <View style={styles.scoringBanner}>
              <ActivityIndicator size="small" color="#4C59D7" />
              <Text style={styles.scoringText}>Calculating match scores...</Text>
            </View>
          )}

          <View style={styles.cardArea}>
            <CardStack
              jobs={feedJobs}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
              onTap={handleTapCard}
              onPass={handlePass}
              onSave={handleSave}
            />
          </View>

          <View style={{ flex: 1 }} />

          <ActionButtons
            onPass={handlePassButton}
            onApply={handleApplyButton}
            disabled={!currentJob}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  cardArea: {
    flex: 0,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#4C59D7',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
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
  scoringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  scoringText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
});
