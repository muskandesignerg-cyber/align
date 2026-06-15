/**
 * InterviewIntroScreen — Round 3 AI interview intro.
 * Shows role, focus selector (Technical / Behavioural / Full Round),
 * mic permission notice, Begin Interview CTA.
 * Matches reference image 1 (AI Interview Prep).
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mic, AlertTriangle, Play, Briefcase } from 'lucide-react-native';
import { InterviewFocus, InterviewSession } from '../types/assessment';
import { generateInterviewQuestions } from '../lib/assessmentAI';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'InterviewIntro'>;

const FOCUS_OPTIONS: InterviewFocus[] = ['Technical', 'Behavioural', 'Full Round'];

export default function InterviewIntroScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { session } = params;

  const [focus,     setFocus]     = useState<InterviewFocus>('Technical');
  const [loading,   setLoading]   = useState(false);

  const handleBegin = async () => {
    setLoading(true);
    try {
      const questions = await generateInterviewQuestions(
        session.roleTitle,
        [],
        focus,
        8,
      );
      const enrichedSession: InterviewSession = { ...session, focus, questions };
      navigation.replace('InterviewSession', { session: enrichedSession });
    } catch {
      // fallback still works inside generateInterviewQuestions
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0A0A0A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Interview Prep</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>

        {/* Hero */}
        <Text style={styles.heroTitle}>AI Mock Interview</Text>
        <Text style={styles.heroSub}>Practice before the real thing. Get scored on your answers.</Text>

        {/* Role card */}
        <View style={styles.roleCard}>
          <View style={styles.roleIcon}>
            <Briefcase size={18} color="#4F46E5" strokeWidth={2} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleLabel}>TARGET ROLE</Text>
            <Text style={styles.roleTitle}>{session.roleTitle}</Text>
          </View>
        </View>

        {/* Focus selector */}
        <Text style={styles.sectionLabel}>Select Interview Focus</Text>
        <View style={styles.focusRow}>
          {FOCUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.focusBtn, focus === opt && styles.focusBtnActive]}
              onPress={() => setFocus(opt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.focusBtnText, focus === opt && styles.focusBtnTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mic notice */}
        <View style={styles.micNotice}>
          <View style={styles.micNoticeIcon}>
            <Mic size={18} color="#F59E0B" strokeWidth={2} />
          </View>
          <View style={styles.micNoticeText}>
            <Text style={styles.micNoticeTitle}>Microphone Access Required</Text>
            <Text style={styles.micNoticeSub}>
              The AI needs to hear your responses to evaluate your performance accurately.
            </Text>
          </View>
        </View>

        {/* Passing score info */}
        <View style={styles.passingRow}>
          <Text style={styles.passingLabel}>Employer passing threshold:</Text>
          <Text style={styles.passingValue}>{session.passingScore}%</Text>
        </View>

      </View>

      {/* Begin CTA */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.beginBtn, loading && { opacity: 0.7 }]}
          onPress={handleBegin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Play size={18} color="#FFFFFF" strokeWidth={0} fill="#FFFFFF" />
          <Text style={styles.beginText}>{loading ? 'Preparing Questions…' : 'Begin Interview'}</Text>
        </TouchableOpacity>
        <Text style={styles.privacyNote}>🔒 Your audio is not stored after scoring</Text>
      </View>
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

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },

  heroTitle: { fontSize: 28, fontWeight: '800', color: '#0A0A0A', textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 21, marginBottom: 28 },

  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F8F7FF', borderRadius: 16, padding: 16, marginBottom: 28,
  },
  roleIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(79,70,229,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 2 },
  roleTitle: { fontSize: 17, fontWeight: '800', color: '#0A0A0A', lineHeight: 22 },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', marginBottom: 12 },
  focusRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  focusBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  focusBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  focusBtnText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  focusBtnTextActive: { color: '#FFFFFF' },

  micNotice: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 20,
  },
  micNoticeIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  micNoticeText: { flex: 1 },
  micNoticeTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 2 },
  micNoticeSub: { fontSize: 12, color: '#78350F', lineHeight: 18 },

  passingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0F0FF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  passingLabel: { fontSize: 13, color: '#666666' },
  passingValue: { fontSize: 16, fontWeight: '800', color: '#4F46E5' },

  actions: { paddingHorizontal: 24, paddingBottom: 20, gap: 10, alignItems: 'center' },
  beginBtn: {
    width: '100%', height: 56, backgroundColor: '#4F46E5', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(79,70,229,0.35)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    }),
  },
  beginText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  privacyNote: { fontSize: 12, color: '#9CA3AF' },
});
