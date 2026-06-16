import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
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
 * FeedScreen — layer stack:
 *   SafeAreaView (flex:1, white)
 *     TopBar             ← auto height (~180px)
 *     ScrollView         ← flex:1, white, holds card
 *     ActionButtons      ← auto height (~76px), sits above navbar
 */
export const FeedScreen: React.FC = () => {
  const { state, feedJobs, currentJob, applyToJob, passJob, saveJob, reload } = useDiscover();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleSwipeRight = useCallback((jobId: string) => {
    applyToJob(jobId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [applyToJob]);

  const handleSwipeLeft = useCallback((jobId: string) => {
    passJob(jobId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [passJob]);

  const handleSwipeUp = useCallback((jobId: string) => {
    applyToJob(jobId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [applyToJob]);

  const handleTapCard = useCallback((job: Job) => {
    navigation.navigate('JobDetail', { job });
  }, [navigation]);

  const handleSave  = useCallback((jobId: string) => { saveJob(jobId); }, [saveJob]);
  const handlePass  = useCallback((jobId: string) => { passJob(jobId); }, [passJob]);

  const handlePassButton = useCallback(() => {
    if (currentJob) passJob(currentJob.id);
  }, [currentJob, passJob]);

  const handleApplyButton = useCallback(() => {
    if (currentJob) navigation.navigate('JobDetail', { job: currentJob });
  }, [currentJob, navigation]);

  const { isLoading, isScoring, errorType } = state;
  const isEmpty = !isLoading && !errorType && feedJobs.length === 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Finding matches...</Text>
        </View>
      );
    }
    if (errorType === 'offline') return <OfflineState onRetry={reload} />;
    if (errorType === 'error')   return <ErrorState onRetry={reload} onClose={() => {}} />;
    if (errorType === 'empty') {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No jobs available yet</Text>
          <Text style={styles.emptyBody}>Check back soon — employers are posting roles now.</Text>
        </View>
      );
    }
    if (isEmpty) return <EmptyFeed onUpdatePreferences={() => {}} />;

    return (
      <>
        {isScoring && (
          <View style={styles.scoringBanner}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.scoringText}>Calculating match scores...</Text>
          </View>
        )}
        <CardStack
          jobs={feedJobs}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onSwipeUp={handleSwipeUp}
          onTap={handleTapCard}
          onPass={handlePass}
          onSave={handleSave}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Layer 1 — Header */}
      <TopBar />

      {/* Layer 2 — Scroll area (pure white behind card) */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Layer 3 — Pass / Apply buttons */}
      <ActionButtons
        onPass={handlePassButton}
        onApply={handleApplyButton}
        disabled={!currentJob}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#FFFFFF',
  },

  // Pure white scroll area — no gray background
  scrollArea: {
    flex:            1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop:    0,
    paddingBottom: 100,
    flexGrow:      1,
  },

  center: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop:  16,
    fontSize:   16,
    fontWeight: '600',
    color:      '#4F46E5',
  },
  emptyTitle: {
    fontSize:   22,
    fontWeight: '700',
    color:      '#1A1A2E',
    textAlign:  'center',
  },
  emptyBody: {
    fontSize:   15,
    fontWeight: '400',
    color:      '#6B7280',
    textAlign:  'center',
    marginTop:  8,
    lineHeight: 22,
  },
  scoringBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    backgroundColor:   '#F0F0FF',
    borderRadius:      12,
    paddingHorizontal: 16,
    paddingVertical:   10,
    marginHorizontal:  20,
    marginBottom:      12,
  },
  scoringText: {
    fontSize:   14,
    fontWeight: '500',
    color:      '#4F46E5',
  },
});
