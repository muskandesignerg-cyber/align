/**
 * ChatScreen — Real-time chat between employer and candidate.
 *
 * Used as a modal overlay from both MessagesScreen (candidate)
 * and EmployerMessagesScreen (employer).
 *
 * Features:
 *  - Real message bubbles (sender right, receiver left)
 *  - Supabase real-time subscription for live updates
 *  - TextInput + send button at bottom
 *  - Auto-scroll to latest message
 *  - Marks messages as read on open
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  MessageRow,
} from '../lib/database';

const { width: W } = Dimensions.get('window');
const CHAT_WIDTH = Math.min(W, 430);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatScreenProps {
  visible: boolean;
  conversationId: string | null;
  currentUserId: string;
  otherUserName: string;
  jobTitle?: string;
  onClose: () => void;
}

// ─── Time helper ──────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isMine }: { msg: MessageRow; isMine: boolean }) {
  return (
    <View style={[bs.row, isMine ? bs.rowRight : bs.rowLeft]}>
      <View style={[bs.bubble, isMine ? bs.bubbleMine : bs.bubbleTheirs]}>
        <Text style={[bs.text, isMine ? bs.textMine : bs.textTheirs]}>
          {msg.content}
        </Text>
        <Text style={[bs.time, isMine ? bs.timeMine : bs.timeTheirs]}>
          {formatTime(msg.created_at)}
        </Text>
      </View>
    </View>
  );
}

const bs = StyleSheet.create({
  row: { paddingHorizontal: 16, marginVertical: 3 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft:  { alignItems: 'flex-start' },
  bubble: {
    maxWidth: CHAT_WIDTH * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: '#4C59D7',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#F0F2FF',
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 21, fontFamily: 'PlusJakartaSans_400Regular' },
  textMine:   { color: '#FFFFFF' },
  textTheirs: { color: '#1A1A2E' },
  time: { fontSize: 11, marginTop: 4, fontFamily: 'PlusJakartaSans_400Regular' },
  timeMine:   { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  timeTheirs: { color: '#9CA3AF', textAlign: 'left' },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatScreen({
  visible,
  conversationId,
  currentUserId,
  otherUserName,
  jobTitle,
  onClose,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  // ── Load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const msgs = await getMessages(conversationId);
    setMessages(msgs);
    setLoading(false);
    // Mark as read
    await markMessagesAsRead(conversationId, currentUserId);
  }, [conversationId, currentUserId]);

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !conversationId) return;

    loadMessages();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if received from other party
          if (newMsg.sender_id !== currentUserId) {
            markMessagesAsRead(conversationId, currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, conversationId, loadMessages]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !conversationId || sending) return;
    setText('');
    setSending(true);
    try {
      await sendMessage(conversationId, currentUserId, content);
      // The real-time subscription will add it to state
    } catch (e) {
      console.error('[Chat] send error:', e);
      setText(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const inner = (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherUserName}</Text>
          {jobTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>{jobTitle}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.divider} />

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#4C59D7" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptySub}>
              Send a message to {otherUserName} below.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <Bubble msg={item} isMine={item.sender_id === currentUserId} />
            )}
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
        {inner}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {inner}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#FFFFFF' },
  header:     { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 8 },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, paddingHorizontal: 8 },
  headerName: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  headerSub:  { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 1 },
  divider:    { height: 1, backgroundColor: '#F0F2FF' },
  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E', marginBottom: 8 },
  emptySub:   { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', textAlign: 'center' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2FF',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1A1A2E',
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C4C9F0' },
});

const webStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(10,10,30,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  phoneFrame: {
    width: 430, maxHeight: 844, height: '90%' as any,
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
  },
});
