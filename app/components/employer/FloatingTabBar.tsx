/**
 * EmployerFloatingNavBar ΓÇö Premium pill navbar for employer screens.
 *
 * Tabs: Pipeline (active) ┬╖ Post Role ┬╖ Messages (red dot) ┬╖ Settings
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

type NavItem = {
  routeName: string;
  label:     string;
  icon:      keyof typeof Ionicons.glyphMap;
  iconActive:keyof typeof Ionicons.glyphMap;
  dot?:      boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    routeName:  'Candidates',
    label:      'Dashboard',
    icon:       'grid-outline',
    iconActive: 'grid-outline',
  },
  {
    routeName:  'Jobs',
    label:      'Post Role',
    icon:       'add-circle-outline',
    iconActive: 'add-circle-outline',
  },
  {
    routeName:  'EMessages',
    label:      'Messages',
    icon:       'chatbubble-outline',
    iconActive: 'chatbubble-outline',
    dot:        true,
  },
  {
    routeName:  'Analytics',
    label:      'Analytics',
    icon:       'bar-chart-outline',
    iconActive: 'bar-chart-outline',
  },
];

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={S.wrapper} pointerEvents="box-none">
      <View style={S.pill}>
        {NAV_ITEMS.map((item) => {
          const index   = state.routes.findIndex((r) => r.name === item.routeName);
          const focused = index !== -1 && state.index === index;

          const onPress = () => {
            if (index === -1) return;
            const route = state.routes[index];
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (focused) {
            return (
              <TouchableOpacity key={item.routeName} onPress={onPress} activeOpacity={0.9} style={S.activePill}>
                <Ionicons name={item.iconActive} size={18} color="#FFFFFF" />
                <Text style={S.activePillLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={item.routeName} onPress={onPress} activeOpacity={0.7} style={S.inactiveItem}>
              <View style={S.inactiveIconWrap}>
                <Ionicons name={item.icon} size={22} color="#BBBBBB" />
                {item.dot && <View style={S.dot} />}
              </View>
              <Text style={S.inactiveLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingTop: 16, paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'stretch',
    zIndex: 999,
  },
  pill: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 32px rgba(0,0,0,0.10)',
      } as any,
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },

  // Active pill item
  activePill: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    backgroundColor: '#4C59D7',
    borderRadius: 14,
    ...Platform.select({
      web:     { boxShadow: '0 4px 14px rgba(79,70,229,0.35)' } as any,
      default: { shadowColor: '#4C59D7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
    }),
  },
  activePillLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Inactive item
  inactiveItem:     { alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  inactiveIconWrap: { position: 'relative' },
  inactiveLabel:    { fontSize: 10, fontWeight: '500', color: '#BBBBBB' },

  // Messages red dot
  dot: {
    position: 'absolute', top: -1, right: -2,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#E63946',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
});
