import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageThread } from '../../types/employer';
import { EmployerTopBar } from './JobsScreen';

const FILTERS = ['All', 'Candidates', 'Assessments', 'Interviews'];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('');
}

export default function EmployerMessagesScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Placeholder — real messaging in a future phase
  const allThreads: MessageThread[] = [];
  const threads = allThreads.filter((t) =>
    t.candidateName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <EmployerTopBar />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Messages</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, active ? styles.filterActive : styles.filterInactive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Thread list */}
        <View style={styles.threadList}>
          {threads.map((t) => (
            <TouchableOpacity key={t.id} style={styles.thread} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(t.candidateName)}</Text>
                {t.isVerified && <View style={styles.verifyDot}><Text style={styles.verifyTick}>✓</Text></View>}
              </View>
              <View style={styles.threadBody}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName}>{t.candidateName}</Text>
                  <Text style={styles.threadTime}>{t.timestamp}</Text>
                </View>
                <Text style={styles.threadRole} numberOfLines={1}>{t.appliedFor}</Text>
                <Text style={styles.threadMsg} numberOfLines={1}>{t.lastMessage}</Text>
              </View>
              {t.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{t.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 120 },
  title: { fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E', paddingHorizontal: 20, marginTop: 20 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF',
    borderRadius: 12, height: 48, paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E', outlineWidth: 0 } as any,
  filterRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 12 },
  filterChip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  filterActive: { backgroundColor: '#4C59D7' },
  filterInactive: { backgroundColor: '#F4F6FF', borderWidth: 1, borderColor: '#D0D7FF' },
  filterText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' },
  filterTextActive: { color: '#FFFFFF' },
  filterTextInactive: { color: '#6B7280' },
  threadList: { paddingHorizontal: 20, gap: 0 },
  thread: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F2FF',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  verifyDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4C59D7', alignItems: 'center', justifyContent: 'center',
  },
  verifyTick: { fontSize: 7, color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' },
  threadBody: { flex: 1, marginLeft: 12 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between' },
  threadName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  threadTime: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
  threadRole: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#849CFF', marginTop: 1 },
  threadMsg: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 2 },
  unreadBadge: {
    marginLeft: 8, backgroundColor: '#4C59D7', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' },
});
