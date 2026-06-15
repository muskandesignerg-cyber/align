import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '../../theme/typography';

/**
 * TopBar — Discover screen header.
 * Left:  "Hi Hridya 👋" greeting + subtitle
 * Right: Bell (with red dot) + Heart outline icon
 */
export default function TopBar() {
  return (
    <View style={styles.container}>
      {/* Left — greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingMain}>Hi, Muskan!</Text>
        <Text style={styles.greetingSub}>Find your perfect role</Text>
      </View>

      {/* Right — bell + heart */}
      <View style={styles.rightIcons}>
        {/* Bell with notification dot */}
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          {/* Explicit relative wrapper so the absolute dot stays on the bell */}
          <View style={styles.bellWrapper}>
            <Ionicons name="notifications-outline" size={22} color="#0A0A0A" />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>

        {/* Heart outline */}
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={22} color="#0A0A0A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  // Left greeting
  greeting: {
    gap: 3,
  },
  greetingMain: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#1A1A2E',
  },
  greetingSub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Right icons
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Explicit relative container — guarantees absolute dot is anchored to bell
  bellWrapper: {
    width:    22,
    height:   22,
    position: 'relative',
  },
  notifDot: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#E63946',
    borderWidth:     2,
    borderColor:     '#FFFFFF',
  },
});
