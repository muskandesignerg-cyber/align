import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Application, ApplicationStatus, DashboardStats, TimelineEvent } from '../types/applications';
import { getApplicationsForCandidate, withdrawApplication as dbWithdrawApplication, type ApplicationRow } from '../lib/database';
import { useAuth } from './AuthContext';
import { MOCK_APPLICATIONS } from '../data/mockApplications';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map application status to number of timeline steps completed */
function buildTimeline(app: ApplicationRow): TimelineEvent[] {
  const status = app.status;
  const appliedDate = app.applied_at;
  const updatedDate = app.updated_at;

  const timeline: TimelineEvent[] = [
    { id: `${app.id}_1`, type: 'applied', label: 'Applied', date: appliedDate, isCompleted: true },
    { id: `${app.id}_2`, type: 'viewed', label: 'In Review', date: status !== 'Applied' ? updatedDate : '', isCompleted: status !== 'Applied' },
    { id: `${app.id}_3`, type: 'interview', label: 'Interview', date: ['Interviewing', 'Offer'].includes(status) ? updatedDate : '', isCompleted: ['Interviewing', 'Offer'].includes(status) },
    { id: `${app.id}_4`, type: 'offer', label: 'Decision', date: status === 'Offer' ? updatedDate : '', isCompleted: status === 'Offer' },
  ];

  return timeline;
}

/** Convert a Supabase ApplicationRow (with joined job) to the app's Application type */
function rowToApplication(row: ApplicationRow): Application {
  const job = row.job_postings;
  return {
    id: row.id,
    jobId: row.job_id,
    companyName: job?.company_name || 'Company',
    roleTitle: job?.role_title || 'Role',
    location: job?.location || job?.work_model || 'Remote',
    workModel: (job?.work_model || 'Remote') as Application['workModel'],
    skills: job?.skills?.slice(0, 3) ?? [],
    status: row.status as ApplicationStatus,
    appliedAt: row.applied_at,
    lastUpdatedAt: row.updated_at,
    hasAssessment: row.status === 'Assessment Sent',
    assessmentCompany: row.status === 'Assessment Sent' ? job?.company_name : undefined,
    timeline: buildTimeline(row),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface DashboardState {
  applications: Application[];
  stats: DashboardStats;
  pendingAssessments: Application[];
  isLoading: boolean;
  isRefreshing: boolean;
  selectedApplication: Application | null;
  statusFilter: ApplicationStatus | null;
  dismissedAssessmentIds: string[];
}

function computeStats(apps: Application[]): DashboardStats {
  return {
    applied: apps.filter((a) => a.status === 'Applied').length,
    inReview: apps.filter((a) => a.status === 'In Review').length,
    interviewing: apps.filter((a) => a.status === 'Interviewing').length,
    offer: apps.filter((a) => a.status === 'Offer').length,
    rejected: apps.filter((a) => a.status === 'Rejected').length,
  };
}

function computePendingAssessments(apps: Application[], dismissed: string[]): Application[] {
  return apps.filter(
    (a) => a.hasAssessment && a.status === 'Assessment Sent' && !dismissed.includes(a.id),
  );
}

const initialState: DashboardState = {
  applications: [],
  stats: computeStats([]),
  pendingAssessments: [],
  isLoading: true,
  isRefreshing: false,
  selectedApplication: null,
  statusFilter: null,
  dismissedAssessmentIds: [],
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type DashboardAction =
  | { type: 'LOAD_APPLICATIONS'; apps: Application[] }
  | { type: 'SET_SELECTED_APPLICATION'; id: string | null }
  | { type: 'DISMISS_ASSESSMENT_BANNER'; id: string }
  | { type: 'WITHDRAW_APPLICATION'; id: string }
  | { type: 'UPDATE_APPLICATION_STATUS'; id: string; status: ApplicationStatus }
  | { type: 'SET_STATUS_FILTER'; status: ApplicationStatus | null }
  | { type: 'SET_REFRESHING'; value: boolean }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'RESTORE_DISMISSED'; ids: string[] };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'LOAD_APPLICATIONS': {
      const apps = action.apps;
      return {
        ...state,
        applications: apps,
        stats: computeStats(apps),
        pendingAssessments: computePendingAssessments(apps, state.dismissedAssessmentIds),
        isLoading: false,
        isRefreshing: false,
      };
    }

    case 'SET_SELECTED_APPLICATION': {
      const selected = action.id ? state.applications.find((a) => a.id === action.id) ?? null : null;
      return { ...state, selectedApplication: selected };
    }

    case 'DISMISS_ASSESSMENT_BANNER': {
      const newDismissed = [...state.dismissedAssessmentIds, action.id];
      return {
        ...state,
        dismissedAssessmentIds: newDismissed,
        pendingAssessments: computePendingAssessments(state.applications, newDismissed),
      };
    }

    case 'WITHDRAW_APPLICATION': {
      const apps = state.applications.filter((a) => a.id !== action.id);
      return {
        ...state,
        applications: apps,
        stats: computeStats(apps),
        pendingAssessments: computePendingAssessments(apps, state.dismissedAssessmentIds),
        selectedApplication:
          state.selectedApplication?.id === action.id ? null : state.selectedApplication,
      };
    }

    case 'UPDATE_APPLICATION_STATUS': {
      const apps = state.applications.map((a) =>
        a.id === action.id ? { ...a, status: action.status, lastUpdatedAt: new Date().toISOString() } : a,
      );
      return {
        ...state,
        applications: apps,
        stats: computeStats(apps),
        pendingAssessments: computePendingAssessments(apps, state.dismissedAssessmentIds),
      };
    }

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: state.statusFilter === action.status ? null : action.status,
      };

    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.value };

    case 'SET_LOADING':
      return { ...state, isLoading: action.value };

    case 'RESTORE_DISMISSED':
      return {
        ...state,
        dismissedAssessmentIds: action.ids,
        pendingAssessments: computePendingAssessments(state.applications, action.ids),
      };

    default:
      return state;
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const DISMISSED_KEY = '@talent_logic_dismissed_assessments';

// ─── Context ──────────────────────────────────────────────────────────────────

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  filteredApplications: Application[];
  refreshApplications: () => void;
  withdrawApplication: (applicationId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { user } = useAuth();

  // Load real applications from Supabase
  const loadApplications = useCallback(async () => {
    if (!user) {
      // Not logged in — show mock data for demo/preview
      dispatch({ type: 'LOAD_APPLICATIONS', apps: MOCK_APPLICATIONS });
      return;
    }
    try {
      const rows = await getApplicationsForCandidate(user.id);
      const apps = rows.map(rowToApplication);
      // If Supabase returns nothing, fall back to mock data so the
      // dashboard always has visible content during development
      dispatch({ type: 'LOAD_APPLICATIONS', apps: apps.length > 0 ? apps : MOCK_APPLICATIONS });
    } catch (e) {
      console.warn('Failed to load applications:', e);
      dispatch({ type: 'LOAD_APPLICATIONS', apps: MOCK_APPLICATIONS });
    }
  }, [user]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Restore dismissed assessment IDs
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DISMISSED_KEY);
        if (raw) {
          dispatch({ type: 'RESTORE_DISMISSED', ids: JSON.parse(raw) });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Persist dismissed IDs
  useEffect(() => {
    if (state.dismissedAssessmentIds.length > 0) {
      AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(state.dismissedAssessmentIds)).catch(() => {});
    }
  }, [state.dismissedAssessmentIds]);

  const filteredApplications = state.statusFilter
    ? state.applications.filter((a) => a.status === state.statusFilter)
    : state.applications;

  const refreshApplications = useCallback(() => {
    dispatch({ type: 'SET_REFRESHING', value: true });
    loadApplications();
  }, [loadApplications]);

  /**
   * Withdraw an application:
   * 1. Delete from Supabase FIRST (so we know it succeeded)
   * 2. Then remove from local state (confirmed update)
   * 3. Re-throw on failure so the screen can show the error
   */
  const withdrawApplication = useCallback(async (applicationId: string) => {
    console.log('[Dashboard] Withdrawing:', applicationId);
    // DB first — if this throws, the screen catches it
    await dbWithdrawApplication(applicationId);
    // Only update local state after confirmed DB delete
    dispatch({ type: 'WITHDRAW_APPLICATION', id: applicationId });
    console.log('[Dashboard] Withdraw complete:', applicationId);
  }, []);

  return (
    <DashboardContext.Provider value={{ state, dispatch, filteredApplications, refreshApplications, withdrawApplication }}>
      {children}
    </DashboardContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>');
  return ctx;
}
