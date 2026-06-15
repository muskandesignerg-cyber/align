/**
 * Job types for the Discover feed.
 */

export interface Job {
  id: string;
  companyName: string;
  companyLogo?: string;
  roleTitle: string;
  employmentType: 'FULL TIME' | 'PART TIME' | 'CONTRACT' | 'REMOTE';
  location: string;
  workModel: 'Remote' | 'Hybrid' | 'On-site';
  salaryMin: number;
  salaryMax: number;
  currency: 'USD' | 'INR' | 'GBP';
  skills: string[];
  description: string;
  matchScore: number;
  isNew: boolean;
  postedAt: string;
  companySize?: string;
  industry?: string;
  companyDescription?: string;
}

export type SwipeAction = 'apply' | 'pass' | 'save' | 'super_apply';
