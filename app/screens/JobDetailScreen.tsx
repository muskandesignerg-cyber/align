import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainTabNavigator';
import { Job } from '../types/jobs';
import { useDiscover } from '../context/DiscoverContext';
import type { Assessment, InterviewSession } from '../types/assessment';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency: string = 'INR',
): string {
  const m = min != null ? Number(min) : 0;
  const x = max != null ? Number(max) : 0;
  const MIN_VALID = 10_000;

  if (currency === 'INR') {
    const f = (v: number) =>
      v >= 100_000 ? `₹${Math.round(v / 100_000)}L` : `₹${Math.round(v / 1_000)}K`;
    if (m >= MIN_VALID && x >= MIN_VALID) return `${f(m)} – ${f(x)} / yr`;
    if (m >= MIN_VALID) return `${f(m)}+ / yr`;
    if (x >= MIN_VALID) return `Up to ${f(x)} / yr`;
    return 'Competitive';
  }
  const sym = currency === 'GBP' ? '£' : '$';
  const f = (v: number) => `${sym}${Math.round(v / 1_000)}K`;
  if (m >= MIN_VALID && x >= MIN_VALID) return `${f(m)} – ${f(x)} / yr`;
  if (m >= MIN_VALID) return `${f(m)}+ / yr`;
  if (x >= MIN_VALID) return `Up to ${f(x)} / yr`;
  return 'Competitive';
}

function formatTitle(raw: string): string {
  if (!raw?.trim()) return 'Job Role';
  const titled = raw.trim().split(' ').map(w => {
    if (w.includes('/')) return w.split('/').map(p => p.toUpperCase()).join('/');
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
  return titled;
}

const WORK_MODES = new Set(['remote', 'hybrid', 'on-site', 'onsite', 'wfh', 'wfo', 'flexible']);
const isWorkMode = (s?: string | null) => WORK_MODES.has((s ?? '').toLowerCase().trim());

function relativeDate(iso?: string): string {
  if (!iso) return 'Today';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function buildFitReasons(job: Job): string[] {
  const reasons: string[] = [];
  const skills = job.skills ?? [];
  if (skills.length > 0) reasons.push(`You know ${skills[0]} — they need ${skills[0]}`);
  if (skills.length > 1) {
    const extra = skills.slice(1, 3).join(' & ');
    reasons.push(`${extra} match their stack`);
  }
  const wm = job.workModel ?? '';
  if (wm === 'Remote')   reasons.push('Fully remote — matches your remote preference');
  else if (wm === 'Hybrid') reasons.push('Hybrid work aligns with your preference');
  else if (wm === 'On-site') reasons.push('On-site opportunity near your area');
  if (reasons.length === 0) {
    return ['Your profile aligns with this role', 'Skills match their requirements'];
  }
  return reasons.slice(0, 3);
}

function buildDescription(job: Job, title: string, company: string): string {
  const raw = (job.description ?? '').trim();
  if (raw.length > 30) return raw;
  return (
    `We are looking for a ${title} to join our team at ${company}. ` +
    `You will work on impactful projects, collaborate with talented colleagues, ` +
    `and grow your career in a fast-paced, innovative environment.`
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type NavProp    = NativeStackNavigationProp<MainStackParamList>;
type RouteParam = RouteProp<MainStackParamList, 'JobDetail'>;

export const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteParam>();
  const job: Partial<Job> = route.params?.job ?? {};
  const fromDashboard     = route.params?.fromDashboard ?? false;
  const appStatus         = route.params?.applicationStatus ?? 'Applied';
  const postedDate        = route.params?.postedDate ?? 'Applied Today';
  const { applyToJob, isJobApplied } = useDiscover();

  // Derive the pipeline round from applicationStatus
  // 'Applied' | 'In Review'  → Round 1 (just applied)
  // 'Assessment Sent'         → Round 2 (MCQ assessment)
  // 'Interviewing'            → Round 3 (AI interview)
  // 'Offer'                   → Hired!
  type PipelineRound = 'applied' | 'assessment' | 'interview' | 'hired';
  const pipelineRound: PipelineRound =
    appStatus === 'Offer'           ? 'hired'
    : appStatus === 'Interviewing'  ? 'interview'
    : appStatus === 'Assessment Sent' ? 'assessment'
    : 'applied';

  const [isSaved, setIsSaved]      = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);

  // When opened from Dashboard, treat as already applied
  const isApplied = fromDashboard || (job.id ? isJobApplied(job.id) : false);

  // ── Derived display values ──────────────────────────────────────────────
  const displayTitle   = formatTitle(job.roleTitle ?? '');
  const displayCompany = job.companyName ?? 'Company';
  const displayCity    = isWorkMode(job.location) ? 'Remote' : (job.location ?? 'Remote');
  const displayWork    = job.workModel ?? 'Hybrid';
  const displaySalary  = formatSalary(job.salaryMin, job.salaryMax, job.currency ?? 'INR');
  const matchScore     = (job.matchScore && job.matchScore > 0) ? job.matchScore : 55;
  const initial        = displayCompany.charAt(0).toUpperCase();
  const department     = job.industry ?? 'Product Design';
  const empType        = (job.employmentType ?? 'FULL TIME').replace(/_/g, ' ').toUpperCase();
  const skills         = (job.skills && job.skills.length > 0) ? job.skills : [];
  const fitReasons     = buildFitReasons(job as Job);
  const displayDesc    = buildDescription(job as Job, displayTitle, displayCompany);
  const companyDesc    = job.companyDescription
    ?? `A fast-growing company in the ${job.industry ?? 'tech'} space, building products that matter.`;
  const companySize    = job.companySize ?? '50-200';
  const postedStr      = relativeDate(job.postedAt);

  // Match badge color logic
  const matchBadge = matchScore >= 80
    ? { bg: '#EEF0FF', text: '#4C59D7', border: '#849CFF' }
    : matchScore >= 60
    ? { bg: '#FFF8E6', text: '#F57C00', border: '#FBBF24' }
    : { bg: '#FFF0F0', text: '#EF4444', border: '#FCA5A5' };

  // For skills diff: top half "have" (even indices), rest "missing"
  const candidateSkillsHave = new Set(skills.slice(0, Math.ceil(skills.length / 2)));

  // ── Handlers ────────────────────────────────────────────────────────────
  const toggleSave    = () => setIsSaved(p => !p);
  const toggleExpand  = () => setIsExpanded(p => !p);

  const handleApply = useCallback(() => {
    if (isApplied || isLoading) return;
    setIsLoading(true);
    // Persist apply
    if (job.id) applyToJob(job.id);
    // 800ms loading state then navigate to success screen
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('ApplySuccess', {
        jobTitle:       displayTitle,
        companyName:    displayCompany,
        matchScore,
        companyInitial: initial,
      });
    }, 800);
  }, [isApplied, isLoading, job.id, applyToJob, navigation, displayTitle, displayCompany, matchScore, initial]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP NAV BAR ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={22} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Job Details</Text>
        <TouchableOpacity style={styles.navBtn} onPress={toggleSave} activeOpacity={0.7}>
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={22}
            color={isSaved ? '#4F46E5' : '#0A0A0A'}
          />
        </TouchableOpacity>
      </View>

      {/* ── STATUS BANNER (Dashboard → Detail only) ──────────────── */}
      {fromDashboard && (
        <View style={[
          styles.statusBanner,
          pipelineRound === 'assessment' && styles.statusBannerPurple,
          pipelineRound === 'interview'  && styles.statusBannerGreen,
          pipelineRound === 'hired'      && styles.statusBannerGold,
          (pipelineRound === 'applied')  && styles.statusBannerBlue,
        ]}>
          <Ionicons
            name={
              pipelineRound === 'assessment' ? 'flask-outline'
              : pipelineRound === 'interview' ? 'mic-outline'
              : pipelineRound === 'hired'     ? 'ribbon-outline'
              : 'checkmark-circle-outline'
            }
            size={16}
            color={
              pipelineRound === 'assessment' ? '#4F46E5'
              : pipelineRound === 'interview' ? '#10B981'
              : pipelineRound === 'hired'     ? '#F59E0B'
              : '#4F46E5'
            }
          />
          <Text style={[
            styles.statusBannerText,
            pipelineRound === 'interview' && { color: '#10B981' },
            pipelineRound === 'hired'     && { color: '#F59E0B' },
          ]}>
            {pipelineRound === 'assessment'
              ? `You're selected for Round 2 · ${postedDate}`
              : pipelineRound === 'interview'
              ? `You passed Round 2 · Round 3 awaits!`
              : pipelineRound === 'hired'
              ? `Congratulations! You got the offer 🎉`
              : `You applied for this role · ${postedDate}`}
          </Text>
        </View>
      )}

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION A — Company header */}
        <View style={styles.companyRow}>
          <View style={styles.companyLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{initial}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName} numberOfLines={1}>{displayCompany}</Text>
              <View style={styles.deptChip}>
                <Text style={styles.deptChipText}>{department}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.matchBadge, { backgroundColor: matchBadge.bg, borderColor: matchBadge.border }]}>
            <Ionicons name="star" size={12} color={matchBadge.text} />
            <Text style={[styles.matchText, { color: matchBadge.text }]}>{matchScore}% Match</Text>
          </View>
        </View>

        {/* SECTION B — Job title */}
        <Text style={styles.jobTitle}>{displayTitle}</Text>

        {/* SECTION C — Info chips */}
        <View style={styles.chipsRow}>
          {displayCity ? (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={13} color="#555555" />
              <Text style={styles.infoChipText}>{displayCity}</Text>
            </View>
          ) : null}
          <View style={styles.infoChip}>
            <Ionicons name="briefcase-outline" size={13} color="#555555" />
            <Text style={styles.infoChipText}>{displayWork}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={13} color="#555555" />
            <Text style={styles.infoChipText}>{empType}</Text>
          </View>
          {displaySalary !== 'Competitive' ? (
            <View style={styles.infoChip}>
              <Ionicons name="cash-outline" size={13} color="#555555" />
              <Text style={styles.infoChipText}>{displaySalary}</Text>
            </View>
          ) : null}
        </View>

        {/* SECTION D — Why you're a fit */}
        {fitReasons.length > 0 && (
          <View style={styles.fitBox}>
            <View style={styles.fitHeader}>
              <Ionicons name="sparkles-outline" size={16} color="#4F46E5" />
              <Text style={styles.fitHeaderText}>Why you're a fit</Text>
            </View>
            {fitReasons.map((reason, i) => (
              <View key={i} style={styles.fitRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
                <Text style={styles.fitText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION E — About the Role (expandable) */}
        <Text style={styles.sectionTitle}>About the Role</Text>
        <Text
          style={styles.bodyText}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {displayDesc}
        </Text>
        {displayDesc.length > 120 && (
          <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={{ marginBottom: 16 }}>
            <Text style={styles.readMore}>{isExpanded ? 'Read less' : 'Read more'}</Text>
          </TouchableOpacity>
        )}

        {/* SECTION F — Skills Required */}
        {skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillsRow}>
              {skills.map((skill, i) => {
                const have = candidateSkillsHave.has(skill);
                return (
                  <View
                    key={i}
                    style={[
                      styles.skillChip,
                      have ? styles.skillChipHave : styles.skillChipMissing,
                    ]}
                  >
                    {have && <Ionicons name="checkmark" size={10} color="#4C59D7" style={{ marginRight: 4 }} />}
                    <Text style={[styles.skillChipText, { color: have ? '#4C59D7' : '#6B7280' }]}>
                      {skill}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* SECTION G — About company */}
        <Text style={styles.sectionTitle}>About {displayCompany}</Text>
        <View style={styles.companyCard}>
          <Text style={styles.companyCardDesc}>{companyDesc}</Text>
          <View style={styles.companyMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color="#AAAAAA" />
              <Text style={styles.metaText}>{companySize} employees</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color="#AAAAAA" />
              <Text style={styles.metaText}>Posted {postedStr}</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacer for fixed apply bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FIXED BOTTOM BAR ─────────────────────────────────────────── */}
      <View style={styles.applyBar}>
        {fromDashboard ? (
          // ── Dashboard mode: show pipeline-aware CTA ──────────────────
          pipelineRound === 'assessment' ? (
            // ROUND 2 — Take Assessment
            <>
              <View style={styles.roundBadgeRow}>
                <View style={[styles.roundDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={styles.roundLabel}>Round 2 — Technical Assessment</Text>
              </View>
              <TouchableOpacity
                style={styles.applyBtnAssessment}
                activeOpacity={0.85}
                onPress={() => {
                  const assessment: Assessment = {
                    id: `assess-${job.id ?? 'demo'}`,
                    jobId: job.id ?? 'demo',
                    candidateId: 'me',
                    companyName: displayCompany,
                    roleTitle: displayTitle,
                    skills: skills,
                    questions: [],
                    timeLimit: 30,
                    passingScore: 70,
                    createdAt: new Date().toISOString(),
                    createdBy: 'ai',
                  };
                  navigation.navigate('AssessmentIntro', { assessment });
                }}
              >
                <Ionicons name="flask-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>Start Round 2 Assessment →</Text>
              </TouchableOpacity>
              <Text style={styles.applySubText}>Complete to advance to the interview round</Text>
            </>
          ) : pipelineRound === 'interview' ? (
            // ROUND 3 — AI Interview
            <>
              <View style={styles.roundBadgeRow}>
                <View style={[styles.roundDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.roundLabel, { color: '#10B981' }]}>Round 3 — AI Interview</Text>
              </View>
              <TouchableOpacity
                style={[styles.applyBtnAssessment, { backgroundColor: '#10B981' }]}
                activeOpacity={0.85}
                onPress={() => {
                  const session: InterviewSession = {
                    id: `session-${job.id ?? 'demo'}`,
                    jobId: job.id ?? 'demo',
                    candidateId: 'me',
                    companyName: displayCompany,
                    roleTitle: displayTitle,
                    focus: 'Technical',
                    questions: [],
                    timeLimit: 20,
                    passingScore: 65,
                    createdAt: new Date().toISOString(),
                  };
                  navigation.navigate('InterviewIntro', { session });
                }}
              >
                <Ionicons name="mic-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>Begin AI Interview →</Text>
              </TouchableOpacity>
              <Text style={styles.applySubText}>Your responses are scored by AI in real time</Text>
            </>
          ) : pipelineRound === 'hired' ? (
            // HIRED
            <View style={styles.applyBtnSuccess}>
              <Ionicons name="ribbon-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>🎉 Offer Received — Congratulations!</Text>
            </View>
          ) : (
            // ROUND 1 — Applied
            <View style={styles.applyBtnSuccess}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Applied Successfully</Text>
            </View>
          )
        ) : (
          // ── Discover mode: normal apply button ───────────────────────
          <TouchableOpacity
            style={[
              styles.applyBtn,
              isApplied && styles.applyBtnApplied,
            ]}
            activeOpacity={isApplied || isLoading ? 1 : 0.85}
            onPress={handleApply}
            disabled={isApplied || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : isApplied ? (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
                <Text style={[styles.applyBtnText, { color: '#6B7280' }]}>Already Applied</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {!fromDashboard && (
          <Text style={styles.applySubText}>Your verified profile will be shared</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    zIndex: 100,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '600', color: '#0A0A0A' },

  // Scroll
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Section A — Company header
  companyRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 16,
  },
  companyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  logo: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  companyInfo: { flex: 1, gap: 6 },
  companyName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  deptChip: {
    backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  deptChipText: { fontSize: 11, fontWeight: '500', color: '#555555' },
  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, flexShrink: 0,
  },
  matchText: { fontSize: 12, fontWeight: '600' },

  // Section B
  jobTitle: { fontSize: 28, fontWeight: '700', color: '#0A0A0A', lineHeight: 34, marginBottom: 14 },

  // Section C
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 32, paddingHorizontal: 12, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 999,
  },
  infoChipText: { fontSize: 12, fontWeight: '500', color: '#555555' },

  // Section D
  fitBox: {
    backgroundColor: '#F8F8FF', borderWidth: 1, borderColor: '#E8E8FF',
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  fitHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  fitHeaderText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  fitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  fitText: { fontSize: 13, color: '#333333', lineHeight: 18, flex: 1 },

  // Section E
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', marginBottom: 10 },
  bodyText: { fontSize: 14, color: '#666666', lineHeight: 23, marginBottom: 8 },
  readMore: { fontSize: 13, fontWeight: '500', color: '#4F46E5' },

  // Section F
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  skillChip: {
    height: 32, paddingHorizontal: 14,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  skillChipHave: {
    backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#849CFF',
  },
  skillChipMissing: {
    backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF',
  },
  skillChipText: { fontSize: 13, fontWeight: '500' },

  // Section G
  companyCard: { backgroundColor: '#F7F7F7', borderRadius: 14, padding: 16, marginBottom: 24 },
  companyCardDesc: { fontSize: 13, color: '#666666', lineHeight: 21, marginBottom: 12 },
  companyMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#AAAAAA' },

  // Apply bar
  applyBar: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, zIndex: 100,
  },
  applyBtn: {
    height: 56, backgroundColor: '#4C59D7', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(76,89,215,0.30)' } as any,
      default: {
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
      },
    }),
  },
  applyBtnApplied: {
    backgroundColor: '#F4F6FF',
    borderWidth: 1, borderColor: '#D0D7FF',
    ...Platform.select({
      web: { boxShadow: 'none' } as any,
      default: { shadowOpacity: 0, elevation: 0 },
    }),
  },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  applySubText: { fontSize: 12, color: '#AAAAAA', textAlign: 'center' },

  // Green "Applied Successfully" button (Dashboard flow)
  applyBtnSuccess: {
    height: 56, backgroundColor: '#22C55E', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 8,
  },

  // Purple "Start Round 2" / Green "Begin AI Interview" button
  applyBtnAssessment: {
    height: 56, backgroundColor: '#4F46E5', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(79,70,229,0.30)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
    }),
  },

  // Round indicator row (● Round 2 — Technical Assessment)
  roundBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10,
  },
  roundDot: { width: 8, height: 8, borderRadius: 4 },
  roundLabel: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

  // Status banner variants
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FF', borderBottomWidth: 1, borderBottomColor: '#C7D2FE',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  statusBannerBlue:   { backgroundColor: '#EEF2FF', borderBottomColor: '#C7D2FE' },
  statusBannerPurple: { backgroundColor: '#F0F0FF', borderBottomColor: '#C7C8F0' },
  statusBannerGreen:  { backgroundColor: '#F0FDF4', borderBottomColor: '#BBF7D0' },
  statusBannerGold:   { backgroundColor: '#FFFBEB', borderBottomColor: '#FDE68A' },
  statusBannerAmber:  { backgroundColor: '#FFF7ED', borderBottomColor: '#FED7AA' },
  statusBannerText:   { fontSize: 13, fontWeight: '500', color: '#4F46E5', flex: 1 },
  statusBannerTextAmber: { color: '#F59E0B' },
});

