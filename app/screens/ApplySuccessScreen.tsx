/**
 * ApplySuccessScreen — Shown after tapping "Apply Now" on JobDetailScreen.
 * Presented as a stack modal (slides up from bottom).
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type NavProp   = NativeStackNavigationProp<MainStackParamList>;
type RoutePrm  = RouteProp<MainStackParamList, 'ApplySuccess'>;

// ── Timeline steps ────────────────────────────────────────────────────────────
const STEPS = [
  { icon: 'eye-outline' as const,          title: 'Profile Review',          sub: 'They\'ll review your verified profile' },
  { icon: 'chatbubble-outline' as const,   title: 'Assessment (if required)', sub: 'Complete skill challenge if requested' },
  { icon: 'calendar-outline' as const,     title: 'Interview',                sub: 'Schedule if shortlisted' },
];

export const ApplySuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePrm>();
  const { jobTitle, companyName, matchScore, companyInitial } = route.params;

  // ── Animated values ──────────────────────────────────────────────────────
  const screenAnim    = useRef(new Animated.Value(0)).current;
  const checkScale    = useRef(new Animated.Value(0)).current;
  const pulseScale    = useRef(new Animated.Value(1)).current;
  const pulseOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(12)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;
  const btnTranslate  = useRef(new Animated.Value(8)).current;
  const stepAnims     = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Screen entrance
    Animated.timing(screenAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Checkmark spring: 0 → 1.2 → 1
    setTimeout(() => {
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }).start(() => {
        // Pulse ring
        Animated.loop(
          Animated.parallel([
            Animated.timing(pulseScale,   { toValue: 1.5, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0,   duration: 800, useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ).start();
        pulseOpacity.setValue(1);
      });
    }, 300);

    // "Application Sent!" text
    setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 500);

    // Company card
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity,    { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(cardTranslate,  { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 700);

    // Timeline steps stagger
    stepAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      }, 800 + i * 120);
    });

    // Buttons
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btnOpacity,    { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(btnTranslate,  { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 1100);
  }, []);

  const matchBadgeColor = matchScore >= 80
    ? { bg: '#EEF0FF', text: '#4C59D7', border: '#849CFF' }
    : matchScore >= 60
    ? { bg: '#FFF8E6', text: '#F57C00', border: '#FBBF24' }
    : { bg: '#FFF0F0', text: '#EF4444', border: '#FCA5A5' };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── SUCCESS ICON ─────────────────────────────────────── */}
        <View style={s.iconWrap}>
          {/* Pulse ring */}
          <Animated.View
            style={[
              s.pulseRing,
              { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          {/* Checkmark circle */}
          <Animated.View
            style={[
              s.checkCircle,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </Animated.View>
        </View>

        {/* ── HEADLINE ─────────────────────────────────────────── */}
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={s.headline}>Application Sent!</Text>
          <Text style={s.subline}>{companyName} will review your profile</Text>
        </Animated.View>

        {/* ── JOB CARD ─────────────────────────────────────────── */}
        <Animated.View
          style={[
            s.jobCard,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
          ]}
        >
          <View style={s.jobCardRow}>
            <View style={s.jobLogo}>
              <Text style={s.jobLogoText}>{companyInitial}</Text>
            </View>
            <View style={s.jobInfo}>
              <Text style={s.jobTitle} numberOfLines={1}>{jobTitle}</Text>
              <Text style={s.jobCompany}>{companyName}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.matchRow}>
            <Text style={s.matchLabel}>Your match score</Text>
            <Text style={[s.matchValue, { color: matchBadgeColor.text }]}>
              {matchScore}% Match
            </Text>
          </View>
        </Animated.View>

        {/* ── WHAT HAPPENS NEXT ─────────────────────────────────── */}
        <Animated.View
          style={[
            s.timelineWrap,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
          ]}
        >
          <Text style={s.timelineTitle}>What happens next?</Text>

          {STEPS.map((step, i) => (
            <Animated.View
              key={i}
              style={[
                s.timelineStep,
                { opacity: stepAnims[i] },
              ]}
            >
              <View style={s.timelineLeft}>
                <View style={s.stepIconCircle}>
                  <Ionicons name={step.icon} size={16} color="#4C59D7" />
                </View>
                {i < STEPS.length - 1 && <View style={s.connector} />}
              </View>
              <View style={s.stepText}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepSub}>{step.sub}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── BOTTOM BUTTONS ───────────────────────────────────────── */}
      <Animated.View
        style={[
          s.bottomBar,
          { opacity: btnOpacity, transform: [{ translateY: btnTranslate }] },
        ]}
      >
        <TouchableOpacity
          style={s.primaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('MainTabs');
          }}
        >
          <Text style={s.primaryBtnText}>View Application Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('MainTabs');
          }}
        >
          <Text style={s.secondaryBtnText}>Keep Browsing Jobs</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:      { flex: 1 },
  scrollContent: { paddingTop: 48, paddingHorizontal: 24, alignItems: 'center' },

  // Icon
  iconWrap:   { alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', width: 100, height: 100 },
  pulseRing:  {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: '#22C55E',
  },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F0FFF4', borderWidth: 2, borderColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
  },

  // Headline
  headline:  { fontSize: 28, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', marginBottom: 8 },
  subline:   { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },

  // Job card
  jobCard: {
    width: '100%', backgroundColor: '#F8F9FF',
    borderWidth: 1, borderColor: '#D0D7FF', borderRadius: 16, padding: 20, marginBottom: 28,
  },
  jobCardRow:  { flexDirection: 'row', alignItems: 'center' },
  jobLogo:     { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  jobLogoText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  jobInfo:     { flex: 1 },
  jobTitle:    { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  jobCompany:  { fontSize: 14, color: '#6B7280', marginTop: 2 },
  divider:     { height: 1, backgroundColor: '#E8EAFF', marginVertical: 14 },
  matchRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchLabel:  { fontSize: 13, color: '#6B7280' },
  matchValue:  { fontSize: 14, fontWeight: '700' },

  // Timeline
  timelineWrap:  { width: '100%', marginBottom: 16 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  timelineStep:  { flexDirection: 'row', marginBottom: 0 },
  timelineLeft:  { alignItems: 'center', width: 32, marginRight: 14 },
  stepIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center',
  },
  connector: { width: 1, flex: 1, backgroundColor: '#E8EAFF', minHeight: 24, marginVertical: 4 },
  stepText:  { flex: 1, paddingBottom: 20 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  stepSub:   { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  primaryBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...Platform.select({
      web:     { boxShadow: '0px 8px 20px rgba(76,89,215,0.25)' } as any,
      default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
    }),
  },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn:     {
    height: 52, borderRadius: 16, backgroundColor: '#F4F6FF',
    borderWidth: 1, borderColor: '#D0D7FF',
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '500', color: '#6B7280' },
});
