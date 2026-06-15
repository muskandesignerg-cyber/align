/**
 * ExperienceCard — Work Experience card for Profile Builder Step 2.
 *
 * Two states:
 *   COLLAPSED — avatar + company name + role summary + edit/delete icons
 *   EXPANDED  — blue border, header persists, full editable form
 *
 * Self-contained: manages local draft state, dispatches onSave when done.
 * The parent passes the committed data + expanded flag; this card owns
 * the in-progress edits until "Save Experience" is tapped.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkExperience } from '../../types/profile';
import { FontFamily } from '../../theme/typography';

// ─── Avatar color palette (cycles by index) ───────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#EEF0FF', text: '#4C59D7' },
  { bg: '#FFF0F6', text: '#E91E8C' },
  { bg: '#F0FFF4', text: '#22C55E' },
  { bg: '#FFF8E6', text: '#F57C00' },
  { bg: '#F0F8FF', text: '#0077B5' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getSummaryText = (exp: WorkExperience): string => {
  const role     = exp.role     || 'Role';
  const start    = exp.startDate || 'Start Date';
  const end      = exp.isCurrentRole ? 'Present' : (exp.endDate || 'End Date');
  return `${role}  •  ${start} \u2014 ${end}`;
};

// ─── Field label + input helper ───────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'url';
  disabled?: boolean;
  error?: boolean;
  multiline?: boolean;
  minHeight?: number;
  maxLength?: number;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder = '', keyboardType = 'default',
  disabled = false, error = false, multiline = false, minHeight, maxLength,
}) => {
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const borderColor = error
    ? '#EF4444'
    : focused ? '#4C59D7' : '#D0D7FF';
  const borderWidth = focused || error ? 1.5 : 1;
  const bg = disabled ? '#F4F6FF' : '#FFFFFF';

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { borderColor, borderWidth, backgroundColor: bg },
          multiline && { minHeight: minHeight ?? 110, textAlignVertical: 'top', paddingTop: 12 },
          disabled && { color: '#849CFF' },
          focused && styles.fieldFocusShadow,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={disabled ? 'Present' : placeholder}
        placeholderTextColor={disabled ? '#849CFF' : '#C0C4D0'}
        keyboardType={keyboardType}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        maxLength={maxLength}
        returnKeyType={multiline ? 'default' : 'done'}
      />
      {error && <Text style={styles.errorText}>Required</Text>}
    </Animated.View>
  );
};

// ─── ExperienceCard ───────────────────────────────────────────────────────────

interface ExperienceCardProps {
  experience: WorkExperience;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSave: (experience: WorkExperience) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  isExpanded,
  onToggleExpand,
  onSave,
  onDelete,
  index,
}) => {
  // Local draft while expanded
  const [draft, setDraft] = useState<WorkExperience>(experience);
  const [errors, setErrors] = useState({ company: false, role: false });
  const [descCount, setDescCount] = useState(experience.description?.length ?? 0);
  const [borderColor] = useState(new Animated.Value(0)); // 0=collapsed, 1=expanded

  // Sync draft when parent flips isExpanded (e.g. a new card opened)
  useEffect(() => {
    if (isExpanded) setDraft(experience);
  }, [isExpanded]);

  // Animate border on expand/collapse
  useEffect(() => {
    Animated.timing(borderColor, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = (draft.company || experience.company || 'C')[0].toUpperCase();

  const update = (field: Partial<WorkExperience>) => {
    setDraft((d) => ({ ...d, ...field }));
  };

  const handleToggle = () => onToggleExpand(experience.id);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete(experience.id);
  };

  const handleSave = () => {
    const errs = {
      company: draft.company.trim().length < 2,
      role:    draft.role.trim().length < 2,
    };
    setErrors(errs);
    if (errs.company || errs.role) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(draft);
    onToggleExpand(experience.id); // collapse after save
  };

  const animatedBorderColor = borderColor.interpolate({
    inputRange:  [0, 1],
    outputRange: ['#D0D7FF', '#4C59D7'],
  });

  // ── COLLAPSED ───────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardCollapsed]}
        onPress={handleToggle}
        activeOpacity={0.85}
      >
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.avatarLetter, { color: colors.text }]}>{initial}</Text>
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={styles.companyName} numberOfLines={1}>
              {experience.company || 'New Company'}
            </Text>
            <Text style={styles.summaryText} numberOfLines={1}>
              {getSummaryText(experience)}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={handleToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 12 }]} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={18} color="#AAAAAA" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ── EXPANDED ────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.card, styles.cardExpanded, { borderColor: animatedBorderColor }]}>
      {/* Header persists at top */}
      <View style={[styles.headerRow, styles.headerExpanded]}>
        <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
          <Text style={[styles.avatarLetter, { color: colors.text }]}>{initial}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.companyName} numberOfLines={1}>
            {draft.company || 'New Company'}
          </Text>
          <Text style={styles.summaryText} numberOfLines={1}>
            {getSummaryText(draft)}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 12 }]} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-outline" size={18} color="#AAAAAA" />
        </TouchableOpacity>
      </View>

      {/* ── Form Fields ─────────────────────────────────────────────────────── */}
      <View style={styles.form}>

        {/* Company */}
        <Field
          label="Company"
          value={draft.company}
          onChangeText={(v) => { update({ company: v }); setErrors((e) => ({ ...e, company: false })); }}
          placeholder="e.g. Google, Freelance"
          error={errors.company}
        />

        {/* Job Title */}
        <Field
          label="Job Title"
          value={draft.role}
          onChangeText={(v) => { update({ role: v }); setErrors((e) => ({ ...e, role: false })); }}
          placeholder="e.g. Senior Product Designer"
          error={errors.role}
        />

        {/* Dates row */}
        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Field
              label="Start Date"
              value={draft.startDate}
              onChangeText={(v) => update({ startDate: v })}
              placeholder="MM / YYYY"
              keyboardType="numeric"
              maxLength={7}
            />
          </View>
          <View style={styles.dateCol}>
            <Field
              label="End Date"
              value={draft.isCurrentRole ? 'Present' : draft.endDate}
              onChangeText={(v) => update({ endDate: v, isCurrentRole: false })}
              placeholder="MM / YYYY"
              keyboardType="numeric"
              disabled={draft.isCurrentRole}
              maxLength={7}
            />
          </View>
        </View>

        {/* Current role toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I currently work here</Text>
          <Switch
            value={draft.isCurrentRole}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              update({ isCurrentRole: v, endDate: v ? '' : draft.endDate });
            }}
            trackColor={{ false: '#D0D7FF', true: '#4C59D7' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D0D7FF"
          />
        </View>

        {/* Key Achievements */}
        <View>
          <Text style={styles.fieldLabel}>Key Achievements</Text>
          <TextInput
            style={[styles.fieldInput, styles.achievementsInput]}
            value={draft.description}
            onChangeText={(v) => {
              if (v.length <= 400) {
                update({ description: v });
                setDescCount(v.length);
              }
            }}
            placeholder={`\u2022 Led redesign that increased retention 24%\n\u2022 Managed team of 3 junior designers\n\u2022 Built company\u2019s first design system`}
            placeholderTextColor="#C0C4D0"
            multiline
            textAlignVertical="top"
            returnKeyType="default"
          />
          <Text style={styles.charCount}>{descCount} / 400</Text>
          <Text style={styles.helperText}>Use bullet points with numbers for impact</Text>
        </View>

        {/* Save button */}
        <View style={styles.saveDivider} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Experience</Text>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
  default: {},
});

const expandedShadow = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  // ── Card container ─────────────────────────────────────────────────────────
  card: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardCollapsed: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D7FF',
    padding: 14,
    ...cardShadow,
  },
  cardExpanded: {
    backgroundColor: '#F8F9FF',
    borderWidth: 1.5,
    padding: 16,
    ...expandedShadow,
  },

  // ── Header row ────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAFF',
    borderStyle: 'dashed',
    paddingBottom: 14,
    marginBottom: 16,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },

  // ── Text block ────────────────────────────────────────────────────────────
  textBlock: {
    flex: 1,
    marginRight: 4,
  },
  companyName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#1A1A2E',       // FIX: was blue #4C59D7
  },
  summaryText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  // ── Icon group ────────────────────────────────────────────────────────────
  iconBtn: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    gap: 14,
  },

  // ── Field label + input ───────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginBottom: 6,
  },
  fieldInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#1A1A2E',
  },
  fieldFocusShadow: Platform.select({
    ios: {
      shadowColor: '#4C59D7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: {},
    default: {},
  }) as any,
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },

  // ── Dates row ─────────────────────────────────────────────────────────────
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#1A1A2E',
  },

  // ── Achievements textarea ─────────────────────────────────────────────────
  achievementsInput: {
    height: undefined,
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
    lineHeight: 21,
    fontSize: 14,
    borderColor: '#D0D7FF',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  charCount: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#849CFF',
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // ── Save button ───────────────────────────────────────────────────────────
  saveDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8EAFF',
    borderStyle: 'dashed',
    marginTop: 4,
    paddingTop: 14,
  },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
