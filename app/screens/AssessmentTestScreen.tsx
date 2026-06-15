/**
 * AssessmentTestScreen — Round 2 MCQ test.
 * Timer countdown, progress bar, 4-option radio MCQ.
 * Auto-submits when timer hits 0.
 * Matches reference image 2.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { Assessment, AssessmentQuestion } from '../types/assessment';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'AssessmentTest'>;

export default function AssessmentTestScreen() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { assessment } = params;

  const total    = assessment.questions.length;
  const timeSecs = assessment.timeLimit * 60;

  const [currentIndex, setCurrentIndex]   = useState(0);
  const [answers,       setAnswers]        = useState<(number | null)[]>(Array(total).fill(null));
  const [selected,      setSelected]       = useState<number | null>(null);
  const [secondsLeft,   setSecondsLeft]    = useState(timeSecs);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fade animation between questions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Timer ──────────────────────────────────────────────────────────────────

  const submitAssessment = useCallback((finalAnswers: (number | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const questions = assessment.questions;
    let correct = 0;
    finalAnswers.forEach((ans, i) => { if (ans === questions[i].correctIndex) correct++; });
    const score = Math.round((correct / total) * 100);
    const passed = score >= assessment.passingScore;
    navigation.replace('AssessmentResult', {
      passed,
      score,
      correct,
      total,
      roleTitle:   assessment.roleTitle,
      companyName: assessment.companyName,
      assessment,
      answers: finalAnswers,
    });
  }, [assessment, navigation, total]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitAssessment(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timerCritical = secondsLeft < 300; // < 5 min

  // ── Navigation ─────────────────────────────────────────────────────────────

  const question: AssessmentQuestion = assessment.questions[currentIndex];
  const progress = (currentIndex + 1) / total;

  const goNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;
    setAnswers(newAnswers);

    if (currentIndex === total - 1) {
      submitAssessment(newAnswers);
      return;
    }

    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setCurrentIndex(i => i + 1);
      setSelected(answers[currentIndex + 1]);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const goSkip = () => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = null;
    setAnswers(newAnswers);
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
      setSelected(null);
    }
  };

  const confirmExit = () => {
    Alert.alert('Exit Assessment?', 'Your progress will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitBtn} activeOpacity={0.7}>
          <X size={20} color="#666666" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.questionCount}>
          Question {currentIndex + 1} of {total}
        </Text>

        <View style={[styles.timerBadge, timerCritical && styles.timerBadgeCritical]}>
          <Text style={[styles.timerText, timerCritical && styles.timerTextCritical]}>
            {timerStr}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Question ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Topic pill */}
          {question.topic && (
            <View style={styles.topicPill}>
              <Text style={styles.topicText}>{question.topic}</Text>
            </View>
          )}

          {/* Question text */}
          <Text style={styles.questionText}>{question.text}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => setSelected(i)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={goSkip} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          style={[styles.nextBtn, selected === null && styles.nextBtnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {currentIndex === total - 1 ? 'Submit' : 'Next'}
          </Text>
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 12,
  },
  exitBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center',
  },
  questionCount: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#666666',
  },
  timerBadge: {
    width: 52, height: 32, borderRadius: 999,
    backgroundColor: '#F0F0FF', alignItems: 'center', justifyContent: 'center',
  },
  timerBadgeCritical: { backgroundColor: '#FEF2F2' },
  timerText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  timerTextCritical: { color: '#EF4444' },

  progressTrack: { height: 4, backgroundColor: '#F0F0F0', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#4F46E5', borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 24 },

  topicPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 16,
  },
  topicText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },

  questionText: {
    fontSize: 22, fontWeight: '800', color: '#0A0A0A',
    lineHeight: 30, marginBottom: 28,
  },

  optionsContainer: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16,
    padding: 16, backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.05)',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(79,70,229,0.12)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
    }),
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  radioSelected: { borderColor: '#4F46E5' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
  optionText: { flex: 1, fontSize: 15, color: '#444444', lineHeight: 22 },
  optionTextSelected: { color: '#0A0A0A', fontWeight: '500' },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  skipText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#4F46E5', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  nextBtnDisabled: { backgroundColor: '#C7C8F0', opacity: 0.7 },
  nextText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  nextArrow: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
});
