import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';


interface JobHeaderProps {
  roleTitle: string;
  companyName: string;
  candidateCount: number;
}

function GridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </Svg>
  );
}

function ListIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="3" y1="6" x2="21" y2="6" />
      <Line x1="3" y1="12" x2="21" y2="12" />
      <Line x1="3" y1="18" x2="21" y2="18" />
    </Svg>
  );
}

export default function JobHeader({ roleTitle, companyName, candidateCount }: JobHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.roleTitle}>{roleTitle}</Text>
      <Text style={styles.companyName}>{companyName}</Text>
      <View style={styles.row}>
        <Text style={styles.count}>{candidateCount} candidates</Text>
        <View style={styles.icons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <GridIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <ListIcon />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  roleTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    lineHeight: 34,
  },
  companyName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  count: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
  },
  icons: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
