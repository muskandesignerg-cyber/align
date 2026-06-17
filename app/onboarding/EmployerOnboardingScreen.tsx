import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { useAuth } from '../context/AuthContext';
import { upsertProfile, completeOnboarding } from '../lib/database';
import { Ionicons } from '@expo/vector-icons';

// Data
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare',
  'E-commerce', 'Education', 'Media',
  'Manufacturing', 'Consulting',
  'Real Estate', 'Other',
];

const COMPANY_SIZES = [
  { range: '1-10',    label: 'Startup' },
  { range: '11-50',   label: 'Small' },
  { range: '51-200',  label: 'Mid-size' },
  { range: '201-1000', label: 'Large' },
  { range: '1000+',   label: 'Enterprise' },
];

const HIRING_GOALS = [
  'Build a core team', 'Scale engineering', 'Hire for a project',
  'Replace a leaver', 'Expand globally', 'Build diverse teams',
];

type Props = NativeStackScreenProps<OnboardingStackParamList, 'EmployerOnboarding'>;

export const EmployerOnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshProfile, markOnboardingComplete } = useAuth();
  const insets = useSafeAreaInsets();
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

  // Inline header matching exact spec
  const renderHeader = () => (
    <View style={[styles.header, { marginTop: insets.top }]}>
      <TouchableOpacity
        onPress={() => {
          if (step === 2) setStep(1);
          else navigation.goBack();
        }}
        style={styles.headerBtnLeft}
      >
        <Ionicons name="arrow-back" size={22} color="#0A0A0A" />
      </TouchableOpacity>

      <View style={styles.progressPills}>
        {[1, 2, 3].map((pillIndex) => (
          <View
            key={pillIndex}
            style={[
              styles.pill,
              pillIndex <= step ? styles.pillActive : styles.pillInactive
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          if (step === 1) setStep(2);
          else handleFinish();
        }}
        style={styles.headerBtnRight}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Frame constraint container */}
      <View style={styles.screenContainer}>
        {renderHeader()}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && (
              <>
                <Text style={styles.heading}>Set up your company</Text>
                <Text style={styles.subtitle}>
                  Tell candidates who you are so the best ones apply.
                </Text>

                {/* COMPANY NAME */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={styles.labelText}>Company name</Text>
                    <Text style={styles.asterisk}> *</Text>
                  </View>
                  <TextInput
                    style={[styles.input, nameFocused && styles.inputFocused]}
                    placeholder="e.g. Acme Corp"
                    placeholderTextColor="#AAAAAA"
                    value={companyName}
                    onChangeText={setCompanyName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCorrect={false}
                  />
                </View>

                {/* WEBSITE */}
                <View style={styles.section}>
                  <Text style={styles.labelText}>Website</Text>
                  <TextInput
                    style={[styles.input, websiteFocused && styles.inputFocused, { marginTop: 8 }]}
                    placeholder="https://yourcompany.com"
                    placeholderTextColor="#AAAAAA"
                    value={website}
                    onChangeText={setWebsite}
                    onFocus={() => setWebsiteFocused(true)}
                    onBlur={() => setWebsiteFocused(false)}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* INDUSTRY */}
                <View style={[styles.section, { marginTop: 4 }]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.labelUpper}>INDUSTRY</Text>
                    <Text style={styles.asterisk}> *</Text>
                  </View>
                  <View style={styles.chipWrap}>
                    {INDUSTRIES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[styles.chip, industry === item && styles.chipSelected]}
                        onPress={() => setIndustry(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, industry === item && styles.chipTextSelected]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* COMPANY SIZE */}
                <View style={[styles.section, { marginBottom: 0 }]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.labelUpper}>COMPANY SIZE</Text>
                    <Text style={styles.asterisk}> *</Text>
                  </View>
                  <View style={styles.sizeCardsWrap}>
                    {COMPANY_SIZES.map((item) => {
                      const isSelected = companySize === item.range;
                      return (
                        <TouchableOpacity
                          key={item.range}
                          style={[styles.sizeCard, isSelected && styles.sizeCardSelected]}
                          onPress={() => setCompanySize(item.range)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.sizeCardLeft}>
                            <Text style={styles.sizeRange}>{item.range}</Text>
                            <Text style={styles.sizeLabel}>{item.label}</Text>
                          </View>
                          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.heading}>What are you hiring for?</Text>
                <Text style={styles.subtitle}>
                  We'll prioritize your pipeline based on your goals.
                </Text>

                <View style={styles.section}>
                  <Text style={styles.labelUpper}>Select all that apply</Text>
                  <View style={[styles.chipWrap, { marginTop: 12 }]}>
                    {HIRING_GOALS.map((goal) => (
                      <TouchableOpacity
                        key={goal}
                        style={[styles.chip, hiringGoals.includes(goal) && styles.chipSelected]}
                        onPress={() => toggleGoal(goal)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, hiringGoals.includes(goal) && styles.chipTextSelected]}>
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* BOTTOM CTA */}
        <View style={[styles.bottomCTA, { paddingBottom: Math.max(insets.bottom, 28) }]}>
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.continueBtn, !isValidStep1 && styles.continueBtnDisabled]}
              onPress={() => {
                if (isValidStep1) setStep(2);
              }}
              activeOpacity={isValidStep1 ? 0.8 : 1}
              disabled={!isValidStep1}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.continueBtn, (!isValidStep2 || saving) && styles.continueBtnDisabled]}
              onPress={handleFinish}
              activeOpacity={isValidStep2 ? 0.8 : 1}
              disabled={!isValidStep2 || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.continueBtnText}>Finish Setup</Text>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerBtnLeft: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerBtnRight: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  progressPills: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  pill: {
    width: 24,
    height: 4,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: '#4F46E5',
  },
  pillInactive: {
    backgroundColor: '#EBEBEB',
  },
  skipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 100, // Make room for bottom CTA
  },
  heading: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: '#0A0A0A',
    lineHeight: 32.5, // 1.25
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#888888',
    lineHeight: 21, // 150%
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  labelUpper: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  asterisk: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0A0A0A',
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#FAFAFE',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#4F46E5',
    borderWidth: 0,
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
  },
  chipTextSelected: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sizeCardsWrap: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  sizeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 14,
  },
  sizeCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F8F8FF',
  },
  sizeCardLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  sizeRange: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  sizeLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#888888',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#4F46E5',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
