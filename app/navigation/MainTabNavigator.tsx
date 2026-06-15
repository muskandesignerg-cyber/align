import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../screens/FeedScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JobDetailScreen } from '../screens/JobDetailScreen';
import { ApplicationDetailScreen } from '../screens/ApplicationDetailScreen';
import { ApplySuccessScreen } from '../screens/ApplySuccessScreen';
import { DashboardProvider } from '../context/DashboardContext';
import { ProfileProvider } from '../context/ProfileContext';
import { Job } from '../types/jobs';
import { Application } from '../types/applications';
import FloatingNavBar from '../components/navigation/FloatingNavBar';

// ─── Param types ──────────────────────────────────────────────────────────────

export type MainStackParamList = {
  MainTabs:          undefined;
  JobDetail:         { job: Job; fromDashboard?: boolean; applicationStatus?: 'Applied' | 'In Review' | 'Interviewing'; postedDate?: string };
  ApplicationDetail: { application: Application };
  ApplySuccess:      { jobTitle: string; companyName: string; matchScore: number; companyInitial: string };
};

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Feed"      component={FeedScreen}      />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Messages"  component={MessagesScreen}  />
      <Tab.Screen name="Profile"   component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

// ─── Stack Navigator (wraps tabs + modals) ────────────────────────────────────

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * MainTabNavigator — Bottom tabs wrapped in a stack so JobDetail
 * can be presented as a modal overlay.
 */
import { UIProvider } from '../context/UIContext';

export const MainTabNavigator: React.FC = () => {
  return (
    <UIProvider>
      <DashboardProvider>
        <ProfileProvider>
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="JobDetail"
              component={JobDetailScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ApplicationDetail"
              component={ApplicationDetailScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ApplySuccess"
              component={ApplySuccessScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack.Navigator>
        </ProfileProvider>
      </DashboardProvider>
    </UIProvider>
  );
};
