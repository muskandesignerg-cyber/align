import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Heart } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

/**
 * TopBar — Discover screen header.
 * Left:  "Hi, Muskan!" greeting + subtitle
 * Right: Bell (with red dot) + Heart icon
 *
 * No logo, no search bar — matches the original design spec.
 */
export default function TopBar() {
  const { profile } = useAuth();

  // Capitalize first letter of the user's first name
  const rawName = profile?.full_name?.split(' ')[0] ?? 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <View style={styles.container}>
      {/* Single header row — greeting left, icons right */}
      <View style={styles.headerRow}>
        {/* LEFT — Greeting */}
        <View style={styles.greetingCol}>
          <Text style={styles.greetingMain}>Hi, {firstName}!</Text>
          <Text style={styles.greetingSub}>Find your perfect role</Text>
        </View>

        {/* RIGHT — Icons */}
        <View style={styles.rightIcons}>
          <TouchableOpacity activeOpacity={0.7}>
            <View style={styles.bellWrapper}>
              <Bell size={22} color="#0A0A0A" strokeWidth={2} />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}>
            <Heart size={22} color="#0A0A0A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  // Single header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 48,
  },

  // Left column — greeting text
  greetingCol: {
    flex: 1,
  },
  greetingMain: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999999',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  // Right icons cluster
  rightIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  bellWrapper: {
    position: 'relative',
    width: 22,
    height: 22,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
