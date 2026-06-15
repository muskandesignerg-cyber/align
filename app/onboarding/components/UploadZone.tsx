/**
 * UploadZone — PDF upload drop zone for the Resume Upload screen.
 *
 * Idle state redesign:
 *  - 72×72 white card icon container with shadow
 *  - Ionicons document-text-outline (36px, #4C59D7)
 *  - Sparkle overlay top-right ("✦")
 *  - "Tap to upload PDF" — 17px bold #4C59D7
 *  - "AI will auto-fill your profile  •  Max 10MB" — 14px #6B7280
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, BorderRadius, TouchTarget } from '../../theme/spacing';

export type UploadStatus = 'idle' | 'reading' | 'extracting' | 'vision' | 'error';

interface UploadZoneProps {
  status: UploadStatus;
  onUpload: () => void;
  onRetry?: () => void;
  onBuildManually?: () => void;
  errorMessage?: string;
}

// ─── Icon container shadow ────────────────────────────────────────────────────

const iconShadow = Platform.select({
  ios: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
});

// ─── Animated doc icon for idle state ────────────────────────────────────────

const DocIcon: React.FC = () => {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <View style={[styles.iconWrap, iconShadow as any]}>
        <Ionicons name="document-text-outline" size={36} color="#4C59D7" />
        {/* Sparkle overlay */}
        <Text style={styles.sparkle}>✦</Text>
      </View>
    </Animated.View>
  );
};

// ─── UploadZone ──────────────────────────────────────────────────────────────

export const UploadZone: React.FC<UploadZoneProps> = ({
  status,
  onUpload,
  onRetry,
  onBuildManually,
  errorMessage,
}) => {

  // ── Error State ─────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <View style={[styles.zone, styles.zoneError]}>
        <View style={[styles.iconWrap, styles.iconWrapError]}>
          <Ionicons name="warning-outline" size={32} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Couldn't process this PDF</Text>
        <Text style={styles.errorBody}>
          {errorMessage || 'Try a different file, or build your profile manually.'}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry ?? onUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Try Another File</Text>
          </TouchableOpacity>
          {onBuildManually && (
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={onBuildManually}
              activeOpacity={0.7}
            >
              <Text style={styles.manualBtnText}>Build Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Vision Processing State ──────────────────────────────────────────────
  if (status === 'vision') {
    return (
      <View style={[styles.zone, styles.zoneLoading]}>
        <ActivityIndicator size="large" color="#4C59D7" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingTitle}>Analyzing CV layout...</Text>
        <Text style={styles.loadingSubtitle}>
          Image-based PDF detected — using visual AI
        </Text>
        <Text style={styles.loadingHint}>This may take 10–15 seconds</Text>
      </View>
    );
  }

  // ── Extracting State ─────────────────────────────────────────────────────
  if (status === 'extracting') {
    return (
      <View style={[styles.zone, styles.zoneLoading]}>
        <ActivityIndicator size="large" color="#4C59D7" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingTitle}>Extracting with AI...</Text>
        <Text style={styles.loadingSubtitle}>
          Identifying skills, education, and experience
        </Text>
      </View>
    );
  }

  // ── Reading State ────────────────────────────────────────────────────────
  if (status === 'reading') {
    return (
      <View style={[styles.zone, styles.zoneLoading]}>
        <ActivityIndicator size="large" color="#4C59D7" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingTitle}>Reading your CV...</Text>
        <Text style={styles.loadingSubtitle}>Extracting text from PDF</Text>
      </View>
    );
  }

  // ── Idle State ───────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[styles.zone, styles.zoneIdle]}
      onPress={onUpload}
      activeOpacity={0.85}
    >
      <DocIcon />

      <Text style={styles.uploadTitle}>Tap to upload PDF</Text>
      <Text style={styles.uploadSubtitle}>
        AI will auto-fill your profile{'  '}•{'  '}Max 10MB
      </Text>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Base zone ──────────────────────────────────────────────────────────
  zone: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: Spacing.s32,
    minHeight: 200,
  },

  // ── Idle ───────────────────────────────────────────────────────────────
  zoneIdle: {
    backgroundColor: '#F4F6FF',
    borderColor: '#849CFF',
    paddingVertical: 36,
  },

  // Icon wrap (72×72 white card)
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // Sparkle overlay positioned top-right of icon
  sparkle: {
    position: 'absolute',
    top: -2,
    right: -8,
    fontSize: 14,
    color: '#849CFF',
  },

  uploadTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#4C59D7',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },

  // ── Loading ────────────────────────────────────────────────────────────
  zoneLoading: {
    backgroundColor: '#F4F6FF',
    borderColor: '#849CFF',
    paddingVertical: 40,
  },
  loadingTitle: {
    fontSize: FontSize.bodyLg,
    fontFamily: FontFamily.semiBold,
    color: '#4C59D7',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },

  // ── Error ──────────────────────────────────────────────────────────────
  zoneError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    paddingVertical: 28,
    minHeight: undefined,
  },
  iconWrapError: {
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: FontSize.bodyLg,
    fontFamily: FontFamily.bold,
    color: '#EF4444',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  retryBtn: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.s20,
    paddingVertical: Spacing.s12,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  manualBtn: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
});
