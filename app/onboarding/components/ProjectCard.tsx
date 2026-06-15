/**
 * ProjectCard — self-contained project card for Profile Builder Step 2.
 *
 * COLLAPSED: avatar + title/subtitle + gray pencil + gray X
 * EXPANDED:  white bg, proper labeled fields, URL fields with icons,
 *            solid-purple "Save Project" button flush at card bottom.
 *
 * Design tokens:
 *   Card bg        #FFFFFF
 *   Input bg       #F7F7F7
 *   Input border   #EBEBEB
 *   Focus border   #4F46E5
 *   Label          12px 600 #555555
 *   Save btn       #4F46E5, 0 0 16px 16px radius
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
import { Project } from '../../types/profile';
import { FontFamily } from '../../theme/typography';

// ─── Avatar colors (by index) ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FFF0F6', text: '#DB2777' },
  { bg: '#F0FFF4', text: '#16A34A' },
  { bg: '#FFF8E6', text: '#D97706' },
  { bg: '#F0F8FF', text: '#0284C7' },
];

// ─── Labeled text field ───────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'url';
  multiline?: boolean;
  height?: number;
  leftIcon?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder = '',
  keyboardType = 'default', multiline = false, height = 44, leftIcon,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          { height: multiline ? undefined : height, minHeight: multiline ? height : undefined },
          focused && styles.inputWrapFocused,
          leftIcon ? { flexDirection: 'row', alignItems: 'center' } : {},
        ]}
      >
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 8 } : undefined,
            multiline ? { flex: 1, paddingTop: 12, textAlignVertical: 'top' as const } : undefined,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BBBBBB"
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          returnKeyType={multiline ? 'default' : 'done'}
          autoCorrect={false}
          autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        />
      </View>
    </View>
  );
};

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSave: (project: Project) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project, isExpanded, onToggleExpand, onSave, onDelete, index,
}) => {
  const [draft, setDraft] = useState<Project>(project);

  // Sync draft when card opens
  useEffect(() => { if (isExpanded) setDraft(project); }, [isExpanded]);

  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = (draft.name || project.name || 'P')[0].toUpperCase();
  const subtitle = project.techStack?.length > 0 ? project.techStack.join(', ') : 'No tech stack';

  const update = (field: Partial<Project>) => setDraft((d) => ({ ...d, ...field }));
  const handleToggle = () => onToggleExpand(project.id);
  const handleDelete = () => onDelete(project.id);
  const handleSave = () => { onSave(draft); onToggleExpand(project.id); };

  // ── Header row (shared) ────────────────────────────────────────────────────
  const Header = (
    <View style={styles.headerRow}>
      <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
        <Text style={[styles.avatarLetter, { color: colors.text }]}>{initial}</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project.name || 'New Project'}
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.iconBtn, { marginLeft: 12 }]} onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-outline" size={18} color="#AAAAAA" />
      </TouchableOpacity>
    </View>
  );

  // ── COLLAPSED ──────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <TouchableOpacity style={[styles.card, styles.cardCollapsed]} onPress={handleToggle} activeOpacity={0.85}>
        {Header}
      </TouchableOpacity>
    );
  }

  // ── EXPANDED ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, styles.cardExpanded]}>
      {/* Persistent header */}
      <View style={styles.expandedHeaderWrap}>
        {Header}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Form fields */}
      <View style={styles.form}>
        <Field
          label="Project Name"
          value={draft.name}
          onChangeText={(v) => update({ name: v })}
          placeholder="e.g. Portfolio Website"
        />

        <Field
          label="Description"
          value={draft.description}
          onChangeText={(v) => update({ description: v })}
          placeholder="Describe what this project does..."
          multiline
          height={100}
        />

        {/* Project URL — with link icon */}
        <Field
          label="Project URL"
          value={draft.url}
          onChangeText={(v) => update({ url: v })}
          placeholder="https://yourproject.com"
          keyboardType="url"
          leftIcon={<Ionicons name="link-outline" size={16} color="#BBBBBB" />}
        />

        {/* GitHub URL — with git icon */}
        <Field
          label="GitHub URL"
          value={draft.githubUrl}
          onChangeText={(v) => update({ githubUrl: v })}
          placeholder="https://github.com/username/repo"
          keyboardType="url"
          leftIcon={<Ionicons name="logo-github" size={16} color="#BBBBBB" />}
        />
      </View>

      {/* Save button — flush to card bottom, 0 0 16px 16px radius */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={styles.saveBtnText}>Save Project</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  // ── Card ──────────────────────────────────────────────────────────────────
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
  cardExpanded: {},   // padding handled per-section

  // ── Header ────────────────────────────────────────────────────────────────
  expandedHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  headerText: { flex: 1, marginRight: 4, gap: 2 },
  headerTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#0A0A0A' },
  headerSubtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#AAAAAA' },
  iconGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  iconBtn: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#F0F0F0' },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    padding: 20,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },

  // ── Field label ───────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#555555',
    marginBottom: 6,
  },

  // ── Input wrap ────────────────────────────────────────────────────────────
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
  inputIcon: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
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
