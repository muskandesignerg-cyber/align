/**
 * DashboardScreen — Premium redesign.
 *
 * Self-contained screen with:
 *  • Inline header: "Dashboard" title + bell with red dot
 *  • 3 stat cards: Applied / In Review / Interview
 *  • 3 unique application cards with labeled stage tracker
 *  • Floating nav bar handled by FloatingNavBar at root level
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainTabNavigator';
import type { Job } from '../types/jobs';
import { useDashboard } from '../context/DashboardContext';

// ─── Card data type ────────────────────────────────────────────────────────────

type StatusType = 'Applied' | 'In Review' | 'Assessment Sent' | 'Interviewing' | 'Offer' | 'Rejected';

interface CardData {
  id: string;
  companyInitial: string;
  companyName: string;
  jobTitle: string;
  location: string;
  status: StatusType;
  stage: number; // 1–4
  postedDate: string;
}

// ─── Static display cards ─────────────────────────────────────────────────────

const DISPLAY_CARDS: CardData[] = [
  {
    id: 'c1',
    companyInitial: 'L',
    companyName: 'Luminary Health',
    jobTitle: 'Mobile Engineer',
    location: 'Bangalore',
    status: 'Applied',
    stage: 1,
    postedDate: 'Applied Today',
  },
  {
    id: 'c2',
    companyInitial: 'E',
    companyName: 'Exposys Data Labs',
    jobTitle: 'UI/UX Designer',
    location: 'Bangalore',
    status: 'Assessment Sent',
    stage: 2,
    postedDate: 'Applied 2 days ago',
  },
  {
    id: 'c3',
    companyInitial: 'N',
    companyName: 'NovaTech Industries',
    jobTitle: 'Product Manager',
    location: 'Mumbai',
    status: 'Interviewing',
    stage: 3,
    postedDate: 'Applied 5 days ago',
  },
];

// ─── Job data per card (passed to JobDetailScreen) ───────────────────────────

const JOB_DATA: Record<string, Job> = {
  c1: {
    id: 'dashboard-c1',
    companyName: 'Luminary Health',
    roleTitle: 'Mobile Engineer',
    employmentType: 'FULL TIME',
    location: 'Bangalore',
    workModel: 'Remote',
    salaryMin: 1_200_000,
    salaryMax: 1_800_000,
    currency: 'INR',
    matchScore: 88,
    isNew: false,
    postedAt: new Date().toISOString(),
    companySize: '51–200 employees',
    industry: 'Engineering',
    skills: ['React Native', 'Swift', 'Kotlin', 'TypeScript', 'REST APIs', 'Firebase'],
    description:
      'We are looking for a skilled Mobile Engineer to build and maintain high-performance mobile applications for our healthcare platform.',
    companyDescription:
      'Luminary Health builds digital health tools for modern healthcare providers.',
  },
  c2: {
    id: 'dashboard-c2',
    companyName: 'Exposys Data Labs',
    roleTitle: 'UI/UX Designer',
    employmentType: 'FULL TIME',
    location: 'Bangalore',
    workModel: 'Hybrid',
    salaryMin: 600_000,
    salaryMax: 1_400_000,
    currency: 'INR',
    matchScore: 91,
    isNew: false,
    postedAt: new Date().toISOString(),
    companySize: '201–500 employees',
    industry: 'Product Design',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'JavaScript', 'HTML/CSS', 'React', 'User Research', 'Interaction Design'],
    description:
      'We are looking for a talented UI/UX Designer to create intuitive digital experiences across our product suite.',
    companyDescription:
      'A product and tech company building tools for students and early professionals. Founded in 2018.',
  },
  c3: {
    id: 'dashboard-c3',
    companyName: 'NovaTech Industries',
    roleTitle: 'Product Manager',
    employmentType: 'FULL TIME',
    location: 'Mumbai',
    workModel: 'Hybrid',
    salaryMin: 1_800_000,
    salaryMax: 2_800_000,
    currency: 'INR',
    matchScore: 84,
    isNew: false,
    postedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    companySize: '500–1000 employees',
    industry: 'Product',
    skills: ['Product Strategy', 'Roadmapping', 'Agile', 'Jira', 'Analytics', 'Stakeholder Management'],
    description:
      'We are seeking an experienced Product Manager to lead our core product team and drive roadmap execution across multiple business verticals.',
    companyDescription:
      'NovaTech Industries builds enterprise software solutions for businesses across South Asia.',
  },
};

// ─── Status badge config ───────────────────────────────────────────────────────

function getBadge(status: StatusType) {
  switch (status) {
    case 'Applied':
      return { bg: '#EEF2FF', border: '#C7D2FE', color: '#4F46E5', label: 'Applied' };
    case 'In Review':
      return { bg: '#FFF7ED', border: '#FED7AA', color: '#F59E0B', label: 'In Review' };
    case 'Assessment Sent':
      return { bg: '#F0F0FF', border: '#C7C8F0', color: '#4F46E5', label: 'Round 2 ⚡' };
    case 'Interviewing':
      return { bg: '#F0FDF4', border: '#BBF7D0', color: '#10B981', label: 'Round 3 🎤' };
    case 'Offer':
      return { bg: '#FFFBEB', border: '#FDE68A', color: '#F59E0B', label: 'Offer 🎉' };
    case 'Rejected':
      return { bg: '#FFF0F0', border: '#FECACA', color: '#EF4444', label: 'Rejected' };
    default:
      return { bg: '#EEF2FF', border: '#C7D2FE', color: '#4F46E5', label: status };
  }
}

// ─── Count-up stat component ──────────────────────────────────────────────────────────────

function CountUpStat({
  target,
  label,
  color,
  delay = 0,
}: {
  target: number;
  label: string;
  color: string;
  delay?: number;
}) {
  const animated = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: target,
      duration: 900,
      delay,
      useNativeDriver: false, // must be false for number interpolation
    }).start();
  }, [target]);

  return (
    <View style={S.statCard}>
      <Animated.Text
        style={[S.statNum, { color }]}
      >
        {animated.interpolate({
          inputRange: [0, target === 0 ? 1 : target],
          outputRange: ['0', String(target === 0 ? 0 : target)],
        })}
      </Animated.Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Stage Tracker ─────────────────────────────────────────────────────────────

const STAGE_LABELS = ['Applied', 'Round 2', 'Round 3', 'Hired'];

function StageTracker({ stage, rejected = false }: { stage: number; rejected?: boolean }) {
  return (
    <View style={stageS.row}>
      {STAGE_LABELS.map((label, i) => {
        const num = i + 1;
        const active  = !rejected && num <= stage;
        const current = !rejected && num === stage;
        const dotColor = rejected ? '#EF4444' : active ? '#4F46E5' : '#E5E7EB';
        const lineColor = rejected ? '#EF4444' : num < stage && !rejected ? '#4F46E5' : '#E5E7EB';

        return (
          <React.Fragment key={label}>
            {/* Dot only — no label */}
            <View
              style={[
                stageS.dot,
                { backgroundColor: dotColor },
                !active && stageS.dotFuture,
                current && stageS.dotActive,
              ]}
            />
            {/* Connector line */}
            {i < STAGE_LABELS.length - 1 && (
              <View style={[stageS.line, { backgroundColor: lineColor }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function AppCard({ card, onViewDetails }: { card: CardData; onViewDetails: () => void }) {
  const badge = getBadge(card.status);

  return (
    <View style={cardS.card}>

      {/* Row 1 — company logo + name + status badge */}
      <View style={cardS.topRow}>
        <View style={cardS.companyRow}>
          <View style={cardS.logoBox}>
            <Text style={cardS.logoLetter}>{card.companyInitial}</Text>
          </View>
          <Text style={cardS.companyName} numberOfLines={1}>{card.companyName}</Text>
        </View>
        <View style={[cardS.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[cardS.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Row 2 — job title only */}
      <Text style={cardS.jobTitle}>{card.jobTitle}</Text>

      {/* Row 3 — location */}
      <Text style={cardS.location}>{card.location}</Text>

      {/* Row 4 — stage bar */}
      <StageTracker stage={card.stage} rejected={card.status === 'Rejected'} />

      {/* Row 5 — footer: date + View Details */}
      <View style={cardS.footer}>
        <Text style={cardS.dateText}>{card.postedDate}</Text>
        <TouchableOpacity
          onPress={onViewDetails}
          activeOpacity={0.7}
          style={cardS.viewDetailsBtn}
        >
          <Text style={cardS.viewDetails}>View Details →</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const DashboardInner: React.FC = () => {
  const { state, refreshApplications } = useDashboard();
  const navigation = useNavigation<NavProp>();

  // Reload data every time this tab comes into focus — fixes stale-state
  // after applying so data is always fresh without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      refreshApplications();
    }, [refreshApplications]),
  );

  // Stats — use real data from context (falls back to mock in DashboardContext)
  const appliedCount    = state.stats?.applied      ?? 9;
  const inReviewCount   = state.stats?.inReview     ?? 3;
  const interviewCount  = state.stats?.interviewing ?? 1;

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Dashboard</Text>
          <Text style={S.headerSub}>Track your applications</Text>
        </View>
        <TouchableOpacity style={S.bellWrap} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#0A0A0A" strokeWidth={2} />
          <View style={S.bellDot} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.isRefreshing ?? false}
            onRefresh={refreshApplications}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
      >

        {/* Stats row — count-up animated */}
        <View style={S.statsRow}>
          <CountUpStat target={appliedCount}   label="Applied"   color="#4F46E5" delay={0}   />
          <CountUpStat target={inReviewCount}  label="In Review" color="#F59E0B" delay={150} />
          <CountUpStat target={interviewCount} label="Interview" color="#22C55E" delay={300} />
        </View>

        {/* Section header */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Active Applications</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={S.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Cards */}
        {DISPLAY_CARDS.map((card) => (
          <AppCard
            key={card.id}
            card={card}
            onViewDetails={() => {
              const job = JOB_DATA[card.id];
              if (!job) return;
              navigation.navigate('JobDetail', {
                job,
                fromDashboard: true,
                applicationStatus: card.status as any,
                postedDate: card.postedDate,
              });
            }}
          />
        ))}


      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Exported component ────────────────────────────────────────────────────────

export const DashboardScreen: React.FC = () => <DashboardInner />;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0A0A0A' },
  headerSub:   { fontSize: 13, color: '#999999', marginTop: 2 },
  bellWrap: {
    width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E63946',
    borderWidth: 2, borderColor: '#FFFFFF',
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 160 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    borderWidth: 1, borderColor: '#E8E8FF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  statNum:   { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888888' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  seeAll:       { fontSize: 13, fontWeight: '500', color: '#4F46E5' },
});

const cardS = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(79,70,229,0.08)' } as any,
      default: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  companyRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  logoBox:     { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
  logoLetter:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  companyName: { fontSize: 13, fontWeight: '600', color: '#0A0A0A', flex: 1 },
  badge:       { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText:   { fontSize: 11, fontWeight: '600' },
  jobTitle:    { fontSize: 17, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  location:    { fontSize: 12, color: '#888888', marginBottom: 14 },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText:    { fontSize: 12, color: '#AAAAAA' },
  viewDetailsBtn: { paddingVertical: 10, paddingHorizontal: 4, minWidth: 100 },
  viewDetails: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
});

const stageS = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  dotFuture: { backgroundColor: '#E5E7EB', borderWidth: 1.5, borderColor: '#D1D5DB' },
  dotActive: {
    ...Platform.select({
      web: { boxShadow: '0 0 0 3px rgba(79,70,229,0.15)' } as any,
      default: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.20,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  line: { flex: 1, height: 2, marginHorizontal: 6 },

  // Assessment & Interview banners
  assessBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0F0FF', borderRadius: 16, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79,70,229,0.15)',
  },
  interviewBanner: {
    backgroundColor: '#F0FDF4', borderColor: 'rgba(16,185,129,0.15)',
  },
  assessBannerLeft: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(79,70,229,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  assessBannerContent: { flex: 1 },
  assessBannerTitle: { fontSize: 14, fontWeight: '700', color: '#4F46E5', marginBottom: 2 },
  assessBannerSub: { fontSize: 12, color: '#666666' },
  assessBannerArrow: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(79,70,229,0.1)', alignItems: 'center', justifyContent: 'center',
  },
});

