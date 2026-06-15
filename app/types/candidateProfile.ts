/**
 * Profile types for Phase 4 — Candidate Profile Screen.
 */

export type VerificationMethod = 'challenge' | 'github' | 'peer';

export type Platform =
  | 'github'
  | 'portfolio'
  | 'dribbble'
  | 'behance'
  | 'linkedin'
  | 'notion'
  | 'youtube'
  | 'other';

export interface VerifiedSkill {
  id: string;
  name: string;
  isVerified: boolean;
  verificationMethod?: VerificationMethod;
  score?: number; // 0-100
}

export interface RadarSkill {
  axis: string;
  value: number; // 0-100
}

export interface Experience {
  id: string;
  roleTitle: string;
  company: string;
  startDate: string;
  endDate: string | 'Present';
  description: string;
  isCurrentRole: boolean;
}

export interface LinkedWork {
  id: string;
  platform: Platform;
  label: string;
  url: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  professionalTitle: string;
  tagline: string;
  location: string;
  avatarUrl?: string;
  isOpenToWork: boolean;
  avgMatchScore: number;
  verifiedSkills: VerifiedSkill[];
  radarChartData: RadarSkill[];
  experience: Experience[];
  linkedWork: LinkedWork[];
  stats: {
    verifiedSkillCount: number;
    avgMatchScore: number;
    totalApplications: number;
    totalInterviews: number;
  };
}

export type ActiveSheet = 'none' | 'addSkill' | 'editProfile' | 'addWork';
