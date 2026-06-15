/**
 * AddButton — reusable add action button.
 *
 * variant="dashed"  (default) — ghost dashed outline, 12px radius, 52pt
 * variant="solid"             — solid #4F46E5 filled, 12px radius, 52pt
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { FontFamily } from '../../theme/typography';

interface AddButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'dashed' | 'solid';
  style?: ViewStyle;
}

export const AddButton: React.FC<AddButtonProps> = ({
  label, onPress, variant = 'dashed', style,
}) => (
  <TouchableOpacity
    style={[variant === 'solid' ? styles.solid : styles.dashed, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={variant === 'solid' ? styles.solidLabel : styles.dashedLabel}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // ── Dashed ghost (default — Work Exp, Education, Skills) ──────────────────
  dashed: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dashedLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#4F46E5',
  },

  // ── Solid filled (Projects — prominent CTA) ───────────────────────────────
  solid: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  solidLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
});
