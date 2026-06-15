import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { usePostRole } from '../../../context/PostRoleContext';
import { generateSkillSuggestions } from '../../../lib/groq';
import DepartmentGrid from './DepartmentGrid';
import LocationSetupCard from './LocationSetupCard';
import DualRangeSlider from './DualRangeSlider';
import { formatSalaryRange } from '../../../utils/salaryFormatter';

const EMP_TYPES = ['Full Time', 'Part Time', 'Contract'] as const;

interface RoleBasicsStepProps {
  onContinue: (suggestedSkills?: string[]) => void;
}

export default function RoleBasicsStep({ onContinue }: RoleBasicsStepProps) {
  const { state, dispatch } = usePostRole();
  const s = state.step1;
  const [titleFocused, setTitleFocused] = useState(false);
  const [titleError, setTitleError] = useState('');

  const isValid = s.jobTitle.trim().length > 0;

  const handleAISuggest = async () => {
    if (!s.jobTitle.trim()) {
      setTitleError('Please enter a job title first');
      return;
    }
    setTitleError('');
    dispatch({ type: 'SET_AI_LOADING', value: true });
    try {
      const skills = await generateSkillSuggestions(s.jobTitle.trim());
      // Pre-populate required skills in Step 2 and continue
      if (skills.length > 0) {
        skills.forEach((sk) => dispatch({ type: 'ADD_REQUIRED_SKILL', skill: sk }));
      }
      onContinue(skills);
    } catch {
      // Fallback — still continue
      onContinue([]);
    } finally {
      dispatch({ type: 'SET_AI_LOADING', value: false });
    }
  };

  const handleContinue = () => {
    if (!isValid) { setTitleError('Please enter a job title first'); return; }
    setTitleError('');
    onContinue();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>Role Basics</Text>
        <Text style={styles.pageSubtitle}>
          Let's start with the fundamental details of the position you're looking to fill.
        </Text>

        {/* Job Title */}
        <Text style={styles.sectionLabel}>Job Title</Text>
        <TextInput
          style={[styles.input, titleFocused && styles.inputFocused, titleError ? styles.inputError : null]}
          value={s.jobTitle}
          onChangeText={(v) => {
            dispatch({ type: 'UPDATE_STEP1', partial: { jobTitle: v } });
            if (titleError) setTitleError('');
          }}
          placeholder="e.g. Senior Frontend Engineer"
          placeholderTextColor="#6B7280"
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
        />
        {!!titleError && <Text style={styles.errorText}>{titleError}</Text>}

        {/* AI suggest chip */}
        <TouchableOpacity
          style={styles.aiChip}
          onPress={handleAISuggest}
          activeOpacity={0.8}
          disabled={s.aiSuggestionsLoading}
        >
          {s.aiSuggestionsLoading ? (
            <>
              <ActivityIndicator size="small" color="#4C59D7" />
              <Text style={styles.aiChipText}>Generating...</Text>
            </>
          ) : (
            <>
              <Text style={styles.aiSparkle}>✦</Text>
              <Text style={styles.aiChipText}>Let AI suggest skills for this role</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Department */}
        <Text style={styles.sectionLabel}>Department</Text>
        <DepartmentGrid
          selected={s.department}
          onSelect={(dept) => dispatch({ type: 'UPDATE_STEP1', partial: { department: dept } })}
        />

        {/* Employment Type */}
        <Text style={styles.sectionLabel}>Employment Type</Text>
        <View style={styles.pillRow}>
          {EMP_TYPES.map((t) => {
            const active = s.employmentType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => dispatch({ type: 'UPDATE_STEP1', partial: { employmentType: t } })}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location setup */}
        <View style={styles.locationWrap}>
          <LocationSetupCard
            workModel={s.workModel}
            officeLocation={s.officeLocation}
            onWorkModelChange={(m) => dispatch({ type: 'UPDATE_STEP1', partial: { workModel: m } })}
            onLocationChange={(v) => dispatch({ type: 'UPDATE_STEP1', partial: { officeLocation: v } })}
          />
        </View>

        {/* Target Salary Range */}
        <View style={styles.salaryHeader}>
          <Text style={styles.sectionLabel}>Target Salary Range</Text>
          <Text style={styles.salaryValue}>{formatSalaryRange(s.salaryMin, s.salaryMax)}</Text>
        </View>
        <DualRangeSlider
          min={s.salaryMin}
          max={s.salaryMax}
          onMinChange={(v) => dispatch({ type: 'UPDATE_STEP1', partial: { salaryMin: v } })}
          onMaxChange={(v) => dispatch({ type: 'UPDATE_STEP1', partial: { salaryMax: v } })}
        />

        <View style={styles.divider} />

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled, isValid && btnShadow]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!isValid}
        >
          <Text style={styles.continueBtnText}>Continue to Step 2</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const btnShadow = Platform.select({
  web: { boxShadow: '0px 8px 20px rgba(76,89,215,0.30)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  pageSubtitle: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', marginTop: 8, lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7', marginTop: 24, marginBottom: 10,
  },
  input: {
    height: 52, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 12, paddingHorizontal: 16,
    fontSize: 16, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    outlineWidth: 0,
  } as any,
  inputFocused: { borderWidth: 1.5, borderColor: '#4C59D7' },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#EF4444', marginTop: 4 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginTop: 10, gap: 6,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  aiSparkle: { fontSize: 14, color: '#4C59D7' },
  aiChipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF', borderRadius: 20,
  },
  pillActive: { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  pillText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A1A2E' },
  pillTextActive: { color: '#FFFFFF' },
  locationWrap: { marginTop: 24 },
  salaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  salaryValue: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginTop: 24 },
  continueBtn: {
    marginTop: 24, height: 56, borderRadius: 16,
    backgroundColor: '#4C59D7', alignItems: 'center', justifyContent: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#849CFF' },
  continueBtnText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' },
});
