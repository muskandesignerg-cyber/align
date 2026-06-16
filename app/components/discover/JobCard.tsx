import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MapPin, Briefcase, Users, Clock, X, Heart } from 'lucide-react-native';
import { Job } from '../../types/jobs';

interface JobCardProps {
  job: Job;
  cardWidth: number;
  onPassPress?: () => void;
  onSavePress?: () => void;
  onPress?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min?: number | null, max?: number | null): string {
  const m = min != null ? Number(min) : 0;
  const x = max != null ? Number(max) : 0;
  const MIN_VALID = 10_000;
  const fmt = (v: number) =>
    v >= 100_000 ? `₹${Math.round(v / 100_000)}L` : `₹${Math.round(v / 1_000)}K`;
  if (m >= MIN_VALID && x >= MIN_VALID) return `${fmt(m)} – ${fmt(x)}`;
  if (m >= MIN_VALID)                   return `${fmt(m)}+`;
  if (x >= MIN_VALID)                   return `Up to ${fmt(x)}`;
  return '₹6L – ₹14L';
}

function formatTitle(raw: string): string {
  if (!raw || !raw.trim()) return 'Software Engineer';
  return raw
    .trim()
    .split(' ')
    .map(word =>
      word.includes('/')
        ? word.split('/').map(p => p.toUpperCase()).join('/')
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

function relativeDate(iso?: string): string {
  if (!iso) return 'Posted Yesterday';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const WORK_MODES = new Set(['remote', 'hybrid', 'on-site', 'onsite', 'wfh', 'wfo', 'flexible']);
function isWorkMode(s?: string | null): boolean {
  return WORK_MODES.has((s ?? '').toLowerCase().trim());
}

const MAX_VISIBLE_CHIPS = 3;
const DEMO_DESC =
  'We are seeking a highly motivated and results-driven sales professional to join our sales team. A...';

// ── Component ─────────────────────────────────────────────────────────────────

export default function JobCard({ job, cardWidth, onPassPress, onSavePress, onPress }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const displayTitle   = formatTitle(job.roleTitle ?? '');
  const displayCompany = (job.companyName ?? 'exposys').toLowerCase();
  const displayCity    = isWorkMode(job.location) ? 'Bangalore' : (job.location ?? 'Bangalore');
  const displayWork    = job.workModel ?? 'Hybrid';
  const displaySalary  = formatSalary(job.salaryMin, job.salaryMax);
  const matchScore     = (job.matchScore && job.matchScore > 0) ? job.matchScore : 45;
  const empType        = (job.employmentType ?? 'Full Time');
  const initial        = displayCompany.charAt(0).toUpperCase();

  const allSkills      = job.skills ?? [];
  const visibleSkills  = allSkills.slice(0, MAX_VISIBLE_CHIPS);
  const extraCount     = Math.max(0, allSkills.length - MAX_VISIBLE_CHIPS);
  const rawDesc        = (job.description ?? '').trim();
  const displayDesc    = rawDesc.length > 20 ? rawDesc : DEMO_DESC;

  const handleSave = () => {
    setIsSaved(prev => !prev);
    onSavePress?.();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.97 : 1}
    >

      {/* ROW 1 — Company logo + name + badge */}
      <View style={styles.companyRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>{initial}</Text>
        </View>
        <Text style={styles.companyName}>{displayCompany}</Text>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{empType.toUpperCase()}</Text>
        </View>
      </View>

      {/* ROW 2 — Job title */}
      <Text style={styles.title} numberOfLines={2}>{displayTitle}</Text>

      {/* ROW 3 — Location + work mode */}
      <View style={styles.locationRow}>
        <MapPin size={14} color="#666666" strokeWidth={2} />
        <Text style={styles.locationText}>{displayCity}</Text>
        <Briefcase size={14} color="#666666" strokeWidth={2} />
        <Text style={styles.locationText}>{displayWork}</Text>
      </View>

      {/* ROW 4 — Salary */}
      <View style={styles.salaryRow}>
        <Text style={styles.salary}>{displaySalary}</Text>
        <Text style={styles.salaryPer}> / yr</Text>
      </View>

      {/* ROW 5 — Skill chips */}
      <View style={styles.skillsRow}>
        {visibleSkills.map((skill, i) => (
          <View key={i} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View style={[styles.skillChip, styles.skillChipExtra]}>
            <Text style={[styles.skillText, styles.skillTextExtra]}>+{extraCount}</Text>
          </View>
        )}
      </View>

      {/* ROW 6 — Description (2 lines max) */}
      <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
        {displayDesc}
      </Text>

      {/* ROW 7 — Company info: employees */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Users size={14} color="#AAAAAA" strokeWidth={2} />
          <Text style={styles.metaText}>{job.companySize ? `${job.companySize} employees` : '201–500 employees'}</Text>
        </View>
      </View>

      {/* ROW 8 — Pass + Save inline action row */}
      <View style={styles.cardFooter}>
        {/* Pass — left side */}
        <TouchableOpacity style={styles.passLink} onPress={onPassPress} activeOpacity={0.7}>
          <X size={16} color="#999999" strokeWidth={2} />
          <Text style={styles.passLinkText}>Pass</Text>
        </TouchableOpacity>

        {/* Save — right side */}
        <TouchableOpacity style={styles.saveLink} onPress={handleSave} activeOpacity={0.7}>
          <Heart
            size={14}
            color="#4F46E5"
            strokeWidth={2}
            fill={isSaved ? '#4F46E5' : 'transparent'}
          />
          <Text style={styles.saveLinkText}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    // width: 100% fills the CardStack container which has marginHorizontal: 20
    // This guarantees 20px margin on both sides without any fixed pixel math
    width:           '100%',
    backgroundColor: '#FFFFFF',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     '#F0F0F0',
    padding:         20,
    overflow:        'hidden',
    alignSelf:       'stretch',
    ...Platform.select({
      web: { boxShadow: '0 4px 24px rgba(0,0,0,0.06)' } as any,
      default: {
        shadowColor:   '#000000',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius:  24,
        elevation:     3,
      },
    }),
  },

  // Company row
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  companyName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#0A0A0A' },
  typePill: {
    backgroundColor: '#F5F4FF',
    borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
    marginLeft: 2,
  },
  typePillText: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#4F46E5', textTransform: 'uppercase',
  },

  // Job title
  title: {
    fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', color: '#0A0A0A',
    lineHeight: 28, marginBottom: 10,
  },

  // Location row
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 16,
  },
  locationText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#666666', marginRight: 6 },

  // Salary
  salaryRow: {
    flexDirection: 'row', alignItems: 'baseline',
    marginBottom: 16,
  },
  salary:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#4F46E5' },
  salaryPer: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#999999' },

  // Skill chips
  skillsRow: {
    flexDirection: 'row',
    flexWrap:      'nowrap',
    gap:           8,
    marginBottom:  20,
    overflow:      'hidden',
  },
  skillChip: {
    backgroundColor:   '#FFFFFF',
    borderWidth:       1,
    borderColor:       '#E8E8E8',
    borderRadius:      999,
    paddingHorizontal: 16,
    paddingVertical:   8,
    alignItems:        'center',
    justifyContent:    'center',
    flexShrink:        0,
  },
  skillText:      { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#0A0A0A' },
  skillChipExtra: { backgroundColor: '#F5F4FF', borderColor: '#EBE9FE' },
  skillTextExtra: { color: '#4F46E5', fontFamily: 'PlusJakartaSans_700Bold' },

  // Description
  description: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color:      '#666666',
    lineHeight: 22,
    marginBottom: 16,
    flexShrink: 1,
  },

  // Company info meta row
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  metaText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: '#999999' },

  // Card footer
  cardFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      8,
    paddingTop:     16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  passLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  passLinkText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#666666' },
  saveLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  saveLinkText:  { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#4F46E5' },
  savedLinkText: { color: '#E63946' },
});
