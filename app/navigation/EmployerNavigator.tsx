import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import JobsScreen from '../screens/employer/JobsScreen';
import CandidatesScreen from '../screens/employer/CandidatesScreen';
import EmployerMessagesScreen from '../screens/employer/EmployerMessagesScreen';
import AssessmentBuilderScreen from '../screens/employer/AssessmentBuilderScreen';
import EmployerAnalyticsScreen from '../screens/employer/EmployerAnalyticsScreen';
import FloatingTabBar from '../components/employer/FloatingTabBar';
import { EmployerProvider } from '../context/EmployerContext';
import { PipelineCandidate, JobPosting } from '../types/employer';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type EmployerTabParamList = {
  Candidates: undefined;
  Jobs:       undefined;
  EMessages:  undefined;
  Analytics:  undefined;
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
      tabBar={(props: BottomTabBarProps) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tab 1 — Dashboard (Pipeline/Candidates) */}
      <Tab.Screen 
        name="Candidates" 
        component={CandidatesScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Tab 2 — Post Role (JobsScreen) */}
      <Tab.Screen 
        name="Jobs" 
        component={JobsScreen} 
        options={{
          tabBarLabel: 'Post Role',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Tab 3 — Messages */}
      <Tab.Screen 
        name="EMessages" 
        component={EmployerMessagesScreen} 
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Tab 4 — Analytics */}
      <Tab.Screen 
        name="Analytics" 
        component={EmployerAnalyticsScreen} 
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack Navigator ──────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<EmployerStackParamList>();

/**
 * EmployerNavigator — wraps employer tabs + modal screens.
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
