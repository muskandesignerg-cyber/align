import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';
import { Application, getStatusColors } from '../types/applications';
import ProgressTracker from '../components/dashboard/ProgressTracker';
import TimelineView from '../components/dashboard/TimelineView';
import type { MainStackParamList } from '../navigation/MainTabNavigator';
import { useDashboard } from '../context/DashboardContext';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ApplicationDetailScreen — Modal detail sheet for a single application.
 * Receives the full Application object via route params.
 */
export const ApplicationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'ApplicationDetail'>>();
  const { application } = route.params;
  const { withdrawApplication } = useDashboard();

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const statusColors = getStatusColors(application.status);
  const workModelEmoji = application.workModel === 'Remote' ? '🏠' : '🏢';

  // Actual async withdrawal logic — separated from Alert callback
  const doWithdraw = useCallback(async () => {
    setIsWithdrawing(true);
    console.log('[Screen] Withdrawing application id:', application.id);
    try {
      await withdrawApplication(application.id);
      console.log('[Screen] Withdrawal succeeded, going back');
      navigation.goBack();
    } catch (e: any) {
      console.error('[Screen] Withdrawal failed:', e?.message ?? e);
      setIsWithdrawing(false);
      Alert.alert(
        'Failed to Withdraw',
        e?.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }, [application.id, withdrawApplication, navigation]);

  const handleWithdraw = useCallback(() => {
    Alert.alert(
      'Withdraw Application?',
      `Remove your application to ${application.roleTitle} at ${application.companyName}? You can re-apply later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => { doWithdraw(); },
        },
      ],
    );
  }, [application.roleTitle, application.companyName, doWithdraw]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sheet handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* ── Company hero ───────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          {/* Company logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoLetter}>
              {application.companyName.charAt(0)}
            </Text>
          </View>

          {/* Company name */}
          <Text style={styles.companyName}>{application.companyName}</Text>

          {/* Role title */}
          <Text style={styles.roleTitle} numberOfLines={2}>
            {application.roleTitle}
          </Text>

          {/* Status badge (large) */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {application.status}
            </Text>
          </View>
        </View>

        {/* ── Large progress tracker ─────────────────────────────────────────── */}
        <View style={styles.progressSection}>
          <ProgressTracker
            status={application.status}
            size="large"
            showLabels
          />
        </View>

        {/* ── Timeline ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <TimelineView events={application.timeline} />
        </View>

        {/* ── Assessment card (if applicable) ────────────────────────────────── */}
        {application.hasAssessment && application.status === 'Assessment Sent' && (
          <View style={styles.assessmentSection}>
            <View style={styles.assessmentCard}>
              <View style={styles.assessmentHeader}>
                <View style={styles.assessmentIconWrapper}>
                  <Text style={styles.assessmentIcon}>📋</Text>
                </View>
                <View style={styles.assessmentInfo}>
                  <Text style={styles.assessmentTitle}>
                    Assessment Required
                  </Text>
                  <Text style={styles.assessmentSubtitle}>
                    {application.assessmentCompany
                      ? `by ${application.assessmentCompany}`
                      : 'Complete to move forward'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.assessmentButton}
                activeOpacity={0.8}
              >
                <Text style={styles.assessmentButtonText}>
                  Start Assessment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Job details summary ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          {/* Location */}
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>📍</Text>
            <Text style={styles.detailText}>{application.location}</Text>
          </View>

          {/* Work model */}
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>{workModelEmoji}</Text>
            <Text style={styles.detailText}>{application.workModel}</Text>
          </View>

          {/* Skills chips */}
          {application.skills.length > 0 && (
            <View style={styles.skillChipsRow}>
              {application.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.withdrawButton, isWithdrawing && { opacity: 0.6 }]}
          activeOpacity={0.7}
          onPress={handleWithdraw}
          disabled={isWithdrawing}
        >
          {isWithdrawing ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.withdrawButtonText}>Withdraw Application</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.s20,
  },

  // ── Sheet handle ──────────────────────────────────────────────────────────

  handleRow: {
    alignItems: 'center',
    marginTop: Spacing.s12,
    marginBottom: Spacing.s16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },

  // ── Hero section ──────────────────────────────────────────────────────────

  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.primary,
  },
  companyName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.subtitle,
    color: Colors.tertiary,
    marginTop: Spacing.s12,
  },
  roleTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.bodyText,
    textAlign: 'center',
    marginTop: Spacing.s4,
  },
  statusBadge: {
    marginTop: Spacing.s8,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
  },

  // ── Progress tracker ──────────────────────────────────────────────────────

  progressSection: {
    paddingHorizontal: Spacing.s20,
    marginTop: Spacing.s20,
  },

  // ── Sections ──────────────────────────────────────────────────────────────

  section: {
    paddingHorizontal: Spacing.s20,
    marginTop: Spacing.s16,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.bodyText,
    marginBottom: Spacing.s12,
  },

  // ── Assessment card ───────────────────────────────────────────────────────

  assessmentSection: {
    paddingHorizontal: Spacing.s20,
    marginTop: Spacing.s16,
  },
  assessmentCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(245,124,0,0.2)',
    padding: Spacing.s16,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s12,
  },
  assessmentIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.s12,
  },
  assessmentIcon: {
    fontSize: 20,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.bodyText,
  },
  assessmentSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginTop: 2,
  },
  assessmentButton: {
    height: 44,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F57C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },

  // ── Details rows ──────────────────────────────────────────────────────────

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s8,
    gap: Spacing.s8,
  },
  detailEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  detailText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.muted,
  },

  // ── Skill chips ───────────────────────────────────────────────────────────

  skillChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
    marginTop: Spacing.s8,
  },
  skillChip: {
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s6,
    borderRadius: BorderRadius.chip,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skillChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },

  // ── Sticky bottom bar ─────────────────────────────────────────────────────

  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s16,
  },
  withdrawButton: {
    height: 48,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.error,
  },
});
