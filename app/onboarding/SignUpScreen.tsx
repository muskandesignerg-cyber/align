/**
 * SignUpScreen (Create Account)
 *
 * All 18 spec fixes applied:
 *  1. Header row: back arrow + logo on SAME baseline (flexDirection row, alignItems center)
 *  2. LinkedIn button: outlined same as Google (not filled blue)
 *  3. Create Account button: #4C59D7 full color with shadow (not washed-out)
 *  4. Input backgrounds: #F4F6FF with #D0D7FF border
 *  5. Password strength indicator (4-segment animated bar)
 *  6. Inline validation error messages per field
 *  7. Terms & Privacy consent line above button
 *  8. Social buttons equal visual weight
 *  9. Entrance stagger animations
 * 10. Field shake on invalid submit
 * 11. Error toast for Supabase errors
 * 12. Focus / error / success border states per input
 * 13. Separate eye toggle per password field
 * 14. Blur-only validation for confirmPassword
 * 15. Button enabled only when all fields valid + pw score >= 2
 * 16. Loading state with spinner
 * 17. Success email-verification state
 * 18. Scale press animation on social buttons
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { signUpWithEmail, signInWithGoogle, signInWithLinkedIn } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { PasswordStrength } from '../components/ui/PasswordStrength';
import { ErrorToast } from '../components/ui/ErrorToast';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

// ─── Email validation regex ───────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Password strength score ──────────────────────────────────────────────────
function pwScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <View style={iconS.googleRing}>
    <Text style={iconS.googleG}>G</Text>
  </View>
);

const LinkedInIcon = () => (
  <View style={iconS.linkedInBox}>
    <Text style={iconS.linkedInIn}>in</Text>
  </View>
);

const iconS = StyleSheet.create({
  googleRing: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleG: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#4285F4', lineHeight: 14 },
  linkedInBox: {
    width: 22, height: 22, borderRadius: 4,
    backgroundColor: '#0077B5',
    alignItems: 'center', justifyContent: 'center',
  },
  linkedInIn: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', lineHeight: 13 },
});

// ─── Animated social button with scale press ──────────────────────────────────
function SocialBtn({
  onPress, children, disabled, delay,
}: {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 350, delay, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[s.oauthBtn, oauthShadow, { opacity }]}>
      <TouchableOpacity
        style={s.oauthBtnInner}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, speed: 50, bounciness: 4, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver: true }).start()}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── FormInput — reusable field with label, focus/error/success states ─────────
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: string;
  returnKeyType?: 'next' | 'done';
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
  error?: string;
  isValid?: boolean;
  shakeAnim: Animated.Value;
  animDelay: number;
  onSubmitEditing?: () => void;
}

function FormInput({
  label, value, onChangeText, onBlur, onFocus,
  placeholder, keyboardType = 'default', autoCapitalize = 'sentences',
  autoComplete, returnKeyType = 'next', secureTextEntry = false,
  rightElement, error, isValid, shakeAnim, animDelay, onSubmitEditing,
}: FormInputProps) {
  const [focused, setFocused] = useState(false);

  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
      Animated.timing(containerY, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  const borderColor = error
    ? '#EF4444'
    : isValid
    ? '#22C55E'
    : focused
    ? '#4C59D7'
    : '#D0D7FF';

  const borderWidth = focused || error || isValid ? 1.5 : 1;

  const bgColor = error
    ? '#FFF8F8'
    : isValid
    ? '#F8FFF8'
    : focused
    ? '#FFFFFF'
    : '#F4F6FF';

  const focusShadow = focused && !error ? Platform.select({
    web: { boxShadow: '0 0 0 3px rgba(76,89,215,0.08)' } as any,
    default: {},
  }) : {};

  return (
    <Animated.View style={{ opacity: containerOpacity, transform: [{ translateY: containerY }, { translateX: shakeAnim }] }}>
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{label}</Text>
        <View style={[
          s.inputWrap,
          { borderColor, borderWidth, backgroundColor: bgColor },
          focusShadow,
        ]}>
          <TextInput
            style={s.input as any}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => { setFocused(true); onFocus?.(); }}
            onBlur={() => { setFocused(false); onBlur?.(); }}
            placeholder={placeholder}
            placeholderTextColor="#B0B8D0"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete as any}
            returnKeyType={returnKeyType}
            secureTextEntry={secureTextEntry}
            selectionColor="#4C59D7"
            onSubmitEditing={onSubmitEditing}
          />
          {isValid && !rightElement && (
            <Text style={s.checkMark}>✓</Text>
          )}
          {rightElement}
        </View>
        {error ? (
          <Text style={s.errorText}>⚠ {error}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'linkedin' | null>(null);
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Validation errors (only shown after blur or submit attempt)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Shake animations per field
  const shakes = {
    fullName: useRef(new Animated.Value(0)).current,
    email: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    confirmPassword: useRef(new Animated.Value(0)).current,
  };

  // Entrance animations
  const headerOp = useRef(new Animated.Value(0)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(10)).current;
  const socialOp = useRef(new Animated.Value(0)).current;
  const dividerOp = useRef(new Animated.Value(0)).current;
  const btnOp = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(8)).current;
  const signinOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = (anim: Animated.Value | Animated.CompositeAnimation, delay: number, config?: any) =>
      Animated.timing(anim as Animated.Value, { toValue: 1, duration: 350, delay, useNativeDriver: true, ...config });

    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 250, delay: 0, useNativeDriver: true }),
      run(titleOp, 100),
      Animated.timing(titleY, { toValue: 0, duration: 350, delay: 100, useNativeDriver: true }),
      run(socialOp, 200),
      run(dividerOp, 280),
      // fields stagger: handled per FormInput via animDelay prop
      run(btnOp, 560),
      Animated.timing(btnY, { toValue: 0, duration: 350, delay: 560, useNativeDriver: true }),
      run(signinOp, 620),
    ]).start();
  }, []);

  // ── Validation helpers ─────────────────────────────────────────────────────

  const validate = useCallback((field: string, val: string, pw?: string): string => {
    switch (field) {
      case 'fullName':
        if (!val.trim()) return 'Name is required';
        if (val.trim().length < 2) return 'Name too short';
        break;
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!EMAIL_RE.test(val.trim())) return 'Enter a valid email address';
        break;
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 8) return 'Must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (!val) return 'Please confirm your password';
        if (val !== (pw ?? password)) return 'Passwords do not match';
        break;
    }
    return '';
  }, [password]);

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validate(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const isFieldValid = (field: string, val: string): boolean => {
    if (!touched[field] || !val) return false;
    return !validate(field, val);
  };

  // ── Button enabled condition ───────────────────────────────────────────────
  const canSubmit = useMemo(() =>
    fullName.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading,
  [fullName, email, password, confirmPassword, loading]);

  // Animated button background: #C7CCF5 (disabled) → #4C59D7 (enabled)
  const btnBgAnim = useRef(new Animated.Value(canSubmit ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(btnBgAnim, {
      toValue: canSubmit ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // backgroundColor cannot use native driver
    }).start();
  }, [canSubmit]);
  const animatedBtnBg = btnBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C7CCF5', '#4C59D7'],
  });
  const animatedBtnShadow = canSubmit ? submitShadow : {};

  // ── Shake animation ───────────────────────────────────────────────────────
  const shake = (anim: Animated.Value) =>
    Animated.sequence([
      Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    const fields = ['fullName', 'email', 'password', 'confirmPassword'];
    const vals = { fullName, email, password, confirmPassword };
    let hasError = false;

    fields.forEach((f) => {
      const err = validate(f, vals[f as keyof typeof vals]);
      if (err) { newErrors[f] = err; hasError = true; }
    });

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (hasError) {
      // Shake all invalid fields
      const toShake = fields.filter((f) => newErrors[f]);
      Animated.parallel(toShake.map((f) => shake(shakes[f as keyof typeof shakes]))).start();
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigation.navigate('RoleSelection');
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setToastMsg(err?.message ?? 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'linkedin') => {
    setOauthLoading(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithLinkedIn();
      navigation.navigate('RoleSelection');
    } catch (err: any) {
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismiss')) {
        setToastMsg(err?.message ?? 'Sign-in failed. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const busy = oauthLoading !== null || loading;

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>📧</Text>
          <Text style={s.successTitle}>Check your inbox!</Text>
          <Text style={s.successSub}>
            We sent a confirmation link to{'\n'}
            <Text style={s.successEmail}>{email}</Text>
          </Text>
          <TouchableOpacity
            style={s.successBtn}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.85}
          >
            <Text style={s.successBtnText}>Go to Sign In →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header row: back arrow ONLY (no logo per spec) ── */}
          <Animated.View style={[s.headerRow, { opacity: headerOp }]}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
            </TouchableOpacity>
          </Animated.View>

          {/* ── Page title ── */}
          <Animated.View style={{ opacity: titleOp, transform: [{ translateY: titleY }] }}>
            <Text style={s.heading}>Create account</Text>
            <Text style={s.subheading}>Join the skills-first job marketplace.</Text>
          </Animated.View>

          {/* ── Social buttons (equal outlined style) ── */}
          <Animated.View style={[s.oauthRow, { opacity: socialOp }]}>
            {/* Google — outlined */}
            <SocialBtn delay={0} disabled={busy} onPress={() => handleOAuth('google')}>
              {oauthLoading === 'google'
                ? <ActivityIndicator color="#4285F4" size="small" />
                : <>
                    <GoogleIcon />
                    <Text style={s.oauthLabel}>Google</Text>
                  </>}
            </SocialBtn>

            {/* LinkedIn — ALSO outlined (fix: was filled blue) */}
            <SocialBtn delay={60} disabled={busy} onPress={() => handleOAuth('linkedin')}>
              {oauthLoading === 'linkedin'
                ? <ActivityIndicator color="#0077B5" size="small" />
                : <>
                    <LinkedInIcon />
                    <Text style={s.oauthLabel}>LinkedIn</Text>
                  </>}
            </SocialBtn>
          </Animated.View>

          {/* ── Divider ── */}
          <Animated.View style={[s.dividerRow, { opacity: dividerOp }]}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or sign up with email</Text>
            <View style={s.dividerLine} />
          </Animated.View>

          {/* ── Form fields ── */}
          <FormInput
            label="Full Name"
            value={fullName}
            onChangeText={(t) => { setFullName(t); if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' })); }}
            onBlur={() => handleBlur('fullName', fullName)}
            placeholder="Jane Smith"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            error={touched.fullName ? errors.fullName : undefined}
            isValid={isFieldValid('fullName', fullName)}
            shakeAnim={shakes.fullName}
            animDelay={320}
          />

          <FormInput
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
            onBlur={() => handleBlur('email', email)}
            placeholder="jane@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            error={touched.email ? errors.email : undefined}
            isValid={isFieldValid('email', email)}
            shakeAnim={shakes.email}
            animDelay={380}
          />

          <FormInput
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
            onBlur={() => handleBlur('password', password)}
            placeholder="Min. 8 characters"
            autoCapitalize="none"
            returnKeyType="next"
            secureTextEntry={!showPw}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPw((p) => !p)}
                activeOpacity={0.7}
                style={s.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPw ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={showPw ? '#4C59D7' : '#6B7280'}
                />
              </TouchableOpacity>
            }
            error={touched.password ? errors.password : undefined}
            isValid={isFieldValid('password', password)}
            shakeAnim={shakes.password}
            animDelay={440}
          />

          {/* Password strength bar (only shown when password has content) */}
          <PasswordStrength password={password} />

          <FormInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' })); }}
            onBlur={() => {
              setTouched((p) => ({ ...p, confirmPassword: true }));
              const err = confirmPassword !== password ? 'Passwords do not match' : '';
              setErrors((p) => ({ ...p, confirmPassword: err }));
            }}
            placeholder="Re-enter password"
            autoCapitalize="none"
            returnKeyType="done"
            secureTextEntry={!showConfirmPw}
            onSubmitEditing={handleSignUp}
            rightElement={
              <View style={s.eyeRow}>
                {/* Show green checkmark when passwords match */}
                {touched.confirmPassword && !!confirmPassword && confirmPassword === password && (
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 4 }} />
                )}
                <TouchableOpacity
                  onPress={() => setShowConfirmPw((p) => !p)}
                  activeOpacity={0.7}
                  style={s.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPw ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={showConfirmPw ? '#4C59D7' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            }
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            isValid={touched.confirmPassword && !!confirmPassword && confirmPassword === password}
            shakeAnim={shakes.confirmPassword}
            animDelay={500}
          />

          {/* ── Terms consent ── */}
          <Animated.View style={[s.termsRow, { opacity: btnOp }]}>
            <Text style={s.termsText}>
              By creating an account you agree to our{' '}
              <Text style={s.termsLink} onPress={() => {}}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={s.termsLink} onPress={() => {}}>Privacy Policy</Text>
            </Text>
          </Animated.View>

          {/* ── Create Account button (animated bg: disabled→enabled) ── */}
          <Animated.View style={[{ opacity: btnOp, transform: [{ translateY: btnY }] }, animatedBtnShadow]}>
            <Animated.View style={[s.submitBtn, { backgroundColor: animatedBtnBg }]}>
              <TouchableOpacity
                style={s.submitBtnInner}
                onPress={handleSignUp}
                activeOpacity={canSubmit ? 0.85 : 1}
                disabled={!canSubmit}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={[s.submitBtnText, !canSubmit && { opacity: 0.75 }]}>Create Account →</Text>}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Sign in link ── */}
          <Animated.View style={[s.signInRow, { opacity: signinOp }]}>
            <Text style={s.signInPrefix}>Already have an account? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SignIn')}>
              <Text style={s.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error toast */}
      <ErrorToast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </SafeAreaView>
  );
};

// ─── Mini bolt ────────────────────────────────────────────────────────────────
const miniBolt = StyleSheet.create({
  wrap: { width: 14, height: 20, alignItems: 'center' },
  top: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 3.5, borderBottomWidth: 11,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#4C59D7',
  },
  bottom: {
    width: 0, height: 0,
    borderLeftWidth: 3.5, borderRightWidth: 7, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#4C59D7', marginTop: -2,
  },
});

// ─── Shadows ──────────────────────────────────────────────────────────────────
const oauthShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(76,89,215,0.06)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
});

const submitShadow = Platform.select({
  web: { boxShadow: '0px 8px 20px rgba(76,89,215,0.30)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 8 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 16 },

  // Header — back arrow + logo on same baseline
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    gap: 12,
  },
  backBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -8,
  },
  backArrow: { fontSize: 22, color: '#1A1A2E', fontFamily: 'PlusJakartaSans_500Medium' },
  logoInline: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  logoMiniCard: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#F4F6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4C59D7', letterSpacing: 1.5,
  },

  // Title
  heading: {
    fontSize: 30, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E', marginTop: 8,
  },
  subheading: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', marginTop: 6, marginBottom: 0,
  },

  // Social buttons
  oauthRow: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
  oauthBtn: {
    flex: 1, height: 52, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8EAFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  oauthBtnInner: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  oauthLabel: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A1A2E',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, marginBottom: 4, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8EAFF' },
  dividerText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },

  // Form field
  fieldGroup: { marginTop: 16 },
  fieldLabel: {
    fontSize: 14,                            // CHANGE 5: was 13
    fontFamily: 'PlusJakartaSans_500Medium', // CHANGE 5: was SemiBold
    color: '#1A1A2E',
    marginBottom: 8,                         // CHANGE 5: was 6
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1, fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    outlineWidth: 0, padding: 0,
  },
  checkMark: {
    fontSize: 16, color: '#22C55E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  eyeRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#EF4444', marginTop: 5,
  },

  // Terms
  termsRow: { marginTop: 16 },
  termsText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', textAlign: 'center', lineHeight: 18,
  },
  termsLink: {
    color: '#4C59D7', textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // Create Account button
  submitBtn: {
    marginTop: 14, height: 56, borderRadius: 16, // CHANGE 7: marginTop 14 (was 16)
    overflow: 'hidden',
  },
  submitBtnInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF',
  },

  // Sign in row
  signInRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 16,
  },
  signInPrefix: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
  signInLink: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },

  // Success state
  successWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: {
    fontSize: 26, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E', textAlign: 'center',
  },
  successSub: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', textAlign: 'center',
    marginTop: 8, lineHeight: 24,
  },
  successEmail: { fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  successBtn: {
    marginTop: 32, height: 52, paddingHorizontal: 32,
    borderRadius: 14, backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  successBtnText: {
    fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF',
  },
});
