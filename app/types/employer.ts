/**
 * Employer-side TypeScript interfaces — Phase 5
 */

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  companyLogo?: string;
  industry: string;
  companySize: string;
  location: string;
}

export interface JobPosting {
  id: string;
  employerId: string;
  roleTitle: string;
  companyName: string;
  employmentType: string;
  workModel: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  skills: string[];
  description: string;
  isActive: boolean;
  requiresAssessment: boolean;
  blindAudition: boolean;
  candidateCount: number;
  postedAt: string;
}

export type PipelineStage =
  | 'new_matches'
  | 'testing'
  | 'interview'
  | 'hired'
  | 'rejected';

export interface PipelineCandidate {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string;
  avatarUrl?: string;
  skills: string[];
  matchScore: number;
  stage: PipelineStage;
  hasAssessment: boolean;
  assessmentScore?: number;
  voiceInterviewScore?: number;
  hasVideoPitch: boolean;
  appliedAt: string;
  isVerified: boolean;
}

export interface Pipeline {
  new_matches: PipelineCandidate[];
  testing: PipelineCandidate[];
  interview: PipelineCandidate[];
  hired: PipelineCandidate[];
  rejected: PipelineCandidate[];
}

export interface MessageThread {
  id: string;
  candidateName: string;
  candidateTitle: string;
  appliedFor: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isVerified: boolean;
}
