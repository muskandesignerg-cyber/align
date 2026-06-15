import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinkedWork } from '../../types/candidateProfile';
import LinkedWorkCard from './LinkedWorkCard';
import { LinkIcon } from '../ui/AppIcons';

interface LinkedWorkSectionProps {
  linkedWork: LinkedWork[];
  onAddPress: () => void;
}

export default function LinkedWorkSection({ linkedWork, onAddPress }: LinkedWorkSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinkIcon size={24} color="#1A1A2E" />
          <Text style={styles.headerTitle}>Linked Work</Text>
        </View>
        <TouchableOpacity onPress={onAddPress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {linkedWork.map((item) => (
          <LinkedWorkCard key={item.id} work={item} />
        ))}
      </View>

      {/* Link Portfolio ghost button */}
      <TouchableOpacity style={styles.ghostBtn} onPress={onAddPress} activeOpacity={0.8}>
        <Text style={styles.ghostBtnText}>+ Link Portfolio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 20 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
  },
  addBtn: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
  list: { marginTop: 16, gap: 10 },
  ghostBtn: {
    marginTop: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D0D7FF',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#4C59D7',
  },
});
