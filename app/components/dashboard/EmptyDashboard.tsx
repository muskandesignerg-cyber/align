import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IsometricBox } from '../ui/AppIcons';

interface EmptyDashboardProps {
  onGoToFeed: () => void;
}

export default function EmptyDashboard({ onGoToFeed }: EmptyDashboardProps) {
  return (
    <View style={styles.container}>
      {/* Illustration card */}
      <View style={styles.card}>
        <IsometricBox size={160} />
      </View>

      {/* Text */}
      <Text style={styles.title}>No applications{'\n'}yet</Text>
      <Text style={styles.subtitle}>
        Start swiping to apply — it takes one tap{'\n'}to find your next big opportunity.
      </Text>

      {/* CTA */}
      <TouchableOpacity style={styles.button} onPress={onGoToFeed} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Go to Discover  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 24px rgba(76,89,215,0.08)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: '#F8F9FF',
  },
  card: {
    width: 240,
    height: 220,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...cardShadow,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7',
    textAlign: 'center',
    lineHeight: 40,
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
    height: 56,
    paddingHorizontal: 40,
    borderRadius: 28,
    backgroundColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
