/**
 * EditProfileSheet — Premium upgrade.
 *
 * Adds:
 *  • Top bar: ← | Edit Profile (center) | Save (right)
 *  • Bottom Save Changes button with loading → success → close flow
 *  • Discard dialog when back is pressed with unsaved changes
 *  • isDirty tracking to detect unsaved changes
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
  Switch,
  Platform,
  KeyboardAvoidingView,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated2, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CandidateProfile } from '../../types/candidateProfile';
import { useUI } from '../../context/UIContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT  = SCREEN_HEIGHT * 0.9;

// ─── Save button state ─────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved';

interface EditProfileSheetProps {
  visible: boolean;
  profile: CandidateProfile | null;
  onClose: () => void;
  onSave: (updates: Partial<CandidateProfile>) => void;
}

// ─── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldS.wrap}>
      <Text style={fieldS.label}>{label}</Text>
      <TextInput
        style={[fieldS.input, focused && fieldS.inputFocused] as any}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#AAAAAA"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── Main sheet ────────────────────────────────────────────────────────────────

export default function EditProfileSheet({
  visible,
  profile,
  onClose,
  onSave,
}: EditProfileSheetProps) {
  // Form state
  const [fullName,   setFullName]   = useState('');
  const [title,      setTitle]      = useState('');
  const [tagline,    setTagline]    = useState('');
  const [location,   setLocation]   = useState('');
  const [openToWork, setOpenToWork] = useState(true);
  const [linkedin,   setLinkedin]   = useState('');
  const [portfolio,  setPortfolio]  = useState('');
  const [github,     setGithub]     = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState('');

  // Snapshots to detect dirty state
  const snapshot = useRef({ fullName:'', title:'', tagline:'', location:'', openToWork:true, linkedin:'', portfolio:'', github:'' });

  const isDirty = () =>
    fullName  !== snapshot.current.fullName  ||
    title     !== snapshot.current.title     ||
    tagline   !== snapshot.current.tagline   ||
    location  !== snapshot.current.location  ||
    openToWork !== snapshot.current.openToWork ||
    linkedin  !== snapshot.current.linkedin  ||
    portfolio !== snapshot.current.portfolio ||
    github    !== snapshot.current.github;

  // Save state machine
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Discard dialog
  const [showDiscard, setShowDiscard] = useState(false);

  // Sheet animation (reanimated v3)
  const translateY = useSharedValue(SHEET_HEIGHT);
  const { setSheetOpen } = useUI();

  useEffect(() => {
    if (visible) {
      setSheetOpen(true);
      translateY.value = withSpring(0, { mass: 1, damping: 20, stiffness: 200 });
      if (profile) {
        const gh = profile.linkedWork.find((w) => w.platform === 'github');
        const pf = profile.linkedWork.find((w) => w.platform === 'portfolio');
        const li = profile.linkedWork.find((w) => w.platform === 'linkedin');

        setFullName(profile.fullName);
        setTitle(profile.professionalTitle);
        setTagline(profile.tagline);
        setLocation(profile.location);
        setOpenToWork(profile.isOpenToWork);
        setLinkedin(li?.url ?? '');
        setPortfolio(pf?.url ?? '');
        setGithub(gh?.url ?? '');
        setAvatarUrl(profile.avatarUrl ?? '');

        // Store snapshot
        snapshot.current = {
          fullName:   profile.fullName,
          title:      profile.professionalTitle,
          tagline:    profile.tagline,
          location:   profile.location,
          openToWork: profile.isOpenToWork,
          linkedin:   li?.url ?? '',
          portfolio:  pf?.url ?? '',
          github:     gh?.url ?? '',
        };
      }
      setSaveState('idle');
    } else {
      setSheetOpen(false);
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Close sheet (dismiss animation)
  const dismiss = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, () => runOnJS(onClose)());
  };

  // Back arrow handler
  const handleBackPress = () => {
    if (isDirty()) {
      setShowDiscard(true);
    } else {
      dismiss();
    }
  };

  // Save handler — 3-step state machine
  const handleSave = () => {
    if (saveState !== 'idle') return;
    setSaveState('saving');
    setTimeout(() => {
      onSave({
        fullName,
        professionalTitle: title,
        tagline,
        location,
        isOpenToWork: openToWork,
        avatarUrl,
      });
      setSaveState('saved');
      setTimeout(() => {
        dismiss();
      }, 1200);
    }, 800);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  if (!visible) return null;

  const initials =
    profile?.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('') ?? 'U';

  // Save button content
  const renderSaveBtnContent = () => {
    if (saveState === 'saving') {
      return (
        <View style={S.saveBtnInner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={S.saveBtnText}>Saving...</Text>
        </View>
      );
    }
    if (saveState === 'saved') {
      return (
        <View style={S.saveBtnInner}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
          <Text style={S.saveBtnText}>Saved!</Text>
        </View>
      );
    }
    return (
      <View style={S.saveBtnInner}>
        <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
        <Text style={S.saveBtnText}>Save Changes</Text>
      </View>
    );
  };

  const saveBtnBg = saveState === 'saved' ? '#22C55E' : '#4F46E5';

  return (
    <View style={S.modalContainer} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={handleBackPress} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.kvWrapper}
        pointerEvents="box-none"
      >
        <Animated2.View style={[S.sheet, sheetStyle]}>

          {/* Drag handle */}
          <View style={S.handle} />

          {/* Top bar */}
          <View style={S.topBar}>
            <TouchableOpacity onPress={handleBackPress} style={S.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back-outline" size={22} color="#0A0A0A" />
            </TouchableOpacity>
            <Text style={S.topBarTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saveState !== 'idle'}>
              <Text style={[S.topBarSave, saveState !== 'idle' && S.topBarSaveDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          <View style={S.divider} />

          {/* Scrollable form */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Photo */}
            <View style={S.photoRow}>
              <View style={S.photoAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={S.photoImage} />
                ) : (
                  <Text style={S.photoInitials}>{initials}</Text>
                )}
              </View>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
                <Text style={S.changePhoto}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Basic info */}
            <View style={S.formSection}>
              <Text style={S.sectionLabel}>BASIC INFO</Text>
              <Field label="Full Name"           value={fullName}  onChangeText={setFullName} />
              <Field label="Professional Title"  value={title}     onChangeText={setTitle} />
              <Field label="Tagline"             value={tagline}   onChangeText={setTagline} />
              <Field label="Location"            value={location}  onChangeText={setLocation} />
            </View>

            {/* Open to work */}
            <View style={S.formSection}>
              <View style={S.toggleRow}>
                <Text style={S.toggleLabel}>Open to work</Text>
                <Switch
                  value={openToWork}
                  onValueChange={setOpenToWork}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                />
              </View>
            </View>

            {/* Social links */}
            <View style={S.formSection}>
              <Text style={S.sectionLabel}>SOCIAL LINKS</Text>
              <Field label="LinkedIn URL"  value={linkedin}  onChangeText={setLinkedin}  placeholder="linkedin.com/in/yourname" />
              <Field label="Portfolio URL" value={portfolio} onChangeText={setPortfolio} placeholder="yoursite.com" />
              <Field label="GitHub URL"    value={github}    onChangeText={setGithub}    placeholder="github.com/username" />
            </View>
          </ScrollView>

          {/* Fixed bottom Save button */}
          <View style={S.saveWrap}>
            <TouchableOpacity
              style={[S.saveBtn, { backgroundColor: saveBtnBg }]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saveState !== 'idle'}
            >
              {renderSaveBtnContent()}
            </TouchableOpacity>
          </View>

        </Animated2.View>
      </KeyboardAvoidingView>

      {/* Discard dialog */}
      {showDiscard && (
        <View style={S.discardOverlay}>
          <TouchableOpacity
            style={S.discardBackdrop}
            activeOpacity={1}
            onPress={() => setShowDiscard(false)}
          />
          <View style={S.discardCard}>
            <Text style={S.discardTitle}>Discard changes?</Text>
            <Text style={S.discardSub}>Your changes will not be saved</Text>
            <TouchableOpacity
              style={S.discardBtn}
              onPress={dismiss}
              activeOpacity={0.8}
            >
              <Text style={S.discardBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.keepBtn}
              onPress={() => setShowDiscard(false)}
              activeOpacity={0.8}
            >
              <Text style={S.keepBtnText}>Keep Editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Field styles ─────────────────────────────────────────────────────────────

const fieldS = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0A0A0A',
    outlineWidth: 0,
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#FAFAFE',
  },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Overlay
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  kvWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT },
  sheet: { height: SHEET_HEIGHT, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

  // Handle
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  // Top bar
  topBar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  backBtn:            { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  topBarTitle:        { fontSize: 16, fontWeight: '600', color: '#0A0A0A' },
  topBarSave:         { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  topBarSaveDisabled: { opacity: 0.4 },

  divider: { height: 1, backgroundColor: '#F0F0F0' },

  // Photo
  photoRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 20, gap: 16 },
  photoAvatar:   { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage:    { width: '100%', height: '100%' },
  photoInitials: { fontSize: 24, fontWeight: '700', color: '#4F46E5' },
  changePhoto:   { fontSize: 14, fontWeight: '500', color: '#4F46E5' },

  // Form
  formSection:  { paddingHorizontal: 24, marginTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel:  { fontSize: 15, fontWeight: '500', color: '#0A0A0A' },

  // Bottom Save
  saveWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
    zIndex: 100,
  },
  saveBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(79,70,229,0.25)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
    }),
  },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText:  { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Discard dialog
  discardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 99999 },
  discardBackdrop:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  discardCard: {
    width: 320, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.16)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 32, elevation: 20 },
    }),
  },
  discardTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A0A', marginBottom: 8 },
  discardSub:   { fontSize: 14, color: '#888888', marginBottom: 24, textAlign: 'center' },
  discardBtn: {
    width: '100%', height: 48, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  discardBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  keepBtn: {
    width: '100%', height: 48, borderRadius: 12,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  keepBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
