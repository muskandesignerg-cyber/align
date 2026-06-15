import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyFeedProps {
  onUpdatePreferences?: () => void;
}

export default function EmptyFeed({ onUpdatePreferences }: EmptyFeedProps) {
  return (
    <View style={styles.container}>
      {/* Icon box — replaces atom illustration */}
      <View style={styles.iconBox}>
        <Ionicons name="search-outline" size={32} color="#4F46E5" />
      </View>

      {/* Text */}
      <Text style={styles.title}>You've seen all jobs{'\n'}for now</Text>
      <Text style={styles.subtitle}>
        We're finding more matches. Check back{'\n'}soon.
      </Text>

      {/* CTA */}
      <TouchableOpacity
        style={styles.button}
        onPress={onUpdatePreferences}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Update Preferences</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    height: 52,
    paddingHorizontal: 36,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#4C59D7',
  },
});
