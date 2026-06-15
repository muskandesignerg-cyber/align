/**
 * RolePreferencesScreen — Step 3 of 5
 *
 * Fixes applied:
 *  - Pure #FFFFFF background everywhere (removed Colors.surface lavender)
 *  - Work model cards: white bg, border only — active = purple border, NOT filled
 *  - Work model icons: Ionicons (wifi-outline, grid-outline, business-outline)
 *  - Salary: ₹ symbol, INR lakhs (₹4L–₹20L+) not USD
 *  - Salary slider: custom range slider — single clean track, purple fill between handles
 *  - Industries: expanded list, horizontal scroll, right fade gradient
 *  - Job chips: height 40, radius 10, 14px 600
 *  - Continue: height 52, radius 14, purple shadow, Ionicons arrow-forward
 *  - Bottom bar: borderTop, paddingBottom 28
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
  LayoutChangeEvent,
  PanResponder,
  GestureResponderEvent,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { FontFamily } from '../theme/typography';
import { OnboardingHeader } from '../components/ui/OnboardingHeader';
import { useAuth } from '../context/AuthContext';
import { savePreferences, completeOnboarding, upsertCandidateProfileData } from '../lib/database';
import { useProfileBuilder } from '../context/ProfileBuilderContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RolePreferences'>;
type JobType   = 'Full Time' | 'Part Time' | 'Contract' | 'Freelance';
type WorkModel = 'Remote' | 'Hybrid' | 'On-site';

const JOB_TYPES: JobType[]   = ['Full Time', 'Part Time', 'Contract', 'Freelance'];
const WORK_MODELS: WorkModel[] = ['Remote', 'Hybrid', 'On-site'];

const INDUSTRIES = [
  'Technology', 'Design', 'Fintech', 'Healthcare', 'Education',
  'E-commerce', 'SaaS', 'Media', 'Real Estate',
];

// Ionicons name type fix
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const WORK_MODEL_ICONS: Record<WorkModel, IconName> = {
  Remote:   'wifi-outline',
  Hybrid:   'grid-outline',
  'On-site':'business-outline',
};

// ₹ salary in lakhs
const SALARY_MIN_L = 4;
const SALARY_MAX_L = 20;

const formatSalary = (value: number, isMax: boolean): string => {
  if (isMax && value >= SALARY_MAX_L) return '₹20L+';
  return `₹${value}L`;
};

// ─── Custom Range Slider ──────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  step: number;
  onLowChange:  (v: number) => void;
  onHighChange: (v: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min, max, low, high, step, onLowChange, onHighChange,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);

  const valueToPos = (val: number) =>
    trackWidth > 0 ? ((val - min) / (max - min)) * trackWidth : 0;

  const posToValue = (pos: number) => {
    const raw = (pos / trackWidth) * (max - min) + min;
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const makePanResponder = (isLow: boolean) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        const currentPos = isLow ? valueToPos(low) : valueToPos(high);
        const newPos     = currentPos + gs.dx;
        const newVal     = posToValue(newPos);
        if (isLow) {
          if (newVal < high - step) onLowChange(newVal);
        } else {
          if (newVal > low + step) onHighChange(newVal);
        }
      },
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lowPR  = React.useMemo(() => makePanResponder(true),  [low,  high, trackWidth]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const highPR = React.useMemo(() => makePanResponder(false), [low,  high, trackWidth]);

  const lowPos  = valueToPos(low);
  const highPos = valueToPos(high);

  return (
    <View style={rs.wrap}>
      <View
        style={rs.track}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Gray background track */}
        <View style={rs.trackBg} />
        {/* Purple fill between handles */}
        <View
          style={[
            rs.fill,
            { left: lowPos, width: Math.max(0, highPos - lowPos) },
          ]}
        />
        {/* Low handle */}
        <View
          {...lowPR.panHandlers}
          style={[rs.handle, { left: lowPos - 11 }]}
        />
        {/* High handle */}
        <View
          {...highPR.panHandlers}
          style={[rs.handle, { left: highPos - 11 }]}
        />
      </View>
    </View>
  );
};

const rs = StyleSheet.create({
  wrap:    { width: '100%', marginVertical: 12 },
  track:   { width: '100%', height: 22, justifyContent: 'center', position: 'relative' },
  trackBg: {
    position: 'absolute', left: 0, right: 0,
    height: 4, backgroundColor: '#E0E0E0', borderRadius: 999,
  },
  fill: {
    position: 'absolute',
    height: 4, backgroundColor: '#4F46E5', borderRadius: 999,
  },
  handle: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#4F46E5',
    borderWidth: 3, borderColor: '#FFFFFF',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 4 },
      web:     { boxShadow: '0 2px 8px rgba(79,70,229,0.40)' } as any,
    }),
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const RolePreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshProfile, markOnboardingComplete } = useAuth();
  const { state: profileState } = useProfileBuilder();

  const [selectedJobTypes,   setSelectedJobTypes]   = useState<Set<JobType>>(new Set(['Full Time']));
  const [selectedWorkModel,  setSelectedWorkModel]  = useState<WorkModel>('Remote');
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set(['Design']));
  const [customIndustries,   setCustomIndustries]   = useState<string[]>([]);
  const [customIndustry,     setCustomIndustry]     = useState('');
  const [showCustomInput,    setShowCustomInput]    = useState(false);
  const customInputRef = useRef<TextInput>(null);
  const [salaryMin,          setSalaryMin]          = useState(8);
  const [salaryMax,          setSalaryMax]          = useState(14);
  const [saving,             setSaving]             = useState(false);

  const toggleJobType = (type: JobType) =>
    setSelectedJobTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });

  const toggleIndustry = (industry: string) =>
    setSelectedIndustries((prev) => {
      const next = new Set(prev);
      if (next.has(industry)) { if (next.size > 1) next.delete(industry); }
      else next.add(industry);
      return next;
    });

  const addCustomIndustry = () => {
    const trimmed = customIndustry.trim();
    if (!trimmed) return;
    const already = selectedIndustries.has(trimmed) || customIndustries.includes(trimmed);
    if (!already) {
      setCustomIndustries((prev) => [...prev, trimmed]);
      setSelectedIndustries((prev) => new Set([...prev, trimmed]));
    }
    setCustomIndustry('');
    setShowCustomInput(false);
  };

  const removeCustomIndustry = (name: string) => {
    setCustomIndustries((prev) => prev.filter((c) => c !== name));
    setSelectedIndustries((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    if (user) {
      try {
        await savePreferences(user.id, {
          job_types:  Array.from(selectedJobTypes),
          work_model: selectedWorkModel,
          salary_min: salaryMin,
          salary_max: salaryMax,
          industries: Array.from(selectedIndustries),
        });
      } catch (err: any) { console.warn('Could not save preferences:', err?.message); }

      try {
        await upsertCandidateProfileData(user.id, profileState.profileData);
      } catch (err: any) { console.warn('Could not save profile data:', err?.message); }

      try {
        await completeOnboarding(user.id);
        await refreshProfile();
      } catch (err: any) { console.warn('Could not complete onboarding:', err?.message); }
    }
    markOnboardingComplete();
    setSaving(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <OnboardingHeader
        currentStep={4}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading — scrolls with content */}
        <Text style={styles.heading}>What are you looking for?</Text>

        {/* ── Job Type ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Job Type</Text>
        <View style={styles.chipRow}>
          {JOB_TYPES.map((type) => {
            const active = selectedJobTypes.has(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.jobChip, active && styles.jobChipActive]}
                onPress={() => toggleJobType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.jobChipText, active && styles.jobChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Work Model ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Work Model</Text>
        <View style={styles.workModelRow}>
          {WORK_MODELS.map((model) => {
            const active = selectedWorkModel === model;
            return (
              <TouchableOpacity
                key={model}
                style={[styles.workModelCard, active && styles.workModelCardActive]}
                onPress={() => setSelectedWorkModel(model)}
                activeOpacity={0.8}
              >
                <Text style={[styles.workModelLabel, active && styles.workModelLabelActive]}>
                  {model}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Salary Base ───────────────────────────────────────────────── */}
        <View style={[styles.salaryCard, { marginTop: 28 }]}>
          <View style={styles.salaryHeaderRow}>
            <Text style={styles.salaryTitle}>Salary Base</Text>
            <Text style={styles.salaryValue}>
              {formatSalary(salaryMin, false)} – {formatSalary(salaryMax, true)}
            </Text>
          </View>

          <RangeSlider
            min={SALARY_MIN_L}
            max={SALARY_MAX_L}
            low={salaryMin}
            high={salaryMax}
            step={1}
            onLowChange={setSalaryMin}
            onHighChange={setSalaryMax}
          />

          <View style={styles.salaryLabels}>
            <Text style={styles.salaryRangeLabel}>₹4L</Text>
            <Text style={styles.salaryRangeLabel}>₹20L+</Text>
          </View>
        </View>

        {/* ── Preferred Industries ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Preferred Industries</Text>
        <View style={styles.industriesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.industriesRow}
          >
            {INDUSTRIES.map((industry) => {
              const active = selectedIndustries.has(industry);
              return (
                <TouchableOpacity
                  key={industry}
                  style={[styles.industryChip, active && styles.industryChipActive]}
                  onPress={() => toggleIndustry(industry)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.industryChipText, active && styles.industryChipTextActive]}>
                    {industry}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom industry chips — purple filled with X */}
            {customIndustries.map((name) => (
              <View key={name} style={[styles.industryChip, styles.industryChipActive, { flexDirection: 'row', gap: 6, paddingRight: 10 }]}>
                <Text style={styles.industryChipTextActive}>{name}</Text>
                <TouchableOpacity
                  onPress={() => removeCustomIndustry(name)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={12} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Dashed + Custom chip — always last */}
            <TouchableOpacity
              style={styles.customAddChip}
              onPress={() => {
                setShowCustomInput(true);
                setTimeout(() => customInputRef.current?.focus(), 80);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color="#4F46E5" />
              <Text style={styles.customAddChipText}>Custom</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Right fade */}
          <LinearGradient
            colors={['transparent', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.industriesFade}
            pointerEvents="none"
          />
        </View>

        {/* Custom industry input — appears after tapping + Custom */}
        {showCustomInput && (
          <View style={styles.customInputRow}>
            <TextInput
              ref={customInputRef}
              style={styles.customIndustryInput}
              value={customIndustry}
              onChangeText={setCustomIndustry}
              placeholder="e.g. Gaming, CleanTech..."
              placeholderTextColor="#BBBBBB"
              onSubmitEditing={addCustomIndustry}
              returnKeyType="done"
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.addIndustryBtn, !customIndustry.trim() && { backgroundColor: '#A5B4FC' }]}
              onPress={addCustomIndustry}
              disabled={!customIndustry.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.addIndustryBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Spacer for fixed bottom bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom CTA bar ─────────────────────────────────────────────── */}
      <View style={styles.bottomSection}>
        {saving ? (
          <View style={styles.continueButton}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.continueButtonText}>Finishing setup...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.disclaimer}>
          You can change these anytime in your profile
        </Text>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex:      { flex: 1 },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 160,
  },

  // ── Heading ──────────────────────────────────────────────────────────────
  heading: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#0A0A0A',
    lineHeight: 32,
    marginBottom: 28,
  },

  // ── Section titles ────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0A0A0A',
    marginBottom: 12,
  },

  // ── Job Type chips ───────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  jobChip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 8px rgba(79,70,229,0.25)' } as any,
    }),
  },
  jobChipText:       { fontSize: 14, fontFamily: FontFamily.semiBold, color: '#555555' },
  jobChipTextActive: { color: '#FFFFFF' },

  // ── Work Model cards ──────────────────────────────────────────────────────
  workModelRow: { flexDirection: 'row', gap: 10 },

  workModelCard: {
    flex: 1,
    height: 88,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workModelCardActive: {
    borderWidth: 2,
    borderColor: '#4F46E5',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 12px rgba(79,70,229,0.15)' } as any,
    }),
  },
  workModelLabel:       { fontSize: 13, fontFamily: FontFamily.semiBold, color: '#555555' },
  workModelLabelActive: { color: '#4F46E5' },

  // ── Salary card ───────────────────────────────────────────────────────────
  salaryCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 20,
  },
  salaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  salaryTitle:      { fontSize: 15, fontFamily: FontFamily.bold, color: '#0A0A0A' },
  salaryValue:      { fontSize: 15, fontFamily: FontFamily.bold, color: '#4F46E5' },
  salaryLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  salaryRangeLabel: { fontSize: 12, fontFamily: FontFamily.regular, color: '#AAAAAA' },

  // ── Industries ────────────────────────────────────────────────────────────
  industriesWrap:  { position: 'relative' },
  industriesRow:   { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  industriesFade: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: 48,
  },

  industryChip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  industryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 8px rgba(79,70,229,0.25)' } as any,
    }),
  },
  industryChipText:       { fontSize: 14, fontFamily: FontFamily.medium, color: '#555555', whiteSpace: 'nowrap' } as any,
  industryChipTextActive: { color: '#FFFFFF' },

  // ── Custom dashed chip (+ Custom) ────────────────────────────────────────
  customAddChip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customAddChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#4F46E5',
  },

  // ── Custom industry text input row ────────────────────────────────────────
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  customIndustryInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#0A0A0A',
    outlineWidth: 0,
  } as any,
  addIndustryBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIndustryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
    alignItems: 'center',
  },

  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 4 },
      web:     { boxShadow: '0 4px 16px rgba(79,70,229,0.25)' } as any,
    }),
  },
  continueButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  disclaimer: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});
