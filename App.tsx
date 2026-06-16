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
import {
  View,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AuthProvider } from './app/context/AuthContext';
import { Colors } from './app/theme/colors';

// Remove focus outline on web inputs
if (Platform.OS === 'web') {
  try {
    const style = document.createElement('style');
    style.textContent = `
      * { -webkit-tap-highlight-color: transparent; }
      input, textarea { outline: none !important; }
      html, body {
        margin: 0; padding: 0;
        width: 100%; height: 100%;
        background: #0F1117;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  } catch (_) {}
}

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  selectionColor: '#4C59D7',
};

// iPhone 15 Pro dimensions for the phone frame
const PHONE_W = 390;
const PHONE_H = 844;

// Safe-area metrics for web (simulates iPhone 15 Pro)
const WEB_METRICS = {
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: PHONE_W, height: PHONE_H },
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

  // ── Web: Phone frame centred on dark background ──────────────────────────
  if (Platform.OS === 'web') {
    const win = Dimensions.get('window');
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: win.width,
          height: win.height,
          backgroundColor: '#0F1117',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: PHONE_W,
            height: PHONE_H,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
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

  // ── Native iOS/Android ───────────────────────────────────────────────────
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
});
