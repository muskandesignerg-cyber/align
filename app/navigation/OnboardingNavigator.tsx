import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../onboarding/WelcomeScreen';
import { SignUpScreen } from '../onboarding/SignUpScreen';
import { SignInScreen } from '../onboarding/SignInScreen';
import { RoleSelectionScreen } from '../onboarding/RoleSelectionScreen';
import { ProfileBuilderScreen } from '../onboarding/ProfileBuilderScreen';
import { SkillConfirmationScreen } from '../onboarding/SkillConfirmationScreen';
import { RolePreferencesScreen } from '../onboarding/RolePreferencesScreen';
import { EmployerOnboardingScreen } from '../onboarding/EmployerOnboardingScreen';
import { ProfileBuilderProvider } from '../context/ProfileBuilderContext';

export type OnboardingStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
  RoleSelection: undefined;
  ProfileBuilder: undefined;
  SkillConfirmation: { parsedSkills?: string[] } | undefined;
  RolePreferences: undefined;
  /** Employer-specific onboarding (company details) */
  EmployerOnboarding: undefined;
};

interface OnboardingNavigatorProps {
  /** When user is already signed in, skip Welcome and go straight to role selection */
  initialRoute?: keyof OnboardingStackParamList;
}

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({
  initialRoute = 'Welcome',
}) => {
  return (
    <ProfileBuilderProvider>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

        {/* Candidate onboarding flow */}
        <Stack.Screen name="ProfileBuilder" component={ProfileBuilderScreen} />
        <Stack.Screen name="SkillConfirmation" component={SkillConfirmationScreen} />
        <Stack.Screen name="RolePreferences" component={RolePreferencesScreen} />

        {/* Employer onboarding flow */}
        <Stack.Screen name="EmployerOnboarding" component={EmployerOnboardingScreen} />
      </Stack.Navigator>
    </ProfileBuilderProvider>
  );
};
