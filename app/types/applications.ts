/**
 * Application types for the Dashboard.
 */

export type ApplicationStatus =
  | 'Applied'
  | 'In Review'
  | 'Assessment Sent'
  | 'Interviewing'
  | 'Offer'
  | 'Rejected';

export interface TimelineEvent {
  id: string;
  type: 'applied' | 'viewed' | 'assessment' | 'interview' | 'offer' | 'rejected';
  label: string;
  date: string;
  isCompleted: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  companyName: string;
  companyLogo?: string;
  roleTitle: string;
  location: string;
  workModel: 'Remote' | 'Hybrid' | 'On-site';
  skills: string[];
  status: ApplicationStatus;
  appliedAt: string;
  lastUpdatedAt: string;
  hasAssessment: boolean;
  assessmentCompany?: string;
  timeline: TimelineEvent[];
}

export interface DashboardStats {
  applied: number;
  inReview: number;
  interviewing: number;
  offer: number;
  rejected: number;
}

/** Map status to number of filled progress dots (out of 4) */
export function getProgressForStatus(status: ApplicationStatus): number {
  switch (status) {
    case 'Applied':
      return 1;
    case 'In Review':
    case 'Assessment Sent':
      return 2;
    case 'Interviewing':
      return 3;
    case 'Offer':
      return 4;
    case 'Rejected':
      return -1; // special: all dots red
    default:
      return 0;
  }
}

/** Status badge color config */
export function getStatusColors(status: ApplicationStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'Assessment Sent':
      return { bg: '#FFF3E0', text: '#F57C00', border: 'rgba(245,124,0,0.3)' };
    case 'In Review':
      return { bg: '#F3F4FF', text: '#6B7280', border: 'rgba(107,114,128,0.3)' };
    case 'Interviewing':
      return { bg: '#EEF0FF', text: '#4C59D7', border: 'rgba(76,89,215,0.3)' };
    case 'Applied':
      return { bg: '#F4F6FF', text: '#6B7280', border: 'rgba(107,114,128,0.3)' };
    case 'Offer':
      return { bg: '#4C59D7', text: '#FFFFFF', border: '#4C59D7' };
    case 'Rejected':
      return { bg: '#FFF0F0', text: '#EF4444', border: 'rgba(239,68,68,0.3)' };
    default:
      return { bg: '#F4F6FF', text: '#6B7280', border: 'rgba(107,114,128,0.3)' };
  }
}
