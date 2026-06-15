/**
 * WelcomeScreen — TALENT.LOGIC splash / auth entry
 *
 * Design spec fixes applied:
 *  1. Logo icon: pure-View lightning bolt (no image asset dependency)
 *  2. Button hierarchy: Google + LinkedIn = outlined (#E8EAFF border)
 *     Email = outlined with #4C59D7 border (more prominent, not filled)
 *  3. Spacing: flex layout, no hardcoded gaps between logo and buttons
 *  4. "or" divider: between social group and email button
 *  5. Button order: Google → LinkedIn → [or] → Email
 *  6. Entrance animations: logo slides up + fades, buttons stagger in
 *  7. Press animations: scale 1 → 0.97 on press
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { signInWithGoogle, signInWithLinkedIn } from '../lib/auth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;
type OAuthProvider = 'google' | 'linkedin' | null;

// ─── Pure-View Icons ──────────────────────────────────────────────────────────

const LightningBolt: React.FC = () => (
  <View style={bolt.wrap}>
    {/* Top triangle of bolt */}
    <View style={bolt.top} />
    {/* Bottom triangle of bolt */}
    <View style={bolt.bottom} />
  </View>
);

const bolt = StyleSheet.create({
  wrap: { width: 32, height: 48, alignItems: 'center' },
  top: {
    width: 0, height: 0,
    borderLeftWidth: 16, borderRightWidth: 8, borderBottomWidth: 28,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#4C59D7',
  },
  bottom: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 16, borderTopWidth: 26,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#4C59D7',
    marginTop: -4,
  },
});

const GoogleIcon: React.FC = () => (
  <View style={iconS.googleRing}>
    <Text style={iconS.googleG}>G</Text>
  </View>
);

const LinkedInIcon: React.FC = () => (
  <View style={iconS.linkedInBox}>
    <Text style={iconS.linkedInIn}>in</Text>
  </View>
);

const MailIcon: React.FC = () => (
  <View style={iconS.mailBox}>
    {/* envelope body */}
    <View style={iconS.mailBody} />
    {/* envelope flap */}
    <View style={iconS.mailFlapLeft} />
    <View style={iconS.mailFlapRight} />
  </View>
);

const iconS = StyleSheet.create({
  googleRing: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleG: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#4285F4', lineHeight: 15 },
  linkedInBox: {
    width: 24, height: 24, borderRadius: 5,
    backgroundColor: '#0A66C2',
    alignItems: 'center', justifyContent: 'center',
  },
  linkedInIn: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', lineHeight: 14 },
  mailBox: { width: 22, height: 16, position: 'relative', justifyContent: 'center' },
  mailBody: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1.5, borderColor: '#4C59D7', borderRadius: 3,
    backgroundColor: 'transparent',
  },
  mailFlapLeft: {
    position: 'absolute', top: 0, left: 0,
    width: 0, height: 0,
    borderLeftWidth: 11, borderTopWidth: 9,
    borderLeftColor: 'transparent', borderTopColor: '#4C59D7',
  },
  mailFlapRight: {
    position: 'absolute', top: 0, right: 0,
    width: 0, height: 0,
    borderRightWidth: 11, borderTopWidth: 9,
    borderRightColor: 'transparent', borderTopColor: '#4C59D7',
  },
});

// ─── Animated button with scale press ────────────────────────────────────────

function AnimatedBtn({
  onPress,
  style,
  children,
  disabled,
  delay,
}: {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
  disabled?: boolean;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 350,
        delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 350,
        delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97, useNativeDriver: true,
      speed: 50, bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true,
      speed: 30, bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider>(null);

  // Logo entrance animation
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo slides up
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 500, delay: 100, useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0, duration: 500, delay: 100, useNativeDriver: true,
      }),
    ]).start();

    // Tagline fades in after logo
    Animated.timing(taglineOpacity, {
      toValue: 1, duration: 400, delay: 350, useNativeDriver: true,
    }).start();
  }, []);

  const handleOAuth = async (provider: 'google' | 'linkedin') => {
    setLoadingProvider(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithLinkedIn();
      navigation.navigate('RoleSelection');
    } catch (err: any) {
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('dismiss')) {
        Alert.alert('Sign-in failed', err?.message ?? 'Please try again.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const busy = loadingProvider !== null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Logo section — vertically centered in remaining space ── */}
      <View style={s.logoSection}>
        <Animated.View style={[s.logoCardWrap, {
          opacity: logoOpacity,
          transform: [{ translateY: logoY }],
        }]}>
          {/* Logo card */}
          <View style={[s.logoCard, cardShadow]}>
            <LightningBolt />
          </View>

          {/* App name */}
          <Text style={s.wordmark}>TALENT.LOGIC</Text>
        </Animated.View>

        {/* Tagline fades in separately */}
        <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
          Skills speak. Resumes don't.
        </Animated.Text>
      </View>

      {/* ── Button section — pinned to bottom ── */}
      <View style={s.bottomSection}>

        {/* BUTTON 1 — Google */}
        <AnimatedBtn
          delay={500}
          disabled={busy}
          onPress={() => handleOAuth('google')}
          style={[s.socialBtn, btnShadow]}
        >
          <View style={s.btnInner}>
            {loadingProvider === 'google'
              ? <ActivityIndicator color="#4285F4" size="small" />
              : <GoogleIcon />}
            <Text style={s.socialBtnText}>Continue with Google</Text>
          </View>
        </AnimatedBtn>

        {/* BUTTON 2 — LinkedIn */}
        <AnimatedBtn
          delay={580}
          disabled={busy}
          onPress={() => handleOAuth('linkedin')}
          style={[s.socialBtn, s.btnGap, btnShadow]}
        >
          <View style={s.btnInner}>
            {loadingProvider === 'linkedin'
              ? <ActivityIndicator color="#0A66C2" size="small" />
              : <LinkedInIcon />}
            <Text style={s.socialBtnText}>Continue with LinkedIn</Text>
          </View>
        </AnimatedBtn>

        {/* OR DIVIDER — between social and email */}
        <Animated.View style={[s.dividerRow, {
          opacity: logoOpacity, // reuse same animation timing
        }]}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </Animated.View>

        {/* BUTTON 3 — Email (outlined, #4C59D7 border) */}
        <AnimatedBtn
          delay={660}
          disabled={busy}
          onPress={() => navigation.navigate('SignUp')}
          style={s.emailBtn}
        >
          <View style={s.btnInner}>
            <MailIcon />
            <Text style={s.emailBtnText}>Sign up with Email</Text>
          </View>
        </AnimatedBtn>

        {/* Sign in link */}
        <Animated.View style={[s.signInRow, { opacity: taglineOpacity }]}>
          <Text style={s.signInPrefix}>Already have an account? </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={s.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Animated.View style={{ opacity: taglineOpacity }}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
            <Text style={s.terms}>
              By continuing you agree to our{' '}
              <Text style={s.termsLink}>Terms</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ─── Shadows ──────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  web: { boxShadow: '0px 4px 16px rgba(76,89,215,0.12)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
});

const btnShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(76,89,215,0.06)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Logo section fills all space above the buttons
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCardWrap: {
    alignItems: 'center',
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#F4F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 20,
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4C59D7',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Button section pinned to bottom
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // Social buttons (Google + LinkedIn) — outlined, #E8EAFF border
  socialBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGap: { marginTop: 12 },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A2E',
  },

  // OR divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8EAFF' },
  dividerText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
  },

  // Email button — outlined with #4C59D7 border (not filled)
  emailBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4C59D7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },

  // Sign in row
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInPrefix: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4C59D7',
  },

  // Terms
  terms: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  termsLink: {
    color: '#4C59D7',
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});
