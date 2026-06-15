/**
 * AssessmentIntroScreen — Round 2 intro card.
 * Shows company name, challenge details, time/questions/badge stats.
 * Matches reference image 1.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Clock, List, Star, ArrowRight } from 'lucide-react-native';
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

      {/* Company banner */}
      <View style={styles.companyBanner}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>
            {assessment.companyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.companyText}>
          <Text style={styles.companyBold}>{assessment.companyName}</Text>
          {' '}wants to verify your skills
        </Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* Shield badge */}
        <View style={styles.badgeCircle}>
          <ShieldCheck size={40} color="#4F46E5" strokeWidth={2} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Technical{'\n'}Challenge</Text>
        <Text style={styles.subtitle}>
          Answer questions to prove your skills.{'\n'}
          No right way to think — just respond authentically.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon={<Clock size={22} color="#4F46E5" />} value={String(assessment.timeLimit)} label="MIN" />
          <StatCard icon={<List size={22} color="#4F46E5" />} value={String(assessment.questions.length)} label="QUESTIONS" />
          <StatCard icon={<Star size={22} color="#4F46E5" />} value="1" label="BADGE" />
        </View>

        {/* Passing score note */}
        <View style={styles.passingNote}>
          <Text style={styles.passingText}>
            Passing score: <Text style={styles.passingScore}>{assessment.passingScore}%</Text>
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startText}>Start Challenge</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  companyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingVertical: 16,
  },
  companyIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  companyInitial: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  companyText: { fontSize: 13, color: '#666666', flex: 1 },
  companyBold: { fontWeight: '700', color: '#0A0A0A' },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },

  badgeCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(79,70,229,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 34, fontWeight: '800', color: '#0A0A0A',
    textAlign: 'center', lineHeight: 40, marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, color: '#666666', textAlign: 'center',
    lineHeight: 22, marginBottom: 36,
  },

  statsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 20,
  },
  statCard: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: '#F8F7FF',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.8 },

  passingNote: {
    backgroundColor: 'rgba(79,70,229,0.06)',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  passingText: { fontSize: 13, color: '#666666' },
  passingScore: { fontWeight: '700', color: '#4F46E5' },

  actions: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  startBtn: {
    height: 56, backgroundColor: '#4F46E5', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(79,70,229,0.35)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    }),
  },
  startText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  dismissBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  dismissText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
});
