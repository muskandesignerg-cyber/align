import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';

interface ActionButtonsProps {
  onPass:    () => void;
  onApply:   () => void;
  disabled?: boolean;
}

/**
 * ActionButtons — fixed bar that sits directly above the bottom nav (72px).
 * Uses position absolute with bottom = 72 so it's always visible above the navbar.
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
        <X size={14} color="#888888" strokeWidth={2} />
        <Text style={styles.passText}>Pass</Text>
      </TouchableOpacity>

      {/* Apply */}
      <TouchableOpacity
        style={[styles.applyButton, disabled && styles.disabled]}
        onPress={onApply}
        activeOpacity={0.75}
        disabled={disabled}
      >
        <Check size={16} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:          'absolute',
    bottom:            80,
    left:              0,
    width:             '100%',
    height:            68,
    flexDirection:     'row',
    justifyContent:    'center',
    paddingTop:        8,
    paddingBottom:     8,
    paddingLeft:       16,
    paddingRight:      16,
    gap:               10,
    backgroundColor:   '#FFFFFF',
    borderTopWidth:    1,
    borderTopColor:    '#EFEFEF',
    zIndex:            99,
  },

  passButton: {
    width:           110,
    height:          52,
    backgroundColor: '#FFFFFF',
    borderWidth:     1.5,
    borderColor:     '#DEDEDE',
    borderRadius:    12,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
  },

  applyButton: {
    width:           228,
    height:          52,
    backgroundColor: '#4F46E5',
    borderRadius:    12,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(79,70,229,0.25)' } as any,
      default: {
        shadowColor:   '#4F46E5',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius:  12,
        elevation:     6,
      },
    }),
  },

  disabled: { opacity: 0.45 },

  passText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize:   14,
    color:      '#888888',
  },
  applyText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize:   14,
    color:      '#FFFFFF',
  },
});
