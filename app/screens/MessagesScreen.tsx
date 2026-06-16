import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, PenSquare, ArchiveX } from 'lucide-react-native';

const FILTERS = ['All', 'Unread', 'Employers', 'Archived'];

// ─── 5 Chat Conversations Data ───────────────────────────────────────────────
const MOCK_CHATS = [
  {
    id: '1',
    isUnread: true,
    avatarLetter: 'E',
    avatarBg: '#1A1A2E',
    online: true,
    company: 'Exposys Data Labs',
    timestamp: '2m ago',
    jobTag: 'Re: UI/UX Designer',
    preview: '"Hi Muskan! We reviewed your profile and would love to schedule a quick..."',
    unreadCount: 2,
  },
  {
    id: '2',
    isUnread: true,
    avatarLetter: 'L',
    avatarBg: '#0F4C75',
    online: false,
    company: 'Luminary Health',
    timestamp: '1h ago',
    jobTag: 'Re: Mobile Engineer',
    preview: '"Your assessment results were impressive! Can you join us for a video call on..."',
    unreadCount: 1,
  },
  {
    id: '3',
    isUnread: false,
    avatarLetter: 'N',
    avatarBg: '#1A1A2E',
    online: false,
    company: 'NovaTech Industries',
    timestamp: 'Yesterday',
    jobTag: 'Re: Product Manager',
    preview: '"Thank you for your interest. We will be in touch shortly with next steps."',
    unreadCount: 0,
  },
  {
    id: '4',
    isUnread: false,
    avatarLetter: 'T',
    avatarBg: '#134E4A',
    online: false,
    company: 'TechFlow Inc.',
    timestamp: '2 days ago',
    jobTag: 'Re: Senior Product Designer',
    preview: '"You: Thanks for considering me! Looking forward to hearing back."',
    unreadCount: 0,
  },
  {
    id: '5',
    isUnread: false,
    avatarLetter: 'G',
    avatarBg: '#3B1F5E',
    online: false,
    company: 'GrowthBase',
    timestamp: '3 days ago',
    jobTag: 'Re: UX Researcher',
    preview: '"Unfortunately, we have moved forward with other candidates at this time."',
    unreadCount: 0,
  },
];

export function MessagesScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleFilterChange = (newFilter: string) => {
    if (newFilter === activeFilter) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveFilter(newFilter);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const filteredChats = useMemo(() => {
    if (activeFilter === 'Unread') return MOCK_CHATS.filter(c => c.isUnread);
    if (activeFilter === 'Archived') return [];
    return MOCK_CHATS;
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Layer 1 — Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <PenSquare size={22} color="#4F46E5" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Layer 2 — Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color="#AAAAAA" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search conversations..."
              placeholderTextColor="#AAAAAA"
            />
          </View>
        </View>

        {/* Layer 3 — Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, active ? styles.filterActive : styles.filterInactive]}
                  onPress={() => handleFilterChange(f)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Layer 4 — Chat List */}
        <Animated.View style={[styles.chatList, { opacity: fadeAnim }]}>
          {activeFilter === 'Archived' ? (
            <View style={styles.archivedEmpty}>
              <View style={styles.archiveIconBox}>
                <ArchiveX size={28} color="#AAAAAA" strokeWidth={2} />
              </View>
              <Text style={styles.archivedTitle}>No archived conversations</Text>
              <Text style={styles.archivedSub}>
                Conversations you archive{'\n'}will appear here.
              </Text>
            </View>
          ) : (
            filteredChats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatRow} activeOpacity={0.7}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: chat.avatarBg }]}>
                <Text style={styles.avatarLetter}>{chat.avatarLetter}</Text>
                {chat.online && <View style={styles.onlineDot} />}
              </View>

              {/* Content */}
              <View style={styles.chatContent}>
                
                {/* Row 1 */}
                <View style={styles.chatRow1}>
                  <Text style={[styles.companyName, chat.isUnread ? styles.companyUnread : styles.companyRead]} numberOfLines={1}>
                    {chat.company}
                  </Text>
                  <Text style={styles.timestamp}>{chat.timestamp}</Text>
                </View>

                {/* Row 2 */}
                <View style={styles.chatRow2}>
                  {chat.preview.startsWith('"You:') ? (
                    <Text style={styles.previewText} numberOfLines={1}>
                      <Text style={styles.youPrefix}>"You:</Text>
                      {chat.preview.substring(5)}
                    </Text>
                  ) : (
                    <Text style={[styles.previewText, chat.isUnread ? styles.previewUnread : styles.previewRead]} numberOfLines={1}>
                      {chat.preview}
                    </Text>
                  )}
                  
                  {chat.isUnread && chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>

                {/* Row 3 */}
                <View style={styles.jobTagWrap}>
                  <Text style={styles.jobTag}>{chat.jobTag}</Text>
                </View>

              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  content: {
    paddingBottom: 120, // space for floating navbar
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    width: '100%',
    height: 42,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0A0A0A',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },

  // Filters
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterActive: {
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  filterInactive: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  filterText: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  filterTextActive: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterTextInactive: {
    fontWeight: '500',
    color: '#555555',
  },

  // Chat List
  chatList: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    width: '100%',
  },

  // Avatar
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarLetter: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 11,
    height: 11,
    backgroundColor: '#22C55E',
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Content
  chatContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  chatRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0A0A0A',
  },
  companyUnread: {
    fontWeight: '700',
  },
  companyRead: {
    fontWeight: '600',
  },
  timestamp: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: '#AAAAAA',
  },

  chatRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontFamily: 'Inter',
    fontSize: 13,
    maxWidth: 220,
  },
  previewUnread: {
    fontWeight: '500',
    color: '#333333',
  },
  previewRead: {
    fontWeight: '400',
    color: '#888888',
  },
  youPrefix: {
    color: '#AAAAAA',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    backgroundColor: '#4F46E5',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  jobTagWrap: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  jobTag: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500',
    color: '#4F46E5',
  },

  // Archived Empty State
  archivedEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  archiveIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#F7F7F7',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0A0A',
    marginTop: 16,
    textAlign: 'center',
  },
  archivedSub: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: '#888888',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default MessagesScreen;
