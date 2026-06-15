/**
 * DiscoverContext — Candidate job discovery feed with full pipeline persistence.
 *
 * Pipeline rules:
 * ① Applied jobs  → stored in Supabase `applications` table (permanent)
 * ② Passed jobs   → stored in Supabase `candidate_passed_jobs` table (permanent)
 * ③ Saved jobs    → stored in AsyncStorage (local, survives app restart)
 *
 * On load: fetch already-applied + already-passed job IDs from Supabase,
 * then filter those out of the feed so they never reappear.
 *
 * The feed uses a filtered job list, not currentIndex, to determine what to show.
 * This means refresh never breaks the position.
 */
import React, {
  createContext, useContext, useReducer, useEffect, useCallback, type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/jobs';
import {
  getActiveJobPostings,
  createApplication,
  getSkills,
  getPreferences,
  getCandidateProfileData,
  getAppliedJobIds,
  getPassedJobIds,
  recordPassedJob,
  type JobPostingRow,
} from '../lib/database';
import { useAuth } from './AuthContext';
import { groqScoreMatch } from '../utils/groqMatcher';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCandidateProfile(skills: string[], profileJson: any) {
  const profileSkills = [...skills];
  if (profileJson?.skills) {
    for (const s of profileJson.skills as any[]) {
      if (s?.name) profileSkills.push(s.name);
    }
  }
  if (profileJson?.projects) {
    for (const p of profileJson.projects as any[]) {
      if (Array.isArray(p?.techStack)) profileSkills.push(...p.techStack);
    }
  }
  const experienceTitles: string[] = [];
  if (profileJson?.workExperience) {
    for (const w of profileJson.workExperience as any[]) {
      if (w?.role) experienceTitles.push(w.role);
    }
  }
  return {
    professionalTitle:
      profileJson?.basicInfo?.professionalTitle ||
      profileJson?.basicInfo?.title || '',
    skills: [...new Set(profileSkills)],
    experienceTitles,
    summary: profileJson?.basicInfo?.professionalSummary || '',
  };
}

function rowToNeutralJob(row: JobPostingRow): Job {
  return {
    id: row.id,
    companyName: row.company_name || 'Company',
    roleTitle: row.role_title,
    employmentType: (row.employment_type?.toUpperCase() ?? 'FULL TIME') as Job['employmentType'],
    location: row.location || row.work_model || 'Remote',
    workModel: (row.work_model || 'Remote') as Job['workModel'],
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    currency: (row.currency || 'INR') as Job['currency'],
    skills: row.skills ?? [],
    description: row.description || '',
    matchScore: 55, // placeholder until Groq scores it
    isNew: Date.now() - new Date(row.posted_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    postedAt: row.posted_at,
    industry: row.department || undefined,
    companyDescription: row.company_description || undefined,
    companySize: row.company_size || undefined,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface DiscoverState {
  /** All available jobs from DB (unfiltered — filter happens in selectors) */
  allJobs: Job[];
  /** Job IDs already applied to (from Supabase) */
  appliedJobIds: Set<string>;
  /** Job IDs passed on (from Supabase) */
  passedJobIds: Set<string>;
  /** Job IDs saved locally */
  savedJobIds: Set<string>;
  isLoading: boolean;
  isScoring: boolean;
  errorType: 'offline' | 'error' | 'empty' | null;
  /** Maps jobId → employer_id */
  jobEmployerMap: Record<string, string>;
}

const initialState: DiscoverState = {
  allJobs: [],
  appliedJobIds: new Set(),
  passedJobIds: new Set(),
  savedJobIds: new Set(),
  isLoading: true,
  isScoring: false,
  errorType: null,
  jobEmployerMap: {},
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type DiscoverAction =
  | { type: 'LOAD_JOBS'; jobs: Job[]; employerMap: Record<string, string>; appliedIds: string[]; passedIds: string[] }
  | { type: 'LOAD_ERROR'; errorType: 'offline' | 'error' | 'empty' }
  | { type: 'UPDATE_SCORES'; jobs: Job[] }
  | { type: 'SET_SCORING'; value: boolean }
  | { type: 'APPLY_JOB'; jobId: string }
  | { type: 'PASS_JOB'; jobId: string }
  | { type: 'SAVE_JOB'; jobId: string }
  | { type: 'RESTORE_SAVED'; savedIds: string[] };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function discoverReducer(state: DiscoverState, action: DiscoverAction): DiscoverState {
  switch (action.type) {
    case 'LOAD_JOBS':
      return {
        ...state,
        allJobs: action.jobs,
        jobEmployerMap: action.employerMap,
        appliedJobIds: new Set(action.appliedIds),
        passedJobIds: new Set(action.passedIds),
        isLoading: false,
        errorType: null,
      };

    case 'UPDATE_SCORES':
      return { ...state, allJobs: action.jobs, isScoring: false };

    case 'SET_SCORING':
      return { ...state, isScoring: action.value };

    case 'LOAD_ERROR':
      return { ...state, isLoading: false, errorType: action.errorType };

    case 'APPLY_JOB': {
      const next = new Set(state.appliedJobIds);
      next.add(action.jobId);
      return { ...state, appliedJobIds: next };
    }

    case 'PASS_JOB': {
      const next = new Set(state.passedJobIds);
      next.add(action.jobId);
      return { ...state, passedJobIds: next };
    }

    case 'SAVE_JOB': {
      const next = new Set(state.savedJobIds);
      if (next.has(action.jobId)) next.delete(action.jobId);
      else next.add(action.jobId);
      return { ...state, savedJobIds: next };
    }

    case 'RESTORE_SAVED':
      return { ...state, savedJobIds: new Set(action.savedIds) };

    default:
      return state;
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const SAVED_KEY = '@talent_logic_saved_jobs_v2';

// ─── Context ──────────────────────────────────────────────────────────────────

interface DiscoverContextValue {
  state: DiscoverState;
  /** Jobs that haven't been applied to or passed on — the live feed */
  feedJobs: Job[];
  currentJob: Job | null;
  isJobApplied: (id: string) => boolean;
  isJobSaved: (id: string) => boolean;
  applyToJob: (jobId: string) => Promise<void>;
  passJob: (jobId: string) => void;
  saveJob: (jobId: string) => void;
  reload: () => void;
  /** Legacy compat */
  dispatch: React.Dispatch<DiscoverAction>;
}

const DiscoverContext = createContext<DiscoverContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DiscoverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(discoverReducer, initialState);
  const { user } = useAuth();

  /**
   * Load pipeline: fetch jobs + candidate state in one batch.
   * Filter out already-acted-on jobs so the feed is always correct.
   */
  const loadJobs = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch everything in parallel
      const [rows, skills, prefs, profileJson, appliedIds, passedIds] = await Promise.all([
        getActiveJobPostings().catch(() => [] as JobPostingRow[]),
        getSkills(user.id).catch(() => [] as string[]),
        getPreferences(user.id).catch(() => null),
        getCandidateProfileData(user.id).catch(() => null),
        getAppliedJobIds(user.id).catch(() => [] as string[]),
        getPassedJobIds(user.id).catch(() => [] as string[]),
      ]);

      if (rows.length === 0) {
        dispatch({ type: 'LOAD_ERROR', errorType: 'empty' });
        return;
      }

      const employerMap: Record<string, string> = {};
      rows.forEach((r) => { employerMap[r.id] = r.employer_id; });

      // Show all jobs immediately with neutral scores
      const neutralJobs = rows.map(rowToNeutralJob);
      dispatch({ type: 'LOAD_JOBS', jobs: neutralJobs, employerMap, appliedIds, passedIds });

      // Score jobs with Groq if we have any candidate data
      if (skills.length > 0 || profileJson) {
        const candidate = buildCandidateProfile(skills, profileJson);
        dispatch({ type: 'SET_SCORING', value: true });

        const scoredJobs = await Promise.all(
          neutralJobs.map((job, i) =>
            new Promise<Job>((resolve) =>
              setTimeout(async () => {
                const result = await groqScoreMatch(
                  candidate,
                  {
                    roleTitle: job.roleTitle,
                    skills: job.skills,
                    description: job.description,
                    workModel: job.workModel,
                    employmentType: job.employmentType,
                  },
                  `${job.id}::${user.id}`,
                ).catch(() => ({ score: 55, reasons: [], gaps: [], label: '' }));
                resolve({ ...job, matchScore: result.score });
              }, i * 200)
            )
          )
        );

        dispatch({ type: 'UPDATE_SCORES', jobs: scoredJobs });
      }

    } catch (e: any) {
      console.warn('Failed to load jobs:', e);
      const isOffline = e?.message?.toLowerCase().includes('network') ||
        e?.message?.toLowerCase().includes('fetch') ||
        e?.message?.toLowerCase().includes('offline');
      dispatch({ type: 'LOAD_ERROR', errorType: isOffline ? 'offline' : 'error' });
    }
  }, [user]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Restore locally-saved jobs on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVED_KEY);
        const savedIds: string[] = raw ? JSON.parse(raw) : [];
        if (savedIds.length) dispatch({ type: 'RESTORE_SAVED', savedIds });
      } catch {}
    })();
  }, []);

  // Persist saved jobs whenever they change
  useEffect(() => {
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...state.savedJobIds])).catch(() => {});
  }, [state.savedJobIds]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const applyToJob = useCallback(async (jobId: string) => {
    if (!user) return;
    // Optimistic update immediately
    dispatch({ type: 'APPLY_JOB', jobId });
    // Persist to Supabase
    const employerId = state.jobEmployerMap[jobId];
    if (employerId) {
      try {
        await createApplication(jobId, user.id, employerId);
      } catch (e: any) {
        if (!e?.message?.includes('duplicate') && !e?.message?.includes('unique')) {
          console.warn('Failed to persist application:', e);
        }
      }
    }
  }, [user, state.jobEmployerMap]);

  const passJob = useCallback((jobId: string) => {
    dispatch({ type: 'PASS_JOB', jobId });
    // Persist pass to Supabase asynchronously (best-effort)
    if (user) {
      recordPassedJob(user.id, jobId).catch(() => {});
    }
  }, [user]);

  const saveJob = useCallback((jobId: string) => {
    dispatch({ type: 'SAVE_JOB', jobId });
  }, []);

  // ── Derived feed ──────────────────────────────────────────────────────────

  // Feed = all jobs minus applied and passed ones
  const feedJobs = state.allJobs.filter(
    (j) => !state.appliedJobIds.has(j.id) && !state.passedJobIds.has(j.id)
  );
  const currentJob = feedJobs.length > 0 ? feedJobs[0] : null;

  const isJobApplied = (id: string) => state.appliedJobIds.has(id);
  const isJobSaved = (id: string) => state.savedJobIds.has(id);

  return (
    <DiscoverContext.Provider
      value={{
        state,
        feedJobs,
        currentJob,
        isJobApplied,
        isJobSaved,
        applyToJob,
        passJob,
        saveJob,
        reload: loadJobs,
        dispatch,
      }}
    >
      {children}
    </DiscoverContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDiscover(): DiscoverContextValue {
  const ctx = useContext(DiscoverContext);
  if (!ctx) throw new Error('useDiscover must be used within <DiscoverProvider>');
  return ctx;
}
