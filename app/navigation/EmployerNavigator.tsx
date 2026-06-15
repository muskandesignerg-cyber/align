import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JobsScreen from '../screens/employer/JobsScreen';
import CandidatesScreen from '../screens/employer/CandidatesScreen';
import EmployerMessagesScreen from '../screens/employer/EmployerMessagesScreen';
import EmployerSettingsScreen from '../screens/employer/EmployerSettingsScreen';
import AssessmentBuilderScreen from '../screens/employer/AssessmentBuilderScreen';
import EmployerAnalyticsScreen from '../screens/employer/EmployerAnalyticsScreen';
import { EmployerProvider } from '../context/EmployerContext';
import EmployerFloatingNavBar from '../components/employer/EmployerFloatingNavBar';
import { PipelineCandidate } from '../types/employer';
import { JobPosting } from '../types/employer';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type EmployerTabParamList = {
  Candidates: undefined;
  Jobs:       undefined;
  Analytics:  undefined;
  EMessages:  undefined;
  ESettings:  undefined;
};

export type EmployerStackParamList = {
  EmployerTabs:       undefined;
  AssessmentBuilder:  { candidate: PipelineCandidate; job: JobPosting };
};

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<EmployerTabParamList>();

function EmployerTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Candidates"
      tabBar={(props) => <EmployerFloatingNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Candidates" component={CandidatesScreen} />
      <Tab.Screen name="Jobs"       component={JobsScreen} />
      <Tab.Screen name="Analytics"  component={EmployerAnalyticsScreen} />
      <Tab.Screen name="EMessages"  component={EmployerMessagesScreen} />
      <Tab.Screen name="ESettings"  component={EmployerSettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── Stack Navigator ──────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<EmployerStackParamList>();

/**
 * EmployerNavigator — wraps employer tabs + modal screens.
 * Uses EmployerFloatingNavBar instead of the system tab bar.
 */
export default function EmployerNavigator() {
  return (
    <EmployerProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
        <Stack.Screen
          name="AssessmentBuilder"
          component={AssessmentBuilderScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </EmployerProvider>
  );
}
