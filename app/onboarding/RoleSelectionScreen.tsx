/**
 * RoleSelectionScreen — "I am a..." role picker
 *
 * Fixed:
 *  ✓ Back arrow header
 *  ✓ Dead space eliminated (flex spacer capped at 80pt)
 *  ✓ 14px gap between cards
 *  ✓ 52×52 Ionicons icon squares with color transition
 *  ✓ Checkmark radio (filled circle + white ✓)
 *  ✓ Card shadow + animated border/bg on select
 *  ✓ Continue button disabled → enabled color animation
 *  ✓ Haptic on card selection
 *  ✓ Stagger entrance animations
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { upsertProfile, UserRole } from '../lib/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND      = '#4C59D7';
const BRAND_LITE = '#EEF0FF';
const BRAND_MID  = '#849CFF';
const BG         = '#F8F9FF';
const DARK       = '#1A1A2E';
const GRAY       = '#6B7280';
const BORDER_DEF = '#E8EAFF';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RoleSelection'>;

// ─── RoleCard ─────────────────────────────────────────────────────────────────

interface RoleCardProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  entranceAnim: Animated.Value;
  fixedIconBg?: string;
  imageSource?: any;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title,
  subtitle,
  iconName,
  selected,
  onPress,
  entranceAnim,
  fixedIconBg,
  imageSource,
}) => {
  // Selection progress 0 → 1
  const selAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  // Press scale
  const pressScale = useRef(new Animated.Value(1)).current;
  // Icon container scale spring
  const iconScale = useRef(new Animated.Value(1)).current;
  // Radio fill + checkmark scale
  const radioAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selAnim, {
      toValue: selected ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(radioAnim, {
      toValue: selected ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (selected) {
      // Icon bounce spring
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.1, duration: 120, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [selected]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.975,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  // Interpolated colors
  const cardBg = '#FFFFFF';
  const borderColor = '#E8E8E8';
  const iconBg = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BRAND_LITE, BRAND],
  });
  const radioBg = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', BRAND],
  });
  const radioBorder = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D0D7FF', BRAND],
  });
  const titleColor = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DARK, '#3B43A7'],
  });
  const subtitleColor = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GRAY, BRAND],
  });

  return (
    <Animated.View
      style={[
        cardStyles.entrance,
        {
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
            { scale: pressScale },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Animated.View
          style={[
            cardStyles.card,
            {
              backgroundColor: cardBg,
              borderColor,
              borderWidth: selected ? 2 : 1.5,
            } as any,
          ]}
        >
          {/* Icon square */}
          <Animated.View
            style={[
              cardStyles.iconWrap,
              {
                backgroundColor: fixedIconBg ? fixedIconBg : iconBg,
                transform: [{ scale: iconScale }],
              } as any,
            ]}
          >
            {imageSource ? (
              <Image 
                source={imageSource} 
                style={{ width: 28, height: 28, tintColor: '#FFFFFF', resizeMode: 'contain' }} 
              />
            ) : (
              <Ionicons
                name={iconName}
                size={26}
                color={selected ? '#FFFFFF' : BRAND}
              />
            )}
          </Animated.View>

          {/* Text */}
          <View style={cardStyles.textBlock}>
            <Animated.Text style={[cardStyles.title, { color: titleColor } as any]}>
              {title}
            </Animated.Text>
            <Animated.Text style={[cardStyles.subtitle, { color: subtitleColor } as any]}>
              {subtitle}
            </Animated.Text>
          </View>

          {/* Radio */}
          <Animated.View
            style={[
              cardStyles.radio,
              {
                backgroundColor: radioBg,
                borderColor: radioBorder,
                borderWidth: selected ? 0 : 2,
              } as any,
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: radioAnim }],
                opacity: radioAnim,
              }}
            >
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Entrance animations ────────────────────────────────────────────────────
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const cardAAnim   = useRef(new Animated.Value(0)).current;
  const cardBAnim   = useRef(new Animated.Value(0)).current;
  const buttonAnim  = useRef(new Animated.Value(0)).current;

  // Continue button enable animation
  const enableAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.stagger(80, [
      Animated.timing(titleAnim,  { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardAAnim,  { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardBAnim,  { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(enableAnim, {
      toValue: selectedRole ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // interpolateColor needs false
    }).start();
  }, [selectedRole]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectRole = useCallback((role: UserRole) => {
    setSelectedRole(role);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleContinue = async () => {
    if (!selectedRole || saving) return;
    setSaving(true);
    try {
      if (user) {
        await upsertProfile(user.id, { role: selectedRole });
        await refreshProfile();
      }
    } catch (err: any) {
      console.warn('[RoleSelection] Could not save role:', err?.message);
    } finally {
      setSaving(false);
      if (selectedRole === 'employer') {
        navigation.navigate('EmployerOnboarding');
      } else {
        navigation.navigate('ProfileBuilder');
      }
    }
  };

  // ── Button style interpolations ───────────────────────────────────────────

  const btnBg = enableAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#C7CCF5', BRAND],
  });

  const btnTranslateY = enableAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Header with back arrow ─────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <View style={styles.body}>

        {/* Title block */}
        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Top Logo Badge */}
          <View style={styles.iconBadge}>
            <Image 
              source={require('../../assets/images/align-icon.png')} 
              style={{ width: 28, height: 28, resizeMode: 'contain', tintColor: BRAND }} 
            />
          </View>

          <Text style={styles.heading}>I am a...</Text>
          <Text style={styles.subheading}>
            Select your primary goal to personalize{'\n'}your experience.
          </Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cards}>
          <RoleCard
            title="I'm looking for work"
            subtitle="Find roles matched to your real skills"
            iconName="laptop-outline"
            selected={selectedRole === 'candidate'}
            onPress={() => handleSelectRole('candidate')}
            entranceAnim={cardAAnim}
          />

          <View style={styles.cardGap} />

          <RoleCard
            title="I'm hiring"
            subtitle="Find verified talent, fast"
            iconName="briefcase-outline"
            selected={selectedRole === 'employer'}
            onPress={() => handleSelectRole('employer')}
            entranceAnim={cardBAnim}
          />
        </View>

        {/* Flex spacer — capped so button stays close to cards */}
        <View style={styles.spacer} />

        {/* Continue button */}
        <Animated.View
          style={[
            styles.btnWrapper,
            {
              opacity: buttonAnim,
              transform: [{ translateY: btnTranslateY }],
            },
          ]}
        >
          <Pressable
            onPress={handleContinue}
            disabled={!selectedRole || saving}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !selectedRole || saving }}
          >
            <Animated.View
              style={[
                styles.btn,
                { backgroundColor: btnBg } as any,
                selectedRole && !saving && styles.btnShadow,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    !selectedRole && styles.btnTextDisabled,
                  ]}
                >
                  Continue
                </Text>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

// ─── Card Styles ──────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
});

const cardShadowSelected = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  android: { elevation: 6 },
  default: {},
});

const cardStyles = StyleSheet.create({
  entrance: {
    // no flex here — let natural height from card
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 3,
    lineHeight: 19,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

const btnShadow = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
  },
  android: { elevation: 8 },
  default: {},
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Body
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },

  // ── Title block
  titleBlock: {
    alignItems: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND_LITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: DARK,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 280,
  },

  // ── Cards
  cards: {
    marginTop: 40,
  },
  cardGap: {
    height: 14,
  },

  // ── Spacer (capped so button stays close to cards)
  spacer: {
    flex: 1,
    maxHeight: 80,
  },

  // ── Continue button
  btnWrapper: {
    // no extra padding — body paddingBottom handles it
  },
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnShadow: {
    ...btnShadow,
  } as any,
  btnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  btnTextDisabled: {
    opacity: 0.65,
  },
});
