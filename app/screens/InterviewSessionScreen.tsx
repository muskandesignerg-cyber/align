/**
 * InterviewSessionScreen — Round 3 live AI interview.
 * Shows AI question, pulsing mic button, waveform, timer.
 * Web: uses browser SpeechRecognition API.
 * Matches reference image 2 (AI Interviewer session).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Alert, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mic } from 'lucide-react-native';
import { InterviewAnswer, InterviewSession } from '../types/assessment';
import { scoreInterviewAnswers } from '../lib/assessmentAI';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'InterviewSession'>;

// ── Waveform bars ─────────────────────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  const bars = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (!active) { bars.forEach(b => Animated.timing(b, { toValue: 0.3, duration: 300, useNativeDriver: true }).start()); return; }
    const animations = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, { toValue: 0.3 + Math.random() * 0.7, duration: 200 + i * 20, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.2, duration: 200 + i * 15, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={wave.container}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={[wave.bar, { transform: [{ scaleY: b }] }]}
        />
      ))}
    </View>
  );
}

const wave = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', height: 40, gap: 3 },
  bar: { width: 4, height: 36, borderRadius: 2, backgroundColor: '#4F46E5', opacity: 0.7 },
});

// ── Pulsing mic ring ──────────────────────────────────────────────────────────

function PulsingMic({ recording, onPress }: { recording: boolean; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!recording) { pulse.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [recording]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={mic.wrap}>
      {/* outer ring */}
      <Animated.View style={[mic.ring, { transform: [{ scale: pulse }] }]} />
      {/* button */}
      <View style={[mic.btn, recording && mic.btnActive]}>
        <Mic size={28} color="#FFFFFF" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const mic = StyleSheet.create({
  wrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: 'rgba(79,70,229,0.25)',
  },
  btn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(79,70,229,0.4)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    }),
  },
  btnActive: { backgroundColor: '#E63946' },
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function InterviewSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { session } = params;

  const questions  = session.questions;
  const totalQ     = questions.length;
  const timeSecs   = session.timeLimit * 60;

  const [qIndex,      setQIndex]      = useState(0);
  const [recording,   setRecording]   = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [answers,     setAnswers]      = useState<InterviewAnswer[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(timeSecs);
  const [submitting,  setSubmitting]  = useState(false);
  const recStart = useRef<number>(0);

  // Web speech recognition
  const recognizerRef = useRef<any>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(p => {
        if (p <= 1) { clearInterval(t); handleFinish(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // ── Speech recognition ────────────────────────────────────────────────────

  const startRecording = () => {
    setRecording(true);
    setTranscript('');
    recStart.current = Date.now();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';
        recognizer.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          setTranscript(fullText);
        };
        recognizer.start();
        recognizerRef.current = recognizer;
        return;
      }
    }
    // Native / unsupported: show placeholder
    setTranscript('Listening… (speak your answer)');
  };

  const stopRecording = () => {
    setRecording(false);
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const saveAnswer = useCallback(() => {
    const duration = Math.round((Date.now() - recStart.current) / 1000);
    const answer: InterviewAnswer = {
      questionId: questions[qIndex].id,
      transcript: transcript || '(No response given)',
      durationSeconds: duration,
    };
    return [...answers, answer];
  }, [answers, qIndex, questions, transcript]);

  const goNext = () => {
    const updated = saveAnswer();
    setAnswers(updated);
    if (qIndex < totalQ - 1) {
      setQIndex(i => i + 1);
      setTranscript('');
      setRecording(false);
    } else {
      handleFinish(updated);
    }
  };

  const handleFinish = useCallback(async (finalAnswers?: InterviewAnswer[]) => {
    if (submitting) return;
    setSubmitting(true);
    const ans = finalAnswers ?? saveAnswer();
    stopRecording();

    const qaPairs = ans.map(a => ({
      question: questions.find(q => q.id === a.questionId)?.text ?? '',
      answer: a.transcript,
    }));

    const score = await scoreInterviewAnswers(session.roleTitle, qaPairs);
    const passed = score.overall >= session.passingScore;

    navigation.replace('InterviewResult', {
      result: {
        sessionId: session.id,
        answers: ans,
        score,
        passed,
        completedAt: new Date().toISOString(),
      },
      session,
    });
  }, [submitting, session, questions, navigation]);

  const confirmEnd = () => {
    Alert.alert('End Interview?', 'Your current answers will be scored.', [
      { text: 'Continue', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => handleFinish() },
    ]);
  };

  const q = questions[qIndex];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roleTag}>{session.roleTitle.toUpperCase()}</Text>
        <Text style={styles.timer}>{timerStr}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>

        {/* Question bubble */}
        <View style={styles.questionBubble}>
          <Text style={styles.questionText}>"{q?.text}"</Text>
        </View>

        {/* Mic button */}
        <View style={styles.micSection}>
          <PulsingMic recording={recording} onPress={toggleRecording} />
          <Text style={styles.micLabel}>AI Interviewer</Text>
        </View>

        {/* Transcript / waveform */}
        <View style={styles.listenSection}>
          {recording ? (
            <>
              <Text style={styles.listenLabel}>✨ Listening…</Text>
              <WaveformBars active={recording} />
            </>
          ) : transcript ? (
            <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </ScrollView>
          ) : (
            <Text style={styles.listenHint}>Tap the mic to start answering</Text>
          )}
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {questions.map((_, i) => (
            <View key={i} style={[styles.dot, i <= qIndex && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.endBtn} onPress={confirmEnd} activeOpacity={0.7}>
          <Text style={styles.endText}>↩ End Interview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, submitting && { opacity: 0.6 }]}
          onPress={goNext}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {qIndex === totalQ - 1 ? 'Submit' : `Next (${qIndex + 1}/${totalQ})`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  roleTag: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, flex: 1 },
  timer: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },

  body: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 },

  questionBubble: {
    backgroundColor: '#F8F7FF', borderRadius: 20,
    padding: 24, marginBottom: 36, width: '100%',
  },
  questionText: {
    fontSize: 20, fontWeight: '700', color: '#0A0A0A',
    lineHeight: 28, textAlign: 'center',
  },

  micSection: { alignItems: 'center', marginBottom: 24 },
  micLabel: { marginTop: 8, fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  listenSection: {
    alignItems: 'center', width: '100%',
    minHeight: 60, justifyContent: 'center', marginBottom: 20,
  },
  listenLabel: { fontSize: 14, color: '#666666', fontWeight: '500', marginBottom: 8 },
  listenHint: { fontSize: 14, color: '#C0C0C0', fontStyle: 'italic' },
  transcriptScroll: { maxHeight: 120, width: '100%' },
  transcriptText: { fontSize: 14, color: '#444444', lineHeight: 22, textAlign: 'center' },

  dots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8E8E8' },
  dotActive: { backgroundColor: '#4F46E5' },

  bottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  endBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12,
  },
  endText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  nextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
