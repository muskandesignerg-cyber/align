/**
 * MessagesScreen — Full chat list redesign.
 *
 * Features:
 *  • Header: "Messages" + compose icon
 *  • Search bar
 *  • Filter chips (All / Unread / Employers / Archived)
 *  • 5 realistic conversations with job context tags
 *  • Unread indicators (bold text + badge count)
 *  • Online dot on active company
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Chat {
  id: string;
  initial: string;
  avatarBg: string;
  company: string;
  timestamp: string;
  jobTag: string;
  preview: string;
  unread: number;
  online: boolean;
  sentByMe?: boolean;
}

const CHATS: Chat[] = [
  {
    id: '1',
    initial: 'E',
    avatarBg: '#1A1A2E',
    company: 'Exposys Data Labs',
    timestamp: '2m ago',
    jobTag: 'UI/UX Designer',
    preview: 'Hi Muskan! We reviewed your profile and would love to schedule a quick...',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    initial: 'L',
    avatarBg: '#0F4C75',
    company: 'Luminary Health',
    timestamp: '1h ago',
    jobTag: 'Mobile Engineer',
    preview: 'Your assessment results were impressive! Can you join us for a video call on...',
    unread: 1,
    online: false,
  },
  {
    id: '3',
    initial: 'N',
    avatarBg: '#1A1A2E',
    company: 'NovaTech Industries',
    timestamp: 'Yesterday',
    jobTag: 'Product Manager',
    preview: 'Thank you for your interest. We will be in touch shortly with next steps.',
    unread: 0,
    online: false,
  },
  {
    id: '4',
    initial: 'T',
    avatarBg: '#134E4A',
    company: 'TechFlow Inc.',
    timestamp: '2 days ago',
    jobTag: 'Senior Product Designer',
    preview: 'Thanks for considering me! Looking forward to hearing back.',
    unread: 0,
    online: false,
    sentByMe: true,
  },
  {
    id: '5',
    initial: 'G',
    avatarBg: '#3B1F5E',
    company: 'GrowthBase',
    timestamp: '3 days ago',
    jobTag: 'UX Researcher',
    preview: 'Unfortunately, we have moved forward with other candidates at this time.',
    unread: 0,
    online: false,
  },
];

const FILTERS = ['All', 'Unread', 'Employers', 'Archived'];

// ─── Chat Row ─────────────────────────────────────────────────────────────────

function ChatRow({ chat }: { chat: Chat }) {
  const isUnread = chat.unread > 0;

  return (
    <TouchableOpacity
      style={[styles.chatRow, isUnread && styles.chatRowUnread]}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: chat.avatarBg }]}>
          <Text style={styles.avatarLetter}>{chat.initial}</Text>
        </View>
        {chat.online && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        {/* Row 1 — company + timestamp */}
        <View style={styles.chatTopRow}>
          <Text
            style={[
              styles.companyName,
              isUnread && styles.companyNameUnread,
            ]}
            numberOfLines={1}
          >
            {chat.company}
          </Text>
          <Text style={styles.timestamp}>{chat.timestamp}</Text>
        </View>

        {/* Row 2 — preview + badge */}
        <View style={styles.previewRow}>
          <Text
            style={[
              styles.preview,
              isUnread && styles.previewUnread,
            ]}
            numberOfLines={1}
          >
            {chat.sentByMe ? (
              <Text style={styles.youPrefix}>You: </Text>
            ) : null}
            {chat.preview}
          </Text>
          {isUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{chat.unread}</Text>
            </View>
          )}
        </View>

        {/* Row 3 — job context tag */}
        <View style={styles.tagWrap}>
          <Text style={styles.jobTag}>Re: {chat.jobTag}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const MessagesScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fade out → update → fade in when filter changes
  const handleFilterChange = (filter: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setActiveFilter(filter);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Derive visible chats based on active filter
  const visibleChats = (() => {
    switch (activeFilter) {
      case 'unread':
        return CHATS.filter((c) => c.unread > 0);
      case 'archived':
        return []; // no archived chats
      default: // 'all' | 'employers'
        return CHATS;
    }
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="create-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#AAAAAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#AAAAAA"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => {
          const key = f.toLowerCase();
          const isActive = key === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handleFilterChange(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Chat list / empty state (fades on filter change) ── */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {activeFilter === 'archived' ? (
          /* Archived empty state */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="archive-outline" size={28} color="#AAAAAA" />
            </View>
            <Text style={styles.emptyTitle}>No archived conversations</Text>
            <Text style={styles.emptySub}>Conversations you archive</Text>
            <Text style={styles.emptySub}>will appear here.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleChats.map((chat) => (
              <ChatRow key={chat.id} chat={chat} />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0A0A0A' },

  // Search
  searchWrap: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  searchBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A0A0A',
    paddingVertical: 0,
  },

  // Filters
  filtersScroll: { maxHeight: 44, backgroundColor: '#FFFFFF' },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText:       { fontSize: 12, fontWeight: '500', color: '#555555' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },

  // List
  list:        { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Chat row
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  chatRowUnread: { backgroundColor: '#FAFAFE' },

  // Avatar
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Content
  chatContent: { flex: 1, gap: 4 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName:       { fontSize: 14, fontWeight: '600', color: '#0A0A0A', flex: 1, marginRight: 8 },
  companyNameUnread: { fontWeight: '700' },
  timestamp:         { fontSize: 11, color: '#AAAAAA' },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview:       { fontSize: 13, color: '#888888', flex: 1, marginRight: 8 },
  previewUnread: { color: '#333333', fontWeight: '500' },
  youPrefix:     { color: '#AAAAAA' },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  tagWrap: { alignSelf: 'flex-start' },
  jobTag: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  // Archived empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
