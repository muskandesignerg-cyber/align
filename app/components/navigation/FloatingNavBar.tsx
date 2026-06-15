import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '../../theme/typography';
import { useUI } from '../../context/UIContext';

const ACTIVE_COLOR   = '#4C59D7';
const INACTIVE_COLOR = '#9CA3AF';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  label:    string;
  active:   IoniconName;
  inactive: IoniconName;
  badge?:   boolean;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Feed: {
    label:    'Home',
    active:   'home',
    inactive: 'home-outline',
  },
  Dashboard: {
    label:    'Dashboard',
    active:   'grid',
    inactive: 'grid-outline',
  },
  Messages: {
    label:    'Messages',
    active:   'chatbubble',
    inactive: 'chatbubble-outline',
    badge:    true,
  },
  Profile: {
    label:    'Profile',
    active:   'person',
    inactive: 'person-outline',
  },
};

/**
 * FloatingNavBar — Custom bottom tab bar that floats 20px above
 * all screen edges. Active tab = horizontal purple pill with icon+label.
 * Inactive tabs = vertical icon+label stack.
 */
export default function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const insets       = useSafeAreaInsets();
  const floatBottom  = insets.bottom + 16;
  const { sheetOpen } = useUI();

  // Animate opacity: 1 → 0 when sheet opens, 0 → 1 when sheet closes
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue:         sheetOpen ? 0 : 1,
      duration:        200,
      useNativeDriver: true,
    }).start();
  }, [sheetOpen]);

  return (
    /**
     * height: 0 outer wrapper is CRITICAL.
     * React Navigation measures this component's height and subtracts it
     * from the screen content area. Without height:0, RN measures the
     * absolute-positioned navbar as full-screen height → screen gets 0px.
     * With height:0, screen gets full height, navbar floats freely on top.
     */
    <View style={{ height: 0 }}>
      <Animated.View
        style={[
          styles.wrapper,
          { bottom: floatBottom, opacity },
          sheetOpen && { pointerEvents: 'none' } as any,
        ]}
      >
        <View style={styles.navbar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config    = TAB_CONFIG[route.name];
            if (!config) return null;

            const onPress = () => {
              const event = navigation.emit({
                type:              'tabPress',
                target:            route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isFocused) {
              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.activePill}
                  onPress={onPress}
                  activeOpacity={0.85}
                >
                  <Ionicons name={config.active} size={18} color="#FFFFFF" />
                  <Text style={styles.activeLabel}>{config.label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.inactiveItem}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <View>
                  <Ionicons name={config.inactive} size={22} color={INACTIVE_COLOR} />
                  {config.badge && <View style={styles.badge} />}
                </View>
                <Text style={styles.inactiveLabel}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  // Outer wrapper — creates 20px floating gap from all edges
  wrapper: {
    position: 'absolute',
    left:     20,
    right:    20,
    zIndex:   999,
  },

  // Inner floating navbar card
  navbar: {
    height:            64,
    backgroundColor:   '#FFFFFF',
    borderRadius:      22,
    borderWidth:       1,
    borderColor:       'rgba(0,0,0,0.06)',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 12,
    overflow:          'hidden',
    ...Platform.select({
      web: {
        // @ts-ignore web-only — three-layer premium shadow
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 32px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.04)',
      },
      default: {
        shadowColor:   '#000000',
        shadowOffset:  { width: 0, height: 10 },
        shadowOpacity: 0.10,
        shadowRadius:  32,
        elevation:     16,
      },
    }),
  },

  // ── Active pill ──────────────────────────────────────────────────────────────
  activePill: {
    height:            42,
    backgroundColor:   ACTIVE_COLOR,
    borderRadius:      14,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    paddingHorizontal: 18,
    ...Platform.select({
      web: {
        // @ts-ignore web-only
        boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
      },
      default: {
        shadowColor:   '#4F46E5',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius:  14,
        elevation:     8,
      },
    }),
  },
  activeLabel: {
    fontSize:      13,
    fontFamily:    FontFamily.bold,
    color:         '#FFFFFF',
    letterSpacing: 0,
  },

  // ── Inactive item ─────────────────────────────────────────────────────────────
  inactiveItem: {
    alignItems:        'center',
    gap:                3,
    paddingHorizontal:  8,
    paddingVertical:    4,
  },
  inactiveLabel: {
    fontSize:   10,
    fontFamily: FontFamily.medium,
    color:      INACTIVE_COLOR,
  },

  // ── Notification badge ────────────────────────────────────────────────────────
  badge: {
    position:        'absolute',
    top:             -1,
    right:           -1,
    width:            7,
    height:           7,
    borderRadius:     3.5,
    backgroundColor: '#E63946',
    borderWidth:      1.5,
    borderColor:     '#FFFFFF',
  },
});
