import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Bell, Heart, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

/**
 * TopBar — Discover screen header.
 * Row 1: "Align" text logo (left) + Bell + Heart (right)
 * Row 2: Greeting "Hi, Muskan!"
 * Row 3: Subtitle
 * Row 4: Search bar
 */
export default function TopBar() {
  const { profile } = useAuth();
  return (
    <View style={styles.container}>
      {/* ROW 1 — Logo + Icons */}
      <View style={styles.row1}>
        {/* LEFT — Align wordmark */}
        <Image
          source={require('../../../assets/images/align-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

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

      {/* ROW 2 — Hi Muskan */}
      <Text style={styles.greetingMain}>Hi, {profile?.full_name?.split(' ')[0] ?? 'there'}!</Text>

      {/* ROW 3 — Subtitle */}
      <Text style={styles.greetingSub}>Find your perfect role</Text>

      {/* ROW 4 — Search bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#999999" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search roles, skills or companies"
          placeholderTextColor="#999999"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    paddingBottom: 24,
  },

  // ROW 1 — Logo + Icons row
  row1: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Logo image
  logoImage: {
    height: 28,
    width: 100,
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

  // ROW 2 — Greeting
  greetingMain: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0A0A0A',
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // ROW 3 — Subtitle
  greetingSub: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  // ROW 4 — Search bar
  searchBar: {
    height: 48,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0A0A0A',
    height: '100%',
    outlineStyle: 'none' as any,
  },
});
