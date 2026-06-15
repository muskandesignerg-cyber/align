/**
 * EducationCard — self-contained education card for Profile Builder Step 2.
 *
 * COLLAPSED: avatar + institution/degree + gray pencil + gray X (marginLeft:12)
 * EXPANDED:  white card, labeled fields, Start/End year side-by-side,
 *            solid-purple "Save Education" button flush at card bottom.
 *
 * Design tokens:
 *   Card bg      #FFFFFF
 *   Input bg     #F7F7F7
 *   Input border #EBEBEB
 *   Focus border #4F46E5
 *   Label        12px 600 #555555
 *   Save btn     #4F46E5, 0 0 16px 16px radius
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Education } from '../../types/profile';
import { FontFamily } from '../../theme/typography';

// ─── Avatar color pool ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FFF0F6', text: '#DB2777' },
  { bg: '#F0FFF4', text: '#16A34A' },
  { bg: '#FFF8E6', text: '#D97706' },
  { bg: '#F0F8FF', text: '#0284C7' },
];

// ─── Labeled input field ──────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  flex?: number;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder = '', keyboardType = 'default', flex,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={flex !== undefined ? { flex } : {}}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BBBBBB"
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize={keyboardType === 'numeric' ? 'none' : 'words'}
        />
      </View>
    </View>
  );
};

// ─── EducationCard ────────────────────────────────────────────────────────────

interface EducationCardProps {
  education: Education;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSave: (education: Education) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  education, isExpanded, onToggleExpand, onSave, onDelete, index,
}) => {
  const [draft, setDraft] = useState<Education>(education);

  // Sync draft when card opens
  useEffect(() => { if (isExpanded) setDraft(education); }, [isExpanded]);

  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = (draft.institution || education.institution || 'U')[0].toUpperCase();

  const degreeLabel = education.degree || 'Degree';
  const fieldLabel  = education.fieldOfStudy ? ` in ${education.fieldOfStudy}` : '';
  const startLabel  = education.startYear || '?';
  const endLabel    = education.endYear   || '?';
  const subtitle    = `${degreeLabel}${fieldLabel} \u2022 ${startLabel} \u2013 ${endLabel}`;

  const update = (field: Partial<Education>) => setDraft((d) => ({ ...d, ...field }));
  const handleToggle = () => onToggleExpand(education.id);
  const handleDelete = () => onDelete(education.id);
  const handleSave   = () => { onSave(draft); onToggleExpand(education.id); };

  // ── Header row (reused in both states) ───────────────────────────────────
  const Header = (
    <View style={styles.headerRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
        <Text style={[styles.avatarLetter, { color: colors.text }]}>{initial}</Text>
      </View>

      {/* Text */}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {education.institution || 'New Institution'}
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>

      {/* Pencil — always gray */}
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
      </TouchableOpacity>

      {/* X — always gray, marginLeft:12 for reliable 12px gap on web */}
      <TouchableOpacity
        style={[styles.iconBtn, { marginLeft: 12 }]}
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-outline" size={18} color="#AAAAAA" />
      </TouchableOpacity>
    </View>
  );

  // ── COLLAPSED ─────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardCollapsed]}
        onPress={handleToggle}
        activeOpacity={0.85}
      >
        {Header}
      </TouchableOpacity>
    );
  }

  // ── EXPANDED ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, styles.cardExpanded]}>
      {/* Header */}
      <View style={styles.expandedHeaderWrap}>{Header}</View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Form */}
      <View style={styles.form}>
        <Field
          label="Institution"
          value={draft.institution}
          onChangeText={(v) => update({ institution: v })}
          placeholder="e.g. IIT Delhi, Delhi University"
        />

        <Field
          label="Degree"
          value={draft.degree}
          onChangeText={(v) => update({ degree: v })}
          placeholder="e.g. B.Tech, MBA, B.Des"
        />

        <Field
          label="Field of Study"
          value={draft.fieldOfStudy}
          onChangeText={(v) => update({ fieldOfStudy: v })}
          placeholder="e.g. Computer Science, Design"
        />

        {/* Start Year + End Year — side-by-side */}
        <View style={styles.yearRow}>
          <Field
            label="Start Year"
            value={draft.startYear}
            onChangeText={(v) => update({ startYear: v })}
            placeholder="e.g. 2018"
            keyboardType="numeric"
            flex={1}
          />
          <View style={styles.yearGap} />
          <Field
            label="End Year"
            value={draft.endYear}
            onChangeText={(v) => update({ endYear: v })}
            placeholder="e.g. 2022"
            keyboardType="numeric"
            flex={1}
          />
        </View>

        <Field
          label="Grade / GPA"
          value={draft.grade}
          onChangeText={(v) => update({ grade: v })}
          placeholder="e.g. 8.5 / 10 or 3.8 / 4.0"
        />
      </View>

      {/* Save button — flush to card bottom, 0 0 16px 16px */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={styles.saveBtnText}>Save Education</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 10,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardCollapsed: { padding: 14 },
  cardExpanded: {},

  // ── Expanded header wrap ──────────────────────────────────────────────────
  expandedHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  // ── Header row ───────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },

  // ── Header text ───────────────────────────────────────────────────────────
  headerText: { flex: 1, marginRight: 4 },
  headerTitle:    { fontSize: 15, fontFamily: FontFamily.bold,    color: '#0A0A0A' },
  headerSubtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#AAAAAA', marginTop: 2 },

  // ── Icon buttons — marginLeft:12 on delete for reliable web spacing ──────
  iconBtn: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#F0F0F0' },

  // ── Form ─────────────────────────────────────────────────────────────────
  form: {
    padding: 20,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },

  // ── Year row ─────────────────────────────────────────────────────────────
  yearRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yearGap: { width: 12 },

  // ── Field label ───────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#555555',
    marginBottom: 6,
  },

  // ── Input wrap ───────────────────────────────────────────────────────────
  inputWrap: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: '#4F46E5',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#0A0A0A',
  },

  // ── Save button — flush bottom, 0 0 16 16 radius ─────────────────────────
  saveBtn: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
});
