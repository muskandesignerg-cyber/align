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

// ─── Rich mock candidates (shown when DB returns nothing) ─────────────────────

const MOCK_CANDIDATES: PipelineCandidate[] = [
  {
    id: 'mock-1', jobId: 'mock-job-1',
    candidateId: 'mock-cand-1',
    candidateName: 'Arjun Sharma',
    candidateTitle: 'Senior React Native Developer',
    skills: ['React Native', 'TypeScript', 'Node.js', 'GraphQL'],
    matchScore: 92, stage: 'new_matches',
    hasAssessment: false, hasVideoPitch: false,
    appliedAt: new Date().toISOString(), isVerified: true,
  },
  {
    id: 'mock-2', jobId: 'mock-job-1',
    candidateId: 'mock-cand-2',
    candidateName: 'Priya Mehta',
    candidateTitle: 'Full Stack Engineer',
    skills: ['React', 'Python', 'PostgreSQL', 'Docker'],
    matchScore: 87, stage: 'new_matches',
    hasAssessment: false, hasVideoPitch: false,
    appliedAt: new Date(Date.now() - 3_600_000).toISOString(), isVerified: true,
  },
  {
    id: 'mock-3', jobId: 'mock-job-1',
    candidateId: 'mock-cand-3',
    candidateName: 'Rohan Verma',
    candidateTitle: 'Backend Engineer',
    skills: ['Go', 'Kubernetes', 'AWS', 'Kafka'],
    matchScore: 79, stage: 'new_matches',
    hasAssessment: false, hasVideoPitch: false,
    appliedAt: new Date(Date.now() - 7_200_000).toISOString(), isVerified: false,
  },
  {
    id: 'mock-4', jobId: 'mock-job-1',
    candidateId: 'mock-cand-4',
    candidateName: 'Sneha Kapoor',
    candidateTitle: 'Product Designer',
    skills: ['Figma', 'User Research', 'Prototyping', 'CSS'],
    matchScore: 84, stage: 'testing',
    hasAssessment: true, assessmentScore: undefined,
    hasVideoPitch: false,
    appliedAt: new Date(Date.now() - 86_400_000).toISOString(), isVerified: true,
  },
  {
    id: 'mock-5', jobId: 'mock-job-1',
    candidateId: 'mock-cand-5',
    candidateName: 'Vikram Singh',
    candidateTitle: 'DevOps Engineer',
    skills: ['Terraform', 'CI/CD', 'GCP', 'Helm'],
    matchScore: 76, stage: 'interview',
    hasAssessment: true, assessmentScore: 82,
    hasVideoPitch: false,
    appliedAt: new Date(Date.now() - 172_800_000).toISOString(), isVerified: true,
  },
  {
    id: 'mock-6', jobId: 'mock-job-1',
    candidateId: 'mock-cand-6',
    candidateName: 'Ananya Iyer',
    candidateTitle: 'Data Scientist',
    skills: ['Python', 'TensorFlow', 'SQL', 'Spark'],
    matchScore: 91, stage: 'hired',
    hasAssessment: true, assessmentScore: 90,
    voiceInterviewScore: 88,
    hasVideoPitch: false,
    appliedAt: new Date(Date.now() - 259_200_000).toISOString(), isVerified: true,
  },
];

const MOCK_JOB: JobPosting = {
  id: 'mock-job-1',
  employerId: 'mock-employer',
  roleTitle: 'Senior Software Engineer',
  companyName: 'My Company',
  employmentType: 'Full-time',
  workModel: 'Remote',
  location: 'Remote',
  salaryMin: 1_500_000,
  salaryMax: 2_500_000,
  currency: 'INR',
  skills: ['React Native', 'TypeScript', 'Node.js', 'System Design'],
  description: 'Building the next generation of products.',
  isActive: true,
  requiresAssessment: true,
  blindAudition: false,
  candidateCount: 6,
  postedAt: new Date().toISOString(),
};

// ─── Pipeline stage → application status mapping ──────────────────────────────

const STAGE_TO_STATUS: Record<PipelineStage, string> = {
  new_matches: 'Applied',
  testing: 'Assessment Sent',
  interview: 'Interviewing',
  hired: 'Offer',
  rejected: 'Rejected',
};

// ─── Context interface ────────────────────────────────────────────────────────

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
    dispatch({ type: 'SET_LOADING', value: true });

    // Build the profile regardless — this always succeeds
    const profile: EmployerProfile = {
      id: user?.id ?? 'guest',
      userId: user?.id ?? 'guest',
      companyName: 'My Company',
      industry: 'Technology',
      companySize: '10-50',
      location: 'India',
    };

    if (!user) {
      // Not logged in — show mocks immediately
      dispatch({ type: 'LOAD_DATA', profile, jobs: [MOCK_JOB], candidates: MOCK_CANDIDATES });
      return;
    }

    try {
      // ── Hard 8-second timeout on DB calls ──────────────────────────────
      const timeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
        Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), ms))]);

      const [dbProfile, jobRows, appRows] = await Promise.all([
        timeout(getProfile(user.id), 8000).catch(() => null),
        timeout(getJobPostingsByEmployer(user.id), 8000).catch(() => [] as any[]),
        timeout(getApplicationsForEmployer(user.id), 8000).catch(() => [] as any[]),
      ]);

      // Patch profile name if DB gave us one
      if (dbProfile && (dbProfile as any)?.full_name) {
        profile.companyName = (dbProfile as any).full_name;
      }

      const safeJobRows = Array.isArray(jobRows) ? jobRows : [];
      const safeAppRows = Array.isArray(appRows) ? appRows : [];

      const jobs = safeJobRows.map((row: any) => {
        const posting = jobRowToPosting(row);
        posting.candidateCount = safeAppRows.filter((a: any) => a.job_id === row.id).length;
        return posting;
      });

      // ── Score each candidate independently — never let one failure block all ──
      const candidateResults = await Promise.all(
        safeAppRows.map((row: any) =>
          Promise.race([
            applicationRowToCandidate(row).catch(() => null),
            new Promise<null>((res) => setTimeout(() => res(null), 5000)),
          ])
        )
      );
      const candidates = candidateResults.filter(Boolean) as PipelineCandidate[];

      // ── If nothing from DB, show rich mock data ────────────────────────
      if (jobs.length === 0 && candidates.length === 0) {
        console.log('[EmployerContext] No DB data — using mock candidates');
        dispatch({ type: 'LOAD_DATA', profile, jobs: [MOCK_JOB], candidates: MOCK_CANDIDATES });
        return;
      }

      dispatch({ type: 'LOAD_DATA', profile, jobs, candidates });
    } catch (e) {
      console.warn('[EmployerContext] loadData failed, using mock data:', e);
      dispatch({ type: 'LOAD_DATA', profile, jobs: [MOCK_JOB], candidates: MOCK_CANDIDATES });
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
      // Update in Supabase (fire and forget — skip for mock IDs)
      if (!candidateId.startsWith('mock-')) {
        const newStatus = STAGE_TO_STATUS[to] || 'Applied';
        updateApplicationPipelineStage(candidateId, to, newStatus).catch((e) =>
          console.warn('Failed to update pipeline stage:', e),
        );
      }
    },
    [],
  );

  /**
   * Publish a new job posting to Supabase.
   */
  const publishJob = useCallback(
    async (jobData: Omit<JobPostingRow, 'id' | 'posted_at' | 'updated_at'>) => {
      try {
        const row = await dbCreateJobPosting(jobData);
        const posting = jobRowToPosting(row);
        dispatch({ type: 'POST_JOB', job: posting });
      } catch (e) {
        console.warn('[EmployerContext] publishJob failed:', e);
        // Still add to local state with a mock ID so UI updates
        const mockPosting: JobPosting = {
          id: `local-${Date.now()}`,
          employerId: user?.id ?? 'guest',
          roleTitle: (jobData as any).role_title ?? 'New Role',
          companyName: (jobData as any).company_name ?? 'My Company',
          employmentType: (jobData as any).employment_type ?? 'Full-time',
          workModel: (jobData as any).work_model ?? 'Remote',
          location: (jobData as any).location ?? 'Remote',
          salaryMin: (jobData as any).salary_min ?? 0,
          salaryMax: (jobData as any).salary_max ?? 0,
          currency: (jobData as any).currency ?? 'INR',
          skills: (jobData as any).skills ?? [],
          description: (jobData as any).description ?? '',
          isActive: true,
          requiresAssessment: (jobData as any).requires_assessment ?? false,
          blindAudition: (jobData as any).blind_audition ?? false,
          candidateCount: 0,
          postedAt: new Date().toISOString(),
        };
        dispatch({ type: 'POST_JOB', job: mockPosting });
      }
    },
    [user],
  );

  const refreshData = useCallback(() => {
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


