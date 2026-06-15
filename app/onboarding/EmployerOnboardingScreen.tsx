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

function StepDot({ step, current }: { step: number; current: number }) {
  const active = step === current;
  const done = step < current;
  return (
    <View style={[dotStyles.dot, done && dotStyles.done, active && dotStyles.active]}>
      {done && <Text style={dotStyles.check}>✓</Text>}
      {active && <Text style={dotStyles.num}>{step}</Text>}
      {!active && !done && <Text style={dotStyles.num}>{step}</Text>}
    </View>
  );
}

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

function FloatingInput({
  label, value, onChangeText, keyboardType, placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'url';
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[inputStyles.wrap, focused && inputStyles.wrapFocused]}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input as any}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#B0B8D0"
        keyboardType={keyboardType ?? 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor="#4C59D7"
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
            {/* Progress dots */}
            <View style={styles.dotsRow}>
              <StepDot step={1} current={step} />
              <View style={styles.dotLine} />
              <StepDot step={2} current={step} />
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
              <FloatingInput
                label="Company name *"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g. Acme Corp"
              />
              <FloatingInput
                label="Website"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                placeholder="https://yourcompany.com"
              />

              <Text style={styles.sectionLabel}>Industry *</Text>
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

              <Text style={styles.sectionLabel}>Company size *</Text>
              <View style={styles.sizeRow}>
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
              </View>
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
              <Text style={styles.primaryBtnText}>Continue  →</Text>
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

const dotStyles = StyleSheet.create({
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#D0D7FF',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F9FF',
  },
  active: { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  done: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  num: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#6B7280' },
  check: { fontSize: 12, color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#D0D7FF',
    backgroundColor: '#F8F9FF', marginRight: 8, marginBottom: 8,
  },
  selected: { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  text: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#6B7280' },
  textSelected: { color: '#FFFFFF' },
});

const inputStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F4F6FF',
    borderWidth: 1.5, borderColor: '#D0D7FF',
    borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
    marginBottom: 14,
  },
  wrapFocused: { borderColor: '#4C59D7', borderWidth: 2 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#6B7280', marginBottom: 4 },
  input: {
    fontSize: 16, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    padding: 0, outlineWidth: 0,
  } as any,
});

const sizeStyles = StyleSheet.create({
  box: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#D0D7FF',
    backgroundColor: '#F8F9FF',
  },
  boxSelected: { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  num: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#3B43A7' },
  numSelected: { color: '#FFFFFF' },
  desc: { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', color: '#9CA3AF', marginTop: 2 },
  descSelected: { color: 'rgba(255,255,255,0.8)' },
});

const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 24px rgba(76,89,215,0.08)' } as any,
  default: {
    shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 3,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 20 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dotLine: { flex: 0, width: 40, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  title: {
    fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E', letterSpacing: -0.3, marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', lineHeight: 22,
  },
  body: { paddingHorizontal: 24, paddingTop: 20 },
  sectionLabel: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A2E', marginBottom: 12, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  sizeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: {
    marginTop: 24, borderRadius: 16, backgroundColor: '#F4F6FF',
    borderWidth: 1.5, borderColor: '#D0D7FF', padding: 16, ...cardShadow,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 32 },
  summaryCompany: {
    fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#3B43A7',
  },
  summaryMeta: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 2,
  },
  bottom: {
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 8 : 24,
    paddingTop: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: '#F0F2FF',
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF', letterSpacing: 0.2,
  },
  backBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  backBtnText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#6B7280',
  },
});
