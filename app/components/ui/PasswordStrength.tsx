import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface PasswordStrengthProps {
  password: string;
}

function getScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LEVELS = [
  { score: 0, label: '',       color: '#E8EAFF' },
  { score: 1, label: 'Weak',   color: '#EF4444' },
  { score: 2, label: 'Fair',   color: '#F57C00' },
  { score: 3, label: 'Good',   color: '#4C59D7' },
  { score: 4, label: 'Strong', color: '#22C55E' },
];

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const score = password.length > 0 ? Math.max(1, getScore(password)) : 0;
  const level = LEVELS[score] ?? LEVELS[0];
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i < score ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [score]);

  if (password.length === 0) return null;

  return (
    <View style={s.wrap}>
      <View style={s.bars}>
        {anims.map((anim, i) => {
          const color = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E8EAFF', level.color],
          });
          return (
            <Animated.View
              key={i}
              style={[s.bar, { backgroundColor: color }]}
            />
          );
        })}
      </View>
      {level.label ? (
        <Text style={[s.label, { color: level.color }]}>{level.label}</Text>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', minWidth: 40, textAlign: 'right' },
});
