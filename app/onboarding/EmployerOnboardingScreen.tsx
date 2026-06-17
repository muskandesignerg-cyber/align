import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { useAuth } from '../context/AuthContext';
import { upsertProfile, completeOnboarding } from '../lib/database';
import { OnboardingHeader } from '../components/ui/OnboardingHeader';

const { width: W } = Dimensions.get('window');

// Data
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce',
  'Education', 'Media', 'Manufacturing', 'Consulting',
  'Real Estate', 'Other',
];

const COMPANY_SIZES = [
  { range: '1–10',    label: 'Startup' },
  { range: '11–50',   label: 'Small' },
  { range: '51–200',  label: 'Mid-size' },
  { range: '201–1000', label: 'Large' },
  { range: '1000+',   label: 'Enterprise' },
];

const HIRING_GOALS = [
  'Build a core team', 'Scale engineering', 'Hire for a project',
  'Replace a leaver', 'Expand globally', 'Build diverse teams',
];

type Props = NativeStackScreenProps<OnboardingStackParamList, 'EmployerOnboarding'>;

export const EmployerOnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshProfile, markOnboardingComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<string | null>(null);
  const [companySize, setCompanySize] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  
  const [nameFocused, setNameFocused] = useState(false);
  const [websiteFocused, setWebsiteFocused] = useState(false);

  // Step 2 state
  const [hiringGoals, setHiringGoals] = useState<string[]>([]);

  const toggleGoal = useCallback((goal: string) => {
    setHiringGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  const isValidStep1 = companyName.trim().length >= 2 && industry !== null && companySize !== null;
  const isValidStep2 = hiringGoals.length > 0;

  const handleFinish = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile(user.id, {
        full_name: companyName.trim(),
        role: 'employer',
      });
      await completeOnboarding(user.id);
      await refreshProfile();
    } catch (e) {
      console.warn('[EmployerOnboarding] DB error (using local fallback):', e);
      markOnboardingComplete();
    } finally {
      setSaving(false);
    }
  }, [user, companyName, refreshProfile, markOnboardingComplete]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP BAR — same as job seeker */}
      <OnboardingHeader
        currentStep={step}
        totalSteps={2}
        onBack={() => {
          if (step === 2) setStep(1);
          else navigation.goBack();
        }}
      />

      {/* CONTENT */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <>
              {/* PAGE TITLE */}
              <Text style={styles.title}>Set up your company</Text>
              <Text style={styles.subtitle}>
                Tell candidates who you are so the best ones apply.
              </Text>

              {/* COMPANY NAME */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Company name</Text>
                  <Text style={styles.asterisk}>{' *'}</Text>
                </View>
                <TextInput
                  style={[styles.input, nameFocused && styles.inputFocused]}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor="#C0C4D0"
                  value={companyName}
                  onChangeText={setCompanyName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* WEBSITE */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={[styles.input, websiteFocused && styles.inputFocused]}
                  placeholder="https://yourcompany.com"
                  placeholderTextColor="#C0C4D0"
                  value={website}
                  onChangeText={setWebsite}
                  onFocus={() => setWebsiteFocused(true)}
                  onBlur={() => setWebsiteFocused(false)}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* INDUSTRY */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelUpper}>INDUSTRY</Text>
                  <Text style={styles.asterisk}>{' *'}</Text>
                </View>
                <View style={styles.chipWrap}>
                  {INDUSTRIES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.chip, industry === item && styles.chipActive]}
                      onPress={() => setIndustry(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, industry === item && styles.chipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* COMPANY SIZE */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelUpper}>COMPANY SIZE</Text>
                  <Text style={styles.asterisk}>{' *'}</Text>
                </View>
                <View style={styles.sizeGrid}>
                  {COMPANY_SIZES.map((item) => (
                    <TouchableOpacity
                      key={item.range}
                      style={[styles.sizeCard, companySize === item.range && styles.sizeCardActive]}
                      onPress={() => setCompanySize(item.range)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.sizeRange, companySize === item.range && styles.sizeRangeActive]}>
                        {item.range}
                      </Text>
                      <Text style={[styles.sizeLabel, companySize === item.range && styles.sizeLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              {/* PAGE TITLE */}
              <Text style={styles.title}>What are you hiring for?</Text>
              <Text style={styles.subtitle}>
                We'll prioritize your pipeline based on your goals.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel}>Select all that apply</Text>
                <View style={styles.chipWrap}>
                  {HIRING_GOALS.map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      style={[styles.chip, hiringGoals.includes(goal) && styles.chipActive]}
                      onPress={() => toggleGoal(goal)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, hiringGoals.includes(goal) && styles.chipTextActive]}>
                        {goal}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
            </>
          )}

          {/* Bottom space */}
          <View style={{ height: 32 }} />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* CONTINUE BUTTON — sticky bottom */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.continueBtn, !isValidStep1 && styles.continueBtnOff]}
            onPress={() => {
              if (!isValidStep1) return;
              setStep(2);
            }}
            activeOpacity={isValidStep1 ? 0.8 : 1}
            disabled={!isValidStep1}
          >
            <Text style={[styles.continueBtnText, !isValidStep1 && styles.continueBtnTextOff]}>
              Continue →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueBtn, !isValidStep2 && styles.continueBtnOff]}
            onPress={handleFinish}
            activeOpacity={isValidStep2 ? 0.8 : 1}
            disabled={!isValidStep2 || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.continueBtnText, !isValidStep2 && styles.continueBtnTextOff]}>
                Get Started  ✦
              </Text>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>

    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 36,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  fieldGroup: {
    marginTop: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  labelUpper: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#0A0A0A',
    marginBottom: 12,
    letterSpacing: 0.2,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  asterisk: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C59D7',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F4F6FF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A2E',
    fontFamily: 'PlusJakartaSans_400Regular',
    outlineWidth: 0,
  } as any,
  inputFocused: {
    borderColor: '#4C59D7',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 0,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D7FF',
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#4C59D7',
    borderColor: '#4C59D7',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeCard: {
    width: (W - 48 - 10) / 2,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D7FF',
    borderRadius: 14,
  },
  sizeCardActive: {
    backgroundColor: '#EEF0FF',
    borderColor: '#4C59D7',
    borderWidth: 2,
  },
  sizeRange: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sizeRangeActive: {
    color: '#3B43A7',
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  sizeLabelActive: {
    color: '#4C59D7',
  },
  summaryCard: {
    marginTop: 24, borderRadius: 16, backgroundColor: '#F5F5F7',
    borderWidth: 1, borderColor: '#E8E8E8', padding: 16,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 32 },
  summaryCompany: {
    fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#0A0A0A',
  },
  summaryMeta: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#666666', marginTop: 2,
  },
  bottomSafe: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueBtn: {
    marginHorizontal: 24,
    marginVertical: 16,
    height: 56,
    backgroundColor: '#4C59D7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  continueBtnOff: {
    backgroundColor: '#C7CCF5',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  continueBtnTextOff: {
    opacity: 0.7,
  },
});
