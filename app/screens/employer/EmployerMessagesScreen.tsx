/**
 * EmployerMessagesScreen — Real conversations with candidates.
 *
 * Fetches conversations from Supabase where employer_id = current user.
 * Opens ChatScreen modal on tap.
 * Real-time: new messages update the last_message preview automatically.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
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
import { EmployerTopBar } from './JobsScreen';
import ChatScreen from '../ChatScreen';

const FILTERS = ['All', 'Candidates', 'Assessments', 'Interviews'];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

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

// ─── Thread row ───────────────────────────────────────────────────────────────

function ThreadRow({
  conv,
  currentUserId,
  onPress,
}: {
  conv: ConversationRow;
  currentUserId: string;
  onPress: () => void;
}) {
  const candidateName = conv.candidate?.full_name ?? 'Candidate';
  const jobTitle = conv.job?.role_title ?? '';
  const preview = conv.last_message || 'No messages yet';
  const timestamp = timeAgo(conv.last_message_at);

  return (
    <TouchableOpacity style={styles.thread} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(candidateName)}</Text>
      </View>

      {/* Body */}
      <View style={styles.threadBody}>
        <View style={styles.threadTop}>
          <Text style={styles.threadName} numberOfLines={1}>{candidateName}</Text>
          <Text style={styles.threadTime}>{timestamp}</Text>
        </View>
        {jobTitle ? (
          <Text style={styles.jobTag} numberOfLines={1}>📋 {jobTitle}</Text>
        ) : null}
        <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
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

  // Chat modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);

  // ── Load conversations ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    const data = await getConversations(user.id);
    setConversations(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time: refresh list when a new message arrives ───────────────────
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

  const filtered = conversations.filter((c) =>
    (c.candidate?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (conv: ConversationRow) => {
    setSelectedConv(conv);
    setChatOpen(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <EmployerTopBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4C59D7" />}
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

        {/* Conversations */}
        {loading ? (
          <ActivityIndicator color="#4C59D7" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              Start a conversation with a candidate from their profile in the pipeline.
            </Text>
          </View>
        ) : (
          <View style={styles.threadList}>
            {filtered.map((conv) => (
              <ThreadRow
                key={conv.id}
                conv={conv}
                currentUserId={user?.id ?? ''}
                onPress={() => openChat(conv)}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content:  { paddingHorizontal: 20, paddingBottom: 160 },
  title:    { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#1A1A2E', marginTop: 20, marginBottom: 16 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, height: 46, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E' },

  filterRow: { gap: 8, paddingBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterActive:   { backgroundColor: '#4C59D7', borderColor: '#4C59D7' },
  filterInactive: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  filterText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  filterTextActive:   { color: '#FFFFFF' },
  filterTextInactive: { color: '#6B7280' },

  threadList: { gap: 2 },
  thread: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F0F2FF',
    gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' },
  threadBody: { flex: 1 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  threadName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E', flex: 1, marginRight: 8 },
  threadTime: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#9CA3AF' },
  jobTag:  { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7', marginBottom: 2 },
  preview: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },

  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
