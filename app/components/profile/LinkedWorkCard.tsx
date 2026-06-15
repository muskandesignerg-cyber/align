import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinkedWork } from '../../types/candidateProfile';
import { CodeIcon, GlobeIcon } from '../ui/AppIcons';

interface LinkedWorkCardProps {
  work: LinkedWork;
}

function renderPlatformIcon(platform: string) {
  switch (platform) {
    case 'github':
      return <CodeIcon size={20} color="#4C59D7" />;
    case 'portfolio':
    default:
      return <GlobeIcon size={20} color="#4C59D7" />;
  }
}

export default function LinkedWorkCard({ work }: LinkedWorkCardProps) {

  const handlePress = () => {
    const url = work.url.startsWith('http') ? work.url : `https://${work.url}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      {/* Platform icon */}
      <View style={styles.iconBox}>
        {renderPlatformIcon(work.platform)}
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.label}>{work.label}</Text>
        <Text style={styles.url} numberOfLines={1}>{work.url}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, marginLeft: 16 },
  label: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
  },
  url: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
});
