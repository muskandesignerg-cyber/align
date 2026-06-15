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
import AssessmentIntroScreen from '../screens/AssessmentIntroScreen';
import AssessmentTestScreen from '../screens/AssessmentTestScreen';
import AssessmentResultScreen from '../screens/AssessmentResultScreen';
import InterviewIntroScreen from '../screens/InterviewIntroScreen';
import InterviewSessionScreen from '../screens/InterviewSessionScreen';
import InterviewResultScreen from '../screens/InterviewResultScreen';
import { DashboardProvider } from '../context/DashboardContext';
import { ProfileProvider } from '../context/ProfileContext';
import { UIProvider } from '../context/UIContext';
import { Job } from '../types/jobs';
import { Application } from '../types/applications';
import { Assessment, InterviewResult, InterviewSession } from '../types/assessment';
import FloatingNavBar from '../components/navigation/FloatingNavBar';

// ─── Param types ──────────────────────────────────────────────────────────────

export type MainStackParamList = {
  MainTabs:          undefined;
  JobDetail:         { job: Job; fromDashboard?: boolean; applicationStatus?: 'Applied' | 'In Review' | 'Assessment Sent' | 'Interviewing' | 'Offer'; postedDate?: string };
  ApplicationDetail: { application: Application };
  ApplySuccess:      { jobTitle: string; companyName: string; matchScore: number; companyInitial: string };

  // Round 2 — MCQ Assessment
  AssessmentIntro:  { assessment: Assessment };
  AssessmentTest:   { assessment: Assessment };
  AssessmentResult: { passed: boolean; score: number; correct: number; total: number; roleTitle: string; companyName: string; assessment: Assessment; answers: (number | null)[] };

  // Round 3 — AI Voice Interview
  InterviewIntro:   { session: InterviewSession };
  InterviewSession: { session: InterviewSession };
  InterviewResult:  { result: InterviewResult; session: InterviewSession };
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
 * MainTabNavigator — Bottom tabs wrapped in a stack so overlays
 * (JobDetail, Assessment, Interview) can be presented as modals.
 */
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

            {/* ── Round 2: MCQ Assessment ── */}
            <Stack.Screen
              name="AssessmentIntro"
              component={AssessmentIntroScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="AssessmentTest"
              component={AssessmentTestScreen}
              options={{ animation: 'slide_from_right', gestureEnabled: false }}
            />
            <Stack.Screen
              name="AssessmentResult"
              component={AssessmentResultScreen}
              options={{ animation: 'slide_from_right', gestureEnabled: false }}
            />

            {/* ── Round 3: AI Interview ── */}
            <Stack.Screen
              name="InterviewIntro"
              component={InterviewIntroScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="InterviewSession"
              component={InterviewSessionScreen}
              options={{ animation: 'slide_from_right', gestureEnabled: false }}
            />
            <Stack.Screen
              name="InterviewResult"
              component={InterviewResultScreen}
              options={{ animation: 'slide_from_right', gestureEnabled: false }}
            />
          </Stack.Navigator>
        </ProfileProvider>
      </DashboardProvider>
    </UIProvider>
  );
};
