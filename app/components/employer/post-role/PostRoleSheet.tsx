import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { PostRoleProvider, usePostRole } from '../../../context/PostRoleContext';
import { useEmployer } from '../../../context/EmployerContext';
import { useAuth } from '../../../context/AuthContext';
import RoleBasicsStep from './RoleBasicsStep';
import SkillsStep from './SkillsStep';
import PreviewStep from './PreviewStep';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const fillWidth = useSharedValue((step / 3) * SCREEN_WIDTH);

  useEffect(() => {
    fillWidth.value = withTiming((step / 3) * SCREEN_WIDTH, { duration: 400 });
  }, [step]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <View style={pbStyles.track}>
      <Animated.View style={[pbStyles.fill, fillStyle]} />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: { height: 3, backgroundColor: '#F0F2FF', width: '100%' },
  fill: { height: 3, backgroundColor: '#4C59D7', borderRadius: 2 },
});

// ─── Navigation header ────────────────────────────────────────────────────────
function NavHeader({
  step,
  onClose,
  onBack,
}: {
  step: number;
  onClose: () => void;
  onBack: () => void;
}) {
  const titles: Record<number, string> = { 1: 'Post a Role', 2: 'Post a Role', 3: 'Preview your listing' };
  const stepLabels: Record<number, string> = { 1: 'Step 1 of 3', 2: 'Step 2 of 3', 3: 'Step 3 of 3' };

  return (
    <View style={nhStyles.bar}>
      <TouchableOpacity
        style={nhStyles.leftBtn}
        onPress={step === 1 ? onClose : onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Text style={nhStyles.leftIcon}>{step === 1 ? '✕' : '←'}</Text>
      </TouchableOpacity>

      <View style={nhStyles.centerBlock}>
        <Text style={nhStyles.title}>{titles[step]}</Text>
        <Text style={nhStyles.stepLabel}>{stepLabels[step]}</Text>
      </View>

      <View style={nhStyles.rightPlaceholder} />
    </View>
  );
}

const nhStyles = StyleSheet.create({
  bar: {
    height: 56, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F2FF',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8,
  },
  leftBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  leftIcon: { fontSize: 20, color: '#1A1A2E' },
  centerBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  stepLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 1 },
  rightPlaceholder: { width: 44 },
});

// ─── Inner content (needs both PostRoleContext AND EmployerContext) ─────────────
function PostRoleInner({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = usePostRole();

  // ── Fix: access EmployerContext to call the real publishJob() ──────────────
  const { publishJob, state: employerState } = useEmployer();
  const { user } = useAuth();

  const [animDir, setAnimDir] = useState<'in' | 'none'>('none');
  const [renderStep, setRenderStep] = useState(state.currentStep);

  const goToStep = (next: 1 | 2 | 3) => {
    setAnimDir('in');
    setRenderStep(next);
    dispatch({ type: 'SET_STEP', step: next });
  };

  const goBack = () => {
    const prev = (state.currentStep - 1) as 1 | 2 | 3;
    if (prev < 1) { onClose(); return; }
    setAnimDir('none');
    dispatch({ type: 'SET_STEP', step: prev });
    setRenderStep(prev);
  };

  /**
   * handlePublish — the real publish handler.
   *
   * Reads ALL form fields from PostRoleContext state, maps them to the
   * JobPostingRow shape, and calls publishJob() from EmployerContext which
   * writes to Supabase and updates local state.
   */
  const handlePublish = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to publish a role.');
      return;
    }

    dispatch({ type: 'SET_PUBLISHING', value: true });

    try {
      const { step1, step2, step3 } = state;

      // Validate required fields
      if (!step1.jobTitle.trim()) {
        Alert.alert('Missing info', 'Please enter a job title in Step 1.');
        dispatch({ type: 'SET_PUBLISHING', value: false });
        return;
      }

      // Map form state → JobPostingRow fields
      const jobData = {
        employer_id: user.id,
        role_title: step1.jobTitle.trim(),
        company_name: employerState.profile?.companyName || 'My Company',
        employment_type: step1.employmentType,
        work_model: step1.workModel,
        location: step1.officeLocation.trim() || step1.workModel,
        department: step1.department || '',
        salary_min: step1.salaryMin,
        salary_max: step1.salaryMax,
        currency: 'INR',
        skills: step2.requiredSkills,
        nice_to_have: step2.niceToHaveSkills,
        description: step2.description.trim(),
        years_experience: step2.yearsOfExperience,
        is_active: true,
        requires_assessment: step3.requireAssessment,
        blind_audition: step3.blindAuditionMode,
        // New v2 fields — employer can fill via profile later
        company_description: '',
        company_size: '',
      };

      // This writes to Supabase and dispatches POST_JOB to EmployerContext
      await publishJob(jobData);

      dispatch({ type: 'SET_PUBLISHING', value: false });
      dispatch({ type: 'RESET_FORM' });

      // Show success and close
      Alert.alert(
        'Role Published! ✦',
        `"${jobData.role_title}" is now live and matching with candidates.`,
        [{ text: 'Great!', onPress: onClose }],
      );
    } catch (e: any) {
      console.error('[PostRole] publish error:', e);
      dispatch({ type: 'SET_PUBLISHING', value: false });
      Alert.alert(
        'Publish Failed',
        e?.message?.includes('violates') || e?.message?.includes('permission')
          ? 'Permission error. Make sure your Supabase RLS policy allows employers to insert job postings.'
          : 'Failed to publish role. Please check your connection and try again.',
      );
    }
  };

  const handleSaveDraft = () => {
    dispatch({ type: 'RESET_FORM' });
    onClose();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <NavHeader
        step={state.currentStep}
        onClose={() => { dispatch({ type: 'RESET_FORM' }); onClose(); }}
        onBack={goBack}
      />
      <ProgressBar step={state.currentStep} />

      <View style={styles.stepContainer}>
        {state.currentStep === 1 && (
          <RoleBasicsStep onContinue={() => goToStep(2)} />
        )}
        {state.currentStep === 2 && (
          <SkillsStep onContinue={() => goToStep(3)} />
        )}
        {state.currentStep === 3 && (
          <PreviewStep onPublish={handlePublish} onSaveDraft={handleSaveDraft} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
interface PostRoleSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostRoleSheet({ visible, onClose }: PostRoleSheetProps) {
  const slideY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { mass: 1, damping: 20, stiffness: 200 });
    } else {
      slideY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  if (!visible) return null;

  // ── Web: absolute overlay inside the phone frame ─────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, sheetStyle, { zIndex: 999 }]}>
        <PostRoleProvider>
          <PostRoleInner onClose={onClose} />
        </PostRoleProvider>
      </Animated.View>
    );
  }

  // ── Native: full-screen slide-up ────────────────────────────────────────────
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, sheetStyle]}>
        <PostRoleProvider>
          <PostRoleInner onClose={onClose} />
        </PostRoleProvider>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  stepContainer: { flex: 1, overflow: 'hidden' },
});

const webStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,30,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 430,
    maxHeight: 844,
    height: '90%' as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
});

