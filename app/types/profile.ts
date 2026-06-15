/**
 * Profile Types — full schema for AI-extracted resume data.
 * Matches the Groq extraction JSON structure.
 */

// ─── Basic Info ───────────────────────────────────────────────────────────────

export interface BasicInfo {
  fullName: string;
  professionalTitle: string;
  professionalSummary: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  portfolio: string;
  github: string;
}

// ─── Work Experience ──────────────────────────────────────────────────────────

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  description: string;
  achievements: string[];
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export type SkillCategory = 'technical' | 'soft' | 'tool' | 'language';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  yearsOfExperience: number;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  url: string;
  githubUrl: string;
}

// ─── Education ────────────────────────────────────────────────────────────────

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
}

// ─── Certifications ───────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialUrl: string;
}

// ─── Languages ────────────────────────────────────────────────────────────────

export type LanguageProficiency = 'native' | 'fluent' | 'professional' | 'basic';

export interface Language {
  name: string;
  proficiency: LanguageProficiency;
}

// ─── Full Profile Data ────────────────────────────────────────────────────────

export interface ProfileData {
  basicInfo: BasicInfo;
  workExperience: WorkExperience[];
  skills: Skill[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  extraContext: string;
}

// ─── Extraction Status ────────────────────────────────────────────────────────

export type ExtractionStatus = 'idle' | 'reading' | 'extracting' | 'done' | 'error';

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const EMPTY_BASIC_INFO: BasicInfo = {
  fullName: '',
  professionalTitle: '',
  professionalSummary: '',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  portfolio: '',
  github: '',
};

export const EMPTY_PROFILE_DATA: ProfileData = {
  basicInfo: { ...EMPTY_BASIC_INFO },
  workExperience: [],
  skills: [],
  projects: [],
  education: [],
  certifications: [],
  languages: [],
  extraContext: '',
};

// ─── ID Generation ────────────────────────────────────────────────────────────

export const generateId = (): string =>
  `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
