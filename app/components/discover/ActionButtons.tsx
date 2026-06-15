import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';


interface ActionButtonsProps {
  onPass: () => void;
  onApply: () => void;
  disabled?: boolean;
}

/**
 * ActionButtons — Bottom Pass + Apply buttons. Matches reference image:
 * Pass:  white bg, red border, red ✕ icon + "Pass" text
 * Apply: filled #4C59D7, white ♥ icon + "Apply" text
 */
export default function ActionButtons({ onPass, onApply, disabled = false }: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      {/* Pass */}
      <TouchableOpacity
        style={[styles.passButton, disabled && styles.disabled]}
        onPress={onPass}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <Ionicons name="close" size={16} color="#888888" />
        <Text style={styles.passText}>Pass</Text>
      </TouchableOpacity>

      {/* Apply — checkmark icon */}
      <TouchableOpacity
        style={[styles.applyButton, disabled && styles.disabled]}
        onPress={onApply}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  passButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  applyButton: {
    flex: 1.3,
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0px 4px 16px rgba(79,70,229,0.30)',
      },
      default: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },

  passText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: '#888888',
  },
  applyText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.45,
  },
});
