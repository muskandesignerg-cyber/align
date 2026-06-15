/**
 * Assessment & AI Interview types for Align's hiring pipeline.
 * Round 2 = Technical MCQ Assessment
 * Round 3 = AI Voice Interview
 */

// ─── Round 2: MCQ Assessment ──────────────────────────────────────────────────

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
  topic?: string;
}

export interface Assessment {
  id: string;
  jobId: string;
  candidateId: string;
  companyName: string;
  roleTitle: string;
  skills: string[];
  questions: AssessmentQuestion[];
  timeLimit: number; // minutes
  passingScore: number; // 0-100
  createdAt: string;
  createdBy: 'ai' | 'manual';
}

export interface AssessmentAttempt {
  assessmentId: string;
  candidateId: string;
  answers: (number | null)[]; // index into options, null = skipped
  score: number; // 0-100
  passed: boolean;
  timeTaken: number; // seconds
  completedAt: string;
}

// ─── Round 3: AI Voice Interview ──────────────────────────────────────────────

export type InterviewFocus = 'Technical' | 'Behavioural' | 'Full Round';

export interface InterviewQuestion {
  id: string;
  text: string;
  followUp?: string;
  topic: string;
}

export interface InterviewSession {
  id: string;
  jobId: string;
  candidateId: string;
  companyName: string;
  roleTitle: string;
  focus: InterviewFocus;
  questions: InterviewQuestion[];
  timeLimit: number; // minutes
  passingScore: number; // employer-set threshold 0-100
  createdAt: string;
}

export interface InterviewAnswer {
  questionId: string;
  transcript: string;
  durationSeconds: number;
}

export interface InterviewScore {
  overall: number; // 0-100
  technicalAccuracy: number;
  communicationClarity: number;
  confidence: number;
  structure: number;
  strengths: string[];
  areasToImprove: string[];
  verdict: string; // short summary sentence
}

export interface InterviewResult {
  sessionId: string;
  answers: InterviewAnswer[];
  score: InterviewScore;
  passed: boolean;
  completedAt: string;
}

// ─── Pipeline Stage ───────────────────────────────────────────────────────────

export type HiringRound = 'applied' | 'review' | 'assessment' | 'interview' | 'final' | 'rejected';

export interface CandidatePipelineEntry {
  candidateId: string;
  candidateName: string;
  jobId: string;
  roleTitle: string;
  companyName: string;
  round: HiringRound;
  assessmentScore?: number;
  interviewScore?: number;
  updatedAt: string;
}
