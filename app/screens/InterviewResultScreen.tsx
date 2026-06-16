/**
 * InterviewResultScreen — Round 3 AI interview results.
 * Overall score gauge, 4-dimension breakdown bars,
 * strengths/areas-to-improve panels, CTA buttons.
 * Matches reference image 3 (Interview Report).
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Settings, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { InterviewResult, InterviewSession } from '../types/assessment';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'InterviewResult'>;

// ── Circular gauge ─────────────────────────────────────────────────────────────

function CircularScore({ score }: { score: number }) {
  const r = 58, cx = 72, cy = 72;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <View style={gaugeS.wrap}>
      <Svg width={144} height={144}>
        <Circle cx={cx} cy={cy} r={r} stroke="#F0F0F0" strokeWidth={10} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="#4F46E5" strokeWidth={10} fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={gaugeS.label}>
        <Text style={gaugeS.score}>{score}</Text>
        <Text style={gaugeS.over}>/100</Text>
      </View>
    </View>
  );
}
const gaugeS = StyleSheet.create({
  wrap: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: 36, fontWeight: '900', color: '#4F46E5' },
  over: { fontSize: 13, color: '#9CA3AF', marginTop: -4 },
});

// ── Dimension bar ─────────────────────────────────────────────────────────────

function DimBar({ label, value }: { label: string; value: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(anim, { toValue: value, duration: 900, useNativeDriver: false }).start(); }, []);
  return (
    <View style={dimS.row}>
      <Text style={dimS.label}>{label}</Text>
      <View style={dimS.track}>
        <Animated.View style={[dimS.fill, { width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={dimS.value}>{value}%</Text>
    </View>
  );
}
const dimS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  label: { width: 160, fontSize: 13, color: '#444444', fontWeight: '500' },
  track: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#4F46E5', borderRadius: 4 },
  value: { width: 36, fontSize: 13, fontWeight: '700', color: '#0A0A0A', textAlign: 'right' },
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function InterviewResultScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { result, session } = params;
  const { score, passed } = result;

  const handleRetake = () => navigation.replace('InterviewIntro', { session });
  const handleShare  = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0A0A0A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Interview Prep</Text>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Settings size={20} color="#666666" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Report header */}
        <Text style={styles.sectionLabel}>Interview Report</Text>
        <Text style={styles.reportRole}>{session.roleTitle}</Text>

        {/* Gauge + overall */}
        <Text style={styles.overallLabel}>OVERALL SCORE</Text>
        <View style={styles.gaugeWrap}>
          <CircularScore score={score.overall} />
        </View>
        <View style={[styles.verdictCard, { borderLeftColor: passed ? '#4F46E5' : '#EF4444' }]}>
          <Text style={styles.verdictText}>{score.verdict}</Text>
        </View>

        {/* Breakdown */}
        <Text style={styles.sectionTitle}>Performance Breakdown</Text>
        <DimBar label="Technical Accuracy"    value={score.technicalAccuracy} />
        <DimBar label="Communication Clarity" value={score.communicationClarity} />
        <DimBar label="Confidence"            value={score.confidence} />
        <DimBar label="Structure"             value={score.structure} />

        {/* Strengths */}
        <View style={[styles.feedbackCard, styles.strengthCard]}>
          <View style={styles.feedbackHeader}>
            <CheckCircle2 size={18} color="#16A34A" strokeWidth={2} />
            <Text style={[styles.feedbackTitle, { color: '#15803D' }]}>Strengths</Text>
          </View>
          {score.strengths.map((s, i) => (
            <Text key={i} style={styles.feedbackItem}>• {s}</Text>
          ))}
        </View>

        {/* Areas to improve */}
        <View style={[styles.feedbackCard, styles.improveCard]}>
          <View style={styles.feedbackHeader}>
            <AlertTriangle size={18} color="#D97706" strokeWidth={2} />
            <Text style={[styles.feedbackTitle, { color: '#B45309' }]}>Areas to Improve</Text>
          </View>
          {score.areasToImprove.map((a, i) => (
            <Text key={i} style={styles.feedbackItem}>• {a}</Text>
          ))}
        </View>

        {/* Passing threshold */}
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Employer threshold</Text>
          <Text style={[styles.thresholdValue, { color: passed ? '#16A34A' : '#EF4444' }]}>
            {session.passingScore}% — {passed ? '✓ Passed' : '✗ Not met'}
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaStack}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.85}>
            <Text style={styles.retakeText}>Retake Interview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={styles.shareText}>Share with Employer</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  sectionLabel: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 2, fontWeight: '500' },
  reportRole: { fontSize: 14, fontWeight: '700', color: '#0A0A0A', textAlign: 'center', marginBottom: 20 },

  overallLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center', letterSpacing: 0.8, marginBottom: 12 },
  gaugeWrap: { alignItems: 'center', marginBottom: 16 },

  verdictCard: {
    borderLeftWidth: 4, backgroundColor: '#F8F7FF',
    borderRadius: 12, padding: 16, marginBottom: 28,
  },
  verdictText: { fontSize: 14, color: '#444444', lineHeight: 21, textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0A0A0A', marginBottom: 18 },

  feedbackCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  strengthCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  improveCard:  { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  feedbackTitle: { fontSize: 15, fontWeight: '700' },
  feedbackItem: { fontSize: 13, color: '#444444', lineHeight: 22, marginLeft: 4 },

  thresholdRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8F7FF', borderRadius: 12, padding: 14, marginVertical: 20,
  },
  thresholdLabel: { fontSize: 13, color: '#666666' },
  thresholdValue: { fontSize: 14, fontWeight: '800' },

  ctaStack: { gap: 12 },
  retakeBtn: {
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8',
    alignItems: 'center', justifyContent: 'center',
  },
  retakeText: { fontSize: 16, fontWeight: '600', color: '#0A0A0A' },
  shareBtn: {
    height: 52, backgroundColor: '#4F46E5', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(79,70,229,0.3)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    }),
  },
  shareText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
