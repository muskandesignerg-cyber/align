import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { FileSearch } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, BorderRadius, TouchTarget } from '../theme/spacing';
import { ProgressBar } from '../components/ui/ProgressBar';
import { OnboardingHeader } from '../components/ui/OnboardingHeader';
import { useProfileBuilder } from '../context/ProfileBuilderContext';
import { extractTextFromPdf, renderPdfPagesToImages } from '../lib/pdfExtractor';
import { extractResumeData, extractResumeFromImages } from '../lib/groq';
import { type UploadStatus } from './components/UploadZone';
import {
  ProfileData,
  WorkExperience,
  Project,
  Education,
  Certification,
  Skill,
  generateId,
  EMPTY_PROFILE_DATA,
} from '../types/profile';

// Sub-components
import { FloatingLabelInput } from './components/FloatingLabelInput';
import { UploadZone } from './components/UploadZone';
import { ExpandableCard } from './components/ExpandableCard';
import { ExperienceCard } from './components/ExperienceCard';
import { ProjectCard } from './components/ProjectCard';
import { EducationCard } from './components/EducationCard';
import { SkillsSection } from './components/SkillsSection';
import { SectionHeader } from './components/SectionHeader';
import { AddButton } from './components/AddButton';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileBuilder'>;

type ScreenMode = 'upload' | 'form';
const TEXT_THRESHOLD = 100; // Minimum chars to consider text extraction successful

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ProfileBuilderScreen: React.FC<Props> = ({ navigation }) => {
  const { state, dispatch } = useProfileBuilder();
  const [mode, setMode] = useState<ScreenMode>('upload');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState('');
  const [partialWarning, setPartialWarning] = useState(false);
  const [summaryCount, setSummaryCount] = useState(0);
  const [extraContextCount, setExtraContextCount] = useState(0);

  // Fade AI badges after 3 seconds
  useEffect(() => {
    if (state.showAiBadges) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_AI_BADGES' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.showAiBadges, dispatch]);

  // Loading Screen Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(0.5)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (state.extractionStatus === 'extracting') {
      Animated.timing(progressAnim, {
        toValue: 85,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      const createPulse = (anim: Animated.Value, initialVal: number) => {
        return Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.25, duration: 400, useNativeDriver: true })
        ]);
      };

      Animated.loop(
        Animated.stagger(200, [
          createPulse(dot1, 1),
          createPulse(dot2, 0.5),
          createPulse(dot3, 0.25),
        ])
      ).start();
    } else {
      progressAnim.setValue(0);
      dot1.setValue(1);
      dot2.setValue(0.5);
      dot3.setValue(0.25);
    }
  }, [state.extractionStatus]);

  // ─── PDF Upload + AI Extract ───────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.uri) throw new Error('File URI is missing');
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('File too large', 'Please upload a PDF under 10 MB.');
        return;
      }

      // Check for manual edits before re-upload
      if (state.hasManualEdits) {
        return new Promise<void>((resolve) => {
          Alert.alert(
            'Re-upload CV?',
            'Re-uploading will overwrite your current edits.',
            [
              { text: 'Keep my edits', style: 'cancel', onPress: () => resolve() },
              {
                text: 'Use CV data',
                style: 'destructive',
                onPress: async () => {
                  await performExtraction(asset.uri);
                  resolve();
                },
              },
            ]
          );
        });
      }

      await performExtraction(asset.uri);
    } catch (err: any) {
      console.error('Upload error:', err);
      if (!err?.message?.includes('cancel')) {
        setUploadStatus('error');
        setUploadError(err?.message ?? 'Could not read this PDF.');
      }
    }
  }, [state.hasManualEdits]);

  const performExtraction = async (fileUri: string) => {
    setUploadStatus('reading');
    dispatch({ type: 'SET_EXTRACTION_STATUS', status: 'reading' });

    try {
      // LAYER 1: Try text extraction first
      let pdfText = '';
      try {
        pdfText = await extractTextFromPdf(fileUri);
        console.log(`[Pipeline] Text extraction got ${pdfText.length} chars`);
      } catch (textErr) {
        console.warn('[Pipeline] Text extraction failed:', textErr);
        pdfText = '';
      }

      let profileData;

      if (pdfText.trim().length >= TEXT_THRESHOLD) {
        // TEXT-BASED PDF — use fast text model
        console.log('[Pipeline] Using text-based extraction (Layer 1)');
        setUploadStatus('extracting');
        dispatch({ type: 'SET_EXTRACTION_STATUS', status: 'extracting' });
        profileData = await extractResumeData(pdfText);
      } else {
        // IMAGE-BASED PDF — render pages to images, use vision model
        console.log('[Pipeline] Text too short, using vision extraction (Layer 2)');
        setUploadStatus('vision');
        dispatch({ type: 'SET_EXTRACTION_STATUS', status: 'extracting' });

        const pageImages = await renderPdfPagesToImages(fileUri, 2);
        if (!pageImages.length) {
          throw new Error('Could not render PDF pages to images.');
        }
        console.log(`[Pipeline] Rendered ${pageImages.length} page(s) to images`);
        profileData = await extractResumeFromImages(pageImages);
      }

      // Check for partial extraction (< 5 meaningful fields)
      const fieldCount = countPopulatedFields(profileData);
      console.log(`[Pipeline] Populated fields: ${fieldCount}`);
      if (fieldCount < 5) {
        setPartialWarning(true);
      }

      dispatch({ type: 'SET_PROFILE_DATA', data: profileData });
      setUploadStatus('idle');
      setMode('form');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setUploadStatus('error');
      setUploadError(err?.message ?? "Couldn't read this PDF. Try another file.");
      dispatch({ type: 'SET_EXTRACTION_STATUS', status: 'error' });
    }
  };

  /** Count how many meaningful fields were populated by extraction */
  const countPopulatedFields = (data: ProfileData): number => {
    let count = 0;
    const bi = data.basicInfo;
    if (bi.fullName) count++;
    if (bi.professionalTitle) count++;
    if (bi.email) count++;
    if (bi.phone) count++;
    if (bi.location) count++;
    if (bi.professionalSummary) count++;
    count += data.workExperience.length;
    count += data.skills.length > 0 ? 1 : 0;
    count += data.projects.length;
    count += data.education.length;
    return count;
  };

  const handleBuildManually = () => {
    dispatch({ type: 'RESET_PROFILE' });
    setMode('form');
  };

  const handleRetry = () => {
    setUploadStatus('idle');
    setUploadError('');
  };

  // ─── Navigation ────────────────────────────────────────────────────────
  const handleNext = () => {
    const skillNames = state.profileData.skills.map((s) => s.name);
    navigation.navigate('SkillConfirmation', { parsedSkills: skillNames });
  };

  const handleSkip = () => {
    navigation.navigate('SkillConfirmation');
  };

  // ─── Helpers ───────────────────────────────────────────────────────────
  const { profileData } = state;
  const { basicInfo } = profileData;

  const updateBasicInfo = (field: keyof typeof basicInfo, value: string) => {
    dispatch({ type: 'UPDATE_BASIC_INFO', field, value });
  };

  // ─── MODE A: Upload Screen ────────────────────────────────────────────
  if (mode === 'upload' && state.extractionStatus !== 'extracting') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

        {/* OnboardingHeader handles top safe-area + back arrow + progress bar + step label */}
        <OnboardingHeader
          currentStep={1}
          onBack={() => navigation.goBack()}
        />

        {/* ── Scrollable body ──────────────────────────────────────── */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.uploadScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page title */}
          <Text style={styles.heading}>Let's build your profile</Text>
          <Text style={styles.subheading}>
            {`Drop your resume or link LinkedIn — we’ll do the rest`}
          </Text>

          {/* Upload zone */}
          <UploadZone
            status={uploadStatus}
            onUpload={handleUpload}
            onRetry={handleRetry}
            onBuildManually={handleBuildManually}
            errorMessage={uploadError}
          />

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* LinkedIn button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.linkedInButton}
            onPress={() =>
              Alert.alert('Coming soon', 'LinkedIn import will be available soon.')
            }
          >
            <View style={styles.linkedInIcon}>
              <Text style={styles.linkedInIn}>in</Text>
            </View>
            <Text style={styles.linkedInText}>Connect LinkedIn</Text>
          </TouchableOpacity>

          {/* Spacer — pushes build manually to bottom */}
          <View style={styles.uploadSpacer} />

          {/* Build manually link */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.manualLink}
            onPress={handleBuildManually}
          >
            <Text style={styles.manualLinkText}>Build manually instead →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Extracting State ──────────────────────────────────────────────────
  if (state.extractionStatus === 'extracting') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          
          <View style={{ width: 80, height: 80, backgroundColor: '#EEF2FF', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
            <FileSearch size={36} color="#4F46E5" strokeWidth={2} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '700', color: '#0A0A0A', textAlign: 'center', marginBottom: 10 }}>
            Analyzing your CV...
          </Text>
          
          <Text style={{ fontSize: 15, fontWeight: '400', color: '#888888', textAlign: 'center', lineHeight: 24, maxWidth: 280, marginBottom: 40 }}>
            Image-based PDF detected — using visual AI to extract your details.
          </Text>
          
          <View style={{ width: '100%', height: 4, backgroundColor: '#E8E8E8', borderRadius: 999, marginBottom: 16, overflow: 'hidden' }}>
            <Animated.View style={{ 
              height: '100%', 
              backgroundColor: '#4F46E5', 
              borderRadius: 999,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }} />
          </View>

          <Text style={{ fontSize: 13, fontWeight: '400', color: '#AAAAAA', textAlign: 'center', fontStyle: 'normal' }}>
            This may take 10–15 seconds
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 32 }}>
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', opacity: dot1 }} />
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', opacity: dot2 }} />
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', opacity: dot3 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── MODE B: Full Profile Form ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <OnboardingHeader
        currentStep={1}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Re-upload button — radius 16px per spec */}
          <TouchableOpacity style={styles.reuploadBtn} activeOpacity={0.85} onPress={handleUpload}>
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={styles.reuploadText}>Upload CV to auto-fill</Text>
          </TouchableOpacity>
          <Text style={styles.reuploadHint}>PDF only, max 10MB</Text>

          {/* Partial extraction warning */}
          {partialWarning && (
            <View style={styles.warningBanner}>
              <View style={styles.warningContent}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningTextWrap}>
                  <Text style={styles.warningTitle}>We could only extract some details</Text>
                  <Text style={styles.warningBody}>Please review and fill in the missing fields manually.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.warningDismiss}
                onPress={() => setPartialWarning(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.warningDismissText}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Basic Info (4 fields — email/phone collected at signup) ── */}
          <SectionHeader title="Basic Info" topMargin={24} />

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Full Name"
              value={basicInfo.fullName}
              onChangeText={(v) => updateBasicInfo('fullName', v)}
              placeholder="Jane Smith"
              showAiBadge={state.showAiBadges && !!basicInfo.fullName}
            />
            <FloatingLabelInput
              label="Professional Title"
              value={basicInfo.professionalTitle}
              onChangeText={(v) => updateBasicInfo('professionalTitle', v)}
              placeholder="e.g. Senior Product Designer"
              showAiBadge={state.showAiBadges && !!basicInfo.professionalTitle}
            />
            <View>
              <FloatingLabelInput
                label="Professional Summary"
                value={basicInfo.professionalSummary}
                onChangeText={(v) => {
                  if (v.length <= 300) {
                    updateBasicInfo('professionalSummary', v);
                    setSummaryCount(v.length);
                  }
                }}
                placeholder="Brief overview of your experience and what you're looking for..."
                multiline
                numberOfLines={4}
                showAiBadge={state.showAiBadges && !!basicInfo.professionalSummary}
              />
              <Text style={styles.charCount}>{summaryCount}/300</Text>
            </View>
            <FloatingLabelInput
              label="Location"
              value={basicInfo.location}
              onChangeText={(v) => updateBasicInfo('location', v)}
              placeholder="City, Country"
              showAiBadge={state.showAiBadges && !!basicInfo.location}
            />
          </View>

          {/* ── Work Experience ─────────────────────────────────────── */}
          <SectionHeader
            title="Work Experience"
            subtitle="Add your relevant roles and achievements."
          />

          {profileData.workExperience.map((exp, idx) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              index={idx}
              isExpanded={state.expandedCards.includes(exp.id)}
              onToggleExpand={(id) => dispatch({ type: 'TOGGLE_CARD_EXPAND', id })}
              onDelete={(id) => dispatch({ type: 'DELETE_EXPERIENCE', id })}
              onSave={(updated) => dispatch({
                type: 'UPDATE_EXPERIENCE',
                id: updated.id,
                updates: {
                  company: updated.company,
                  role: updated.role,
                  startDate: updated.startDate,
                  endDate: updated.endDate,
                  isCurrentRole: updated.isCurrentRole,
                  description: updated.description,
                },
              })}
            />
          ))}

          <AddButton
            label="+ Add Work Experience"
            onPress={() => dispatch({
              type: 'ADD_EXPERIENCE',
              experience: { id: generateId(), company: '', role: '', startDate: '', endDate: '', isCurrentRole: false, description: '', achievements: [] },
            })}
          />

          {/* ── Skills ──────────────────────────────────────────────── */}
          <SectionHeader
            title="Skills"
            subtitle="Add skills that match the roles you want."
          />

          <SkillsSection
            skills={profileData.skills}
            onAddSkill={(skill) => dispatch({ type: 'ADD_SKILL', skill })}
            onDeleteSkill={(id) => dispatch({ type: 'DELETE_SKILL', id })}
            showAiBadge={state.showAiBadges && profileData.skills.length > 0}
          />

          {/* ── Projects ────────────────────────────────────────────── */}
          <SectionHeader
            title="Projects"
            subtitle="Showcase work that demonstrates your skills."
          />

          {profileData.projects.map((proj, idx) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              index={idx}
              isExpanded={state.expandedCards.includes(proj.id)}
              onToggleExpand={(id) => dispatch({ type: 'TOGGLE_CARD_EXPAND', id })}
              onDelete={(id) => dispatch({ type: 'DELETE_PROJECT', id })}
              onSave={(updated) => dispatch({
                type: 'UPDATE_PROJECT',
                id: updated.id,
                updates: {
                  name: updated.name,
                  description: updated.description,
                  url: updated.url,
                  githubUrl: updated.githubUrl,
                },
              })}
            />
          ))}

          <AddButton
            label="+ Add Project"
            onPress={() => dispatch({
              type: 'ADD_PROJECT',
              project: { id: generateId(), name: '', description: '', techStack: [], url: '', githubUrl: '' },
            })}
          />

          {/* ── Education ───────────────────────────────────────────── */}
          <SectionHeader
            title="Education"
            subtitle="Your degrees and relevant coursework."
          />

          {profileData.education.map((edu, idx) => (
            <EducationCard
              key={edu.id}
              education={edu}
              index={idx}
              isExpanded={state.expandedCards.includes(edu.id)}
              onToggleExpand={(id) => dispatch({ type: 'TOGGLE_CARD_EXPAND', id })}
              onDelete={(id) => dispatch({ type: 'DELETE_EDUCATION', id })}
              onSave={(updated) => dispatch({
                type: 'UPDATE_EDUCATION',
                id: updated.id,
                updates: {
                  institution: updated.institution,
                  degree: updated.degree,
                  fieldOfStudy: updated.fieldOfStudy,
                  startYear: updated.startYear,
                  endYear: updated.endYear,
                  grade: updated.grade,
                },
              })}
            />
          ))}

          <AddButton
            label="+ Add Education"
            onPress={() => dispatch({
              type: 'ADD_EDUCATION',
              education: { id: generateId(), institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' },
            })}
          />

          {/* Certifications removed from onboarding — candidates add in profile */}

          {/* ── Extra Context ────────────────────────────────────────── */}
          <SectionHeader
            title="Extra Context"
            subtitle={`Career gaps, transitions, or anything that gives employers better context.`}
          />

          <View>
            <FloatingLabelInput
              label="Extra Context"
              value={profileData.extraContext}
              onChangeText={(v) => {
                if (v.length <= 400) {
                  dispatch({ type: 'UPDATE_EXTRA_CONTEXT', value: v });
                  setExtraContextCount(v.length);
                }
              }}
              placeholder={`e.g. I'm transitioning from backend to product design...`}
              multiline
              numberOfLines={5}
            />
            <Text style={styles.charCount}>{extraContextCount}/400</Text>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* ── Bottom CTA — radius 16px per spec ────────────────────── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.skipButton} activeOpacity={0.8} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // Step label — right aligned below progress bar
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    paddingRight: 20,
    marginTop: 6,
    fontFamily: FontFamily.regular,
  },

  // MODE A — Upload
  uploadScroll: {
    paddingHorizontal: Spacing.s24,
    paddingTop: 28,
    paddingBottom: 24,
    flexGrow: 1,
  },
  uploadSpacer: { flex: 1, minHeight: 40 },
  // Title: dark #1A1A2E (NOT brand blue)
  heading: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: '#1A1A2E',
    lineHeight: 36,
  },
  subheading: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 22,
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.s24, gap: Spacing.s12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.base, fontFamily: FontFamily.medium, color: Colors.muted },

  linkedInButton: {
    marginTop: Spacing.s24, height: 52, borderRadius: BorderRadius.button,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.s12,
  },
  linkedInIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center' },
  linkedInIn: { fontSize: 13, fontFamily: FontFamily.bold, color: Colors.white, lineHeight: 15 },
  linkedInText: { fontSize: FontSize.bodyLg, fontFamily: FontFamily.medium, color: Colors.bodyText },

  manualLink: { alignItems: 'center', paddingBottom: Spacing.s32, minHeight: TouchTarget, justifyContent: 'center' },
  manualLinkText: { fontSize: FontSize.body, fontFamily: FontFamily.medium, color: Colors.primary },

  // Extracting state
  extractingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.s32 },
  extractingIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.s24 },
  extractingEmoji: { fontSize: 44 },
  extractingTitle: { fontSize: FontSize.heading3, fontFamily: FontFamily.bold, color: Colors.tertiary, textAlign: 'center' },
  extractingSubtitle: { fontSize: FontSize.body, fontFamily: FontFamily.regular, color: Colors.muted, textAlign: 'center', marginTop: Spacing.s8 },
  extractingHint: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: Colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.s16 },

  // MODE B — Form
  formScroll: { paddingHorizontal: 24, paddingTop: 8 },

  // Field group: 14px gap between Basic Info inputs
  fieldGroup: { gap: 14 },

  // Character count — shown bottom-right of multiline fields
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },

  // Upload CV button — radius 16px (PRIMARY button standard)
  reuploadBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4C59D7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reuploadText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  reuploadHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  // (Social links section removed — collapsible styles no longer needed)

  dateRow: { flexDirection: 'row', gap: Spacing.s12 },
  dateField: { flex: 1 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: Spacing.s8,
    paddingHorizontal: Spacing.s24, paddingVertical: Spacing.s12,
    borderTopWidth: 1, borderTopColor: '#F0F0F5', backgroundColor: Colors.white,
  },
  // Skip — SECONDARY: radius 16px, height 56 (matches Next)
  skipButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F4F6FF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 16, fontFamily: FontFamily.medium, color: '#6B7280' },
  // Next — PRIMARY: radius 16px, height 56, shadow
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  nextText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFFFFF' },

  // Warning banner
  warningBanner: {
    backgroundColor: '#FFF8E6', borderRadius: BorderRadius.card,
    borderLeftWidth: 3, borderLeftColor: '#D97706',
    padding: Spacing.s16, marginBottom: Spacing.s16,
  },
  warningContent: { flexDirection: 'row', gap: Spacing.s12, alignItems: 'flex-start' },
  warningIcon: { fontSize: 18, marginTop: 2 },
  warningTextWrap: { flex: 1 },
  warningTitle: { fontSize: FontSize.md, fontFamily: FontFamily.semiBold, color: '#92400E' },
  warningBody: { fontSize: FontSize.base, fontFamily: FontFamily.regular, color: '#B45309', marginTop: Spacing.s4 },
  warningDismiss: {
    alignSelf: 'flex-end', marginTop: Spacing.s8,
    paddingVertical: Spacing.s6, paddingHorizontal: Spacing.s16,
    backgroundColor: '#FEF3C7', borderRadius: BorderRadius.chip,
  },
  warningDismissText: { fontSize: FontSize.sm, fontFamily: FontFamily.semiBold, color: '#92400E' },
});
