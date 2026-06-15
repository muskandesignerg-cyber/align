import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobsScreen from '../screens/employer/JobsScreen';
import CandidatesScreen from '../screens/employer/CandidatesScreen';
import EmployerMessagesScreen from '../screens/employer/EmployerMessagesScreen';
import EmployerSettingsScreen from '../screens/employer/EmployerSettingsScreen';
import { EmployerProvider } from '../context/EmployerContext';
import EmployerFloatingNavBar from '../components/employer/EmployerFloatingNavBar';

const Tab = createBottomTabNavigator();

function EmployerTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Candidates"
      tabBar={(props) => <EmployerFloatingNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Candidates" component={CandidatesScreen} />
      <Tab.Screen name="Jobs"       component={JobsScreen} />
      <Tab.Screen name="EMessages"  component={EmployerMessagesScreen} />
      <Tab.Screen name="ESettings"  component={EmployerSettingsScreen} />
    </Tab.Navigator>
  );
}

/**
 * EmployerNavigator — wraps all tabs in a single EmployerProvider.
 * Uses EmployerFloatingNavBar instead of the system tab bar.
 */
export default function EmployerNavigator() {
  return (
    <EmployerProvider>
      <EmployerTabs />
    </EmployerProvider>
  );
}
