import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { BorderRadius, Spacing } from '../../theme/spacing';

type ChipVariant = 'filled' | 'outlined' | 'inactive';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  onRemove?: () => void;
  showPlus?: boolean;
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'inactive',
  onPress,
  onRemove,
  showPlus = false,
  selected = false,
}) => {
  const resolvedVariant = selected ? 'filled' : variant;

  // Bug fix: removeIcon was always white — invisible on non-filled chips
  const removeIconColor =
    resolvedVariant === 'filled' ? Colors.white : Colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.base,
        resolvedVariant === 'filled' && styles.filled,
        resolvedVariant === 'outlined' && styles.outlined,
        resolvedVariant === 'inactive' && styles.inactive,
      ]}
    >
      <View style={styles.inner}>
        {showPlus && (
          <Text
            style={[
              styles.prefix,
              resolvedVariant === 'filled' && styles.textFilled,
              resolvedVariant === 'outlined' && styles.textOutlined,
              resolvedVariant === 'inactive' && styles.textInactive,
            ]}
          >
            +{' '}
          </Text>
        )}
        <Text
          style={[
            styles.label,
            resolvedVariant === 'filled' && styles.textFilled,
            resolvedVariant === 'outlined' && styles.textOutlined,
            resolvedVariant === 'inactive' && styles.textInactive,
          ]}
        >
          {label}
        </Text>
        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.removeBtn}
          >
            {/* Bug fix: dynamically set color based on variant */}
            <Text style={[styles.removeIcon, { color: removeIconColor }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.chip,
    paddingHorizontal: Spacing.s14,
    paddingVertical: Spacing.s8,
    minHeight: 36,
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: Colors.primary,
  },
  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  inactive: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefix: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  textFilled: { color: Colors.white },
  textOutlined: { color: Colors.primary },
  textInactive: { color: Colors.bodyText },
  removeBtn: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: FontSize.bodyLg,
    lineHeight: 18,
    fontFamily: FontFamily.bold,
    // color is applied dynamically — do not set here
  },
});
