import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  EmployerProfile,
  JobPosting,
  PipelineCandidate,
  Pipeline,
  PipelineStage,
} from '../types/employer';
import {
  getProfile,
  getJobPostingsByEmployer,
  getApplicationsForEmployer,
  updateApplicationPipelineStage,
  createJobPosting as dbCreateJobPosting,
  getCandidateSkills,
  getCandidateProfileJson,
  type JobPostingRow,
  type ApplicationRow,
} from '../lib/database';
import { useAuth } from './AuthContext';
import { groqScoreMatch } from '../utils/groqMatcher';
import { computeEmployerMatchScore } from '../utils/matchEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jobRowToPosting(row: JobPostingRow): JobPosting {
  return {
    id: row.id,
    employerId: row.employer_id,
    roleTitle: row.role_title,
    companyName: row.company_name || 'My Company',
    employmentType: row.employment_type || 'Full Time',
    workModel: row.work_model || 'Remote',
    location: row.location || 'Remote',
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    currency: row.currency || 'INR',
    skills: row.skills ?? [],
    description: row.description || '',
    isActive: row.is_active,
    requiresAssessment: row.requires_assessment,
    blindAudition: row.blind_audition,
    candidateCount: 0,
    postedAt: row.posted_at,
  };
}

async function applicationRowToCandidate(row: ApplicationRow): Promise<PipelineCandidate> {
  const candidateProfile = row.profiles;
  const job = row.job_postings;

  // Fetch real candidate data from DB in parallel
  const [candidateSkills, profileJson] = await Promise.all([
    getCandidateSkills(row.candidate_id).catch(() => [] as string[]),
    getCandidateProfileJson(row.candidate_id).catch(() => null),
  ]);

  // Build full skills list from DB + Groq-parsed profile
  const extraSkills: string[] = [];
  if (profileJson?.skills) {
    for (const s of profileJson.skills as any[]) {
      if (s?.name) extraSkills.push(s.name);
    }
  }
  if (profileJson?.projects) {
    for (const p of profileJson.projects as any[]) {
      if (Array.isArray(p?.techStack)) extraSkills.push(...p.techStack);
    }
  }
  const allCandidateSkills = [...new Set([...candidateSkills, ...extraSkills])];

  // Get candidate title — use profile JSON, fallback to name-based guess
  const candidateTitle =
    profileJson?.basicInfo?.professionalTitle ||
    profileJson?.basicInfo?.title ||
    (allCandidateSkills.length > 0 ? 'Professional' : 'Candidate');

  // Candidate full name — profiles join gives us full_name
  const candidateName = candidateProfile?.full_name ||
    profileJson?.basicInfo?.fullName ||
    `Candidate ${row.candidate_id.slice(0, 4).toUpperCase()}`;

  // Build experience titles for domain matching
  const experienceTitles: string[] = [];
  if (profileJson?.workExperience) {
    for (const w of profileJson.workExperience as any[]) {
      if (w?.role) experienceTitles.push(w.role);
    }
  }

  // Use Groq AI scoring if we have any candidate data; otherwise use heuristic
  let matchScore = 50;
  if (job) {
    if (allCandidateSkills.length > 0 || candidateTitle !== 'Candidate') {
      try {
        const result = await groqScoreMatch(
          {
            professionalTitle: candidateTitle,
            skills: allCandidateSkills,
            experienceTitles,
            summary: profileJson?.basicInfo?.professionalSummary || '',
          },
          {
            roleTitle: job.role_title,
            skills: job.skills ?? [],
            description: job.description || '',
            workModel: job.work_model || 'Remote',
            employmentType: job.employment_type || 'Full Time',
          },
          `${row.candidate_id}::${job.id}`,
        );
        matchScore = result.score;
      } catch {
        // Groq failed — use heuristic fallback
        matchScore = computeEmployerMatchScore(
          allCandidateSkills,
          candidateTitle,
          {
            roleTitle: job.role_title,
            skills: job.skills ?? [],
            workModel: job.work_model || 'Remote',
            employmentType: job.employment_type || 'Full Time',
            description: job.description || '',
          },
        );
      }
    } else {
      // No profile data — show honest "unknown" score instead of 30
      matchScore = 52;
    }
  }

  return {
    id: row.id,
    jobId: row.job_id,
    candidateId: row.candidate_id,
    candidateName,
    candidateTitle,
    avatarUrl: candidateProfile?.avatar_url || undefined,
    skills: allCandidateSkills.slice(0, 4),
    matchScore,
    stage: (row.pipeline_stage || 'new_matches') as PipelineStage,
    hasAssessment: row.status === 'Assessment Sent',
    hasVideoPitch: false,
    appliedAt: row.applied_at,
    isVerified: candidateSkills.length > 0,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface EmployerState {
  profile: EmployerProfile | null;
  jobPostings: JobPosting[];
  selectedJobId: string | null;
  pipeline: Pipeline;
  selectedCandidate: PipelineCandidate | null;
  activeStageFilter: string;
  isLoading: boolean;
  showPostRole: boolean;
  showCandidateDetail: boolean;
}

const EMPTY_PIPELINE: Pipeline = {
  new_matches: [],
  testing: [],
  interview: [],
  hired: [],
  rejected: [],
};

function buildPipeline(candidates: PipelineCandidate[]): Pipeline {
  const p: Pipeline = { new_matches: [], testing: [], interview: [], hired: [], rejected: [] };
  candidates.forEach((c) => p[c.stage].push(c));
  return p;
}

const initialState: EmployerState = {
  profile: null,
  jobPostings: [],
  selectedJobId: null,
  pipeline: EMPTY_PIPELINE,
  selectedCandidate: null,
  activeStageFilter: 'new_matches',
  isLoading: true,
  showPostRole: false,
  showCandidateDetail: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type EmployerAction =
  | { type: 'LOAD_DATA'; profile: EmployerProfile; jobs: JobPosting[]; candidates: PipelineCandidate[] }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SELECT_JOB'; jobId: string }
  | { type: 'MOVE_CANDIDATE'; candidateId: string; fromStage: PipelineStage; toStage: PipelineStage }
  | { type: 'SELECT_CANDIDATE'; candidate: PipelineCandidate | null }
  | { type: 'SET_STAGE_FILTER'; stage: string }
  | { type: 'DISMISS_CANDIDATE'; candidateId: string }
  | { type: 'POST_JOB'; job: JobPosting }
  | { type: 'SET_SHOW_POST_ROLE'; value: boolean }
  | { type: 'SET_SHOW_CANDIDATE_DETAIL'; value: boolean };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function employerReducer(state: EmployerState, action: EmployerAction): EmployerState {
  switch (action.type) {
    case 'LOAD_DATA': {
      const pipeline = buildPipeline(action.candidates);
      const firstJob = action.jobs[0];
      return {
        ...state,
        profile: action.profile,
        jobPostings: action.jobs,
        selectedJobId: firstJob?.id ?? null,
        pipeline,
        isLoading: false,
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.value };

    case 'SELECT_JOB':
      return { ...state, selectedJobId: action.jobId };

    case 'MOVE_CANDIDATE': {
      const { candidateId, fromStage, toStage } = action;
      const fromList = state.pipeline[fromStage];
      const candidate = fromList.find((c) => c.id === candidateId);
      if (!candidate) return state;
      const updatedCandidate = { ...candidate, stage: toStage };
      return {
        ...state,
        pipeline: {
          ...state.pipeline,
          [fromStage]: fromList.filter((c) => c.id !== candidateId),
          [toStage]: [...state.pipeline[toStage], updatedCandidate],
        },
      };
    }

    case 'SELECT_CANDIDATE':
      return { ...state, selectedCandidate: action.candidate };

    case 'SET_STAGE_FILTER':
      return { ...state, activeStageFilter: action.stage };

    case 'DISMISS_CANDIDATE': {
      const stages: PipelineStage[] = ['new_matches', 'testing', 'interview', 'hired', 'rejected'];
      const newPipeline = { ...state.pipeline };
      stages.forEach((s) => {
        newPipeline[s] = state.pipeline[s].filter((c) => c.id !== action.candidateId);
      });
      return { ...state, pipeline: newPipeline };
    }

    case 'POST_JOB':
      return { ...state, jobPostings: [...state.jobPostings, action.job] };

    case 'SET_SHOW_POST_ROLE':
      return { ...state, showPostRole: action.value };

    case 'SET_SHOW_CANDIDATE_DETAIL':
      return { ...state, showCandidateDetail: action.value };

    default:
      return state;
  }
}

// ─── Pipeline stage → application status mapping ──────────────────────────────

const STAGE_TO_STATUS: Record<PipelineStage, string> = {
  new_matches: 'Applied',
  testing: 'Assessment Sent',
  interview: 'Interviewing',
  hired: 'Offer',
  rejected: 'Rejected',
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface EmployerContextValue {
  state: EmployerState;
  dispatch: React.Dispatch<EmployerAction>;
  allCandidates: PipelineCandidate[];
  stageCounts: Record<string, number>;
  moveCandidate: (candidateId: string, from: PipelineStage, to: PipelineStage) => void;
  publishJob: (jobData: Omit<JobPostingRow, 'id' | 'posted_at' | 'updated_at'>) => Promise<void>;
  refreshData: () => void;
}

const EmployerContext = createContext<EmployerContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const EmployerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(employerReducer, initialState);
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_LOADING', value: false });
      return;
    }
    try {
      const [dbProfile, jobRows, appRows] = await Promise.all([
        getProfile(user.id),
        getJobPostingsByEmployer(user.id),
        getApplicationsForEmployer(user.id),
      ]);

      const profile: EmployerProfile = {
        id: user.id,
        userId: user.id,
        companyName: dbProfile?.full_name || 'My Company',
        industry: 'Technology',
        companySize: '10-50',
        location: 'India',
      };

      const jobs = jobRows.map((row) => {
        const posting = jobRowToPosting(row);
        // Count candidates for this job
        posting.candidateCount = appRows.filter((a) => a.job_id === row.id).length;
        return posting;
      });

      // Score all candidates concurrently (each needs async DB calls)
      const candidates = await Promise.all(appRows.map(applicationRowToCandidate));

      dispatch({ type: 'LOAD_DATA', profile, jobs, candidates });
    } catch (e) {
      console.warn('Failed to load employer data:', e);
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Move candidate to a new pipeline stage — updates both local state and Supabase.
   */
  const moveCandidate = useCallback(
    (candidateId: string, from: PipelineStage, to: PipelineStage) => {
      dispatch({ type: 'MOVE_CANDIDATE', candidateId, fromStage: from, toStage: to });
      // Update in Supabase (fire and forget)
      const newStatus = STAGE_TO_STATUS[to] || 'Applied';
      updateApplicationPipelineStage(candidateId, to, newStatus).catch((e) =>
        console.warn('Failed to update pipeline stage:', e),
      );
    },
    [],
  );

  /**
   * Publish a new job posting to Supabase.
   */
  const publishJob = useCallback(
    async (jobData: Omit<JobPostingRow, 'id' | 'posted_at' | 'updated_at'>) => {
      const row = await dbCreateJobPosting(jobData);
      const posting = jobRowToPosting(row);
      dispatch({ type: 'POST_JOB', job: posting });
    },
    [],
  );

  const refreshData = useCallback(() => {
    dispatch({ type: 'SET_LOADING', value: true });
    loadData();
  }, [loadData]);

  const allCandidates: PipelineCandidate[] = [
    ...state.pipeline.new_matches,
    ...state.pipeline.testing,
    ...state.pipeline.interview,
    ...state.pipeline.hired,
    ...state.pipeline.rejected,
  ];

  const stageCounts: Record<string, number> = {
    new_matches: state.pipeline.new_matches.length,
    testing: state.pipeline.testing.length,
    interview: state.pipeline.interview.length,
    hired: state.pipeline.hired.length,
    rejected: state.pipeline.rejected.length,
  };

  return (
    <EmployerContext.Provider value={{ state, dispatch, allCandidates, stageCounts, moveCandidate, publishJob, refreshData }}>
      {children}
    </EmployerContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmployer(): EmployerContextValue {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error('useEmployer must be used within <EmployerProvider>');
  return ctx;
}
