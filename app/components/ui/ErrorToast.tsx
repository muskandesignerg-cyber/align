import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // slide up
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // auto dismiss after 4s
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, 4000);
      return () => clearTimeout(t);
    } else {
      translateY.setValue(80);
      opacity.setValue(0);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[s.toast, { transform: [{ translateY }], opacity }, toastShadow]}>
      <Text style={s.icon}>⚠</Text>
      <Text style={s.text} numberOfLines={3}>{message}</Text>
    </Animated.View>
  );
};

const toastShadow = Platform.select({
  web: { boxShadow: '0px 4px 20px rgba(239,68,68,0.20)' } as any,
  default: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 20, elevation: 8 },
});

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 999,
  },
  icon: { fontSize: 16, color: '#EF4444', lineHeight: 22 },
  text: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#EF4444', lineHeight: 20 },
});
