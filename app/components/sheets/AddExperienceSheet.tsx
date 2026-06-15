/**
 * AddExperienceSheet — Premium bottom sheet for adding a work experience entry.
 */

import React, { useState, useEffect } from 'react';
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
  Switch,
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
const SHEET_HEIGHT  = SCREEN_HEIGHT * 0.88;

const EMP_TYPES = ['Full Time', 'Part Time', 'Internship', 'Freelance'] as const;
type EmpType = typeof EMP_TYPES[number];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

export interface ExperienceEntry {
  title:      string;
  company:    string;
  location:   string;
  empType:    EmpType;
  startMonth: string;
  startYear:  string;
  endMonth:   string;
  endYear:    string;
  current:    boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd:   (entry: ExperienceEntry) => void;
}

// ─── Reusable text field ───────────────────────────────────────────────────────

function Field({ label, value, onChangeText, placeholder }: {
  label: string; value: string;
  onChangeText: (v: string) => void; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={F.wrap}>
      <Text style={F.label}>{label}</Text>
      <TextInput
        style={[F.input, focused && F.focused] as any}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#AAAAAA"
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
      />
    </View>
  );
}

// ─── Dropdown picker ───────────────────────────────────────────────────────────

function SelectPicker({ options, value, onChange, placeholder }: {
  options: string[]; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity style={F.picker} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={value ? F.pickerValue : F.pickerPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={14}
          color="#AAAAAA"
        />
      </TouchableOpacity>
      {open && (
        <View style={F.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[F.dropdownItem, value === opt && F.dropdownItemSel]}
                onPress={() => { onChange(opt); setOpen(false); }}
                activeOpacity={0.75}
              >
                <Text style={[F.dropdownText, value === opt && F.dropdownTextSel]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Main sheet ────────────────────────────────────────────────────────────────

export default function AddExperienceSheet({ visible, onClose, onAdd }: Props) {
  const [jobTitle,   setJobTitle]   = useState('');
  const [company,    setCompany]    = useState('');
  const [location,   setLocation]   = useState('');
  const [empType,    setEmpType]    = useState<EmpType>('Full Time');
  const [startMonth, setStartMonth] = useState('');
  const [startYear,  setStartYear]  = useState('');
  const [endMonth,   setEndMonth]   = useState('');
  const [endYear,    setEndYear]    = useState('');
  const [current,    setCurrent]    = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const { setSheetOpen } = useUI();

  useEffect(() => {
    if (visible) {
      setSheetOpen(true);
      translateY.value = withSpring(0, { mass: 1, damping: 20, stiffness: 200 });
      setJobTitle(''); setCompany(''); setLocation('');
      setEmpType('Full Time');
      setStartMonth(''); setStartYear('');
      setEndMonth('');   setEndYear('');
      setCurrent(false);
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

  const canSave = jobTitle.trim().length > 0 && company.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onAdd({ title: jobTitle, company, location, empType, startMonth, startYear, endMonth, endYear, current });
    dismiss();
  };

  if (!visible) return null;

  return (
    <View style={S.overlay} pointerEvents="box-none">
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={dismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.kv}
        pointerEvents="box-none"
      >
        <Animated.View style={[S.sheet, sheetStyle]}>

          {/* Handle */}
          <View style={S.handle} />

          {/* Header */}
          <View style={S.header}>
            <Text style={S.headerTitle}>Add Experience</Text>
            <TouchableOpacity onPress={dismiss} style={S.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={22} color="#888888" />
            </TouchableOpacity>
          </View>
          <View style={S.divider} />

          {/* Scrollable form */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.scrollContent}
          >
            <Field
              label="Job Title"
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g. UI/UX Designer"
            />
            <Field
              label="Company Name"
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Exposys Data Labs"
            />
            <Field
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Bangalore, India"
            />

            {/* Employment Type */}
            <View style={S.fieldWrap}>
              <Text style={S.fieldLabel}>Employment Type</Text>
              <View style={S.chipRow}>
                {EMP_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[S.typeChip, empType === t && S.typeChipSel]}
                    onPress={() => setEmpType(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[S.typeChipText, empType === t && S.typeChipTextSel]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start Date */}
            <View style={S.fieldWrap}>
              <Text style={S.fieldLabel}>Start Date</Text>
              <View style={S.dateRow}>
                <View style={{ flex: 1 }}>
                  <SelectPicker options={MONTHS} value={startMonth} onChange={setStartMonth} placeholder="Month" />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <SelectPicker options={YEARS}  value={startYear}  onChange={setStartYear}  placeholder="Year"  />
                </View>
              </View>
            </View>

            {/* Currently working toggle */}
            <View style={S.toggleRow}>
              <Text style={S.toggleLabel}>Currently working here</Text>
              <Switch
                value={current}
                onValueChange={setCurrent}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              />
            </View>

            {/* End Date — only if not current */}
            {!current && (
              <View style={S.fieldWrap}>
                <Text style={S.fieldLabel}>End Date</Text>
                <View style={S.dateRow}>
                  <View style={{ flex: 1 }}>
                    <SelectPicker options={MONTHS} value={endMonth} onChange={setEndMonth} placeholder="Month" />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <SelectPicker options={YEARS}  value={endYear}  onChange={setEndYear}   placeholder="Year"  />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Fixed Save button */}
          <View style={S.saveWrap}>
            <TouchableOpacity
              style={[S.saveBtn, !canSave && S.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
              <Text style={S.saveBtnText}>Save Experience</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Field styles ─────────────────────────────────────────────────────────────

const F = StyleSheet.create({
  wrap:  { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '500', color: '#555555', marginBottom: 6 },
  input: {
    height: 48, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 12, paddingHorizontal: 16,
    fontSize: 14, color: '#0A0A0A', outlineWidth: 0,
  },
  focused: { borderWidth: 1.5, borderColor: '#4F46E5', backgroundColor: '#FAFAFE' },

  picker: {
    height: 48, backgroundColor: '#F7F7F7',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerValue:       { fontSize: 14, color: '#0A0A0A' },
  pickerPlaceholder: { fontSize: 14, color: '#AAAAAA' },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EBEBEB',
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
    ...Platform.select({
      web:     { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    }),
  },
  dropdownItem:    { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownItemSel: { backgroundColor: '#EEF2FF' },
  dropdownText:    { fontSize: 14, color: '#0A0A0A' },
  dropdownTextSel: { color: '#4F46E5', fontWeight: '600' },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  overlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  kv:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT },
  sheet: {
    height: SHEET_HEIGHT, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
    ...Platform.select({
      web:     { boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 32, elevation: 16 },
    }),
  },

  handle: {
    width: 36, height: 4, backgroundColor: '#E0E0E0',
    borderRadius: 2, alignSelf: 'center', marginTop: 12,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  closeBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  divider:     { height: 1, backgroundColor: '#F0F0F0' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: '#555555', marginBottom: 8 },

  chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:        { height: 34, paddingHorizontal: 14, backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 999, justifyContent: 'center' },
  typeChipSel:     { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#4F46E5' },
  typeChipText:    { fontSize: 12, fontWeight: '500', color: '#555555' },
  typeChipTextSel: { color: '#4F46E5', fontWeight: '600' },

  dateRow:     { flexDirection: 'row' },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: '#0A0A0A' },

  saveWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, zIndex: 10,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, backgroundColor: '#4F46E5',
    ...Platform.select({
      web:     { boxShadow: '0 4px 16px rgba(79,70,229,0.25)' } as any,
      default: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
    }),
  },
  saveBtnDisabled: { backgroundColor: '#C7D2FE', ...Platform.select({ web: { boxShadow: 'none' } as any, default: {} }) },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
