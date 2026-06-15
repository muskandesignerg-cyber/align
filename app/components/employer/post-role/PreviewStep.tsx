import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { usePostRole } from '../../../context/PostRoleContext';
import { formatSalaryRange } from '../../../utils/salaryFormatter';
import CustomToggle from '../../ui/CustomToggle';

// ─── Mini feed-preview card (matches Discover card style) ─────────────────────
function FeedPreviewCard() {
  const { state } = usePostRole();
  const s1 = state.step1;
  const s2 = state.step2;
  const [expanded, setExpanded] = useState(false);

  const roleTitle = s1.jobTitle || 'Untitled Role';
  const company = 'TechFlow Inc.';
  const location = s1.officeLocation
    ? `${s1.officeLocation} (${s1.workModel})`
    : s1.workModel;
  const salary = formatSalaryRange(s1.salaryMin, s1.salaryMax);
  const topSkills = s2.requiredSkills.slice(0, 2);
  const desc =
    s2.description ||
    `We are looking for an experienced ${roleTitle} to lead the development of our next-generation products. You will collaborate with cross-functional teams to build scalable, high-quality solutions that drive business impact.`;

  return (
    <View style={[cardStyles.card, cardShadow]}>
      {/* Top row — logo + bookmark */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.logoWrap}>
          <Text style={cardStyles.logoEmoji}>🏢</Text>
        </View>
        <View style={cardStyles.titleBlock}>
          <Text style={cardStyles.roleTitle} numberOfLines={2}>{roleTitle}</Text>
          <Text style={cardStyles.companySub}>{company} • {location}</Text>
        </View>
        <View style={cardStyles.matchBadge}>
          <Text style={cardStyles.matchBolt}>⚡</Text>
          <Text style={cardStyles.matchText}>94% Match</Text>
        </View>
      </View>

      {/* Bookmark */}
      <TouchableOpacity style={cardStyles.bookmark} activeOpacity={0.7}>
        <Text style={cardStyles.bookmarkIcon}>🔖</Text>
      </TouchableOpacity>

      {/* Tags */}
      <View style={cardStyles.tagsRow}>
        <View style={cardStyles.tag}>
          <Text style={cardStyles.tagText}>{salary}</Text>
        </View>
        {topSkills.map((sk) => (
          <View key={sk} style={cardStyles.tag}>
            <Text style={cardStyles.tagText}>{sk}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <Text style={cardStyles.desc} numberOfLines={expanded ? undefined : 3}>{desc}</Text>
      <TouchableOpacity onPress={() => setExpanded((p) => !p)} activeOpacity={0.8}>
        <Text style={cardStyles.viewMore}>
          {expanded ? 'Hide description ›' : 'View full description ›'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 12px rgba(76,89,215,0.10)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 16, padding: 20, position: 'relative',
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logoWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F4F6FF', alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 20 },
  titleBlock: { flex: 1 },
  roleTitle: { fontSize: 24, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E', lineHeight: 30 },
  companySub: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 4 },
  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#849CFF',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  matchBolt: { fontSize: 12, color: '#4C59D7' },
  matchText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  bookmark: { position: 'absolute', top: 16, right: 16 },
  bookmarkIcon: { fontSize: 18, color: '#D0D7FF' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E' },
  desc: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 12, lineHeight: 20 },
  viewMore: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7', marginTop: 8 },
});

// ─── PreviewStep main ─────────────────────────────────────────────────────────

interface PreviewStepProps {
  onPublish: () => void;
  onSaveDraft: () => void;
}

export default function PreviewStep({ onPublish, onSaveDraft }: PreviewStepProps) {
  const { state, dispatch } = usePostRole();
  const s3 = state.step3;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Feed preview */}
      <Text style={styles.sectionTag}>FEED PREVIEW</Text>
      <FeedPreviewCard />

      {/* Stats card */}
      <View style={[styles.statsCard, statsShadow]}>
        <View style={styles.statsRow}>
          <Text style={styles.statsIcon}>👥</Text>
          <View style={styles.statsText}>
            <Text style={styles.statsLabel}>Estimated reach</Text>
            <Text style={styles.statsValue}>~240 matched candidates</Text>
          </View>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <Text style={styles.statsIcon}>📊</Text>
          <View style={styles.statsText}>
            <Text style={styles.statsLabel}>Avg match score</Text>
            <Text style={styles.statsValue}>72% for this role</Text>
          </View>
        </View>
      </View>

      {/* Publishing options */}
      <Text style={styles.sectionTag}>PUBLISHING OPTIONS</Text>
      <View style={styles.optionsList}>
        {/* Blind audition */}
        <View style={styles.optionCard}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Blind Audition Mode</Text>
            <Text style={styles.optionDesc}>
              Hide candidate names and photos until interview stage to reduce bias.
            </Text>
          </View>
          <CustomToggle
            value={s3.blindAuditionMode}
            onValueChange={(v) => dispatch({ type: 'UPDATE_STEP3', partial: { blindAuditionMode: v } })}
          />
        </View>
        {/* Require assessment */}
        <View style={styles.optionCard}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Require Assessment</Text>
            <Text style={styles.optionDesc}>
              Candidates must complete a 15-min coding challenge before applying.
            </Text>
          </View>
          <CustomToggle
            value={s3.requireAssessment}
            onValueChange={(v) => dispatch({ type: 'UPDATE_STEP3', partial: { requireAssessment: v } })}
          />
        </View>
      </View>

      {/* Publish button */}
      <TouchableOpacity
        style={[styles.publishBtn, publishShadow]}
        onPress={onPublish}
        activeOpacity={0.85}
        disabled={s3.isPublishing}
      >
        {s3.isPublishing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.publishBtnText}>Publish Role</Text>
        )}
      </TouchableOpacity>

      {/* Save as Draft */}
      <TouchableOpacity style={styles.draftBtn} onPress={onSaveDraft} activeOpacity={0.85}>
        <Text style={styles.draftBtnText}>Save as Draft</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const statsShadow = Platform.select({
  web: { boxShadow: '0px 1px 4px rgba(76,89,215,0.06)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
});

const publishShadow = Platform.select({
  web: { boxShadow: '0px 8px 20px rgba(76,89,215,0.30)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  sectionTag: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#6B7280', letterSpacing: 2,
    textTransform: 'uppercase', marginTop: 24, marginBottom: 12,
  },
  statsCard: {
    marginTop: 16, backgroundColor: '#F4F6FF',
    borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsIcon: { fontSize: 20 },
  statsText: { gap: 2 },
  statsLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
  statsValue: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  statsDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  optionsList: { gap: 12 },
  optionCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  optionDesc: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', marginTop: 4, lineHeight: 18,
  },
  publishBtn: {
    marginTop: 28, height: 56, borderRadius: 16,
    backgroundColor: '#4C59D7', alignItems: 'center', justifyContent: 'center',
  },
  publishBtnText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' },
  draftBtn: {
    marginTop: 12, height: 52, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  draftBtnText: { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
});
