/**
 * ProfileBuilderContext — React Context + useReducer for profile builder state.
 *
 * Manages extraction status, profile data, expanded cards,
 * manual-edit tracking, and AI badge visibility.
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  type ExtractionStatus,
  type ProfileData,
  type BasicInfo,
  type WorkExperience,
  type Skill,
  type Project,
  type Education,
  type Certification,
  EMPTY_PROFILE_DATA,
} from '../types/profile';

// ─── State ────────────────────────────────────────────────────────────────────

export interface ProfileBuilderState {
  extractionStatus: ExtractionStatus;
  profileData: ProfileData;
  expandedCards: string[];
  hasManualEdits: boolean;
  showAiBadges: boolean;
}

const initialState: ProfileBuilderState = {
  extractionStatus: 'idle',
  profileData: { ...EMPTY_PROFILE_DATA },
  expandedCards: [],
  hasManualEdits: false,
  showAiBadges: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type ProfileBuilderAction =
  | { type: 'SET_EXTRACTION_STATUS'; status: ExtractionStatus }
  | { type: 'SET_PROFILE_DATA'; data: ProfileData }
  | { type: 'UPDATE_BASIC_INFO'; field: keyof BasicInfo; value: string }
  | { type: 'ADD_EXPERIENCE'; experience: WorkExperience }
  | { type: 'UPDATE_EXPERIENCE'; id: string; updates: Partial<WorkExperience> }
  | { type: 'DELETE_EXPERIENCE'; id: string }
  | { type: 'ADD_SKILL'; skill: Skill }
  | { type: 'DELETE_SKILL'; id: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; id: string; updates: Partial<Project> }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_EDUCATION'; education: Education }
  | { type: 'UPDATE_EDUCATION'; id: string; updates: Partial<Education> }
  | { type: 'DELETE_EDUCATION'; id: string }
  | { type: 'ADD_CERTIFICATION'; certification: Certification }
  | { type: 'UPDATE_CERTIFICATION'; id: string; updates: Partial<Certification> }
  | { type: 'DELETE_CERTIFICATION'; id: string }
  | { type: 'UPDATE_EXTRA_CONTEXT'; value: string }
  | { type: 'TOGGLE_CARD_EXPAND'; id: string }
  | { type: 'HIDE_AI_BADGES' }
  | { type: 'RESET_PROFILE' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function profileBuilderReducer(
  state: ProfileBuilderState,
  action: ProfileBuilderAction,
): ProfileBuilderState {
  switch (action.type) {
    // ── Extraction ──────────────────────────────────────────────────────
    case 'SET_EXTRACTION_STATUS':
      return { ...state, extractionStatus: action.status };

    case 'SET_PROFILE_DATA':
      return {
        ...state,
        profileData: action.data,
        extractionStatus: 'done',
        showAiBadges: true,
      };

    // ── Basic Info ──────────────────────────────────────────────────────
    case 'UPDATE_BASIC_INFO':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          basicInfo: {
            ...state.profileData.basicInfo,
            [action.field]: action.value,
          },
        },
      };

    // ── Work Experience ────────────────────────────────────────────────
    case 'ADD_EXPERIENCE':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          workExperience: [...state.profileData.workExperience, action.experience],
        },
      };

    case 'UPDATE_EXPERIENCE':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          workExperience: state.profileData.workExperience.map((exp) =>
            exp.id === action.id ? { ...exp, ...action.updates } : exp,
          ),
        },
      };

    case 'DELETE_EXPERIENCE':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          workExperience: state.profileData.workExperience.filter(
            (exp) => exp.id !== action.id,
          ),
        },
      };

    // ── Skills ──────────────────────────────────────────────────────────
    case 'ADD_SKILL':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          skills: [...state.profileData.skills, action.skill],
        },
      };

    case 'DELETE_SKILL':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          skills: state.profileData.skills.filter((s) => s.id !== action.id),
        },
      };

    // ── Projects ────────────────────────────────────────────────────────
    case 'ADD_PROJECT':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          projects: [...state.profileData.projects, action.project],
        },
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          projects: state.profileData.projects.map((p) =>
            p.id === action.id ? { ...p, ...action.updates } : p,
          ),
        },
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          projects: state.profileData.projects.filter((p) => p.id !== action.id),
        },
      };

    // ── Education ───────────────────────────────────────────────────────
    case 'ADD_EDUCATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          education: [...state.profileData.education, action.education],
        },
      };

    case 'UPDATE_EDUCATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          education: state.profileData.education.map((e) =>
            e.id === action.id ? { ...e, ...action.updates } : e,
          ),
        },
      };

    case 'DELETE_EDUCATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          education: state.profileData.education.filter((e) => e.id !== action.id),
        },
      };

    // ── Certifications ──────────────────────────────────────────────────
    case 'ADD_CERTIFICATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          certifications: [...state.profileData.certifications, action.certification],
        },
      };

    case 'UPDATE_CERTIFICATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          certifications: state.profileData.certifications.map((c) =>
            c.id === action.id ? { ...c, ...action.updates } : c,
          ),
        },
      };

    case 'DELETE_CERTIFICATION':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          certifications: state.profileData.certifications.filter(
            (c) => c.id !== action.id,
          ),
        },
      };

    // ── Extra Context ───────────────────────────────────────────────────
    case 'UPDATE_EXTRA_CONTEXT':
      return {
        ...state,
        hasManualEdits: true,
        profileData: {
          ...state.profileData,
          extraContext: action.value,
        },
      };

    // ── UI State ────────────────────────────────────────────────────────
    case 'TOGGLE_CARD_EXPAND':
      return {
        ...state,
        expandedCards: state.expandedCards.includes(action.id)
          ? state.expandedCards.filter((id) => id !== action.id)
          : [...state.expandedCards, action.id],
      };

    case 'HIDE_AI_BADGES':
      return { ...state, showAiBadges: false };

    case 'RESET_PROFILE':
      return {
        ...initialState,
        profileData: { ...EMPTY_PROFILE_DATA },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ProfileBuilderContextValue {
  state: ProfileBuilderState;
  dispatch: React.Dispatch<ProfileBuilderAction>;
}

const ProfileBuilderContext = createContext<ProfileBuilderContextValue | undefined>(
  undefined,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProfileBuilderProviderProps {
  children: ReactNode;
}

export const ProfileBuilderProvider: React.FC<ProfileBuilderProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(profileBuilderReducer, initialState);

  return (
    <ProfileBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </ProfileBuilderContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileBuilder(): ProfileBuilderContextValue {
  const context = useContext(ProfileBuilderContext);
  if (!context) {
    throw new Error(
      'useProfileBuilder must be used within a <ProfileBuilderProvider>',
    );
  }
  return context;
}
