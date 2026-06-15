/**
 * SignInScreen — TALENT.LOGIC
 *
 * Email + password form is shown IMMEDIATELY (no extra tap).
 * Social options are secondary, below the form.
 * Back arrow only in header — no logo/wordmark.
 * Small 56x56 lightning bolt block below header.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { supabase } from '../lib/supabase';
import { signInWithGoogle, signInWithLinkedIn } from '../lib/auth';
import { ErrorToast } from '../components/ui/ErrorToast';
import { ForgotPasswordSheet } from '../components/sheets/ForgotPasswordSheet';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignIn'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Sub-icons ────────────────────────────────────────────────────────────────

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

// Mini lightning bolt (pure triangles, no image asset needed)
const MiniLightningBolt = () => (
  <View style={boltS.wrap}>
    <View style={boltS.top} />
    <View style={boltS.bottom} />
  </View>
);

const boltS = StyleSheet.create({
  wrap: { width: 18, height: 26, alignItems: 'center' },
  top: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 4.5, borderBottomWidth: 15,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#4C59D7',
  },
  bottom: {
    width: 0, height: 0,
    borderLeftWidth: 4.5, borderRightWidth: 9, borderTopWidth: 13,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#4C59D7', marginTop: -2,
  },
});

const iconS = StyleSheet.create({
  googleRing: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleG: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#4285F4', lineHeight: 13 },
  linkedInBox: {
    width: 20, height: 20, borderRadius: 3,
    backgroundColor: '#0077B5',
    alignItems: 'center', justifyContent: 'center',
  },
  linkedInIn: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', lineHeight: 12 },
});

// ─── Animated press scale for social buttons ──────────────────────────────────
function SocialBtn({ onPress, children, disabled }: {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.socialBtn, socialShadow, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={s.socialBtnInner}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'linkedin' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  // Shake refs per field
  const emailShake = useRef(new Animated.Value(0)).current;
  const pwShake = useRef(new Animated.Value(0)).current;

  // ── Button enabled (any content in both fields) ─────────────────────────────
  const canSubmit = useMemo(
    () => email.length > 0 && password.length > 0 && !isLoading,
    [email, password, isLoading],
  );

  // ── Animated button background ──────────────────────────────────────────────
  const btnBgAnim = useRef(new Animated.Value(canSubmit ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(btnBgAnim, {
      toValue: canSubmit ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [canSubmit]);
  const animatedBtnBg = btnBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C7CCF5', '#4C59D7'],
  });

  // ── Entrance animations ─────────────────────────────────────────────────────
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(10)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(8)).current;
  const emailOp = useRef(new Animated.Value(0)).current;
  const emailY = useRef(new Animated.Value(8)).current;
  const pwOp = useRef(new Animated.Value(0)).current;
  const pwY = useRef(new Animated.Value(8)).current;
  const forgotOp = useRef(new Animated.Value(0)).current;
  const btnOp = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(8)).current;
  const socialOp = useRef(new Animated.Value(0)).current;
  const signupOp = useRef(new Animated.Value(0)).current;

  const anim = (val: Animated.Value, to: number, delay: number, dur = 350) =>
    Animated.timing(val, { toValue: to, duration: dur, delay, useNativeDriver: true });

  useEffect(() => {
    Animated.parallel([
      anim(logoOp, 1, 0, 400), anim(logoY, 0, 0, 400),
      anim(titleOp, 1, 100), anim(titleY, 0, 100),
      anim(emailOp, 1, 180), anim(emailY, 0, 180),
      anim(pwOp, 1, 240), anim(pwY, 0, 240),
      anim(forgotOp, 1, 300, 300),
      anim(btnOp, 1, 340), anim(btnY, 0, 340),
      anim(socialOp, 1, 420, 300),
      anim(signupOp, 1, 480, 300),
    ]).start();
  }, []);

  // ── Shake animation ─────────────────────────────────────────────────────────
  const doShake = (anim: Animated.Value) =>
    Animated.sequence([
      Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    let hasError = false;

    // Validate
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email');
      doShake(emailShake).start();
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      doShake(pwShake).start();
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('invalid') ||
          error.message.toLowerCase().includes('credentials')
        ) {
          setPasswordError('Incorrect email or password');
          doShake(pwShake).start();
        } else {
          setToastMsg(error.message);
        }
        return;
      }

      // Success — RootNavigator handles role-based routing automatically
      // via AuthContext session change. No manual navigate needed.
      if (!data.user) {
        setToastMsg('Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'linkedin') => {
    setOauthLoading(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithLinkedIn();
    } catch (err: any) {
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismiss')) {
        setToastMsg(err?.message ?? 'Sign-in failed. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const busy = isLoading || oauthLoading !== null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header: back arrow only ── */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
            </TouchableOpacity>
          </View>

          {/* ── Logo block (small, centered) ── */}
          <Animated.View style={[s.logoBlock, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
            <View style={[s.logoCard, logoShadow]}>
              <MiniLightningBolt />
            </View>
          </Animated.View>

          {/* ── Title ── */}
          <Animated.View style={[s.titleBlock, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.subheading}>Sign in to continue</Text>
          </Animated.View>

          {/* ── Email field ── */}
          <Animated.View style={{ opacity: emailOp, transform: [{ translateY: emailY }, { translateX: emailShake }] }}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Email</Text>
              <View style={[
                s.inputWrap,
                emailFocused && s.inputFocused,
                !!emailError && s.inputError,
              ]}>
                <TextInput
                  style={s.input as any}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="Enter your email"
                  placeholderTextColor="#B0B8D0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  selectionColor="#4C59D7"
                />
              </View>
              {!!emailError && <Text style={s.errorText}>⚠ {emailError}</Text>}
            </View>
          </Animated.View>

          {/* ── Password field ── */}
          <Animated.View style={{ opacity: pwOp, transform: [{ translateY: pwY }, { translateX: pwShake }] }}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Password</Text>
              <View style={[
                s.inputWrap,
                pwFocused && s.inputFocused,
                !!passwordError && s.inputError,
              ]}>
                <TextInput
                  style={[s.input, { flex: 1 }] as any}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder="Enter your password"
                  placeholderTextColor="#B0B8D0"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  selectionColor="#4C59D7"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  activeOpacity={0.7}
                  style={s.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={showPassword ? '#4C59D7' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={s.errorText}>⚠ {passwordError}</Text>}
            </View>
          </Animated.View>

          {/* ── Forgot password link ── */}
          <Animated.View style={[s.forgotRow, { opacity: forgotOp }]}>
            <TouchableOpacity
              onPress={() => setShowForgot(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Sign In button ── */}
          <Animated.View style={[{ opacity: btnOp, transform: [{ translateY: btnY }] }, canSubmit ? submitShadow : {}]}>
            <Animated.View style={[s.submitBtn, { backgroundColor: animatedBtnBg }]}>
              <TouchableOpacity
                style={s.submitBtnInner}
                onPress={handleSignIn}
                disabled={!canSubmit}
                activeOpacity={canSubmit ? 0.85 : 1}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={[s.submitBtnText, !canSubmit && { opacity: 0.5 }]}>Sign In</Text>}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── OR divider ── */}
          <Animated.View style={[s.dividerRow, { opacity: socialOp }]}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.dividerLine} />
          </Animated.View>

          {/* ── Social buttons (secondary, equal outlined style) ── */}
          <Animated.View style={[s.socialRow, { opacity: socialOp }]}>
            <SocialBtn onPress={() => handleOAuth('google')} disabled={busy}>
              {oauthLoading === 'google'
                ? <ActivityIndicator color="#4285F4" size="small" />
                : <><GoogleIcon /><Text style={s.socialLabel}>Google</Text></>}
            </SocialBtn>

            <SocialBtn onPress={() => handleOAuth('linkedin')} disabled={busy}>
              {oauthLoading === 'linkedin'
                ? <ActivityIndicator color="#0077B5" size="small" />
                : <><LinkedInIcon /><Text style={s.socialLabel}>LinkedIn</Text></>}
            </SocialBtn>
          </Animated.View>

          {/* ── Sign up link ── */}
          <Animated.View style={[s.signUpRow, { opacity: signupOp }]}>
            <Text style={s.signUpPrefix}>Don't have an account? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.signUpLink}>Sign up free</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error toast */}
      <ErrorToast message={toastMsg} onDismiss={() => setToastMsg(null)} />

      {/* Forgot Password bottom sheet */}
      <ForgotPasswordSheet visible={showForgot} onClose={() => setShowForgot(false)} />
    </SafeAreaView>
  );
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
const logoShadow = Platform.select({
  web: { boxShadow: '0px 2px 12px rgba(76,89,215,0.10)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3 },
});

const submitShadow = Platform.select({
  web: { boxShadow: '0px 8px 20px rgba(76,89,215,0.30)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 8 },
});

const socialShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(76,89,215,0.06)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 24, paddingBottom: 16 },

  // Header — back arrow only
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  backBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  // Logo block
  logoBlock: { alignItems: 'center', marginTop: 8 },
  logoCard: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#F4F6FF',
    alignItems: 'center', justifyContent: 'center',
  },

  // Title
  titleBlock: { alignItems: 'center', marginTop: 16 },
  heading: {
    fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E', textAlign: 'center',
  },
  subheading: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', textAlign: 'center', marginTop: 6,
  },

  // Form fields
  fieldGroup: { marginTop: 20 },
  fieldLabel: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A2E', marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 12,
    borderWidth: 1, borderColor: '#D0D7FF',
    backgroundColor: '#F4F6FF',
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderWidth: 1.5, borderColor: '#4C59D7',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF8F8',
  },
  input: {
    flex: 1, fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    outlineWidth: 0, padding: 0,
  },
  eyeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#EF4444', marginTop: 5,
  },

  // Forgot link
  forgotRow: { alignItems: 'flex-end', marginTop: 8 },
  forgotLink: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7',
  },

  // Sign In button
  submitBtn: {
    marginTop: 24, height: 56, borderRadius: 16,
    overflow: 'hidden',
  },
  submitBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: {
    fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF',
  },

  // OR divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8EAFF' },
  dividerText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },

  // Social buttons (secondary, side by side, equal outlined)
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  socialBtn: {
    flex: 1, height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8EAFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  socialBtnInner: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  socialLabel: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A1A2E',
  },

  // Sign up link
  signUpRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 24,
  },
  signUpPrefix: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
  signUpLink: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
});
