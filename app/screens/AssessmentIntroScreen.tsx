/**
 * AssessmentIntroScreen — Round 2 intro card.
 * Redesigned to strictly match the provided layout spec.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Clock, ListChecks, Star, ArrowRight, CheckCircle, ArrowLeft, Heart } from 'lucide-react-native';
import { Assessment } from '../types/assessment';
import type { MainStackParamList } from '../navigation/MainTabNavigator';

type Nav  = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'AssessmentIntro'>;

export default function AssessmentIntroScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { assessment } = params;

  const handleStart = () => {
    navigation.replace('AssessmentTest', { assessment });
  };

  const handleDismiss = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ROW 1 — NAV BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={handleDismiss}>
          <ArrowLeft size={22} color="#0A0A0A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Start Assessment</Text>
        <TouchableOpacity>
          <Heart size={22} color="#0A0A0A" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ROW 2 — COMPANY BANNER */}
      <View style={styles.companyBanner}>
        <View style={styles.companyLogoBox}>
          <Text style={styles.companyLogoText}>
            {assessment.companyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.notificationText} numberOfLines={1}>
          {assessment.companyName} wants to verify your skills
        </Text>
      </View>

      {/* LAYER 2 — MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* ELEMENT 1 — ICON BOX */}
        <View style={styles.iconBox}>
          <ShieldCheck size={32} color="#4F46E5" strokeWidth={2} />
        </View>

        {/* ELEMENT 2 — HEADING */}
        <Text style={styles.heading} numberOfLines={1}>Technical Challenge</Text>

        {/* ELEMENT 3 — SUBTITLE */}
        <Text style={styles.subtitle}>
          Answer questions to prove your skills.{'\n'}No right way to think — just respond authentically.
        </Text>

        {/* ELEMENT 4 — STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={18} color="#4F46E5" strokeWidth={2} style={styles.statIcon} />
            <Text style={styles.statNumber}>{assessment.timeLimit}</Text>
            <Text style={styles.statLabel}>MIN</Text>
          </View>
          <View style={styles.statCard}>
            <ListChecks size={18} color="#4F46E5" strokeWidth={2} style={styles.statIcon} />
            <Text style={styles.statNumber}>{assessment.questions?.length > 0 ? assessment.questions.length : 10}</Text>
            <Text style={styles.statLabel}>QUESTIONS</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={18} color="#4F46E5" strokeWidth={2} style={styles.statIcon} />
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>BADGE</Text>
          </View>
        </View>

        {/* ELEMENT 5 — PASSING SCORE PILL */}
        <View style={styles.passingPill}>
          <CheckCircle size={14} color="#16A34A" strokeWidth={2} />
          <Text style={styles.passingText}>
            Passing score: <Text style={styles.passingScoreBold}>{assessment.passingScore}%</Text>
          </Text>
        </View>
      </View>

      {/* LAYER 3 — BOTTOM ACTIONS */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startText}>Start Challenge</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // Mobile strict 390px
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    overflow: 'hidden',
  },

  // ROW 1 — NAV BAR
  navBar: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
    color: '#0A0A0A',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },

  // ROW 2 — COMPANY BANNER
  companyBanner: {
    width: '100%',
    height: 44,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companyLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  notificationText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#4F46E5',
  },

  // LAYER 2 — MAIN CONTENT
  mainContent: {
    width: '100%',
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // ELEMENT 1 — ICON BOX
  iconBox: {
    width: 72,
    height: 72,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  // ELEMENT 2 — HEADING
  heading: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    color: '#0A0A0A',
    textAlign: 'center',
    lineHeight: 33.6,
    marginBottom: 12,
  },

  // ELEMENT 3 — SUBTITLE
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: 36,
  },

  // ELEMENT 4 — STATS ROW
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    height: 80,
    backgroundColor: '#F8F8FF',
    borderWidth: 1,
    borderColor: '#EBEBFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: '#0A0A0A',
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ELEMENT 5 — PASSING SCORE PILL
  passingPill: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#444444',
  },
  passingScoreBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#16A34A',
  },

  // LAYER 3 — BOTTOM ACTIONS
  bottomActions: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  startBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(79,70,229,0.28)' } as any,
      default: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  startText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  notNowText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});
