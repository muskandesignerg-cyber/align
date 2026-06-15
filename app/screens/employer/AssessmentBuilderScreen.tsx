/**
 * AssessmentBuilderScreen — Employer side Round 2 builder.
 * AI Generate mode: Groq builds 10-15 MCQs from role/skills.
 * Manual mode: employer adds own questions.
 * Employer sets passing score + time limit.
 * "Send Assessment" fires the assessment to the candidate.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft, Sparkles, PlusCircle, Trash2,
  ChevronDown, ChevronUp, Send, CheckCircle2,
} from 'lucide-react-native';
import { generateMCQQuestions } from '../../lib/assessmentAI';
import { AssessmentQuestion, Assessment } from '../../types/assessment';
import type { EmployerStackParamList } from '../../navigation/EmployerNavigator';

type Nav   = NativeStackNavigationProp<EmployerStackParamList>;
type Route = RouteProp<EmployerStackParamList, 'AssessmentBuilder'>;

type BuilderMode = 'ai' | 'manual';

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Question card (collapsible) ───────────────────────────────────────────────

function QuestionCard({
  q, index, onDelete,
}: { q: AssessmentQuestion; index: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={card.wrap}>
      <TouchableOpacity style={card.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={card.num}><Text style={card.numText}>{index + 1}</Text></View>
        <Text style={card.question} numberOfLines={expanded ? undefined : 2}>{q.text}</Text>
        <View style={card.actions}>
          <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={card.deleteBtn}>
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
          {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={card.body}>
          {q.options.map((opt, i) => (
            <View key={i} style={[card.option, i === q.correctIndex && card.optionCorrect]}>
              <Text style={[card.optionLetter, i === q.correctIndex && card.optionLetterCorrect]}>
                {String.fromCharCode(65 + i)}
              </Text>
              <Text style={[card.optionText, i === q.correctIndex && card.optionTextCorrect]}>{opt}</Text>
              {i === q.correctIndex && <CheckCircle2 size={14} color="#4F46E5" style={{ marginLeft: 'auto' }} />}
            </View>
          ))}
          {q.explanation && (
            <View style={card.explanation}>
              <Text style={card.explanationText}>💡 {q.explanation}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 10, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  question: { flex: 1, fontSize: 14, color: '#0A0A0A', lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  deleteBtn: { padding: 4 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  option: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
  optionCorrect: { borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.05)' },
  optionLetter: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E8E8E8', textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700', color: '#666666' },
  optionLetterCorrect: { backgroundColor: '#4F46E5', color: '#FFFFFF' },
  optionText: { flex: 1, fontSize: 13, color: '#444444', lineHeight: 19 },
  optionTextCorrect: { color: '#0A0A0A', fontWeight: '500' },
  explanation: { backgroundColor: '#F8F7FF', borderRadius: 10, padding: 10, marginTop: 4 },
  explanationText: { fontSize: 12, color: '#666666', lineHeight: 18 },
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AssessmentBuilderScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { candidate, job } = params;

  const [mode,         setMode]         = useState<BuilderMode>('ai');
  const [questions,    setQuestions]    = useState<AssessmentQuestion[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [timeLimitStr, setTimeLimitStr] = useState('30');
  const [passingStr,   setPassingStr]   = useState('70');
  const [aiCount,      setAiCount]      = useState('15');
  const [sent,         setSent]         = useState(false);

  // Manual form
  const [manualQ,  setManualQ]  = useState('');
  const [optA,     setOptA]     = useState('');
  const [optB,     setOptB]     = useState('');
  const [optC,     setOptC]     = useState('');
  const [optD,     setOptD]     = useState('');
  const [correct,  setCorrect]  = useState<0|1|2|3>(0);

  // ── AI generation ─────────────────────────────────────────────────────────

  const handleAIGenerate = async () => {
    setLoading(true);
    try {
      const qs = await generateMCQQuestions(job.roleTitle, job.skills, Number(aiCount) || 15);
      setQuestions(qs);
    } catch (e) {
      Alert.alert('Generation failed', 'Please try again or switch to Manual mode.');
    } finally {
      setLoading(false);
    }
  };

  // ── Manual add ────────────────────────────────────────────────────────────

  const handleAddManual = () => {
    if (!manualQ.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      Alert.alert('Fill all fields', 'Please complete the question and all 4 options.');
      return;
    }
    const q: AssessmentQuestion = {
      id: uid(),
      text: manualQ.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctIndex: correct,
    };
    setQuestions(prev => [...prev, q]);
    setManualQ(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect(0);
  };

  const deleteQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = () => {
    if (questions.length < 5) {
      Alert.alert('Not enough questions', 'Add at least 5 questions before sending.');
      return;
    }
    const assessment: Assessment = {
      id: uid(),
      jobId: job.id,
      candidateId: candidate.candidateId,
      companyName: job.companyName,
      roleTitle: job.roleTitle,
      skills: job.skills,
      questions,
      timeLimit: Number(timeLimitStr) || 30,
      passingScore: Number(passingStr) || 70,
      createdAt: new Date().toISOString(),
      createdBy: mode,
    };
    setSent(true);
    setTimeout(() => navigation.goBack(), 1800);
    // In a real app, persist to Supabase here and update candidate stage
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <CheckCircle2 size={64} color="#4F46E5" strokeWidth={1.5} />
        <Text style={styles.sentTitle}>Assessment Sent!</Text>
        <Text style={styles.sentSub}>{candidate.candidateName} will receive it shortly.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#0A0A0A" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Assessment Builder</Text>
          <Text style={styles.headerSub}>{candidate.candidateName} · {job.roleTitle}</Text>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, questions.length < 5 && styles.sendBtnDisabled]}
          onPress={handleSend}
          activeOpacity={0.85}
        >
          <Send size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'ai' && styles.modeBtnActive]}
              onPress={() => setMode('ai')}
              activeOpacity={0.7}
            >
              <Sparkles size={16} color={mode === 'ai' ? '#FFFFFF' : '#666666'} strokeWidth={2} />
              <Text style={[styles.modeBtnText, mode === 'ai' && styles.modeBtnTextActive]}>AI Generate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
              onPress={() => setMode('manual')}
              activeOpacity={0.7}
            >
              <PlusCircle size={16} color={mode === 'manual' ? '#FFFFFF' : '#666666'} strokeWidth={2} />
              <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>Manual Build</Text>
            </TouchableOpacity>
          </View>

          {/* Settings row */}
          <View style={styles.settingsRow}>
            <View style={styles.settingField}>
              <Text style={styles.settingLabel}>Time Limit (min)</Text>
              <TextInput
                style={styles.settingInput}
                value={timeLimitStr}
                onChangeText={setTimeLimitStr}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.settingField}>
              <Text style={styles.settingLabel}>Passing Score (%)</Text>
              <TextInput
                style={styles.settingInput}
                value={passingStr}
                onChangeText={setPassingStr}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            {mode === 'ai' && (
              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Questions</Text>
                <TextInput
                  style={styles.settingInput}
                  value={aiCount}
                  onChangeText={setAiCount}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            )}
          </View>

          {/* AI mode */}
          {mode === 'ai' && (
            <View style={styles.aiSection}>
              <View style={styles.aiInfo}>
                <Text style={styles.aiInfoTitle}>🤖 AI-powered question generation</Text>
                <Text style={styles.aiInfoText}>
                  Groq AI will generate {aiCount} role-specific MCQ questions for <Text style={{ fontWeight: '700' }}>{job.roleTitle}</Text> covering: {job.skills.slice(0, 4).join(', ')}.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.generateBtn, loading && { opacity: 0.7 }]}
                onPress={handleAIGenerate}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
                )}
                <Text style={styles.generateText}>
                  {loading ? 'Generating…' : questions.length > 0 ? 'Regenerate' : 'Generate Questions'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Manual mode form */}
          {mode === 'manual' && (
            <View style={styles.manualForm}>
              <Text style={styles.formLabel}>Question Text</Text>
              <TextInput
                style={styles.textArea}
                value={manualQ}
                onChangeText={setManualQ}
                placeholder="Enter your question…"
                multiline
                numberOfLines={3}
                placeholderTextColor="#C0C0C0"
              />
              {(['A', 'B', 'C', 'D'] as const).map((letter, i) => {
                const vals = [optA, optB, optC, optD];
                const setters = [setOptA, setOptB, setOptC, setOptD];
                return (
                  <View key={letter} style={styles.optionRow}>
                    <TouchableOpacity
                      style={[styles.optionRadio, correct === i && styles.optionRadioActive]}
                      onPress={() => setCorrect(i as 0|1|2|3)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionLetterText, correct === i && { color: '#FFFFFF' }]}>{letter}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.optionInput}
                      value={vals[i]}
                      onChangeText={setters[i]}
                      placeholder={`Option ${letter}`}
                      placeholderTextColor="#C0C0C0"
                    />
                  </View>
                );
              })}
              <Text style={styles.correctHint}>Tap a letter to mark the correct answer</Text>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddManual} activeOpacity={0.85}>
                <PlusCircle size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.addBtnText}>Add Question</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Question list */}
          {questions.length > 0 && (
            <>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{questions.length} Questions</Text>
                <TouchableOpacity onPress={() => setQuestions([])} activeOpacity={0.7}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              {questions.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i} onDelete={() => deleteQuestion(q.id)} />
              ))}
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  sendBtnDisabled: { backgroundColor: '#C0BFEF' },
  sendText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  scroll: { padding: 16, gap: 0 },

  modeToggle: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 6,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: '#4F46E5' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#666666' },
  modeBtnTextActive: { color: '#FFFFFF' },

  settingsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  settingField: { flex: 1 },
  settingLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 6, letterSpacing: 0.5 },
  settingInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: '700', color: '#0A0A0A',
    textAlign: 'center',
  },

  aiSection: { gap: 12, marginBottom: 20 },
  aiInfo: {
    backgroundColor: '#F0F0FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(79,70,229,0.15)',
  },
  aiInfoTitle: { fontSize: 14, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  aiInfoText: { fontSize: 13, color: '#555555', lineHeight: 20 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4F46E5', borderRadius: 14, height: 52,
  },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  manualForm: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, gap: 10,
  },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#444444' },
  textArea: {
    backgroundColor: '#F8F8F8', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8',
    padding: 12, fontSize: 14, color: '#0A0A0A', lineHeight: 21, minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionRadio: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  optionRadioActive: { backgroundColor: '#4F46E5' },
  optionLetterText: { fontSize: 13, fontWeight: '700', color: '#666666' },
  optionInput: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 10,
    borderWidth: 1, borderColor: '#E8E8E8',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0A0A0A',
  },
  correctHint: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0A0A0A', borderRadius: 12, paddingVertical: 12,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  clearText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  sentTitle: { fontSize: 24, fontWeight: '800', color: '#0A0A0A', marginTop: 16, textAlign: 'center' },
  sentSub: { fontSize: 15, color: '#666666', marginTop: 8, textAlign: 'center' },
});
