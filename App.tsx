import 'react-native-url-polyfill/auto';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View, ActivityIndicator, Platform, StyleSheet, TextInput } from 'react-native';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AuthProvider } from './app/context/AuthContext';
import { Colors } from './app/theme/colors';

// ─── Global: remove focus outline on all TextInputs ───────────────────────────

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, [contenteditable] {
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  document.head.appendChild(style);
}

// On all platforms: suppress React Native's own outline/selection ring
(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  selectionColor: '#4C59D7',
  style: [{ outlineWidth: 0 }],
};

// ─── Web safe-area metrics ────────────────────────────────────────────────────
// On web, SafeAreaView returns 0 insets. Provide explicit metrics so every
// screen gets correct top/bottom padding.
const WEB_METRICS = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ─── Web: No phone shell — #root CSS handles the 390x844 frame ─────────────
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider initialMetrics={WEB_METRICS}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // ─── Native: full screen with system SafeArea ──────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
