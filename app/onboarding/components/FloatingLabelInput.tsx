import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  showAiBadge?: boolean;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines,
  keyboardType = 'default',
  showAiBadge = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const badgeOpacity = useRef(new Animated.Value(showAiBadge ? 1 : 0)).current;

  const isActive = isFocused || value.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isActive ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isActive, labelAnim]);

  useEffect(() => {
    if (showAiBadge) {
      badgeOpacity.setValue(1);
      const timer = setTimeout(() => {
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAiBadge, badgeOpacity]);

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FontSize.bodyLg, FontSize.sm],
  });

  return (
    <View
      style={[
        styles.container,
        multiline && styles.containerMultiline,
        isFocused && styles.containerFocused,
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          {
            top: labelTop,
            fontSize: labelFontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={isActive ? placeholder : undefined}
        placeholderTextColor={Colors.muted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType as KeyboardTypeOptions}
        textAlignVertical={multiline ? 'top' : 'center'}
      />

      {showAiBadge && (
        <Animated.View style={[styles.aiBadge, { opacity: badgeOpacity }]}>
          <Text style={styles.aiBadgeText}>✦ AI filled</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    height: 56,
    paddingHorizontal: Spacing.s16,
    justifyContent: 'center',
    position: 'relative',
  },
  containerMultiline: {
    height: undefined,
    minHeight: 120,
    paddingTop: Spacing.s24,
    paddingBottom: Spacing.s12,
  },
  containerFocused: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  label: {
    position: 'absolute',
    left: Spacing.s16,
    fontFamily: FontFamily.regular,
    color: Colors.muted,
    zIndex: 1,
  },
  input: {
    fontSize: FontSize.bodyLg,
    fontFamily: FontFamily.regular,
    color: Colors.bodyText,
    paddingTop: Spacing.s16,
    paddingBottom: 0,
    flex: 1,
    outlineWidth: 0,
  } as any,
  inputMultiline: {
    paddingTop: 0,
    flex: 1,
    textAlignVertical: 'top',
  },
  aiBadge: {
    position: 'absolute',
    top: Spacing.s8,
    right: Spacing.s12,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s2,
    borderRadius: BorderRadius.chip,
  },
  aiBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
});
