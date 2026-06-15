/**
 * ProfileScreen — Premium redesign.
 *
 * Self-contained screen with:
 *  • Header: "Profile" title + bell + pencil
 *  • Profile hero: M avatar, Muskan, UI/UX Designer · Bangalore
 *  • 3 stat cards: AVG Match / Verified Skills / Applications
 *  • Radar chart with fixed label padding (no clipping)
 *  • 4 skill chips (no dashed + Add chip)
 *  • 2 experience entries
 *  • Linked Work: portfolio + github
 *  • Soft Sign Out button
 *  • Sign-out confirmation modal + bottom sheets preserved
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Line, Ellipse, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import AddSkillSheet from '../components/sheets/AddSkillSheet';
import EditProfileSheet from '../components/sheets/EditProfileSheet';
import AddLinkedWorkSheet from '../components/sheets/AddLinkedWorkSheet';
import AddExperienceSheet, { ExperienceEntry } from '../components/sheets/AddExperienceSheet';
import { VerifiedSkill, LinkedWork, CandidateProfile } from '../types/candidateProfile';

// ─── Radar Chart ───────────────────────────────────────────────────────────────

const AXES = ['Frontend', 'Backend', 'Design', 'DevOps', 'Leadership', 'Communication'];
const LEVELS = 5;
const CHART_SIZE = 200;
const PADDING = 44; // enough to prevent label clipping
const CENTER = CHART_SIZE / 2;
const RADIUS = (CHART_SIZE / 2) - PADDING;

function angleForAxis(i: number): number {
  // Start from top (-90°)
  return (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
}

function pointOnAxis(i: number, r: number): { x: number; y: number } {
  const angle = angleForAxis(i);
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function labelAnchor(i: number): 'start' | 'middle' | 'end' {
  const angle = angleForAxis(i);
  const cos = Math.cos(angle);
  if (cos > 0.3) return 'start';
  if (cos < -0.3) return 'end';
  return 'middle';
}

interface RadarChartProps {
  data: number[]; // 0–1 values per axis
}

function RadarChart({ data }: RadarChartProps) {
  // Grid polygon points for a given level
  const gridPoints = (level: number): string => {
    const r = (RADIUS * level) / LEVELS;
    return AXES.map((_, i) => {
      const p = pointOnAxis(i, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  // Data polygon
  const dataPoints = (): string => {
    return AXES.map((_, i) => {
      const r = RADIUS * (data[i] ?? 0);
      const p = pointOnAxis(i, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  return (
    <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
      {/* Grid rings */}
      {Array.from({ length: LEVELS }).map((_, lvl) => (
        <Polygon
          key={`grid-${lvl}`}
          points={gridPoints(lvl + 1)}
          fill="none"
          stroke="#EBEBEB"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const tip = pointOnAxis(i, RADIUS);
        return (
          <Line
            key={`axis-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={tip.x}
            y2={tip.y}
            stroke="#EBEBEB"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data fill */}
      <Polygon
        points={dataPoints()}
        fill="rgba(79,70,229,0.12)"
        stroke="#4F46E5"
        strokeWidth={2}
      />

      {/* Axis dots */}
      {AXES.map((_, i) => {
        const dotR = RADIUS * (data[i] ?? 0);
        const p = pointOnAxis(i, dotR);
        return (
          <Ellipse key={`dot-${i}`} cx={p.x} cy={p.y} rx={4} ry={4} fill="#4F46E5" />
        );
      })}

      {/* Axis labels — placed beyond the max radius with offset */}
      {AXES.map((label, i) => {
        const labelR = RADIUS + 18;
        const p = pointOnAxis(i, labelR);
        const anchor = labelAnchor(i);
        return (
          <SvgText
            key={`label-${i}`}
            x={p.x}
            y={p.y + 4}
            textAnchor={anchor}
            fontSize={10}
            fill="#888888"
            fontFamily="System"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Experience card ───────────────────────────────────────────────────────────

interface ExpEntry {
  initial: string;
  bg: string;
  title: string;
  company: string;
  duration: string;
}

const DEFAULT_EXPERIENCES: ExpEntry[] = [
  {
    initial: 'E',
    bg: '#1A1A2E',
    title: 'UI/UX Designer Intern',
    company: 'Exposys Data Labs',
    duration: 'Jan 2024 – Present · Bangalore',
  },
  {
    initial: 'F',
    bg: '#0F4C75',
    title: 'Freelance UI Designer',
    company: 'Self Employed',
    duration: 'Jun 2023 – Dec 2023 · Remote',
  },
];

function ExperienceCard({ entry }: { entry: ExpEntry }) {
  return (
    <View style={S.expCard}>
      <View style={[S.expLogoBox, { backgroundColor: entry.bg }]}>
        <Text style={S.expLogoLetter}>{entry.initial}</Text>
      </View>
      <View style={S.expDetails}>
        <Text style={S.expTitle}>{entry.title}</Text>
        <Text style={S.expCompany}>{entry.company}</Text>
        <Text style={S.expDuration}>{entry.duration}</Text>
      </View>
    </View>
  );
}

// ─── Linked Work card ──────────────────────────────────────────────────────────

interface WorkEntry {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  url: string;
}

const LINKED_WORK: WorkEntry[] = [
  {
    icon: 'globe-outline',
    iconColor: '#4F46E5',
    title: 'Portfolio Website',
    url: 'muskan.design',
  },
  {
    icon: 'logo-github',
    iconColor: '#0A0A0A',
    title: 'GitHub',
    url: 'github.com/muskan',
  },
];

function WorkCard({ entry }: { entry: WorkEntry }) {
  const handleOpen = async () => {
    const raw = entry.url.trim();
    const url = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open link', `Unable to open: ${url}`);
    }
  };

  return (
    <TouchableOpacity style={S.workCard} onPress={handleOpen} activeOpacity={0.75}>
      <Ionicons name={entry.icon} size={20} color={entry.iconColor} />
      <View style={S.workContent}>
        <Text style={S.workTitle}>{entry.title}</Text>
        <Text style={S.workUrl}>{entry.url}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color="#AAAAAA" />
    </TouchableOpacity>
  );
}

// ─── Main profile inner ────────────────────────────────────────────────────────

const ProfileInner: React.FC = () => {
  const { state, dispatch } = useProfile();
  const { signOut } = useAuth();
  const { profile, isLoading, activeSheet } = state;
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showExpSheet, setShowExpSheet] = useState(false);
  const [experiences, setExperiences] = useState<ExpEntry[]>(DEFAULT_EXPERIENCES);

  const handleEditPress = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'editProfile' });
  }, [dispatch]);

  const handleCloseSheet = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'none' });
  }, [dispatch]);

  const handleConfirmSkill = useCallback(
    (skills: string[], method: 'challenge' | 'github' | 'peer') => {
      skills.forEach((name, i) => {
        const skill: VerifiedSkill = {
          id: `sk_new_${Date.now()}_${i}`,
          name,
          isVerified: method === 'challenge',
          verificationMethod: method,
        };
        dispatch({ type: 'ADD_SKILL', skill });
      });
      dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'none' });
    },
    [dispatch],
  );

  const handleSaveProfile = useCallback(
    (updates: Partial<CandidateProfile>) => {
      dispatch({ type: 'UPDATE_PROFILE', partial: updates });
      dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'none' });
    },
    [dispatch],
  );

  const handleAddWork = useCallback(
    (work: { platform: string; label: string; url: string }) => {
      const newWork: LinkedWork = {
        id: `lw_${Date.now()}`,
        platform: work.platform as any,
        label: work.label,
        url: work.url,
      };
      dispatch({ type: 'ADD_LINKED_WORK', work: newWork });
      dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'none' });
    },
    [dispatch],
  );

  const handleConfirmSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  }, [signOut]);

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={S.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  // Radar data — map RadarSkill[] → number[] (0-1 range)
  const handleAddExperience = useCallback((entry: ExperienceEntry) => {
    const initial = entry.company.trim()[0]?.toUpperCase() ?? 'C';
    const duration = entry.current
      ? `${entry.startMonth} ${entry.startYear} – Present · ${entry.location || 'Remote'}`
      : `${entry.startMonth} ${entry.startYear} – ${entry.endMonth} ${entry.endYear} · ${entry.location || 'Remote'}`;
    setExperiences((prev) => [
      { initial, bg: '#4F46E5', title: entry.title, company: entry.company, duration },
      ...prev,
    ]);
  }, []);

  const radarValues: number[] =
    profile.radarChartData?.length === 6
      ? profile.radarChartData.map((s) => s.value / 100)
      : [0.85, 0.6, 0.9, 0.5, 0.65, 0.75];

  const skillChips = ['Figma', 'UI Design', 'Prototyping', 'User Research'];

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Profile</Text>
        <View style={S.headerRight}>
          {/* Bell */}
          <TouchableOpacity style={S.bellWrap} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#0A0A0A" />
            <View style={S.bellDot} />
          </TouchableOpacity>
          {/* Pencil */}
          <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile Hero ─────────────────────────────────────────────────── */}
        <View style={S.hero}>
          {/* Avatar */}
          <View style={S.avatar}>
            <Text style={S.avatarLetter}>M</Text>
          </View>
          <Text style={S.heroName}>Muskan</Text>
          <Text style={S.heroSub}>UI/UX Designer · Bangalore</Text>
          {/* Open to work chip */}
          <View style={S.openChip}>
            <View style={S.greenDot} />
            <Text style={S.openChipText}>Open to work</Text>
          </View>
        </View>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <View style={S.statsRow}>
          {[
            { label: 'AVG MATCH',        value: '92%' },
            { label: 'VERIFIED SKILLS',  value: '4'   },
            { label: 'APPLICATIONS',     value: '9'   },
          ].map((s) => (
            <View key={s.label} style={S.statCard}>
              <Text style={S.statLabel}>{s.label}</Text>
              <Text style={S.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Verified Skills ───────────────────────────────────────────────── */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Your Verified Skills</Text>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'addSkill' })}
            activeOpacity={0.7}
          >
            <Text style={S.sectionAction}>+ Add Skill</Text>
          </TouchableOpacity>
        </View>

        {/* Radar chart */}
        <View style={S.radarWrap}>
          <RadarChart data={radarValues} />
        </View>

        {/* Skill chips */}
        <View style={S.chipsRow}>
          {skillChips.map((chip) => (
            <View key={chip} style={S.chip}>
              <Text style={S.chipText}>{chip}</Text>
            </View>
          ))}
        </View>

        {/* ── Experience ───────────────────────────────────────────────────── */}
        <View style={S.sectionHeader}>
          <View style={S.sectionLeft}>
            <Ionicons name="briefcase-outline" size={18} color="#0A0A0A" />
            <Text style={S.sectionTitle}>Experience</Text>
          </View>
          <TouchableOpacity onPress={() => setShowExpSheet(true)} activeOpacity={0.7}>
            <Text style={S.sectionAction}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {experiences.map((exp) => (
          <ExperienceCard key={exp.title + exp.company} entry={exp} />
        ))}

        {/* ── Linked Work ──────────────────────────────────────────────────── */}
        <View style={[S.sectionHeader, { marginTop: 24 }]}>
          <View style={S.sectionLeft}>
            <Ionicons name="link-outline" size={18} color="#0A0A0A" />
            <Text style={S.sectionTitle}>Linked Work</Text>
          </View>
          <TouchableOpacity onPress={() => dispatch({ type: 'SET_ACTIVE_SHEET', sheet: 'addWork' })} activeOpacity={0.7}>
            <Text style={S.sectionAction}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {LINKED_WORK.map((work) => (
          <WorkCard key={work.title} entry={work} />
        ))}

        {/* ── Sign Out ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={S.signOutBtn}
          onPress={() => setShowSignOutModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={S.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Sign-Out Confirmation Modal ──────────────────────────────────────── */}
      {showSignOutModal && (
        <TouchableOpacity
          style={S.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSignOutModal(false)}
        >
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Sign Out?</Text>
            <Text style={S.modalBody}>
              You'll need to sign back in to access your profile and applications.
            </Text>
            <TouchableOpacity
              style={S.modalConfirmBtn}
              onPress={handleConfirmSignOut}
              activeOpacity={0.8}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={S.modalConfirmText}>Yes, Sign Out</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={S.modalCancelBtn}
              onPress={() => setShowSignOutModal(false)}
              activeOpacity={0.7}
              disabled={isSigningOut}
            >
              <Text style={S.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Bottom Sheets ────────────────────────────────────────────────────── */}
      <AddSkillSheet
        visible={activeSheet === 'addSkill'}
        selectedSkill={state.selectedSkillForVerify}
        onClose={handleCloseSheet}
        onConfirm={handleConfirmSkill}
      />
      <EditProfileSheet
        visible={activeSheet === 'editProfile'}
        profile={profile}
        onClose={handleCloseSheet}
        onSave={handleSaveProfile}
      />
      <AddLinkedWorkSheet
        visible={activeSheet === 'addWork'}
        onClose={handleCloseSheet}
        onAdd={handleAddWork}
      />
      <AddExperienceSheet
        visible={showExpSheet}
        onClose={() => setShowExpSheet(false)}
        onAdd={handleAddExperience}
      />
    </SafeAreaView>
  );
};

// ─── Export ────────────────────────────────────────────────────────────────────

export const ProfileScreen: React.FC = () => <ProfileInner />;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0A0A0A' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellWrap:    { position: 'relative', width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  bellDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E63946', borderWidth: 2, borderColor: '#FFFFFF',
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 },

  // Hero
  hero:       { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#4F46E5',
    borderWidth: 3, borderColor: '#C7D2FE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  heroName:     { fontSize: 22, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  heroSub:      { fontSize: 13, color: '#888888', marginBottom: 12 },
  openChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6,
  },
  greenDot:     { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E' },
  openChipText: { fontSize: 12, fontWeight: '600', color: '#16A34A' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#F8F8FF',
    borderWidth: 1, borderColor: '#E8E8FF',
    borderRadius: 14, padding: 14, gap: 4,
  },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#888888', letterSpacing: 0.5 },
  statValue: { fontSize: 26, fontWeight: '700', color: '#4F46E5' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  sectionAction:{ fontSize: 13, fontWeight: '600', color: '#4F46E5' },

  // Radar
  radarWrap: { alignItems: 'center', marginBottom: 16 },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  chip: {
    height: 32, paddingHorizontal: 14,
    backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: '#555555' },

  // Experience
  expCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  expLogoBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expLogoLetter: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  expDetails: { flex: 1, gap: 3 },
  expTitle:   { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  expCompany: { fontSize: 13, color: '#4F46E5' },
  expDuration:{ fontSize: 12, color: '#888888' },

  // Linked Work
  workCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8F8FF', borderWidth: 1, borderColor: '#E8E8FF',
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  workContent: { flex: 1, gap: 3 },
  workTitle:   { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  workUrl:     { fontSize: 12, color: '#4F46E5' },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 14,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    marginTop: 8,
  },
  signOutText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },

  // Modal
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,46,0.5)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 110, paddingHorizontal: 16, zIndex: 9999,
  },
  modalCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 24, alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 -8px 40px rgba(26,26,46,0.15)' } as any,
      default: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 20 },
    }),
  },
  modalTitle:       { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  modalBody:        { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalConfirmBtn:  { width: '100%', height: 52, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalConfirmText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  modalCancelBtn:   { width: '100%', height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText:  { fontSize: 16, fontWeight: '600', color: '#6B7280' },
});
