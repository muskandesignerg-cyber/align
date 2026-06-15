import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import {
  CandidateProfile,
  VerifiedSkill,
  Experience,
  LinkedWork,
  ActiveSheet,
} from '../types/candidateProfile';
import { getCandidateProfileData, getProfile, getSkills } from '../lib/database';
import { useAuth } from './AuthContext';

// ─── State ────────────────────────────────────────────────────────────────────

interface ProfileState {
  profile: CandidateProfile | null;
  isLoading: boolean;
  isEditing: boolean;
  activeSheet: ActiveSheet;
  selectedSkillForVerify: string | null;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: true,
  isEditing: false,
  activeSheet: 'none',
  selectedSkillForVerify: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type ProfileAction =
  | { type: 'LOAD_PROFILE'; profile: CandidateProfile }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'UPDATE_PROFILE'; partial: Partial<CandidateProfile> }
  | { type: 'ADD_SKILL'; skill: VerifiedSkill }
  | { type: 'REMOVE_SKILL'; skillId: string }
  | { type: 'TOGGLE_OPEN_TO_WORK' }
  | { type: 'ADD_EXPERIENCE'; exp: Experience }
  | { type: 'UPDATE_EXPERIENCE'; id: string; partial: Partial<Experience> }
  | { type: 'DELETE_EXPERIENCE'; id: string }
  | { type: 'ADD_LINKED_WORK'; work: LinkedWork }
  | { type: 'REMOVE_LINKED_WORK'; id: string }
  | { type: 'SET_ACTIVE_SHEET'; sheet: ActiveSheet }
  | { type: 'SET_SELECTED_SKILL'; name: string | null }
  | { type: 'SET_EDITING'; value: boolean };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'LOAD_PROFILE':
      return { ...state, profile: action.profile, isLoading: false };

    case 'SET_LOADING':
      return { ...state, isLoading: action.value };

    case 'UPDATE_PROFILE':
      if (!state.profile) return state;
      return { ...state, profile: { ...state.profile, ...action.partial } };

    case 'ADD_SKILL': {
      if (!state.profile) return state;
      const updatedSkills = [...state.profile.verifiedSkills, action.skill];
      const verifiedCount = updatedSkills.filter((s) => s.isVerified).length;
      return {
        ...state,
        profile: {
          ...state.profile,
          verifiedSkills: updatedSkills,
          stats: {
            ...state.profile.stats,
            verifiedSkillCount: verifiedCount,
          },
        },
      };
    }

    case 'REMOVE_SKILL': {
      if (!state.profile) return state;
      const updatedSkills = state.profile.verifiedSkills.filter(
        (s) => s.id !== action.skillId,
      );
      const verifiedCount = updatedSkills.filter((s) => s.isVerified).length;
      return {
        ...state,
        profile: {
          ...state.profile,
          verifiedSkills: updatedSkills,
          stats: { ...state.profile.stats, verifiedSkillCount: verifiedCount },
        },
      };
    }

    case 'TOGGLE_OPEN_TO_WORK':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          isOpenToWork: !state.profile.isOpenToWork,
        },
      };

    case 'ADD_EXPERIENCE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: [action.exp, ...state.profile.experience],
        },
      };

    case 'UPDATE_EXPERIENCE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: state.profile.experience.map((e) =>
            e.id === action.id ? { ...e, ...action.partial } : e,
          ),
        },
      };

    case 'DELETE_EXPERIENCE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          experience: state.profile.experience.filter((e) => e.id !== action.id),
        },
      };

    case 'ADD_LINKED_WORK':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          linkedWork: [...state.profile.linkedWork, action.work],
        },
      };

    case 'REMOVE_LINKED_WORK':
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          linkedWork: state.profile.linkedWork.filter((w) => w.id !== action.id),
        },
      };

    case 'SET_ACTIVE_SHEET':
      return { ...state, activeSheet: action.sheet };

    case 'SET_SELECTED_SKILL':
      return { ...state, selectedSkillForVerify: action.name };

    case 'SET_EDITING':
      return { ...state, isEditing: action.value };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ProfileContextValue {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

// ─── Build profile from Supabase data ─────────────────────────────────────────

function buildProfileFromSupabase(
  userId: string,
  dbProfile: any,
  profileJson: any,
  skills: string[],
): CandidateProfile {
  const fullName = dbProfile?.full_name || profileJson?.basicInfo?.fullName || 'User';
  const title = profileJson?.basicInfo?.title || 'Candidate';

  // Build verified skills from both confirmed skills and profile data
  const verifiedSkills: VerifiedSkill[] = skills.map((s, i) => ({
    id: `skill_${i}`,
    name: s,
    isVerified: false,
  }));

  // Build experience from profile JSON
  const experience: Experience[] = (profileJson?.workExperience ?? []).map((exp: any, i: number) => ({
    id: exp.id || `exp_${i}`,
    roleTitle: exp.title || exp.roleTitle || '',
    company: exp.company || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || 'Present',
    description: exp.description || (exp.achievements ?? []).join('. '),
    isCurrentRole: exp.endDate === 'Present' || !exp.endDate,
  }));

  // Build radar chart from skill categories
  const radarCategories = ['Frontend', 'Backend', 'Design', 'DevOps', 'Leadership', 'Communication'];
  const radarChartData = radarCategories.map((axis) => ({
    axis,
    value: Math.floor(Math.random() * 40) + 50, // 50-90 for now
  }));

  // Build linked work from profile JSON
  const linkedWork: LinkedWork[] = (profileJson?.projects ?? []).slice(0, 2).map((proj: any, i: number) => ({
    id: proj.id || `work_${i}`,
    platform: 'github' as const,
    label: proj.name || `Project ${i + 1}`,
    url: proj.techStack?.[0] ? `https://github.com/${proj.name}` : '',
  }));

  return {
    id: `profile_${userId.slice(0, 8)}`,
    userId,
    fullName,
    professionalTitle: title,
    tagline: profileJson?.basicInfo?.tagline || `Experienced ${title}`,
    location: profileJson?.basicInfo?.location || 'India',
    avatarUrl: dbProfile?.avatar_url || undefined,
    isOpenToWork: true,
    avgMatchScore: Math.floor(Math.random() * 15) + 80,
    verifiedSkills,
    radarChartData,
    experience,
    linkedWork,
    stats: {
      verifiedSkillCount: verifiedSkills.filter((s) => s.isVerified).length,
      avgMatchScore: Math.floor(Math.random() * 15) + 80,
      totalApplications: 0,
      totalInterviews: 0,
    },
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(profileReducer, initialState);
  const { user } = useAuth();

  // Load real profile data from Supabase on mount
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_LOADING', value: false });
      return;
    }

    (async () => {
      try {
        const [dbProfile, profileJson, skills] = await Promise.all([
          getProfile(user.id),
          getCandidateProfileData(user.id),
          getSkills(user.id),
        ]);

        const candidateProfile = buildProfileFromSupabase(
          user.id,
          dbProfile,
          profileJson,
          skills,
        );

        dispatch({ type: 'LOAD_PROFILE', profile: candidateProfile });
      } catch (e) {
        console.warn('Failed to load profile:', e);
        // Build a minimal profile from auth data
        dispatch({
          type: 'LOAD_PROFILE',
          profile: {
            id: `profile_${user.id.slice(0, 8)}`,
            userId: user.id,
            fullName: user.email?.split('@')[0] || 'User',
            professionalTitle: 'Candidate',
            tagline: 'Looking for opportunities',
            location: 'India',
            isOpenToWork: true,
            avgMatchScore: 85,
            verifiedSkills: [],
            radarChartData: [],
            experience: [],
            linkedWork: [],
            stats: { verifiedSkillCount: 0, avgMatchScore: 85, totalApplications: 0, totalInterviews: 0 },
          },
        });
      }
    })();
  }, [user]);

  return (
    <ProfileContext.Provider value={{ state, dispatch }}>
      {children}
    </ProfileContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
