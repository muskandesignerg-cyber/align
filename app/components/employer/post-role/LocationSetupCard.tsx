import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LayoutAnimation } from 'react-native';

const WORK_MODELS = ['Remote', 'Hybrid', 'On-site'] as const;
type WorkModel = typeof WORK_MODELS[number];

interface LocationSetupCardProps {
  workModel: WorkModel;
  officeLocation: string;
  onWorkModelChange: (m: WorkModel) => void;
  onLocationChange: (v: string) => void;
}

export default function LocationSetupCard({
  workModel,
  officeLocation,
  onWorkModelChange,
  onLocationChange,
}: LocationSetupCardProps) {
  const [focused, setFocused] = useState(false);
  const needsOffice = workModel === 'Hybrid' || workModel === 'On-site';

  const handleModelChange = (m: WorkModel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onWorkModelChange(m);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Location setup</Text>

      {/* Work model pills */}
      <View style={styles.pillRow}>
        {WORK_MODELS.map((m) => {
          const active = workModel === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => handleModelChange(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Office location (only for Hybrid/On-site) */}
      {needsOffice && (
        <View style={styles.locationWrap}>
          <Text style={styles.locationLabel}>Office Location</Text>
          <View style={[styles.locationInput, focused && styles.locationInputFocused]}>
            <Text style={styles.pinIcon}>📍</Text>
            <TextInput
              style={styles.locationText}
              value={officeLocation}
              onChangeText={onLocationChange}
              placeholder="e.g. Bangalore"
              placeholderTextColor="#6B7280"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          <Text style={styles.helperText}>Required for hybrid or on-site roles.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F6FF',
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
    marginBottom: 12,
  },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1, height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  pillActive: { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  pillText: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A1A2E' },
  pillTextActive: { color: '#FFFFFF' },
  locationWrap: { marginTop: 14 },
  locationLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginBottom: 6 },
  locationInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 10, height: 48, paddingHorizontal: 14,
  },
  locationInputFocused: { borderColor: '#4C59D7' },
  pinIcon: { fontSize: 16 },
  locationText: {
    flex: 1, fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E',
    outlineWidth: 0,
  } as any,
  helperText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', marginTop: 6,
  },
});
