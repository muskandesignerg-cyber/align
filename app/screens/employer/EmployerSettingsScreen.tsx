import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmployerTopBar } from './JobsScreen';
import { useEmployer } from '../../context/EmployerContext';
import { useAuth } from '../../context/AuthContext';

function SettingRow({ title, onPress, chevron }: { title: string; onPress?: () => void; chevron?: boolean }) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={rowStyles.title}>{title}</Text>
      {chevron && <Text style={rowStyles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function ToggleRow({ title, value, onValueChange }: { title: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.title}>{title}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor="#FFFFFF" trackColor={{ false: '#D0D7FF', true: '#4C59D7' }} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F2FF',
  },
  title: { fontSize: 16, fontFamily: 'PlusJakartaSans_400Regular', color: '#1A1A2E' },
  chevron: { fontSize: 22, color: '#D0D7FF' },
});

export default function EmployerSettingsScreen() {
  const [notifs, setNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [defaultAssessment, setDefaultAssessment] = useState(true);
  const [blindByDefault, setBlindByDefault] = useState(false);

  // ── Sign-out state ───────────────────────────────────────────────────────
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { state: employerState } = useEmployer();
  const { signOut } = useAuth();          // ← the real signOut from AuthContext

  const companyName = employerState.profile?.companyName || 'Company';
  const industry = employerState.profile?.industry || 'Technology';
  const initials = companyName.split(' ').slice(0, 2).map((n) => n[0]).join('');

  const handleSignOut = useCallback(() => {
    setShowSignOutModal(true);
  }, []);

  const handleConfirmSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();        // clears session → RootNavigator redirects to auth
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  }, [signOut]);

  const handleCancelSignOut = useCallback(() => {
    setShowSignOutModal(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <EmployerTopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Company profile */}
        <View style={styles.companyCard}>
          <View style={styles.companyAvatar}>
            <Text style={styles.companyAvatarText}>{initials}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyIndustry}>{industry}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <ToggleRow title="Notification Preferences" value={notifs} onValueChange={setNotifs} />
          <ToggleRow title="Email Notifications" value={emailNotifs} onValueChange={setEmailNotifs} />
          <SettingRow title="Two-Factor Auth" chevron onPress={() => {}} />
        </View>

        {/* Hiring */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HIRING</Text>
          <ToggleRow title="Default Assessment Required" value={defaultAssessment} onValueChange={setDefaultAssessment} />
          <ToggleRow title="Blind Audition by Default" value={blindByDefault} onValueChange={setBlindByDefault} />
          <SettingRow title="Auto-Reject Below Score" chevron onPress={() => {}} />
        </View>

        {/* Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BILLING</Text>
          <SettingRow title="Current Plan — Pro" chevron onPress={() => {}} />
          <SettingRow title="Usage Stats" chevron onPress={() => {}} />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <SettingRow title="Help Center" chevron onPress={() => {}} />
          <SettingRow title="Contact Support" chevron onPress={() => {}} />
          <SettingRow title="Privacy Policy" chevron onPress={() => {}} />
          <SettingRow title="Terms of Service" chevron onPress={() => {}} />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Sign-Out Confirmation — inline overlay (stays inside phone shell) ── */}
      {showSignOutModal && (
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={handleCancelSignOut}
        >
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Sign Out?</Text>
            <Text style={modalStyles.body}>
              You'll need to sign back in to manage your job postings and candidates.
            </Text>

            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={handleConfirmSignOut}
              activeOpacity={0.8}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.confirmText}>Yes, Sign Out</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={handleCancelSignOut}
              activeOpacity={0.7}
              disabled={isSigningOut}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 120 },
  title: {
    fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E', paddingHorizontal: 20, marginTop: 20, marginBottom: 20,
  },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#F8F9FF', borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginBottom: 8,
  },
  companyAvatar: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#EEF0FF',
    alignItems: 'center', justifyContent: 'center',
  },
  companyAvatarText: { fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', color: '#4C59D7' },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1A2E' },
  companyIndustry: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 2 },
  editLink: { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: '#4C59D7' },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  signOutBtn: {
    marginHorizontal: 20, marginTop: 32, height: 52,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { fontSize: 16, fontFamily: 'PlusJakartaSans_500Medium', color: '#EF4444' },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,26,46,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 110, // Increased to avoid floating tab bar
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 -8px 40px rgba(26,26,46,0.15)' } as any,
      default: {
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 20,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
  },
  cancelBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#6B7280',
  },
});
