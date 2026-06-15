import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../../types/jobs';
import { getMatchColor, getMatchLabel } from '../../utils/matchEngine';

interface JobCardProps {
  job: Job;
  cardWidth: number;
  onPassPress?: () => void;
  onSavePress?: () => void;
  /** Called when user taps anywhere on the card body (not Pass/Save) */
  onPress?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format salary in Indian lakh notation.
 * Requires >= ₹10,000 to display; tiny/zero values fall back to demo text.
 */
function formatSalary(min?: number | null, max?: number | null): string {
  const m = min != null ? Number(min) : 0;
  const x = max != null ? Number(max) : 0;
  const MIN_VALID = 10_000; // must be at least ₹10K to be worth displaying
  const fmt = (v: number) =>
    v >= 100_000 ? `₹${Math.round(v / 100_000)}L` : `₹${Math.round(v / 1_000)}K`;
  if (m >= MIN_VALID && x >= MIN_VALID) return `${fmt(m)} – ${fmt(x)}`;
  if (m >= MIN_VALID)                   return `${fmt(m)}+`;
  if (x >= MIN_VALID)                   return `Up to ${fmt(x)}`;
  return '₹6L – ₹14L'; // demo fallback
}

/**
 * Title-case a job title. Handles slash-separated abbreviations:
 *   "ui/ux"   → "UI/UX"
 *   "ui/ux designer" → "UI/UX Designer"
 * If the result has no space (bare abbreviation), append " Designer" as a
 * sensible role suffix so it reads as a complete job title.
 */
function formatTitle(raw: string): string {
  if (!raw || !raw.trim()) return 'UI/UX Designer';

  const titled = raw
    .trim()
    .split(' ')
    .map(word => {
      if (word.includes('/')) {
        // Slash-separated → each part uppercased (UI/UX, B2B, etc.)
        return word.split('/').map(p => p.toUpperCase()).join('/');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // If result has no space it's a bare abbreviation — append "Designer"
  const ROLE_WORDS = ['designer', 'developer', 'engineer', 'manager', 'lead',
    'analyst', 'intern', 'architect', 'consultant', 'specialist'];
  const hasRoleWord = ROLE_WORDS.some(w => titled.toLowerCase().includes(w));
  return hasRoleWord ? titled : `${titled} Designer`;
}

/** Relative date from ISO timestamp. */
function relativeDate(iso?: string): string {
  if (!iso) return '2 days ago';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days} days ago`;
  const m = Math.floor(days / 30);
  return `${m} month${m > 1 ? 's' : ''} ago`;
}

/** Return true if the string looks like a work-model value rather than a city. */
const WORK_MODES = new Set(['remote', 'hybrid', 'on-site', 'onsite', 'wfh', 'wfo', 'flexible']);
function isWorkMode(s?: string | null): boolean {
  return WORK_MODES.has((s ?? '').toLowerCase().trim());
}

const MAX_CHIPS = 3;
const DEMO_DESC =
  'We are looking for a talented UI/UX Designer to craft intuitive digital experiences. ' +
  'You will collaborate with product and engineering teams to ship clean, user-focused interfaces.';

// ── Component ─────────────────────────────────────────────────────────────────

export default function JobCard({
  job,
  cardWidth,
  onPassPress,
  onSavePress,
  onPress,
}: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // ── Display values ────────────────────────────────────────────────────────
  const displayTitle   = formatTitle(job.roleTitle ?? '');
  const displayCompany = job.companyName ?? 'Exposys Data Labs';
  // Use city from location field; if it's a work-mode string, fall back to "Bangalore"
  const displayCity    = isWorkMode(job.location) ? 'Bangalore' : (job.location ?? 'Bangalore');
  const displayWork    = job.workModel ?? 'Hybrid';
  const displaySalary  = formatSalary(job.salaryMin, job.salaryMax);
  const matchScore     = (job.matchScore && job.matchScore > 0) ? job.matchScore : 72;
  const matchColor     = getMatchColor(matchScore);
  const empType        = (job.employmentType ?? 'FULL TIME').toUpperCase();
  const initial        = displayCompany.charAt(0).toUpperCase();
  const skills         = job.skills ?? [];
  const visibleSkills  = skills.slice(0, MAX_CHIPS);
  const extraCount     = Math.max(0, skills.length - MAX_CHIPS);
  const rawDesc        = (job.description ?? '').trim();
  const displayDesc    = rawDesc.length > 20 ? rawDesc : DEMO_DESC;
  const postedStr      = relativeDate(job.postedAt);

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = () => {
    setIsSaved(prev => !prev);
    onSavePress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.97 : 1}
    >

      {/* ── ROW 1 — Company + Match badge ─────────────────────────────── */}
      <View style={styles.companyRow}>
        <View style={styles.companyLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{initial}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName} numberOfLines={1}>{displayCompany}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{empType}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.matchBadge, { borderColor: matchColor + '33', backgroundColor: matchColor + '15' }]}>
          <Ionicons name="star" size={11} color={matchColor} />
          <Text style={[styles.matchText, { color: matchColor }]}>{matchScore}% Match</Text>
        </View>
      </View>

      {/* ── ROW 2 — Job title ─────────────────────────────────────────── */}
      <Text style={styles.title}>{displayTitle}</Text>

      {/* ── ROW 3 — City · Work model ─────────────────────────────────── */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color="#888888" />
        <Text style={styles.locationText}>{displayCity}</Text>
        <Text style={styles.dot}>·</Text>
        <Ionicons name="briefcase-outline" size={13} color="#888888" />
        <Text style={styles.locationText}>{displayWork}</Text>
      </View>

      {/* ── ROW 4 — Salary ────────────────────────────────────────────── */}
      <View style={styles.salaryRow}>
        <Text style={styles.salary}>{displaySalary}</Text>
        <Text style={styles.salaryPer}> / yr</Text>
      </View>

      {/* ── ROW 5 — Skill chips ───────────────────────────────────────── */}
      <View style={styles.skillsRow}>
        {(visibleSkills.length > 0 ? visibleSkills : ['Figma', 'Adobe XD', 'Sketch']).map(
          (skill, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ),
        )}
        {extraCount > 0 && (
          <View style={[styles.skillChip, styles.skillChipExtra]}>
            <Text style={[styles.skillText, styles.skillTextExtra]}>+{extraCount}</Text>
          </View>
        )}
      </View>

      {/* ── ROW 6 — Divider ───────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── ROW 7 — Description (2 lines max) ─────────────────────────── */}
      <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
        {displayDesc}
      </Text>

      {/* ── ROW 8 — Company info strip ────────────────────────────────── */}
      <View style={styles.infoStrip}>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={13} color="#AAAAAA" />
          <Text style={styles.infoText}>201–500 employees</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={13} color="#AAAAAA" />
          <Text style={styles.infoText}>Posted {postedStr}</Text>
        </View>
      </View>

      {/* ── ROW 9 — Divider ───────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── ROW 10 — Footer (Pass / Save) ─────────────────────────────── */}
      <View style={styles.footer}>
        {/* Pass */}
        <TouchableOpacity style={styles.footerLink} onPress={onPassPress} activeOpacity={0.7}>
          <Ionicons name="close-outline" size={14} color="#AAAAAA" />
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>

        {/* Save — toggles outline ↔ filled red */}
        <TouchableOpacity style={styles.footerLink} onPress={handleSave} activeOpacity={0.7}>
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={14}
            color={isSaved ? '#E63946' : '#4F46E5'}
          />
          <Text style={[styles.saveText, isSaved && styles.savedText]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card shell ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    20,
    borderWidth:     1.5,
    borderColor:     '#4F46E5',
    padding:         20,
    ...Platform.select({
      web: { boxShadow: '0 4px 24px rgba(79,70,229,0.12)' } as any,
      default: {
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 24, elevation: 6,
      },
    }),
  },

  // ── Row 1 ─────────────────────────────────────────────────────────────────
  companyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  companyLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8,
  },
  logo: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  companyInfo: { flex: 1, gap: 5 },
  companyName: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  typePill: {
    backgroundColor: '#EEF2FF', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  typePillText: {
    fontSize: 10, fontWeight: '700', color: '#4F46E5',
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, flexShrink: 0,
  },
  matchText: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },

  // ── Row 2 ─────────────────────────────────────────────────────────────────
  title: { fontSize: 26, fontWeight: '700', color: '#0A0A0A', lineHeight: 32, marginBottom: 6 },

  // ── Row 3 ─────────────────────────────────────────────────────────────────
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap',
  },
  locationText: { fontSize: 13, fontWeight: '400', color: '#888888' },
  dot: { fontSize: 13, color: '#CCCCCC' },

  // ── Row 4 ─────────────────────────────────────────────────────────────────
  salaryRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  salary: { fontSize: 20, fontWeight: '700', color: '#4F46E5' },
  salaryPer: { fontSize: 14, fontWeight: '400', color: '#AAAAAA' },

  // ── Row 5 ─────────────────────────────────────────────────────────────────
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  skillChip: {
    height: 30, paddingHorizontal: 12, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  skillText: { fontSize: 12, fontWeight: '500', color: '#555555' },
  skillChipExtra: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  skillTextExtra: { color: '#4F46E5', fontWeight: '600' },

  // ── Dividers ──────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 },

  // ── Row 7 ─────────────────────────────────────────────────────────────────
  description: {
    fontSize: 14, fontWeight: '400', color: '#666666', lineHeight: 22, marginBottom: 14,
  },

  // ── Row 8 ─────────────────────────────────────────────────────────────────
  infoStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, fontWeight: '400', color: '#AAAAAA' },

  // ── Row 10 ────────────────────────────────────────────────────────────────
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  passText: { fontSize: 13, fontWeight: '500', color: '#AAAAAA' },
  saveText: { fontSize: 13, fontWeight: '500', color: '#4F46E5' },
  savedText: { color: '#E63946', fontWeight: '600' },
});
