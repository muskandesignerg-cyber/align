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

type NavProp    = NativeStackNavigationProp<MainStackParamList>;
type RouteParam = RouteProp<MainStackParamList, 'JobDetail'>;

export const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteParam>();
  const job: Partial<Job> = route.params?.job ?? {};
  const fromDashboard     = route.params?.fromDashboard ?? false;
  const appStatus         = route.params?.applicationStatus ?? 'Applied';
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
              You're selected for Round 2 · Applied 2 days ago
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
              <Text style={styles.companyLogoLetter}>E</Text>
            </View>
            <View style={styles.companyInfoBox}>
              <Text style={styles.companyNameText}>Exposys Data Labs</Text>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>Product Design</Text>
              </View>
            </View>
          </View>
          <View style={styles.matchBadge}>
            <Star size={12} color="#4F46E5" fill="#4F46E5" />
            <Text style={styles.matchBadgeText}>91% Match</Text>
          </View>
        </View>

        {/* SECTION 2 — JOB TITLE */}
        <Text style={styles.jobTitle}>UI/UX Designer</Text>

        {/* SECTION 3 — JOB META CHIPS ROW */}
        <View style={styles.chipsRow}>
          <View style={styles.metaChip}>
            <MapPin size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>Bangalore</Text>
          </View>
          <View style={styles.metaChip}>
            <Briefcase size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>Hybrid</Text>
          </View>
          <View style={styles.metaChip}>
            <Clock size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>FULL TIME</Text>
          </View>
          <View style={styles.metaChip}>
            <Banknote size={13} color="#888888" strokeWidth={2} />
            <Text style={styles.metaChipText}>₹6L – ₹14L / yr</Text>
          </View>
        </View>

        {/* SECTION 4 — WHY YOU'RE A FIT CARD */}
        <View style={styles.fitCard}>
          <View style={styles.fitHeaderRow}>
            <Sparkles size={16} color="#4F46E5" strokeWidth={2} />
            <Text style={styles.fitHeaderText}>Why you're a fit</Text>
          </View>

          <View style={styles.fitPointRow}>
            <CheckCircle2 size={16} color="#22C55E" fill="#22C55E" />
            <Text style={styles.fitPointText}>You know Figma, they need Figma</Text>
          </View>
          <View style={styles.fitPointRow}>
            <CheckCircle2 size={16} color="#22C55E" fill="#22C55E" />
            <Text style={styles.fitPointText}>Adobe XD & Sketch match their stack</Text>
          </View>
          <View style={styles.fitPointRow}>
            <CheckCircle2 size={16} color="#22C55E" fill="#22C55E" />
            <Text style={styles.fitPointText}>Hybrid work aligns with your preference</Text>
          </View>
        </View>

        {/* SECTION 5 — ABOUT THE ROLE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>About the Role</Text>
          <Text style={styles.bodyText}>
            We are looking for a talented UI/UX Designer to create intuitive digital experiences across our product suite.
          </Text>
        </View>

        {/* SECTION 6 — SKILLS REQUIRED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeadingSkills}>Skills Required</Text>
          <View style={styles.skillsContainer}>
            {['Figma', 'Adobe XD', 'Sketch', 'JavaScript'].map((skill, i) => (
              <View key={`matched-${i}`} style={styles.matchedSkillChip}>
                <Check size={12} color="#4F46E5" strokeWidth={2.5} />
                <Text style={styles.matchedSkillText}>{skill}</Text>
              </View>
            ))}
            {['HTML/CSS', 'React', 'User Research', 'Interaction Design'].map((skill, i) => (
              <View key={`unmatched-${i}`} style={styles.unmatchedSkillChip}>
                <Text style={styles.unmatchedSkillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SECTION 7 — ABOUT EXPOSYS DATA LABS */}
        <View style={styles.sectionContainerLast}>
          <Text style={styles.sectionHeading}>About Exposys Data Labs</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutCardDesc}>
              A product and tech company building tools for students and early professionals. Founded in 2018.
            </Text>
            <View style={styles.aboutCardMeta}>
              <View style={styles.metaGroup}>
                <Users size={13} color="#AAAAAA" strokeWidth={2} />
                <Text style={styles.metaSmallText}>201–500 employees</Text>
              </View>
              <View style={styles.metaGroup}>
                <Clock size={13} color="#AAAAAA" strokeWidth={2} />
                <Text style={styles.metaSmallText}>Posted Today</Text>
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
                    companyName: 'Exposys Data Labs',
                    roleTitle: 'UI/UX Designer',
                    skills: ['Figma', 'Adobe XD', 'Sketch', 'JavaScript'],
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
                <Text style={styles.applyBtnTextWhite}>Start Round 2 Assessment →</Text>
              </TouchableOpacity>
              <Text style={styles.applySubText}>Complete to advance to the interview round</Text>
            </>
          ) : pipelineRound === 'interview' ? (
            // ROUND 3 — AI Interview
            <>
              <View style={styles.roundBadgeRow}>
                <View style={[styles.roundDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.roundLabel, { color: '#10B981' }]}>Round 3 - AI Interview</Text>
              </View>
              <TouchableOpacity
                style={[styles.applyBtnAssessment, { backgroundColor: '#10B981' }]}
                activeOpacity={0.85}
                onPress={() => {
                  const session: InterviewSession = {
                    id: `session-${job.id ?? 'demo'}`,
                    jobId: job.id ?? 'demo',
                    candidateId: 'me',
                    companyName: 'Exposys Data Labs',
                    roleTitle: 'UI/UX Designer',
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
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
    color: '#4F46E5',
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

  // SECTION 7 — ABOUT EXPOSYS DATA LABS
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
