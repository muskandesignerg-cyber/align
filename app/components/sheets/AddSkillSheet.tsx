/**
 * AddSkillSheet — Premium redesign.
 *
 * Fixes:
 *  • Chips: gray style (not blue-outlined)
 *  • Icons: Ionicons Zap / Github / Users (no emoji / </> text)
 *  • Recommended badge: styled pill (not all-caps label)
 *  • Disabled button: #E0E0E0 gray (not lavender)
 *  • Enabled button: #4F46E5 purple
 *  • Success flow: Processing → Skill Added! → close
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
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

// ─── Data ──────────────────────────────────────────────────────────────────────

const SUGGESTED_SKILLS = [
  'React', 'Motion Design', 'User Testing', 'TypeScript',
  'Design Systems', 'Accessibility', 'Wireframing',
  'Brand Identity', 'After Effects', 'Webflow',
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT  = SCREEN_HEIGHT * 0.88;

type VerifyMethod = 'challenge' | 'github' | 'peer';
type ConfirmState = 'idle' | 'processing' | 'success';

interface AddSkillSheetProps {
  visible:       boolean;
  selectedSkill?: string | null;
  onClose:       () => void;
  onConfirm:     (skills: string[], method: VerifyMethod) => void;
}

// ─── Verify options ────────────────────────────────────────────────────────────

interface VerifyOption {
  id:           VerifyMethod;
  iconName:     keyof typeof Ionicons.glyphMap;
  iconColor:    string;
  iconBg:       string;
  title:        string;
  desc:         string;
  recommended?: boolean;
}

const VERIFY_OPTIONS: VerifyOption[] = [
  {
    id:          'challenge',
    iconName:    'flash-outline',
    iconColor:   '#4F46E5',
    iconBg:      '#EEF2FF',
    title:       'Take a 3-min challenge',
    desc:        'Complete a quick quiz to earn a verified badge instantly.',
    recommended: true,
  },
  {
    id:       'github',
    iconName: 'logo-github',
    iconColor:'#0A0A0A',
    iconBg:   '#F3F4F6',
    title:    'Link a GitHub repo',
    desc:     'Connect a repository that demonstrates this skill.',
  },
  {
    id:       'peer',
    iconName: 'people-outline',
    iconColor:'#22C55E',
    iconBg:   '#F0FDF4',
    title:    'Get a peer endorsement',
    desc:     'Ask a colleague to vouch for this skill.',
  },
];

// ─── Sheet ─────────────────────────────────────────────────────────────────────

export default function AddSkillSheet({
  visible,
  selectedSkill,
  onClose,
  onConfirm,
}: AddSkillSheetProps) {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedSkills,  setSelectedSkills]  = useState<Set<string>>(new Set());
  const [selectedMethod,  setSelectedMethod]  = useState<VerifyMethod>('challenge');
  const [inputFocused,    setInputFocused]    = useState(false);
  const [confirmState,    setConfirmState]    = useState<ConfirmState>('idle');

  const translateY = useSharedValue(SHEET_HEIGHT);
  const { setSheetOpen } = useUI();

  useEffect(() => {
    if (visible) {
      setSheetOpen(true);
      translateY.value = withSpring(0, { mass: 1, damping: 20, stiffness: 200 });
      setSelectedSkills(selectedSkill ? new Set([selectedSkill]) : new Set());
      setSearchQuery('');
      setSelectedMethod('challenge');
      setConfirmState('idle');
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

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill); else next.add(skill);
      return next;
    });
  };

  const filtered = SUGGESTED_SKILLS.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const canConfirm = selectedSkills.size > 0 || searchQuery.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm || confirmState !== 'idle') return;

    // Collect skills — typed query becomes a skill too
    const skills = new Set(selectedSkills);
    if (searchQuery.trim()) skills.add(searchQuery.trim());

    setConfirmState('processing');
    setTimeout(() => {
      onConfirm(Array.from(skills), selectedMethod);
      setConfirmState('success');
      setTimeout(() => dismiss(), 1000);
    }, 800);
  };

  if (!visible) return null;

  // ── Button content ──
  const renderBtn = () => {
    if (confirmState === 'processing') {
      return (
        <View style={S.btnInner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={S.btnText}>Processing...</Text>
        </View>
      );
    }
    if (confirmState === 'success') {
      return (
        <View style={S.btnInner}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={S.btnText}>Skill Added!</Text>
        </View>
      );
    }
    return (
      <View style={S.btnInner}>
        <Ionicons name="arrow-forward-outline" size={18} color={canConfirm ? '#FFFFFF' : '#AAAAAA'} />
        <Text style={[S.btnText, !canConfirm && S.btnTextDisabled]}>Confirm & Proceed</Text>
      </View>
    );
  };

  const btnBg =
    confirmState === 'success'    ? '#22C55E' :
    confirmState === 'processing' ? '#4F46E5' :
    canConfirm                    ? '#4F46E5' : '#E0E0E0';

  return (
    <View style={S.overlay} pointerEvents="box-none">
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={dismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.kvWrapper}
        pointerEvents="box-none"
      >
        <Animated.View style={[S.sheet, sheetStyle]}>
          {/* Handle */}
          <View style={S.handle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          >
            {/* Header */}
            <View style={S.header}>
              <Text style={S.headerTitle}>Add or verify a skill</Text>
              <TouchableOpacity onPress={dismiss} style={S.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color="#888888" />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={[S.searchBox, inputFocused && S.searchBoxFocused]}>
              <Ionicons name="search-outline" size={16} color="#AAAAAA" style={S.searchIcon} />
              <TextInput
                style={S.searchInput as any}
                placeholder="Search for a skill (e.g., React, Figma)"
                placeholderTextColor="#AAAAAA"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setInputFocused(true)}
                onBlur={()  => setInputFocused(false)}
              />
            </View>

            {/* Suggested chips */}
            <Text style={S.sectionLabel}>SUGGESTED FOR YOU</Text>
            <View style={S.chipGrid}>
              {filtered.map((skill) => {
                const sel = selectedSkills.has(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[S.chip, sel && S.chipSelected]}
                    onPress={() => toggleSkill(skill)}
                    activeOpacity={0.75}
                  >
                    <Text style={[S.chipText, sel && S.chipTextSelected]}>{skill}</Text>
                  </TouchableOpacity>
                );
              })}
              {/* Custom skill from search */}
              {searchQuery.trim().length > 0 && !SUGGESTED_SKILLS.includes(searchQuery.trim()) && (
                <TouchableOpacity
                  style={[S.chip, selectedSkills.has(searchQuery.trim()) && S.chipSelected]}
                  onPress={() => toggleSkill(searchQuery.trim())}
                  activeOpacity={0.75}
                >
                  <Text style={[S.chipText, selectedSkills.has(searchQuery.trim()) && S.chipTextSelected]}>
                    + Add "{searchQuery.trim()}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verification */}
            <Text style={S.verifyTitle}>How do you want to verify?</Text>
            <Text style={S.verifySub}>Verified skills rank higher in employer searches.</Text>

            <View style={S.optionList}>
              {VERIFY_OPTIONS.map((opt) => {
                const sel = selectedMethod === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[S.optionCard, sel && S.optionCardSelected]}
                    onPress={() => setSelectedMethod(opt.id)}
                    activeOpacity={0.8}
                  >
                    {/* Radio */}
                    <View style={[S.radio, sel && S.radioSelected]}>
                      {sel && <View style={S.radioDot} />}
                    </View>

                    {/* Icon box */}
                    <View style={[S.iconBox, { backgroundColor: opt.iconBg }]}>
                      <Ionicons name={opt.iconName} size={18} color={opt.iconColor} />
                    </View>

                    {/* Text */}
                    <View style={S.optionContent}>
                      <Text style={S.optionTitle}>{opt.title}</Text>
                      <Text style={S.optionDesc}>{opt.desc}</Text>
                    </View>

                    {/* Recommended badge */}
                    {opt.recommended && (
                      <View style={S.recoBadge}>
                        <Text style={S.recoBadgeText}>Recommended</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky confirm button */}
          <View style={S.confirmWrap}>
            <TouchableOpacity
              style={[S.confirmBtn, { backgroundColor: btnBg },
                confirmState === 'success' && S.confirmBtnSuccess,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={!canConfirm || confirmState !== 'idle'}
            >
              {renderBtn()}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  overlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  backdrop:  { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  kvWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT },
  sheet: {
    height: SHEET_HEIGHT, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
    ...Platform.select({
      web:     { boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 32, elevation: 16 },
    }),
  },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  closeBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 46, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 12, paddingLeft: 40, paddingRight: 14,
    marginBottom: 20,
  },
  searchBoxFocused: { borderWidth: 1.5, borderColor: '#4F46E5', backgroundColor: '#FAFAFE' },
  searchIcon:  { position: 'absolute', left: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#0A0A0A', outlineWidth: 0 },

  // Section label
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#AAAAAA',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },

  // Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    height: 32, paddingHorizontal: 12,
    backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  chipSelected:     { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#4F46E5' },
  chipText:         { fontSize: 12, fontWeight: '500', color: '#555555' },
  chipTextSelected: { fontWeight: '600', color: '#4F46E5' },

  // Verify header
  verifyTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  verifySub:   { fontSize: 12, color: '#888888', marginBottom: 14 },

  // Options
  optionList: { gap: 10, marginBottom: 20 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 14, padding: 14,
  },
  optionCardSelected: { backgroundColor: '#F8F8FF', borderWidth: 1.5, borderColor: '#4F46E5' },

  // Radio
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: { borderColor: '#4F46E5' },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },

  // Icon box
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Option text
  optionContent: { flex: 1, gap: 3 },
  optionTitle:   { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  optionDesc:    { fontSize: 12, color: '#888888', lineHeight: 18 },

  // Recommended badge
  recoBadge: {
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 0,
  },
  recoBadgeText: { fontSize: 10, fontWeight: '600', color: '#4F46E5' },

  // Confirm button
  confirmWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
  },
  confirmBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnSuccess: {
    ...Platform.select({
      web:     { boxShadow: '0 4px 16px rgba(34,197,94,0.25)' } as any,
      default: {},
    }),
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText:         { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  btnTextDisabled: { color: '#AAAAAA' },
});
