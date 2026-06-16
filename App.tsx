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
import { View, ActivityIndicator, Platform, TextInput } from 'react-native';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AuthProvider } from './app/context/AuthContext';
import { Colors } from './app/theme/colors';

if (Platform.OS === 'web') {
  try {
    const s = document.createElement('style');
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; background: #0F1117; overflow: hidden; }
      input, textarea { outline: none !important; }
    `;
    document.head.appendChild(s);
  } catch (_) {}
}

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  selectionColor: '#4C59D7',
};

const WEB_METRICS = {
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Web: GestureHandlerRootView fills the viewport (dark bg),
  //         inner View is the 390×844 phone frame (white).
  //         GestureHandlerRootView MUST be root — flex:1 guarantees it
  //         fills whatever #root gives it (100% viewport).
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: '#0F1117',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 390×844 phone frame */}
        <View
          style={{
            width: 390,
            height: 844,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <SafeAreaProvider initialMetrics={WEB_METRICS}>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </SafeAreaProvider>
        </View>
      </GestureHandlerRootView>
    );
  }

  // ── Native iOS / Android ─────────────────────────────────────────────────
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
