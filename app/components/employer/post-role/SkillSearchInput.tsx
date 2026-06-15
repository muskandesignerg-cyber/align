import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';

const SKILL_POOL = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Figma', 'GraphQL', 'AWS',
  'Docker', 'Vue', 'Angular', 'Swift', 'Kotlin', 'PostgreSQL', 'MongoDB',
  'Redis', 'React Native', 'Next.js', 'Go', 'Rust', 'Java', 'C#',
  'Flutter', 'TensorFlow', 'PyTorch', 'Kubernetes', 'Terraform',
  'Photoshop', 'Illustrator', 'Design Systems', 'Prototyping', 'UX Research',
  'Wireframing', 'User Testing', 'Sketch', 'InVision', 'Framer',
];

interface SkillSearchInputProps {
  addedSkills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  variant?: 'required' | 'nice';
  placeholder?: string;
}

export default function SkillSearchInput({
  addedSkills,
  onAddSkill,
  onRemoveSkill,
  variant = 'required',
  placeholder = 'Type a skill...',
}: SkillSearchInputProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const matches = query.length >= 1
    ? SKILL_POOL.filter(
        (s) => s.toLowerCase().includes(query.toLowerCase()) && !addedSkills.includes(s),
      ).slice(0, 6)
    : [];

  const handleAdd = (skill: string) => {
    onAddSkill(skill);
    setQuery('');
    setShowDropdown(false);
    setShowInput(false);
  };

  const handleCustomAdd = () => {
    if (query.trim() && !addedSkills.includes(query.trim())) {
      handleAdd(query.trim());
    }
  };

  const isRequired = variant === 'required';

  return (
    <View style={styles.container}>
      {/* Existing chips */}
      <View style={styles.chipWrap}>
        {addedSkills.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[styles.chip, isRequired ? styles.chipRequired : styles.chipNice]}
            onPress={() => onRemoveSkill(skill)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, isRequired ? styles.chipTextRequired : styles.chipTextNice]}>
              {skill}
            </Text>
            <Text style={[styles.closeX, isRequired ? styles.closeXRequired : styles.closeXNice]}>
              {' '}✕
            </Text>
          </TouchableOpacity>
        ))}

        {/* + Add skill chip */}
        {!showInput && (
          <TouchableOpacity
            style={[styles.chip, styles.addChip]}
            onPress={() => {
              setShowInput(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.addChipText}>+ Add skill</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Inline search input */}
      {showInput && (
        <View style={styles.inputWrap}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={(t) => { setQuery(t); setShowDropdown(t.length >= 1); }}
              placeholder={placeholder}
              placeholderTextColor="#6B7280"
              onBlur={() => {
                setTimeout(() => { setShowDropdown(false); setShowInput(false); setQuery(''); }, 200);
              }}
              returnKeyType="done"
              onSubmitEditing={handleCustomAdd}
            />
            <TouchableOpacity onPress={() => { setShowInput(false); setQuery(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Dropdown */}
          {showDropdown && matches.length > 0 && (
            <View style={[styles.dropdown, dropdownShadow]}>
              {matches.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={styles.dropdownRow}
                  onPress={() => handleAdd(skill)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dropdownText}>{skill}</Text>
                </TouchableOpacity>
              ))}
              {query.trim() && !SKILL_POOL.includes(query.trim()) && (
                <TouchableOpacity style={[styles.dropdownRow, styles.dropdownRowCustom]} onPress={handleCustomAdd} activeOpacity={0.75}>
                  <Text style={styles.dropdownTextCustom}>+ Add "{query.trim()}"</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const dropdownShadow = Platform.select({
  web: { boxShadow: '0px 4px 16px rgba(76,89,215,0.10)' } as any,
  default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
});

const styles = StyleSheet.create({
  container: { gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  chipRequired: { backgroundColor: '#4C59D7' },
  chipNice: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D0D7FF' },
  chipText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' },
  chipTextRequired: { color: '#FFFFFF' },
  chipTextNice: { color: '#6B7280' },
  closeX: { fontSize: 11 },
  closeXRequired: { color: 'rgba(255,255,255,0.7)' },
  closeXNice: { color: '#D0D7FF' },
  addChip: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#4C59D7' },
  addChipText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
  inputWrap: { position: 'relative', zIndex: 100 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 8, height: 44, paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1, fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    outlineWidth: 0,
  } as any,
  cancelText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#6B7280' },
  dropdown: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 8, marginTop: 4, overflow: 'hidden',
  },
  dropdownRow: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F4F6FF' },
  dropdownRowCustom: { borderBottomWidth: 0 },
  dropdownText: { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E' },
  dropdownTextCustom: { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
});
