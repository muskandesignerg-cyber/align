import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, LayoutGrid, MessageCircle, User } from 'lucide-react-native';
import { useUI } from '../../context/UIContext';

interface TabConfig {
  label: string;
  Icon:  React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  badge?: boolean;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Feed:      { label: 'Home',      Icon: Home },
  Dashboard: { label: 'Dashboard', Icon: LayoutGrid },
  Messages:  { label: 'Messages',  Icon: MessageCircle, badge: true },
  Profile:   { label: 'Profile',   Icon: User },
};

/**
 * FloatingNavBar — Dark floating pill, centered 24px above screen bottom.
 * Active tab: white pill with icon + label.
 * Inactive tabs: icon only, rgba(255,255,255,0.6).
 */
export default function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const { sheetOpen } = useUI();

  // Fade out when a bottom sheet is open
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue:         sheetOpen ? 0 : 1,
      duration:        180,
      useNativeDriver: true,
    }).start();
  }, [sheetOpen]);

  return (
    /**
     * height: 0 outer wrapper — React Navigation measures this component's
     * height and subtracts it from screen. With height: 0, screen gets full
     * height and the navbar floats freely via absolute positioning.
     */
    <View style={{ height: 0 }}>
      <Animated.View
        style={[styles.wrapper, { opacity }]}
        pointerEvents={sheetOpen ? 'none' : 'box-none'}
      >
        <View style={styles.pill}>
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
                  style={styles.activeTab}
                  onPress={onPress}
                  activeOpacity={0.85}
                >
                  <config.Icon size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.activeLabel}>{config.label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.inactiveTab}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <config.Icon size={22} color="#BBBBBB" strokeWidth={2} />
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
  // Transparent wrapper to position the floating navbar
  wrapper: {
    position:   'absolute',
    bottom:     20,
    left:       0,
    width:      '100%',
    height:     64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex:     100,
  },

  // White floating pill
  pill: {
    width:             350, // 390 - 40
    height:            64,
    marginHorizontal:  'auto',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   '#FFFFFF',
    borderRadius:      22,
    borderWidth:       1,
    borderColor:       'rgba(0,0,0,0.07)',
    paddingLeft:       12,
    paddingRight:      12,
    ...Platform.select({
      web: { 
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 32px rgba(0,0,0,0.10)' 
      } as any,
      default: {
        shadowColor:   '#000000',
        shadowOffset:  { width: 0, height: 10 },
        shadowOpacity: 0.10,
        shadowRadius:  32,
        elevation:     12,
      },
    }),
  },

  // Active tab — purple filled pill inside the white bar
  activeTab: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               7,
    height:            42,
    backgroundColor:   '#4F46E5',
    borderRadius:      14,
    paddingLeft:       16,
    paddingRight:      16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 14px rgba(79,70,229,0.35)' } as any,
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
    fontFamily: 'Inter',
    fontSize:   13,
    fontWeight: '700',
    color:      '#FFFFFF',
  },

  // Inactive tab — icon stacked above label, both gray
  inactiveTab: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    flexDirection:     'column',
    gap:               3,
    paddingTop:        4,
    paddingBottom:     4,
    paddingLeft:       8,
    paddingRight:      8,
  },
  inactiveLabel: {
    fontFamily: 'Inter',
    fontSize:   10,
    fontWeight: '500',
    color:      '#BBBBBB',
  },

  iconWrap: {
    position:       'relative',
    width:          20,
    height:         20,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Red notification dot (Messages)
  badge: {
    position:        'absolute',
    top:             -1,
    right:           -1,
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: '#E63946',
    borderWidth:     1.5,
    borderColor:     '#FFFFFF',
  },
});
