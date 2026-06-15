/**
 * ErrorState — "Something went wrong" screen matching reference image.
 * Red dashed circle with exclamation mark, X + ? buttons at top.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ErrorCircleIcon } from '../ui/AppIcons';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  subtitle = "It's on us. Try again in a moment.",
  onRetry,
  onClose,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={onClose} activeOpacity={0.7}>
          {/* X icon */}
          <View style={styles.xWrap}>
            <View style={[styles.xBar, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.xBar, { transform: [{ rotate: '-45deg' }], position: 'absolute' }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBtn} activeOpacity={0.7}>
          {/* ? circle icon */}
          <View style={styles.questionCircle}>
            <Text style={styles.questionText}>?</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Centered content */}
      <View style={styles.body}>
        <ErrorCircleIcon size={160} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * OfflineState — "You're offline" screen matching reference image.
 * Wavy concentric circles illustration, Try Again button.
 */
interface OfflineStateProps {
  onRetry?: () => void;
}

import { WavyOffline } from '../ui/AppIcons';

export function OfflineState({ onRetry }: OfflineStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <WavyOffline size={240} />

        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.subtitle}>
          Check your connection and try{'\n'}again.
        </Text>

        <TouchableOpacity style={styles.tryAgainBtn} onPress={onRetry} activeOpacity={0.8}>
          {/* Reload icon (circular arrow) */}
          <View style={styles.reloadIcon}>
            <View style={styles.reloadArc} />
            <View style={styles.reloadArrow} />
          </View>
          <Text style={styles.tryAgainText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * EmptyMessages — "No conversations yet" screen matching reference.
 * Two overlapping chat bubble illustrations.
 */
interface EmptyMessagesProps {
  onExplore?: () => void;
}

import { ChatBubbles } from '../ui/AppIcons';

export function EmptyMessages({ onExplore }: EmptyMessagesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {/* Illustration card */}
        <View style={styles.card}>
          <ChatBubbles size={160} />
        </View>

        <Text style={styles.messagesTitle}>No conversations yet</Text>
        <Text style={styles.subtitle}>
          When employers message you, they'll{'\n'}show up here.
        </Text>
        <TouchableOpacity onPress={onExplore} activeOpacity={0.7}>
          <Text style={styles.exploreLink}>Explore Opportunities</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  web: { boxShadow: '0 4px 24px rgba(76,89,215,0.07)' } as any,
  default: {
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  topBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBar: {
    width: 18,
    height: 2.5,
    backgroundColor: '#3B43A7',
    borderRadius: 1.5,
  },
  questionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#4C59D7',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  messagesTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    height: 52,
    paddingHorizontal: 60,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#4C59D7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  retryText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#4C59D7',
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#4C59D7',
    backgroundColor: '#FFFFFF',
  },
  reloadIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadArc: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#4C59D7',
    borderRightColor: 'transparent',
  },
  reloadArrow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
    borderRightWidth: 0,
    borderBottomWidth: 5,
    borderBottomColor: '#4C59D7',
  },
  tryAgainText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#4C59D7',
  },
  exploreLink: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#4C59D7',
    textDecorationLine: 'underline',
  },
  card: {
    width: 240,
    height: 200,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
});
