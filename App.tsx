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

// Remove focus outline on web inputs
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, [contenteditable] { outline: none !important; }
    html, body { background: #0F1117 !important; margin: 0; padding: 0; height: 100%; }
    #root { background: #0F1117 !important; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  `;
  document.head.appendChild(style);
}

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  selectionColor: '#4C59D7',
  style: [{ outlineWidth: 0 }],
};

// Safe-area metrics for web — simulates iPhone 15 Pro
const WEB_METRICS = {
  insets: { top: 59, bottom: 34, left: 0, right: 0 },
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

  // ─── Web: Render the app inside a strict 390px phone frame ─────────────────
  // React Native Web ignores CSS width on #root — we MUST use RN layout here.
  if (Platform.OS === 'web') {
    return (
      // Outer: fills entire browser window, dark background
      <View style={styles.webOuter}>
        {/* Inner: strict 390×844 phone frame, white background */}
        <View style={styles.phoneFrame}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider initialMetrics={WEB_METRICS}>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </View>
      </View>
    );
  }

  // ─── Native iOS/Android: full screen, OS handles safe areas ────────────────
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
    backgroundColor: '#FFFFFF',
  },

  // Dark background — fills the whole browser window
  webOuter: {
    flex: 1,
    backgroundColor: '#0F1117',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore — web-only
    minHeight: '100vh',
    width: '100%',
  },

  // The 390px phone frame — this is what React Native Web actually respects
  phoneFrame: {
    width: 390,
    height: 844,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // @ts-ignore — web-only shadow
    boxShadow: '0 0 60px rgba(0,0,0,0.5)',
  },
});
