import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ArrowLeft, Heart, FlaskConical, Star, MapPin, Briefcase,
  Clock, Banknote, Sparkles, CheckCircle2, Check, Users
} from 'lucide-react-native';
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
  if (skills.length > 0) reasons.push(`You know ${skills[0]}, they need ${skills[0]}`);
  if (skills.length > 1) {
    const extra = skills.slice(1, 3).join(' & ');
    reasons.push(`${extra} match their stack`);
  }
  const wm = job.workModel ?? '';
  if (wm === 'Remote')   reasons.push('Fully remote, matches your remote preference');
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

  type PipelineRound = 'applied' | 'assessment' | 'interview' | 'hired';
  const pipelineRound: PipelineRound =
    appStatus === 'Offer'           ? 'hired'
    : appStatus === 'Interviewing'  ? 'interview'
    : appStatus === 'Assessment Sent' ? 'assessment'
    : 'applied';

  const [isLoading, setIsLoading] = useState(false);
  const isApplied = fromDashboard || (job.id ? isJobApplied(job.id) : false);

  const handleBack = () => navigation.goBack();

  const handleApply = async () => {
    if (!job.id || isApplied) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    applyToJob(job.id);
    setIsLoading(false);
  };

  // ── Derived display values ──────────────────────────────────────────────
  const displayTitle   = formatTitle(job.roleTitle ?? '');
  const displayCompany = job.companyName ?? 'Company';
  const displayCity    = isWorkMode(job.location) ? 'Remote' : (job.location ?? 'Remote');
  const displayWork    = job.workModel ?? 'Hybrid';
  const displaySalary  = formatSalary(job.salaryMin, job.salaryMax, job.currency ?? 'INR');
  const matchScore     = (job.matchScore && job.matchScore > 0) ? job.matchScore : 91;
  const initial        = displayCompany.charAt(0).toUpperCase();
  const department     = job.industry ?? 'Product Design';
  const empType        = (job.employmentType ?? 'FULL TIME').replace(/_/g, ' ').toUpperCase();
  const skills         = (job.skills && job.skills.length > 0) ? job.skills : ['Figma', 'Adobe XD', 'Sketch', 'JavaScript', 'HTML/CSS', 'React', 'User Research', 'Interaction Design'];
  const fitReasons     = buildFitReasons(job as Job);
  const displayDesc    = buildDescription(job as Job, displayTitle, displayCompany);
  const companyDesc    = job.companyDescription
    ?? `A product and tech company building tools for students and early professionals. Founded in 2018.`;
  const companySize    = job.companySize ?? '201–500';
  const postedStr      = relativeDate(job.postedAt);

  // Match badge color logic
  const matchBadge = matchScore >= 80
    ? { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' }
    : matchScore >= 60
    ? { bg: '#FFF8E6', text: '#F57C00', border: '#FBBF24' }
    : { bg: '#FFF0F0', text: '#EF4444', border: '#FCA5A5' };

  // For skills diff: top half "have" (even indices), rest "missing"
  const candidateSkillsHave = new Set(skills.slice(0, Math.ceil(skills.length / 2)));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* LAYER 1 — FIXED HEADER */}
      <View style={styles.fixedHeader}>
        {/* ROW 1 — NAV BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={handleBack} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <ArrowLeft size={22} color="#0A0A0A" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Job Details</Text>
          <TouchableOpacity hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Heart size={22} color="#0A0A0A" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ROW 2 — STATUS STRIP */}
        {fromDashboard ? (
          <View style={styles.statusStrip}>
            <FlaskConical size={15} color="#4F46E5" strokeWidth={2} />
            <Text style={styles.statusText} numberOfLines={1}>
              You're selected for Round 2 · {postedDate}
            </Text>
          </View>
        ) : null}
      </View>

      {/* LAYER 2 — SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1 — COMPANY ROW */}
        <View style={styles.companyRow}>
          <View style={styles.companyLeft}>
            <View style={styles.companyLogoBox}>
              <Text style={styles.companyLogoLetter}>{initial}</Text>
            </View>
            <View style={styles.companyInfoBox}>
              <Text style={styles.companyNameText}>{displayCompany}</Text>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>{department}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.matchBadge, { backgroundColor: matchBadge.bg, borderColor: matchBadge.border }]}>
            <Star size={12} color={matchBadge.text} fill={matchBadge.text} />
            <Text style={[styles.matchBadgeText, { color: matchBadge.text }]}>{matchScore}% Match</Text>
          </View>
        </View>

        {/* SECTION 2 — JOB TITLE */}
        <Text style={styles.jobTitle}>{displayTitle}</Text>

        {/* SECTION 3 — JOB META CHIPS ROW */}
        <View style={styles.chipsRow}>
          {displayCity !== 'Remote' && (
            <View style={styles.metaChip}>
              <MapPin size={13} color="#888888" strokeWidth={2} />
              <Text style={styles.metaChipText}>{displayCity}</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Briefcase size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>{displayWork}</Text>
          </View>
          <View style={styles.metaChip}>
            <Clock size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>{empType}</Text>
          </View>
          {displaySalary !== 'Competitive' && (
            <View style={styles.metaChip}>
              <Banknote size={13} color="#888888" strokeWidth={2} />
              <Text style={styles.metaChipText}>{displaySalary}</Text>
            </View>
          )}
        </View>

        {/* SECTION 4 — WHY YOU'RE A FIT CARD */}
        {fitReasons.length > 0 && (
          <View style={styles.fitCard}>
            <View style={styles.fitHeaderRow}>
              <Sparkles size={16} color="#4F46E5" strokeWidth={2} />
              <Text style={styles.fitHeaderText}>Why you're a fit</Text>
            </View>

            {fitReasons.map((reason, i) => (
              <View key={i} style={styles.fitPointRow}>
                <CheckCircle2 size={16} color="#22C55E" strokeWidth={2} />
                <Text style={styles.fitPointText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 5 — ABOUT THE ROLE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>About the Role</Text>
          <Text style={styles.bodyText}>
            {displayDesc}
          </Text>
        </View>

        {/* SECTION 6 — SKILLS REQUIRED */}
        {skills.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeadingSkills}>Skills Required</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, i) => {
                const hasIt = candidateSkillsHave.has(skill);
                if (hasIt) {
                  return (
                    <View key={`matched-${i}`} style={styles.matchedSkillChip}>
                      <Check size={12} color="#4F46E5" strokeWidth={2.5} />
                      <Text style={styles.matchedSkillText}>{skill}</Text>
                    </View>
                  );
                } else {
                  return (
                    <View key={`unmatched-${i}`} style={styles.unmatchedSkillChip}>
                      <Text style={styles.unmatchedSkillText}>{skill}</Text>
                    </View>
                  );
                }
              })}
            </View>
          </View>
        )}

        {/* SECTION 7 — ABOUT EXPOSYS DATA LABS */}
        <View style={styles.sectionContainerLast}>
          <Text style={styles.sectionHeading}>About {displayCompany}</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutCardDesc}>
              {companyDesc}
            </Text>
            <View style={styles.aboutCardMeta}>
              <View style={styles.metaGroup}>
                <Users size={13} color="#AAAAAA" strokeWidth={2} />
                <Text style={styles.metaSmallText}>{companySize} employees</Text>
              </View>
              <View style={styles.metaGroup}>
                <Clock size={13} color="#AAAAAA" strokeWidth={2} />
                <Text style={styles.metaSmallText}>Posted {postedStr}</Text>
              </View>
            </View>
          </View>
        </View>
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
                <Text style={styles.roundLabel}>Round 2 - Technical Assessment</Text>
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
                <Text style={styles.applyBtnTextWhite}>Start Round 2 Assessment →</Text>
              </TouchableOpacity>
              <Text style={styles.applySubText}>Complete to advance to the interview round</Text>
            </>
          ) : pipelineRound === 'interview' ? (
            // ROUND 3 — AI Interview
            <>
              <View style={styles.roundBadgeRow}>
                <View style={[styles.roundDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={[styles.roundLabel, { color: '#4F46E5' }]}>Round 3 - AI Interview</Text>
              </View>
              <TouchableOpacity
                style={styles.applyBtnAssessment}
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
                <Text style={styles.applyBtnTextWhite}>Begin AI Interview →</Text>
              </TouchableOpacity>
              <Text style={styles.applySubText}>Your responses are scored by AI in real time</Text>
            </>
          ) : pipelineRound === 'hired' ? (
            // HIRED
            <View style={styles.applyBtnSuccess}>
              <Ionicons name="ribbon-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnTextWhite}>🎉 Offer Received - Congratulations!</Text>
            </View>
          ) : (
            // ROUND 1 — Applied
            <View style={styles.applyBtnSuccess}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnTextWhite}>Applied Successfully</Text>
            </View>
          )
        ) : (
          // ── Discover mode: normal apply button ───────────────────────
          <TouchableOpacity
            style={[
              styles.applyBtnNormal,
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
                <Text style={[styles.applyBtnTextWhite, { color: '#6B7280' }]}>Already Applied</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.applyBtnTextWhite}>Apply Now</Text>
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
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  
  // LAYER 1 — FIXED HEADER
  fixedHeader: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  navBar: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0A0A',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  statusStrip: {
    height: 40,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#4F46E5',
  },

  // LAYER 2 — SCROLLABLE CONTENT
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // SECTION 1 — COMPANY ROW
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyLogoBox: {
    width: 52,
    height: 52,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyInfoBox: {
    flexDirection: 'column',
    gap: 4,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  departmentBadge: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  departmentText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555555',
  },
  matchBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // SECTION 2 — JOB TITLE
  jobTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A0A0A',
    lineHeight: 33.6, // 1.2 * 28
    marginBottom: 14,
  },

  // SECTION 3 — JOB META CHIPS ROW
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  metaChip: {
    height: 34,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#444444',
  },

  // SECTION 4 — WHY YOU'RE A FIT CARD
  fitCard: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  fitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fitHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
  },
  fitPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  fitPointText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
    flex: 1, // Let text wrap correctly if needed
  },

  // GENERAL SECTIONS
  sectionContainer: {
    marginBottom: 20,
  },
  sectionContainerLast: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  sectionHeadingSkills: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 12, // specific from spec
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555555',
    lineHeight: 22.4, // 160% of 14
  },

  // SECTION 6 — SKILLS
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchedSkillChip: {
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchedSkillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  unmatchedSkillChip: {
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
  },
  unmatchedSkillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },

  // SECTION 7 — ABOUT COMPANY
  aboutCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
  },
  aboutCardDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555555',
    lineHeight: 22.4,
    marginBottom: 12,
  },
  aboutCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaSmallText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#AAAAAA',
  },

  // ── BOTTOM APPLY BAR (Preserved) ──
  applyBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  applyBtnNormal: {
    width: '100%',
    height: 54,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnAssessment: {
    width: '100%',
    height: 54,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnApplied: {
    backgroundColor: '#F3F4F6',
  },
  applyBtnSuccess: {
    width: '100%',
    height: 54,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnTextWhite: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  applySubText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 10,
  },
  roundBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
});
