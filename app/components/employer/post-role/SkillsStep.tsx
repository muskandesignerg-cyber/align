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
import { generateJobDescription } from '../../../lib/groq';
import SkillSearchInput from './SkillSearchInput';

interface SkillsStepProps {
  onContinue: () => void;
}

export default function SkillsStep({ onContinue }: SkillsStepProps) {
  const { state, dispatch } = usePostRole();
  const s = state.step2;
  const s1 = state.step1;

  const isValid = s.requiredSkills.length > 0;

  const handleGenerateDesc = async () => {
    dispatch({ type: 'SET_GENERATING_DESCRIPTION', value: true });
    try {
      const text = await generateJobDescription(
        s1.jobTitle,
        s.requiredSkills,
        s.niceToHaveSkills,
        s.yearsOfExperience,
        s1.department ?? 'General',
        s1.workModel,
        s1.salaryMin,
        s1.salaryMax,
      );
      dispatch({ type: 'UPDATE_STEP2', partial: { description: text } });
    } catch {
      // error handled inside generateJobDescription
    } finally {
      dispatch({ type: 'SET_GENERATING_DESCRIPTION', value: false });
    }
  };

  const expLabel = s.yearsOfExperience === 0
    ? '0'
    : s.yearsOfExperience > 10
    ? '10+'
    : `${s.yearsOfExperience}+`;

  const charColor =
    s.description.length > 1800
      ? s.description.length >= 2000
        ? '#EF4444'
        : '#F57C00'
      : '#6B7280';

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
        <Text style={styles.pageTitle}>Skills & Requirements</Text>
        <Text style={styles.pageSubtitle}>Tell us what you're looking for.</Text>

        {/* Required Skills */}
        <Text style={styles.sectionLabel}>Required Skills</Text>
        <SkillSearchInput
          addedSkills={s.requiredSkills}
          onAddSkill={(sk) => dispatch({ type: 'ADD_REQUIRED_SKILL', skill: sk })}
          onRemoveSkill={(sk) => dispatch({ type: 'REMOVE_REQUIRED_SKILL', skill: sk })}
          variant="required"
        />

        {/* Nice to Have */}
        <Text style={styles.sectionLabel}>Nice to Have</Text>
        <SkillSearchInput
          addedSkills={s.niceToHaveSkills}
          onAddSkill={(sk) => dispatch({ type: 'ADD_NICE_TO_HAVE_SKILL', skill: sk })}
          onRemoveSkill={(sk) => dispatch({ type: 'REMOVE_NICE_TO_HAVE_SKILL', skill: sk })}
          variant="nice"
        />

        {/* Years of experience */}
        <Text style={styles.sectionLabel}>Years of experience</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => dispatch({ type: 'DECREMENT_EXPERIENCE' })}
            activeOpacity={0.75}
          >
            <Text style={styles.stepperIcon}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{expLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => dispatch({ type: 'INCREMENT_EXPERIENCE' })}
            activeOpacity={0.75}
          >
            <Text style={styles.stepperIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Role description */}
        <View style={styles.descHeader}>
          <Text style={styles.sectionLabel}>Role description</Text>
          <TouchableOpacity
            onPress={handleGenerateDesc}
            disabled={s.isGeneratingDescription}
            style={styles.generateBtn}
            activeOpacity={0.8}
          >
            {s.isGeneratingDescription ? (
              <ActivityIndicator size="small" color="#4C59D7" />
            ) : (
              <>
                <Text style={styles.generateSparkle}>✦</Text>
                <Text style={styles.generateText}> Generate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.textareaWrap}>
          <TextInput
            style={styles.textarea}
            value={s.description}
            onChangeText={(v) =>
              v.length <= 2000 &&
              dispatch({ type: 'UPDATE_STEP2', partial: { description: v } })
            }
            placeholder="Describe the responsibilities and expectations..."
            placeholderTextColor="#6B7280"
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
          <Text style={[styles.charCount, { color: charColor }]}>
            {s.description.length} / 2000
          </Text>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled, isValid && btnShadow]}
          onPress={onContinue}
          activeOpacity={0.85}
          disabled={!isValid}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const btnShadow = Platform.select({
  web: { boxShadow: '0px 8px 20px rgba(76,89,215,0.30)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  pageSubtitle: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', marginTop: 8,
  },
  sectionLabel: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A2E', marginTop: 24, marginBottom: 12,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#F4F6FF', alignItems: 'center', justifyContent: 'center',
  },
  stepperIcon: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  stepperValue: { width: 60, alignItems: 'center' },
  stepperValueText: { fontSize: 24, fontFamily: 'PlusJakartaSans_700Bold', color: '#3B43A7' },
  descHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24,
  },
  generateBtn: { flexDirection: 'row', alignItems: 'center' },
  generateSparkle: { fontSize: 14, color: '#4C59D7' },
  generateText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
  textareaWrap: {
    marginTop: 10,
    backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 12, padding: 14, minHeight: 160,
  },
  textarea: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1A1A2E', minHeight: 120,
    outlineWidth: 0,
  } as any,
  charCount: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'right', marginTop: 8,
  },
  continueBtn: {
    marginTop: 24, height: 56, borderRadius: 16,
    backgroundColor: '#4C59D7', alignItems: 'center', justifyContent: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#849CFF' },
  continueBtnText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' },
});
