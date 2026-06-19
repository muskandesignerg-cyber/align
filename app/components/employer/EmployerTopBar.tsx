import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface EmployerTopBarProps {
  onProfilePress?: () => void;
  onBellPress?: () => void;
  hasNotification?: boolean;
}

export default function EmployerTopBar({
  onProfilePress,
  onBellPress,
  hasNotification = false,
}: EmployerTopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        {/* LEFT — Align Logo */}
        <Image
          source={require('../../../assets/images/align-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* RIGHT — Profile + Bell */}
        <View style={styles.rightIcons}>
          {/* Person icon — no background */}
          <TouchableOpacity
            style={styles.iconTouch}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={28} color="#1A1A2E" />
          </TouchableOpacity>

          {/* Bell icon — keep box style */}
          <TouchableOpacity
            style={styles.iconTouch}
            onPress={onBellPress}
            activeOpacity={0.7}
          >
            <View style={styles.bellBox}>
              <Ionicons name="notifications-outline" size={18} color="#1A1A2E" />
              {hasNotification && <View style={styles.notifDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2FF',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  // Align logo — left side
  logo: {
    width: 90,
    height: 28,
  },
  // Right icons group
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bell box
  bellBox: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Notification dot
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
