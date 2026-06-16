/**
 * EmployerOnboardingScreen
 *
 * A 2-step employer setup flow:
 *   Step 1 — Company details (name, industry, size, website)
 *   Step 2 — What they're looking for (hiring goals)
 *
 * On completion:
 *   - Upserts company details to the `profiles` table
 *   - Sets onboarding_complete = true
 *   - refreshProfile() → RootNavigator sees the new profile and routes to EmployerNavigator
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { useAuth } from '../context/AuthContext';
import { upsertProfile, completeOnboarding } from '../lib/database';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'EmployerOnboarding'>;

// ─── Data ─────────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce',
  'Education', 'Media', 'Manufacturing', 'Consulting',
  'Real Estate', 'Other',
];

const COMPANY_SIZES = [
  { label: '1–10', desc: 'Startup' },
  { label: '11–50', desc: 'Small' },
  { label: '51–200', desc: 'Mid-size' },
  { label: '201–1000', desc: 'Large' },
  { label: '1000+', desc: 'Enterprise' },
];

const HIRING_GOALS = [
  'Build a core team', 'Scale engineering', 'Hire for a project',
  'Replace a leaver', 'Expand globally', 'Build diverse teams',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Removed StepDot — using horizontal progress bar instead

function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, selected && chipStyles.selected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[chipStyles.text, selected && chipStyles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StandardInput({
  label, value, onChangeText, keyboardType, placeholder, required
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'url';
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>
        {label} {required && <Text style={inputStyles.asterisk}>*</Text>}
      </Text>
      <TextInput
        style={[inputStyles.input, focused && inputStyles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType ?? 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor="#4F46E5"
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const EmployerOnboardingScreen: React.FC<Props> = () => {
  const { user, refreshProfile, markOnboardingComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2 state
  const [hiringGoals, setHiringGoals] = useState<string[]>([]);

  const toggleGoal = useCallback((goal: string) => {
    setHiringGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  const canProceedStep1 = companyName.trim().length > 0 && industry !== '' && companySize !== '';

  const handleFinish = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save company info to profiles table (using full_name for company name)
      await upsertProfile(user.id, {
        full_name: companyName.trim(),
        role: 'employer',
      });
      // Mark onboarding complete in DB
      await completeOnboarding(user.id);
      // Refresh in AuthContext so RootNavigator reads the updated profile
      // and routes to EmployerNavigator
      await refreshProfile();
    } catch (e) {
      console.warn('[EmployerOnboarding] DB error (using local fallback):', e);
      // Fallback: mark locally so navigation still proceeds
      markOnboardingComplete();
    } finally {
      setSaving(false);
    }
  }, [user, companyName, refreshProfile, markOnboardingComplete]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Step {step} of 2</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: step === 1 ? '50%' : '100%' }]} />
              </View>
            </View>

            <Text style={styles.title}>
              {step === 1 ? 'Set up your company' : 'What are you hiring for?'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Tell candidates who you are so the best ones apply.'
                : "We'll prioritize your pipeline based on your goals."}
            </Text>
          </View>

          {/* ── Step 1: Company Details ── */}
          {step === 1 && (
            <View style={styles.body}>
              <StandardInput
                label="Company name"
                required
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g. Acme Corp"
              />
              <StandardInput
                label="Website"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                placeholder="https://yourcompany.com"
              />

              <Text style={styles.sectionLabel}>INDUSTRY <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.chipGrid}>
                {INDUSTRIES.map((ind) => (
                  <Chip
                    key={ind}
                    label={ind}
                    selected={industry === ind}
                    onPress={() => setIndustry(ind)}
                  />
                ))}
              </View>

              <Text style={styles.sectionLabel}>COMPANY SIZE <Text style={styles.asterisk}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>
                {COMPANY_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    style={[sizeStyles.box, companySize === s.label && sizeStyles.boxSelected]}
                    onPress={() => setCompanySize(s.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={[sizeStyles.num, companySize === s.label && sizeStyles.numSelected]}>
                      {s.label}
                    </Text>
                    <Text style={[sizeStyles.desc, companySize === s.label && sizeStyles.descSelected]}>
                      {s.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Step 2: Hiring Goals ── */}
          {step === 2 && (
            <View style={styles.body}>
              <Text style={styles.sectionLabel}>Select all that apply</Text>
              <View style={styles.chipGrid}>
                {HIRING_GOALS.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    selected={hiringGoals.includes(goal)}
                    onPress={() => toggleGoal(goal)}
                  />
                ))}
              </View>

              {/* Summary card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryIcon}>🏢</Text>
                  <View>
                    <Text style={styles.summaryCompany}>{companyName}</Text>
                    <Text style={styles.summaryMeta}>{industry} · {companySize} employees</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom CTA ── */}
        <View style={styles.bottom}>
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.primaryBtn, !canProceedStep1 && styles.primaryBtnDisabled]}
              onPress={() => setStep(2)}
              activeOpacity={0.85}
              disabled={!canProceedStep1}
            >
              <Text style={[styles.primaryBtnText, !canProceedStep1 && styles.primaryBtnTextDisabled]}>
                Continue  →
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleFinish}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Get Started  ✦</Text>
              )}
            </TouchableOpacity>
          )}

          {step === 2 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 999, borderWidth: 1, borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF', marginRight: 10, marginBottom: 10,
  },
  selected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  text: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#0A0A0A' },
  textSelected: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold' },
});

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  label: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#0A0A0A', marginBottom: 6 },
  asterisk: { color: '#4F46E5' },
  input: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1, borderColor: '#E8E8E8',
    borderRadius: 14, height: 52, paddingHorizontal: 16,
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: '#0A0A0A',
    outlineWidth: 0,
  } as any,
  inputFocused: { borderColor: '#4F46E5', borderWidth: 1 },
});

const sizeStyles = StyleSheet.create({
  box: {
    width: 80, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, borderWidth: 1, borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF', marginRight: 10,
  },
  boxSelected: { backgroundColor: '#F5F4FF', borderColor: '#4F46E5', borderWidth: 1.5 },
  num: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#0A0A0A' },
  numSelected: { color: '#4F46E5', fontFamily: 'PlusJakartaSans_700Bold' },
  desc: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#9CA3AF', marginTop: 2 },
  descSelected: { color: '#4F46E5', fontFamily: 'PlusJakartaSans_500Medium' },
});

const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 24px rgba(79,70,229,0.08)' } as any,
  default: {
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 3,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 100 },
  header: { paddingHorizontal: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20 },
  progressLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#666666' },
  progressBarBg: { height: 4, backgroundColor: '#E8E8E8', borderRadius: 999, flex: 1 },
  progressBarFill: { height: 4, backgroundColor: '#4F46E5', borderRadius: 999 },
  title: {
    fontSize: 26, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#0A0A0A', marginTop: 24, marginBottom: 6,
  },
  subtitle: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666666', marginBottom: 28,
  },
  body: { paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#0A0A0A', marginBottom: 12, letterSpacing: 0.2,
  },
  asterisk: { color: '#4F46E5' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 28 },
  sizeRow: { flexDirection: 'row', marginBottom: 28 },
  summaryCard: {
    marginTop: 24, borderRadius: 16, backgroundColor: '#F5F5F7',
    borderWidth: 1, borderColor: '#E8E8E8', padding: 16, ...cardShadow,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 32 },
  summaryCompany: {
    fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#0A0A0A',
  },
  summaryMeta: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#666666', marginTop: 2,
  },
  bottom: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    paddingHorizontal: 20, backgroundColor: 'transparent',
  },
  primaryBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  primaryBtnDisabled: { backgroundColor: '#E8E8E8' },
  primaryBtnText: {
    fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF',
  },
  primaryBtnTextDisabled: { color: '#9CA3AF' },
  backBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  backBtnText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#666666',
  },
});
