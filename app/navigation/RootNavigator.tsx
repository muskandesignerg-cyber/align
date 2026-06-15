import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import EmployerNavigator from './EmployerNavigator';
import { useAuth } from '../context/AuthContext';
import { DiscoverProvider } from '../context/DiscoverContext';
import { Colors } from '../theme/colors';

/**
 * RootNavigator — switches between Onboarding and Main App.
 *
 * ROUTING LOGIC:
 *   - Not signed in                  → OnboardingNavigator (Welcome/Login flow)
 *   - Signed in, onboarding NOT done → OnboardingNavigator (profile builder / employer setup)
 *   - Signed in, role=employer, done → EmployerNavigator
 *   - Signed in, role=candidate, done→ MainTabNavigator (discover + dashboard)
 *
 * IMPORTANT: Role is read from profile.role (the DB `profiles` table),
 * NOT from user_metadata — because RoleSelectionScreen only writes to the DB.
 *
 * The `key` prop on NavigationContainer forces a full remount whenever the
 * auth "bucket" changes, preventing React Navigation stale-state bugs.
 */
export const RootNavigator: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── Determine routing ───────────────────────────────────────────────────────
  const isLoggedIn = !!session;
  const isOnboarded = isLoggedIn && profile?.onboarding_complete === true;

  // Read role from the DB profile row (set by RoleSelectionScreen → upsertProfile)
  const userRole = profile?.role ?? 'candidate';
  const isEmployer = userRole === 'employer';

  // The key changes when the user's auth+role bucket changes.
  // This forces NavigationContainer to fully unmount+remount, giving a clean
  // navigation state — critical for the sign-out transition.
  const navKey = !isLoggedIn
    ? 'auth'
    : !isOnboarded
    ? `onboarding-${userRole}`
    : `app-${userRole}`;

  // Force pure white background for all screen containers
  const WhiteTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#FFFFFF' } };

  return (
    <NavigationContainer key={navKey} theme={WhiteTheme}>
      {isOnboarded ? (
        isEmployer ? (
          <EmployerNavigator />
        ) : (
          <DiscoverProvider>
            <MainTabNavigator />
          </DiscoverProvider>
        )
      ) : (
        // If user is logged in (confirmed email) but hasn't completed onboarding,
        // skip Welcome/SignIn screens and go straight to role selection.
        <OnboardingNavigator initialRoute={isLoggedIn ? 'RoleSelection' : 'Welcome'} />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
