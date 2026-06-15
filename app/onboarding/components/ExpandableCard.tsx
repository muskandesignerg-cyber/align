/**
 * ExpandableCard — generic expandable card for Projects and Education sections.
 *
 * Delete confirmation redesign:
 *   - Two-section layout: company info row / confirmation row
 *   - Specific "Delete 'Title'?" message — NOT generic "Delete this item?"
 *   - Message text is dark (#0A0A0A) — NOT red
 *   - Cancel = white with gray border (equal visual weight)
 *   - Delete = #DC2626 with Trash2 icon and red shadow
 *   - No emoji icons anywhere — Ionicons outline only
 *   - Avatar = rounded square #EEF2FF background
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius, TouchTarget } from '../../theme/spacing';

interface ExpandableCardProps {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  title: string;
  subtitle?: string;
  iconLetter: string;
  children: React.ReactNode;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  id,
  expanded,
  onToggle,
  onDelete,
  title,
  subtitle,
  iconLetter,
  children,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeletePress = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
    setConfirmDelete(false);
  };

  const handleToggle = () => {
    setConfirmDelete(false);
    onToggle();
  };

  // ── Confirm-delete mode: two-section card ──────────────────────────────────
  if (confirmDelete) {
    return (
      <View style={[styles.card, styles.cardShadow]}>

        {/* SECTION 1 — Company info row */}
        <View style={styles.infoRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{iconLetter.toUpperCase()}</Text>
          </View>

          {/* Text */}
          <View style={styles.infoText}>
            <Text style={styles.infoTitle} numberOfLines={1}>{title}</Text>
            {subtitle ? (
              <Text style={styles.infoSubtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
          </TouchableOpacity>
          <View style={[styles.iconBtn, { marginLeft: 12 }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* SECTION 2 — Confirmation row */}
        <View style={styles.confirmRow}>
          {/* Message — dark, NOT red */}
          <Text style={styles.confirmMsg} numberOfLines={1}>
            {`Delete \u201c${title}\u201d?`}
          </Text>

          {/* Buttons */}
          <View style={styles.confirmButtons}>
            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setConfirmDelete(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => { onDelete(); setConfirmDelete(false); }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  }

  // ── Normal mode ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, styles.cardShadow, styles.cardNormal]}>
      {/* Header Row */}
      <View style={styles.infoRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{iconLetter.toUpperCase()}</Text>
        </View>

        {/* Title / Subtitle */}
        <View style={styles.infoText}>
          <Text style={styles.infoTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.infoSubtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={18} color="#AAAAAA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { marginLeft: 12 }]}
          onPress={handleDeletePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-outline" size={18} color="#AAAAAA" />
        </TouchableOpacity>
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card frame ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardNormal: {
    padding: 14,
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 3 },
    default: {},
  }) as any,

  // ── Info row (SECTION 1) ───────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,               // rounded square, NOT circle
    backgroundColor: '#EEF2FF',
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
    color: '#4F46E5',
  },

  // ── Info text ─────────────────────────────────────────────────────────────
  infoText: {
    flex: 1,
    marginRight: 4,
    gap: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0A0A0A',
  },
  infoSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#999999',
  },

  // ── Icon buttons ────────────────────────────────────────────────────────────
  iconBtn: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // ── Confirmation row (SECTION 2) ──────────────────────────────────────────
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  confirmMsg: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#0A0A0A',              // dark — NOT red
  },
  confirmButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  // Cancel button
  cancelBtn: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#555555',
  },

  // Delete button — controlled #DC2626, NOT bright tomato red
  deleteBtn: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },

  // ── Expanded content ──────────────────────────────────────────────────────
  expandedContent: {
    marginTop: 12,
  },
});
