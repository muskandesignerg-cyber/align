import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Bell, Heart, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

/**
 * TopBar — Discover screen header.
 * Matches new design:
 * Row 1: Logo + Icons
 * Row 2: Greeting + Subtitle
 * Row 3: Search Bar
 */
export default function TopBar() {
  const { profile } = useAuth();

  // Capitalize first letter of the user's first name
  const rawName = profile?.full_name?.split(' ')[0] ?? 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <View style={styles.container}>
      {/* ROW 1: Logo & Icons */}
      <View style={styles.topRow}>
        <Image
          source={require('../../../assets/images/align-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.rightIcons}>
          <TouchableOpacity activeOpacity={0.7}>
            <View style={styles.bellWrapper}>
              <Bell size={24} color="#0A0A0A" strokeWidth={2} />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Heart size={24} color="#0A0A0A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ROW 2: Greeting */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingMain}>Hi, {firstName}!</Text>
        <Text style={styles.greetingSub}>Find your perfect role</Text>
      </View>

      {/* ROW 3: Search Bar */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.searchBox} activeOpacity={0.8}>
          <Search size={20} color="#666666" strokeWidth={2.5} />
          <Text style={styles.searchText}>Search roles, skills or companies</Text>
        </TouchableOpacity>
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

  // ROW 1
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logo: {
    height: 24,
    width: 80,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  bellWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ROW 2
  greetingRow: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingMain: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#0A0A0A',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#666666',
  },

  // ROW 3
  searchRow: {
    paddingHorizontal: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },
});
