import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG = [
  {
    name: 'Candidates',
    label: 'Dashboard',
    icon: 'grid-outline' as const,
    iconActive: 'grid' as const,
  },
  {
    name: 'Jobs',
    label: 'Post Role',
    icon: 'add-circle-outline' as const,
    iconActive: 'add-circle' as const,
  },
  {
    name: 'EMessages',
    label: 'Messages',
    icon: 'chatbubble-outline' as const,
    iconActive: 'chatbubble' as const,
    hasNotif: true,
  },
  {
    name: 'Analytics',
    label: 'Analytics',
    icon: 'bar-chart-outline' as const,
    iconActive: 'bar-chart' as const,
  },
];

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Create shared values for scale animation for each tab
  const scales = useMemo(() => TAB_CONFIG.map(() => useSharedValue(1)), []);

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 16 }
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          const scale = scales[index];

          const animStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
            flex: 1,
            marginHorizontal: 2,
          }));

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            // Bounce the pressed tab
            scale.value = withSpring(0.85, { damping: 10, stiffness: 300 }, () => {
              scale.value = withSpring(1);
            });

            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index]?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <Animated.View key={tab.name} style={animStyle}>
              <TouchableOpacity
                onPress={onPress}
                style={[
                  styles.tab,
                  isFocused && styles.tabActive,
                ]}
                activeOpacity={0.75}
              >
                <View style={styles.tabInner}>
                  {/* Icon */}
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={isFocused ? tab.iconActive : tab.icon}
                      size={20}
                      color={isFocused ? '#FFFFFF' : '#6B7280'}
                    />
                    
                    {/* Notification dot */}
                    {tab.hasNotif && !isFocused && (
                      <View style={styles.notifDot} />
                    )}
                  </View>

                  {/* Label */}
                  <Text style={[
                    styles.label,
                    isFocused && styles.labelActive,
                  ]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper — positions the bar
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },

  // Floating pill container
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    height: 64,
    width: '100%',
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',

    // Strong shadow — makes it float
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 16,

    // Subtle border
    borderWidth: 1,
    borderColor: '#F0F2FF',
  },

  // Each tab button
  tab: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active tab — filled purple pill
  tabActive: {
    backgroundColor: '#4C59D7',
    shadowColor: '#4C59D7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },

  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  iconWrap: {
    position: 'relative',
  },

  // Label
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },

  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Notification dot on Messages
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
