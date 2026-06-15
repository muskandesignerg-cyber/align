/**
 * AddLinkedWorkSheet — Premium redesign.
 *
 * Step 1: Compact horizontal option list (5 platforms)
 * Step 2: URL input for selected platform + Save Link button
 *
 * No emoji, no </> code text, no square centered tiles.
 * All icons are Lucide outline with colored icon-box backgrounds.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useUI } from '../../context/UIContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT  = SCREEN_HEIGHT * 0.72; // taller so all 5 rows fit

// ─── Platform definitions ──────────────────────────────────────────────────────

interface PlatformDef {
  id:          string;
  label:       string;
  desc:        string;
  iconName:    keyof typeof Ionicons.glyphMap;
  iconColor:   string;
  iconBg:      string;
  placeholder: string;
}

const PLATFORMS: PlatformDef[] = [
  {
    id:          'github',
    label:       'GitHub',
    desc:        'Showcase your code repositories',
    iconName:    'logo-github',
    iconColor:   '#0A0A0A',
    iconBg:      '#F3F4F6',
    placeholder: 'github.com/username',
  },
  {
    id:          'portfolio',
    label:       'Portfolio',
    desc:        'Link your personal website',
    iconName:    'globe-outline',
    iconColor:   '#4F46E5',
    iconBg:      '#EEF2FF',
    placeholder: 'yoursite.com',
  },
  {
    id:          'dribbble',
    label:       'Dribbble',
    desc:        'Share your design work',
    iconName:    'color-palette-outline',
    iconColor:   '#EA4C89',
    iconBg:      '#FDF2F8',
    placeholder: 'dribbble.com/username',
  },
  {
    id:          'behance',
    label:       'Behance',
    desc:        'Display your creative projects',
    iconName:    'albums-outline',
    iconColor:   '#1769FF',
    iconBg:      '#EFF6FF',
    placeholder: 'behance.net/username',
  },
  {
    id:          'linkedin',
    label:       'LinkedIn',
    desc:        'Connect your professional profile',
    iconName:    'logo-linkedin',
    iconColor:   '#0A66C2',
    iconBg:      '#EFF6FF',
    placeholder: 'linkedin.com/in/yourname',
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AddLinkedWorkSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd:   (work: { platform: string; label: string; url: string }) => void;
}

// ─── Sheet ─────────────────────────────────────────────────────────────────────

export default function AddLinkedWorkSheet({
  visible,
  onClose,
  onAdd,
}: AddLinkedWorkSheetProps) {
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [url,           setUrl]           = useState('');
  const [inputFocused,  setInputFocused]  = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const { setSheetOpen } = useUI();

  useEffect(() => {
    if (visible) {
      setSheetOpen(true);
      translateY.value = withSpring(0, { mass: 1, damping: 20, stiffness: 200 });
      setSelectedId(null);
      setUrl('');
      setInputFocused(false);
    } else {
      setSheetOpen(false);
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const dismiss = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => runOnJS(onClose)());
  };

  const handleAdd = () => {
    if (!selectedId || !url.trim()) return;
    const platform = PLATFORMS.find((p) => p.id === selectedId)!;
    onAdd({ platform: selectedId, label: platform.label, url: url.trim() });
    dismiss();
  };

  if (!visible) return null;

  const selected = PLATFORMS.find((p) => p.id === selectedId) ?? null;
  const canSave  = !!selectedId && url.trim().length > 0;

  return (
    <View style={S.modalContainer} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={dismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.kvWrapper}
        pointerEvents="box-none"
      >
        <Animated.View style={[S.sheet, sheetStyle]}>

          {/* Handle */}
          <View style={S.handle} />

          {/* ── Header ── */}
          <View style={S.header}>
            {selected ? (
              /* URL input step — show back arrow */
              <TouchableOpacity
                onPress={() => { setSelectedId(null); setUrl(''); }}
                style={S.backBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={22} color="#0A0A0A" />
              </TouchableOpacity>
            ) : (
              <View style={S.backBtn} />
            )}

            <Text style={S.headerTitle}>
              {selected ? `Add ${selected.label}` : 'Add Linked Work'}
            </Text>

            <TouchableOpacity onPress={dismiss} style={S.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={22} color="#888888" />
            </TouchableOpacity>
          </View>
          <View style={S.headerBorder} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.scrollContent}
          >
            {!selected ? (
              /* ── Step 1: Platform list ── */
              <>
                <Text style={S.subtitle}>
                  Connect your work profiles to{'\n'}verify your skills automatically
                </Text>

                {PLATFORMS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={S.optionCard}
                    onPress={() => setSelectedId(p.id)}
                    activeOpacity={0.75}
                  >
                    {/* Icon box */}
                    <View style={[S.iconBox, { backgroundColor: p.iconBg }]}>
                      <Ionicons name={p.iconName} size={20} color={p.iconColor} />
                    </View>

                    {/* Name + desc */}
                    <View style={S.optionContent}>
                      <Text style={S.optionName}>{p.label}</Text>
                      <Text style={S.optionDesc}>{p.desc}</Text>
                    </View>

                    {/* Chevron */}
                    <Ionicons name="chevron-forward-outline" size={18} color="#CCCCCC" />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              /* ── Step 2: URL input ── */
              <View style={S.inputStep}>
                {/* Selected platform mini card */}
                <View style={S.selectedPill}>
                  <View style={[S.pillIconBox, { backgroundColor: selected.iconBg }]}>
                    <Ionicons name={selected.iconName} size={16} color={selected.iconColor} />
                  </View>
                  <Text style={S.pillLabel}>{selected.label}</Text>
                </View>

                {/* URL input */}
                <TextInput
                  style={[S.urlInput, inputFocused && S.urlInputFocused] as any}
                  value={url}
                  onChangeText={setUrl}
                  placeholder={selected.placeholder}
                  placeholderTextColor="#AAAAAA"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  autoFocus
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                <Text style={S.inputHint}>Paste your full profile URL</Text>

                {/* Save Link button */}
                <TouchableOpacity
                  style={[S.saveBtn, !canSave && S.saveBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!canSave}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
                  <Text style={S.saveBtnText}>Save Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Container / sheet
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  backdrop:       { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  kvWrapper:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 32, elevation: 16 },
    }),
  },

  // Handle
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerBorder: { height: 1, backgroundColor: '#F0F0F0' },
  backBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: '#0A0A0A', textAlign: 'center' },
  closeBtn:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // Scroll
  scrollContent: { paddingBottom: 40 },

  // Subtitle
  subtitle: {
    fontSize: 13, color: '#888888', lineHeight: 20,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },

  // Option cards
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginTop: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  iconBox:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionContent: { flex: 1, gap: 3 },
  optionName:    { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  optionDesc:    { fontSize: 12, color: '#888888' },

  // Input step
  inputStep: { paddingHorizontal: 20, paddingTop: 20 },

  selectedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 20,
  },
  pillIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pillLabel:   { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },

  urlInput: {
    height: 48, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 12, paddingHorizontal: 16,
    fontSize: 14, color: '#0A0A0A', outlineWidth: 0,
  },
  urlInputFocused: { borderWidth: 1.5, borderColor: '#4F46E5', backgroundColor: '#FAFAFE' },
  inputHint: { fontSize: 12, color: '#AAAAAA', marginTop: 6 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, backgroundColor: '#4F46E5', marginTop: 20,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(79,70,229,0.25)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
    }),
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE' },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
