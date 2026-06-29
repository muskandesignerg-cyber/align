/**
 * EmployerMessagesScreen — Real conversations with candidates.
 * Shows mock conversations when no real data exists yet.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getConversations, ConversationRow } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import EmployerTopBar from '../../components/employer/EmployerTopBar';
import EmployerProfileSheet from '../../components/employer/EmployerProfileSheet';
import ChatScreen from '../ChatScreen';

const FILTERS = ['All', 'Candidates', 'Assessments', 'Interviews'];

// ─── Mock conversations (shown when no real data yet) ─────────────────────────

interface MockConversation {
  id: string;
  candidateName: string;
  candidateInitial: string;
  avatarColor: string;
  lastMessage: string;
  timestamp: string;
  isUnread: boolean;
  unreadCount: number;
  jobTitle: string;
  isOnline: boolean;
  category: 'Candidates' | 'Assessments' | 'Interviews';
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'm1',
    candidateName: 'Muskan Sharma',
    candidateInitial: 'M',
    avatarColor: '#1A1A2E',
    lastMessage: 'Hi! Thank you for considering my application. I am available for a call anytime this week.',
    timestamp: '5m ago',
    isUnread: true,
    unreadCount: 2,
    jobTitle: 'UI/UX Designer',
    isOnline: true,
    category: 'Candidates',
  },
  {
    id: 'm2',
    candidateName: 'Riya Mehta',
    candidateInitial: 'R',
    avatarColor: '#0F4C75',
    lastMessage: 'I have completed the assessment you sent. Let me know the next steps.',
    timestamp: '1h ago',
    isUnread: true,
    unreadCount: 1,
    jobTitle: 'Product Designer',
    isOnline: false,
    category: 'Assessments',
  },
  {
    id: 'm3',
    candidateName: 'Arjun Kapoor',
    candidateInitial: 'A',
    avatarColor: '#134E4A',
    lastMessage: 'You: Thanks for your interest, we will review your portfolio shortly.',
    timestamp: 'Yesterday',
    isUnread: false,
    unreadCount: 0,
    jobTitle: 'UX Researcher',
    isOnline: false,
    category: 'Assessments',
  },
  {
    id: 'm4',
    candidateName: 'Priya Nair',
    candidateInitial: 'P',
    avatarColor: '#3B1F5E',
    lastMessage: 'Looking forward to the interview on Friday at 3 PM.',
    timestamp: '2 days ago',
    isUnread: false,
    unreadCount: 0,
    jobTitle: 'Visual Designer',
    isOnline: false,
    category: 'Interviews',
  },
  {
    id: 'm5',
    candidateName: 'Divya Rao',
    candidateInitial: 'D',
    avatarColor: '#7C2D12',
    lastMessage: 'You: Congratulations! We would like to extend an offer.',
    timestamp: '3 days ago',
    isUnread: false,
    unreadCount: 0,
    jobTitle: 'Senior UX Designer',
    isOnline: false,
    category: 'Interviews',
  },
];

// ─── Mock conversation row ─────────────────────────────────────────────────────

function MockThreadRow({
  item,
  onPress,
}: {
  item: MockConversation;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.conversationRow, item.isUnread && styles.conversationRowUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.candidateInitial}</Text>
        </View>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.candidateName, item.isUnread && styles.unreadText]}>
            {item.candidateName}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.rowMiddle}>
          <Text
            style={[styles.lastMessage, item.isUnread && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.jobTag}>
          <Text style={styles.jobTagText}>Re: {item.jobTitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Real conversation row ─────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}

function RealThreadRow({
  conv,
  onPress,
}: {
  conv: ConversationRow;
  onPress: () => void;
}) {
  const candidateName = conv.candidate?.full_name ?? 'Candidate';
  const jobTitle = conv.job?.role_title ?? '';
  const preview = conv.last_message || 'No messages yet';
  const timestamp = timeAgo(conv.last_message_at);
  const initials = getInitials(candidateName);

  return (
    <TouchableOpacity style={styles.conversationRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: '#4C59D7' }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.rowTop}>
          <Text style={styles.candidateName}>{candidateName}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.rowMiddle}>
          <Text style={styles.lastMessage} numberOfLines={1}>{preview}</Text>
        </View>
        {jobTitle ? (
          <View style={styles.jobTag}>
            <Text style={styles.jobTagText}>Re: {jobTitle}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EmployerMessagesScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const data = await getConversations(user.id);
    setConversations(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('employer-convs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `employer_id=eq.${user.id}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  // Use real data if available, otherwise show mock data
  const hasRealData = conversations.length > 0;

  // Filter mock conversations
  const filteredMock = MOCK_CONVERSATIONS.filter((c) => {
    const matchesSearch = c.candidateName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ||
      activeFilter === 'Candidates' ||
      c.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter real conversations
  const filteredReal = conversations.filter((c) =>
    (c.candidate?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <EmployerTopBar
        hasNotification={true}
        onProfilePress={() => setShowProfileSheet(true)}
        onBellPress={() => {}}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#4C59D7"
          />
        }
      >
        <Text style={styles.title}>Messages</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, active ? styles.filterActive : styles.filterInactive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Conversation list */}
        {loading ? (
          <ActivityIndicator color="#4C59D7" style={{ marginTop: 40 }} />
        ) : hasRealData ? (
          /* Real conversations from Supabase */
          <View style={styles.threadList}>
            {filteredReal.map((conv) => (
              <RealThreadRow
                key={conv.id}
                conv={conv}
                onPress={() => { setSelectedConv(conv); setChatOpen(true); }}
              />
            ))}
          </View>
        ) : (
          /* Mock conversations — shown until real data exists */
          <View style={styles.threadList}>
            {filteredMock.map((item) => (
              <MockThreadRow
                key={item.id}
                item={item}
                onPress={() => {/* mock tap — no real chat to open */}}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Chat modal */}
      <ChatScreen
        visible={chatOpen}
        conversationId={selectedConv?.id ?? null}
        currentUserId={user?.id ?? ''}
        otherUserName={selectedConv?.candidate?.full_name ?? 'Candidate'}
        jobTitle={selectedConv?.job?.role_title}
        onClose={() => { setChatOpen(false); setSelectedConv(null); load(); }}
      />

      {/* Profile Sheet */}
      <EmployerProfileSheet
        visible={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content:  { paddingBottom: 160 },
  title:    {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    marginHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1A1A2E',
  },

  filterRow: { gap: 8, paddingBottom: 16, paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterActive:   { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  filterInactive: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  filterText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  filterTextActive:   { color: '#FFFFFF' },
  filterTextInactive: { color: '#6B7280' },

  threadList: {},

  // Conversation row
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  conversationRowUnread: {
    backgroundColor: '#FAFAFE',
  },

  // Avatar
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Content
  conversationContent: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candidateName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#0A0A0A',
  },
  unreadText: { fontFamily: 'PlusJakartaSans_700Bold' },
  timestamp: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#AAAAAA',
  },
  rowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#888888',
  },
  unreadMessage: {
    color: '#333333',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4C59D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
  },
  jobTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  jobTagText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
});
