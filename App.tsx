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
      *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body { margin: 0; padding: 0; background: #0F1117; width: 100%; height: 100%; overflow: hidden; }
      input, textarea { outline: none !important; }
      ::-webkit-scrollbar { display: none; }
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

// ── Simulated phone status bar (web only) ─────────────────────────────────────
function WebStatusBar() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const time = `${h > 12 ? h - 12 : h || 12}:${m}`;
  return (
    <View style={{
      height: 44, backgroundColor: '#FFFFFF',
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0A0A0A', letterSpacing: 0.2 }}>{time}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {/* Signal */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
          {[3, 5, 7, 9].map((h2, i) => (
            <View key={i} style={{ width: 3, height: h2, backgroundColor: i < 3 ? '#0A0A0A' : '#C0C0C0', borderRadius: 1 }} />
          ))}
        </View>
        {/* WiFi */}
        <View style={{ width: 16, height: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, color: '#0A0A0A' }}>WiFi</Text>
        </View>
        {/* Battery */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 22, height: 11, borderWidth: 1.5, borderColor: '#0A0A0A', borderRadius: 3, padding: 1.5 }}>
            <View style={{ flex: 1, backgroundColor: '#0A0A0A', borderRadius: 1.5, width: '75%' }} />
          </View>
          <View style={{ width: 2, height: 5, backgroundColor: '#0A0A0A', borderRadius: 1, marginLeft: 1 }} />
        </View>
      </View>
    </View>
  );
}

// ── Simulated home indicator (web only) ───────────────────────────────────────
function WebHomeIndicator() {
  return (
    <View style={{
      height: 34, backgroundColor: '#FFFFFF',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ width: 134, height: 5, backgroundColor: '#1A1A1A', borderRadius: 3, opacity: 0.2 }} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1117' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Web: Plain View fills browser (dark bg), phone frame inside ─────────────
  // GestureHandlerRootView goes INSIDE the phone frame to avoid root issues on web
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          flex: 1,
          width: '100%' as any,
          backgroundColor: '#0F1117',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* White 390×844 phone frame */}
        <View
          style={{
            width: 390,
            height: 844,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <WebStatusBar />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider initialMetrics={WEB_METRICS}>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
          <WebHomeIndicator />
        </View>
      </View>
    );
  }

  // ── Native iOS / Android ─────────────────────────────────────────────────────
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
