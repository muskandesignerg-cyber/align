/**
 * OnboardingHeader — Shared header for all candidate onboarding screens.
 *
 * Layout:
 *   ROW 1 — ArrowLeft + 4 flex-stretch bars (height 4px, gap 6px)
 *   ROW 2 — "Step N of 4" right-aligned, 12px 500 #999999
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_BARS     = 3;
const COLOR_ACTIVE   = '#4F46E5';
const COLOR_INACTIVE = '#E0E0E0';

interface OnboardingHeaderProps {
  /** 1-based active step number */
  currentStep: number;
  /** Kept for API compatibility — internally defaults to 3 */
  totalSteps?: number;
  onBack: () => void;
  backgroundColor?: string;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  currentStep,
  totalSteps = TOTAL_BARS,
  onBack,
  backgroundColor = '#FFFFFF',
}) => {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor }}>

      {/* ROW 1 — Arrow + Bars */}
      <View style={styles.row}>

        {/* Back arrow — 44×44 touch target */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0A0A0A" />
        </TouchableOpacity>

        {/* bars — flex:1 each so they stretch to fill available width */}
        <View style={styles.barsRow}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { backgroundColor: i + 1 <= currentStep ? COLOR_ACTIVE : COLOR_INACTIVE },
              ]}
            />
          ))}
        </View>

        {/* Dummy view for symmetry (44px to match back button) */}
        <View style={{ width: 44 }} />
      </View>

      {/* ROW 2 — Step Indicator */}
      <View style={styles.stepRow}>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ROW 1
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    height: 44,
    gap: 16,
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  bar: {
    flex: 1,       // bars stretch to fill barsRow
    height: 4,
    borderRadius: 999,
  },

  // ROW 2
  stepRow: {
    paddingRight: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
    textAlign: 'right',
  },
});
