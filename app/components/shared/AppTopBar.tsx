/**
 * AppTopBar — Unified top navigation bar used on all main tabs.
 *
 * Layout:
 *   [Gradient Avatar ●]   ⚡ TALENT.LOGIC   [🔔 box]
 *
 * Uses AuthContext to read the current user's initial.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

interface AppTopBarProps {
  onBellPress?:      () => void;
  hasNotification?:  boolean;
  onAvatarPress?:    () => void;
}

export default function AppTopBar({
  onBellPress,
  hasNotification = false,
  onAvatarPress,
}: AppTopBarProps) {
  const { user, profile } = useAuth();

  // Derive initial: prefer profile.full_name, then user_metadata, then email
  const fullName =
    (profile as any)?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    '';
  const initial = fullName.trim().charAt(0).toUpperCase() || 'U';

  // Bell press animation
  const bellScale = useSharedValue(1);

  const handleBellPress = () => {
    bellScale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1.0, { damping: 12, stiffness: 220 }),
    );
    onBellPress?.();
  };

  const bellAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }],
  }));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>

        {/* ── LEFT: Gradient Avatar ── */}
        <TouchableOpacity
          style={styles.avatarTouch}
          activeOpacity={0.8}
          onPress={onAvatarPress}
        >
          <LinearGradient
            colors={['#4C59D7', '#3B43A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.initial}>{initial}</Text>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </TouchableOpacity>

        {/* ── CENTER: Wordmark — absolutely positioned so it never shifts ── */}
        <View style={styles.wordmarkWrap} pointerEvents="none">
          <Ionicons
            name="flash"
            size={13}
            color="#4C59D7"
            style={{ marginRight: 5, marginTop: 1 }}
          />
          <Text style={styles.wordmark}>TALENT.LOGIC</Text>
        </View>

        {/* ── RIGHT: Bell ── */}
        <TouchableOpacity
          style={styles.bellTouch}
          activeOpacity={0.85}
          onPress={handleBellPress}
        >
          <Animated.View style={[styles.bellBox, bellAnimStyle]}>
            <Ionicons name="notifications-outline" size={18} color="#1A1A2E" />
            {hasNotification && <View style={styles.notifDot} />}
          </Animated.View>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2FF',
    ...Platform.select({
      default: {
        shadowColor: '#4C59D7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },

  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  // ── Avatar ──────────────────────────────────────────────────────────────────
  avatarTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ── Wordmark ─────────────────────────────────────────────────────────────────
  wordmarkWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3B43A7',
    letterSpacing: 2,
  },

  // ── Bell ─────────────────────────────────────────────────────────────────────
  bellTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBox: {
    width: 36,
    height: 36,
    backgroundColor: '#F4F6FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
