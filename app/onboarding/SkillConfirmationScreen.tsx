import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { FontFamily } from '../theme/typography';
import { OnboardingHeader } from '../components/ui/OnboardingHeader';
import { useAuth } from '../context/AuthContext';
import { saveSkills } from '../lib/database';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SkillConfirmation'>;

// ─── Comprehensive skill suggestions ─────────────────────────────────────────

const SUGGESTED_SKILLS_POOL = [
  // Design
  'Figma', 'UI Design', 'UX Design', 'Prototyping', 'User Research', 'Design Systems',
  'Adobe XD', 'Sketch', 'Wireframing', 'Interaction Design', 'Visual Design',
  'Adobe Photoshop', 'Adobe Illustrator', 'Motion Design', 'Branding',
  // Frontend
  'HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'React Native', 'Next.js',
  'Vue.js', 'Angular', 'Tailwind CSS', 'SASS/SCSS', 'Responsive Design',
  // Backend
  'Node.js', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby on Rails',
  'Express.js', 'Django', 'FastAPI', 'Spring Boot', 'GraphQL', 'REST APIs',
  // Data & AI
  'Machine Learning', 'Data Science', 'SQL', 'PostgreSQL', 'MongoDB',
  'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Data Analysis',
  // Cloud & DevOps
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'CI/CD',
  'Terraform', 'Linux', 'Git', 'GitHub Actions',
  // Mobile
  'iOS Development', 'Android Development', 'Flutter', 'Swift', 'Kotlin',
  // Management & Soft Skills
  'Project Management', 'Agile/Scrum', 'Team Leadership', 'Communication',
  'Product Management', 'Stakeholder Management', 'Technical Writing',
  'Problem Solving', 'Critical Thinking', 'Presentation Skills',
  // Marketing & Business
  'Digital Marketing', 'SEO', 'Content Strategy', 'Growth Hacking',
  'Business Development', 'Sales', 'Analytics', 'A/B Testing',
];

const DEFAULT_CONFIRMED = ['Figma', 'UI Design', 'Prototyping', 'User Research'];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SkillConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const aiSkills = route.params?.parsedSkills;
  const hasAiSkills = aiSkills && aiSkills.length > 0;

  const initialConfirmed = hasAiSkills
    ? aiSkills!.slice(0, Math.min(aiSkills!.length, 12))
    : DEFAULT_CONFIRMED;

  const buildSuggested = (confirmedList: string[]) => {
    const confirmedSet = new Set(confirmedList.map((s) => s.toLowerCase()));
    const aiExtras = hasAiSkills && aiSkills!.length > 12 ? aiSkills!.slice(12) : [];
    const all = [
      ...aiExtras,
      ...SUGGESTED_SKILLS_POOL.filter((s) => !confirmedSet.has(s.toLowerCase())),
    ];
    const seen = new Set<string>();
    return all.filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key) || confirmedSet.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const [confirmed, setConfirmed]   = useState<string[]>(initialConfirmed);
  const [suggested, setSuggested]   = useState<string[]>(() => buildSuggested(initialConfirmed).slice(0, 20));
  const [saving, setSaving]         = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [showInput, setShowInput]   = useState(false);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const removeConfirmed = (skill: string) => {
    setConfirmed((prev) => prev.filter((s) => s !== skill));
    setSuggested((prev) => prev.includes(skill) ? prev : [skill, ...prev]);
  };

  const addFromSuggested = (skill: string) => {
    setSuggested((prev) => prev.filter((s) => s !== skill));
    setConfirmed((prev) => [...prev, skill]);
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (confirmed.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkill('');
      return;
    }
    setConfirmed((prev) => [...prev, trimmed]);
    setSuggested((prev) => prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()));
    setCustomSkill('');
  };

  const handleShowInput = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (user) await saveSkills(user.id, confirmed);
    } catch (err: any) {
      console.warn('Could not save skills to DB:', err?.message);
    } finally {
      setSaving(false);
      navigation.navigate('RolePreferences');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* OnboardingHeader — back arrow + progress bars + step label */}
      <OnboardingHeader
        currentStep={3}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Heading */}
          <Text style={styles.heading}>
            {hasAiSkills ? "Here's what we found" : 'Confirm your skills'}
          </Text>
          <Text style={styles.subheading}>
            {hasAiSkills
              ? 'We pulled these from your resume. Tap to edit.'
              : 'Add skills that best represent your expertise.'}
          </Text>

          {/* ── YOUR SKILLS ───────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>
            YOUR SKILLS ({confirmed.length})
          </Text>

          <View style={styles.chipRow}>
            {confirmed.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={styles.confirmedChip}
                onPress={() => removeConfirmed(skill)}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmedChipText}>{skill}</Text>
                {/* X with 20×20 touch target */}
                <View style={styles.chipXHit}>
                  <Ionicons name="close" size={14} color="rgba(255,255,255,0.85)" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Add custom skill ──────────────────────────────────────────── */}
          {showInput ? (
            <View style={styles.customInputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.customInput}
                placeholder="Type a skill and press Add"
                placeholderTextColor="#BBBBBB"
                value={customSkill}
                onChangeText={setCustomSkill}
                onSubmitEditing={addCustomSkill}
                returnKeyType="done"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.addBtn, !customSkill.trim() && styles.addBtnDisabled]}
                onPress={addCustomSkill}
                disabled={!customSkill.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Add custom skill — dashed button, keep exactly as is */
            <TouchableOpacity
              style={styles.addSkillButton}
              activeOpacity={0.8}
              onPress={handleShowInput}
            >
              <Ionicons name="add" size={16} color="#4F46E5" />
              <Text style={styles.addSkillText}>Add a custom skill</Text>
            </TouchableOpacity>
          )}

          {/* ── SUGGESTED SKILLS ─────────────────────────────────────────── */}
          {suggested.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                SUGGESTED SKILLS
              </Text>
              <View style={styles.chipRow}>
                {suggested.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={styles.suggestedChip}
                    onPress={() => addFromSuggested(skill)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add" size={12} color="#4F46E5" />
                    <Text style={styles.suggestedChipText}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Bottom scroll spacer — clears fixed bottom bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Bottom CTA bar ───────────────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <Text style={styles.skillCount}>
            {confirmed.length} skill{confirmed.length !== 1 ? 's' : ''} selected
          </Text>

          {saving ? (
            <View style={styles.continueButton}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.continueButtonText}>Saving skills...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.continueButton,
                confirmed.length === 0 && styles.continueButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={confirmed.length === 0}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex:      { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },

  // ── Heading ──────────────────────────────────────────────────────────────
  heading: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#0A0A0A',
    lineHeight: 32,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#666666',
    lineHeight: 21,
    marginBottom: 24,
  },

  // ── Section labels ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#999999',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // ── Chip row ─────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // ── Confirmed chips — filled purple pill ──────────────────────────────────
  confirmedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: '#4F46E5',
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 6,
  },
  confirmedChipText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
  // 20×20 touch area for the X icon inside a chip
  chipXHit: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Add custom skill — dashed ghost (unchanged) ───────────────────────────
  addSkillButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addSkillText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#4F46E5',
  },

  // ── Custom skill text input ───────────────────────────────────────────────
  customInputWrap: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',    // was Colors.surface (lavender)
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#0A0A0A',
    outlineWidth: 0,
  } as any,
  addBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#A5B4FC' },
  addBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // ── Suggested chips — white with gray border ──────────────────────────────
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: '#FFFFFF',   // was #F0EEFF (lavender)
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',        // was #D8D4F0 (purple-tinted)
    paddingHorizontal: 14,
    gap: 5,
  },
  suggestedChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#333333',              // was #4C59D7 (purple)
  },

  // ── Bottom CTA bar ────────────────────────────────────────────────────────
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,             // safe-area breathing room
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  skillCount: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#666666',
    textAlign: 'center',
  },
  continueButton: {
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
  continueButtonDisabled: { backgroundColor: '#A5B4FC' },
  continueButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
