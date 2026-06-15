import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// ─── State shape ──────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface Step1State {
  jobTitle: string;
  department: string | null;
  employmentType: 'Full Time' | 'Part Time' | 'Contract';
  workModel: 'Remote' | 'Hybrid' | 'On-site';
  officeLocation: string;
  salaryMin: number;
  salaryMax: number;
  aiSuggestionsLoading: boolean;
}

interface Step2State {
  requiredSkills: string[];
  niceToHaveSkills: string[];
  yearsOfExperience: number;
  description: string;
  isGeneratingDescription: boolean;
  skillSearchQuery: string;
  showSkillDropdown: boolean;
  niceSearchQuery: string;
  showNiceDropdown: boolean;
}

interface Step3State {
  blindAuditionMode: boolean;
  requireAssessment: boolean;
  isPublishing: boolean;
}

interface PostRoleState {
  currentStep: Step;
  step1: Step1State;
  step2: Step2State;
  step3: Step3State;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: PostRoleState = {
  currentStep: 1,
  step1: {
    jobTitle: '',
    department: null,
    employmentType: 'Full Time',
    workModel: 'Hybrid',
    officeLocation: '',
    salaryMin: 12,
    salaryMax: 24,
    aiSuggestionsLoading: false,
  },
  step2: {
    requiredSkills: [],
    niceToHaveSkills: [],
    yearsOfExperience: 3,
    description: '',
    isGeneratingDescription: false,
    skillSearchQuery: '',
    showSkillDropdown: false,
    niceSearchQuery: '',
    showNiceDropdown: false,
  },
  step3: {
    blindAuditionMode: true,
    requireAssessment: false,
    isPublishing: false,
  },
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type PostRoleAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'UPDATE_STEP1'; partial: Partial<Step1State> }
  | { type: 'UPDATE_STEP2'; partial: Partial<Step2State> }
  | { type: 'UPDATE_STEP3'; partial: Partial<Step3State> }
  | { type: 'ADD_REQUIRED_SKILL'; skill: string }
  | { type: 'REMOVE_REQUIRED_SKILL'; skill: string }
  | { type: 'ADD_NICE_TO_HAVE_SKILL'; skill: string }
  | { type: 'REMOVE_NICE_TO_HAVE_SKILL'; skill: string }
  | { type: 'INCREMENT_EXPERIENCE' }
  | { type: 'DECREMENT_EXPERIENCE' }
  | { type: 'SET_GENERATING_DESCRIPTION'; value: boolean }
  | { type: 'SET_AI_LOADING'; value: boolean }
  | { type: 'SET_PUBLISHING'; value: boolean }
  | { type: 'RESET_FORM' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function postRoleReducer(state: PostRoleState, action: PostRoleAction): PostRoleState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };

    case 'UPDATE_STEP1':
      return { ...state, step1: { ...state.step1, ...action.partial } };

    case 'UPDATE_STEP2':
      return { ...state, step2: { ...state.step2, ...action.partial } };

    case 'UPDATE_STEP3':
      return { ...state, step3: { ...state.step3, ...action.partial } };

    case 'ADD_REQUIRED_SKILL': {
      if (state.step2.requiredSkills.includes(action.skill)) return state;
      return { ...state, step2: { ...state.step2, requiredSkills: [...state.step2.requiredSkills, action.skill] } };
    }
    case 'REMOVE_REQUIRED_SKILL':
      return { ...state, step2: { ...state.step2, requiredSkills: state.step2.requiredSkills.filter((s) => s !== action.skill) } };

    case 'ADD_NICE_TO_HAVE_SKILL': {
      if (state.step2.niceToHaveSkills.includes(action.skill)) return state;
      return { ...state, step2: { ...state.step2, niceToHaveSkills: [...state.step2.niceToHaveSkills, action.skill] } };
    }
    case 'REMOVE_NICE_TO_HAVE_SKILL':
      return { ...state, step2: { ...state.step2, niceToHaveSkills: state.step2.niceToHaveSkills.filter((s) => s !== action.skill) } };

    case 'INCREMENT_EXPERIENCE':
      return { ...state, step2: { ...state.step2, yearsOfExperience: Math.min(state.step2.yearsOfExperience + 1, 15) } };

    case 'DECREMENT_EXPERIENCE':
      return { ...state, step2: { ...state.step2, yearsOfExperience: Math.max(state.step2.yearsOfExperience - 1, 0) } };

    case 'SET_GENERATING_DESCRIPTION':
      return { ...state, step2: { ...state.step2, isGeneratingDescription: action.value } };

    case 'SET_AI_LOADING':
      return { ...state, step1: { ...state.step1, aiSuggestionsLoading: action.value } };

    case 'SET_PUBLISHING':
      return { ...state, step3: { ...state.step3, isPublishing: action.value } };

    case 'RESET_FORM':
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface PostRoleContextValue {
  state: PostRoleState;
  dispatch: React.Dispatch<PostRoleAction>;
}

const PostRoleContext = createContext<PostRoleContextValue | undefined>(undefined);

export const PostRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(postRoleReducer, INITIAL_STATE);
  return <PostRoleContext.Provider value={{ state, dispatch }}>{children}</PostRoleContext.Provider>;
};

export function usePostRole(): PostRoleContextValue {
  const ctx = useContext(PostRoleContext);
  if (!ctx) throw new Error('usePostRole must be used within <PostRoleProvider>');
  return ctx;
}
