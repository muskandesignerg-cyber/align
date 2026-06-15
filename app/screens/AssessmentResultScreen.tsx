/**
 * AssessmentResultScreen — Round 2 pass/fail result.
 * Pass: confetti, verified badge, score, skill tags, CTA buttons.
 * Fail: encouragement, retry or back.
 * Matches reference image 3.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Briefcase, User, RefreshCcw } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { Assessment } from '../types/assessment';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'AssessmentResult'>;

// ── Circular score gauge ──────────────────────────────────────────────────────

function ScoreGauge({ score, passed }: { score: number; passed: boolean }) {
  const r = 54, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = passed ? '#4F46E5' : '#EF4444';

  const animatedDash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedDash, { toValue: progress, duration: 1200, useNativeDriver: false }).start();
  }, []);

  return (
    <View style={scoreG.container}>
      <Svg width={140} height={140}>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke="#F0F0F0" strokeWidth={10} fill="none" />
        {/* Progress */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={color} strokeWidth={10} fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={scoreG.labelWrap}>
        <Text style={[scoreG.score, { color }]}>{score}</Text>
        <Text style={scoreG.over}>/100</Text>
      </View>
    </View>
  );
}

const scoreG = StyleSheet.create({
  container: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  labelWrap: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: 32, fontWeight: '800' },
  over: { fontSize: 13, color: '#9CA3AF', marginTop: -4 },
});

// ── Main component ────────────────────────────────────────────────────────────

export default function AssessmentResultScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { passed, score, correct, total, roleTitle, companyName, assessment } = params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  const handleBackToJobs = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const handleRetry = () => {
    navigation.replace('AssessmentIntro', { assessment });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Badge + verified text */}
        <Animated.View style={[styles.badgeWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.badgeCircle, { backgroundColor: passed ? 'rgba(79,70,229,0.12)' : 'rgba(239,68,68,0.10)' }]}>
            <ShieldCheck size={44} color={passed ? '#4F46E5' : '#EF4444'} strokeWidth={2} />
          </View>
          <View style={[styles.verifiedBadge, { backgroundColor: passed ? '#4F46E5' : '#EF4444' }]}>
            <Text style={styles.verifiedText}>{passed ? 'Verified' : 'Not Passed'}</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>
          {passed
            ? 'You earned a Verified\nProblem-Solver badge'
            : 'Keep Going — You\'ll\nNail It Next Time'}
        </Text>
        <Text style={styles.subtitle}>
          {passed
            ? `Outstanding performance! Your analytical skills are now officially verified and visible to top employers.`
            : `You scored ${score}% — the passing score is ${assessment.passingScore}%. Review the topics and give it another shot.`}
        </Text>

        {/* Score gauge */}
        <View style={styles.gaugeRow}>
          <ScoreGauge score={score} passed={passed} />
          <View style={styles.gaugeDetails}>
            <Text style={styles.gaugeLabel}>Correct Answers</Text>
            <Text style={styles.gaugeValue}>{correct}/{total}</Text>
            <Text style={styles.gaugeLabel}>Passing Score</Text>
            <Text style={styles.gaugeValue}>{assessment.passingScore}%</Text>
          </View>
        </View>

        {/* Skill tags (pass only) */}
        {passed && assessment.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <View style={styles.skillsRow}>
              {assessment.skills.slice(0, 4).map((s, i) => (
                <View key={i} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Company match card (pass only) */}
        {passed && (
          <View style={styles.matchCard}>
            <View style={styles.matchCardHeader}>
              <View style={styles.matchIcon}>
                <Briefcase size={16} color="#4F46E5" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.matchCompany}>{companyName.toUpperCase()}</Text>
                <Text style={styles.matchLabel}>Match Score Update</Text>
              </View>
            </View>
            <View style={styles.matchScoreRow}>
              <Text style={styles.matchBefore}>72%</Text>
              <Text style={styles.matchArrow}> ↑ </Text>
              <Text style={styles.matchAfter}>{Math.min(score + 20, 99)}%</Text>
            </View>
          </View>
        )}

        {/* CTAs */}
        <View style={styles.ctaStack}>
          {!passed && (
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <RefreshCcw size={16} color="#4F46E5" strokeWidth={2} />
              <Text style={styles.retryText}>Retake Assessment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleBackToJobs} activeOpacity={0.85}>
            <Briefcase size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryText}>Back to Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Profile' as any)} activeOpacity={0.85}>
            <User size={16} color="#4F46E5" strokeWidth={2} />
            <Text style={styles.secondaryText}>View My Profile</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, alignItems: 'center' },

  badgeWrap: { alignItems: 'center', marginBottom: 24 },
  badgeCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadge: {
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginTop: -10,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  title: {
    fontSize: 26, fontWeight: '800', color: '#0A0A0A',
    textAlign: 'center', lineHeight: 34, marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },

  gaugeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 24,
    backgroundColor: '#F8F7FF', borderRadius: 20, padding: 20,
    width: '100%', marginBottom: 20,
  },
  gaugeDetails: { flex: 1, gap: 8 },
  gaugeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  gaugeValue: { fontSize: 20, fontWeight: '800', color: '#0A0A0A' },

  skillsSection: { width: '100%', marginBottom: 16 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    backgroundColor: 'rgba(79,70,229,0.08)', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  skillTagText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },

  matchCard: {
    width: '100%', backgroundColor: '#F8F7FF',
    borderRadius: 16, padding: 16, marginBottom: 28,
  },
  matchCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  matchIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(79,70,229,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  matchCompany: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  matchLabel: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  matchScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  matchBefore: { fontSize: 24, fontWeight: '700', color: '#9CA3AF' },
  matchArrow: { fontSize: 20, color: '#4F46E5', fontWeight: '800' },
  matchAfter: { fontSize: 32, fontWeight: '800', color: '#4F46E5' },

  ctaStack: { width: '100%', gap: 12 },
  primaryBtn: {
    height: 52, backgroundColor: '#4F46E5', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    height: 52, backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E8E8E8',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  retryBtn: {
    height: 52, backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#4F46E5',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  retryText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
});
