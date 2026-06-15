/**
 * SkillsSection — onboarding skills picker.
 *
 * Empty state: full-width dashed "+ Add Skills" button (no orphan "No skills added" text).
 * Filled state: chip wrap + smaller "+ Add More Skills" inline text trigger.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius, TouchTarget } from '../../theme/spacing';
import { Skill, SkillCategory, generateId } from '../../types/profile';
import { AddButton } from './AddButton';

interface SkillsSectionProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  showAiBadge?: boolean;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  onAddSkill,
  onDeleteSkill,
  showAiBadge = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  const handleAdd = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    onAddSkill({
      id: generateId(),
      name: trimmed,
      category: 'technical',
      yearsOfExperience: 0,
    });
    setNewSkillName('');
    // keep input open for quick multi-add
  };

  const handleDone = () => {
    handleAdd();
    setIsAdding(false);
  };

  // ── Inline add input ─────────────────────────────────────────────────────
  if (isAdding) {
    return (
      <View style={styles.addingWrap}>
        {/* Show existing chips if any */}
        {skills.length > 0 && (
          <View style={styles.chipsWrap}>
            {skills.map((s) => (
              <View key={s.id} style={styles.chip}>
                <Text style={styles.chipText}>{s.name}</Text>
                <TouchableOpacity
                  onPress={() => onDeleteSkill(s.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  style={styles.chipDelete}
                >
                  <Text style={styles.chipDeleteText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newSkillName}
            onChangeText={setNewSkillName}
            placeholder="Type a skill…"
            placeholderTextColor="#C0C4D0"
            autoFocus
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addInlineBtn} onPress={handleAdd}>
            <Text style={styles.addInlineBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { setIsAdding(false); setNewSkillName(''); }}
          >
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.doneLink}
          onPress={() => setIsAdding(false)}
        >
          <Text style={styles.doneLinkText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty state: just the full-width dashed button ───────────────────────
  if (skills.length === 0) {
    return (
      <AddButton
        label="+ Add Skills"
        onPress={() => setIsAdding(true)}
      />
    );
  }

  // ── Has skills: chips + add more link ────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.chipsWrap}>
        {skills.map((s) => (
          <View key={s.id} style={styles.chip}>
            <Text style={styles.chipText}>{s.name}</Text>
            <TouchableOpacity
              onPress={() => onDeleteSkill(s.id)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              style={styles.chipDelete}
            >
              <Text style={styles.chipDeleteText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.addMoreLink}
        onPress={() => setIsAdding(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addMoreLinkText}>+ Add More Skills</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C59D7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
  },
  chipDelete: {
    marginLeft: 6,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDeleteText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  // ── Add more link (below chips) ───────────────────────────────────────────
  addMoreLink: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
    marginTop: 8,
  },
  addMoreLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#4C59D7',
  },

  // ── Inline add input ──────────────────────────────────────────────────────
  addingWrap: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F4F6FF',
    borderWidth: 1,
    borderColor: '#D0D7FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: '#1A1A2E',
  },
  addInlineBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#4C59D7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInlineBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
  cancelBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  doneLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  doneLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
});
