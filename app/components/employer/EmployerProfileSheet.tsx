import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface EmployerProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmployerProfileSheet({ visible, onClose }: EmployerProfileSheetProps) {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  if (!visible) return null;

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'User';
  const companyName = profile?.company_name || 'Company';
  const roleTitle = 'Employer'; // or fallback to profile role if needed
  
  const initial = companyName.charAt(0).toUpperCase() || 'C';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Profile Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#4C59D7', '#3B43A7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.initial}>{initial}</Text>
            </LinearGradient>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.userName}>{firstName} • {roleTitle}</Text>
          </View>

          <View style={styles.divider} />

          {/* Settings Rows */}
          <View style={styles.rows}>
            <TouchableOpacity style={styles.row} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="business-outline" size={20} color="#4C59D7" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Edit Company Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color="#4C59D7" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Notification Preferences</Text>
              <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={20} color="#4C59D7" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Hiring Settings</Text>
              <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={16} color="#D0D7FF" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,46,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D7FF',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F6FF',
    width: '100%',
  },
  rows: {
    flex: 1,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6FF',
  },
  rowIcon: {
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A2E',
  },
});
