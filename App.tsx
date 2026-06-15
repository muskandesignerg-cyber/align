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

// On web: inject a <style> tag that kills the browser's black outline
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    input, textarea, [contenteditable] {
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    * {
      -webkit-tap-highlight-color: transparent;
    }
    /* Phone shell — hard clip boundary for all child content */
    [data-testid="phone-screen"], [data-phone-screen="true"] {
      isolation: isolate;
      overflow: hidden;
    }
    /* Ensure the GestureHandlerRootView inside the phone shell
       acts as a positioning parent and never overflows */
    [data-testid="phone-screen"] > *,
    [data-phone-screen="true"] > * {
      overflow: hidden;
      position: relative;
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

  const appContent = (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );

  // On web: wrap in a centered phone-frame container
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneSpeaker} />
          <View style={styles.phoneScreen}>
            <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
              {appContent}
            </GestureHandlerRootView>
          </View>
          <View style={styles.homeIndicatorWrap}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    );
  }

  // On native: full screen
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {appContent}
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
  webOuter: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#0F1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneShell: {
    width: 393,
    height: 852,
    backgroundColor: Colors.white,
    borderRadius: 52,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#1C1C1E',
    // @ts-ignore web-only
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
    // @ts-ignore web-only — creates a CSS isolation boundary so no child
    // stacking context (e.g. Animated.View with transform) escapes the shell
    isolation: 'isolate',
  },
  phoneSpeaker: {
    height: 28,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneScreen: {
    flex: 1,
    overflow: 'hidden',
    // @ts-ignore web-only
    isolation: 'isolate',
  },
  homeIndicatorWrap: {
    height: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1C1C1E',
    opacity: 0.2,
  },
});
