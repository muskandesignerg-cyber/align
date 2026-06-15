import {
  EmployerProfile,
  JobPosting,
  PipelineCandidate,
  MessageThread,
} from '../types/employer';

export const MOCK_EMPLOYER: EmployerProfile = {
  id: 'emp_1',
  userId: 'user_employer_mock',
  companyName: 'TechFlow Inc.',
  industry: 'SaaS / Technology',
  companySize: '51–200 employees',
  location: 'San Francisco, CA',
};

export const MOCK_JOB_POSTING: JobPosting = {
  id: 'job_1',
  employerId: 'emp_1',
  roleTitle: 'Senior Product Designer',
  companyName: 'TechFlow Inc.',
  employmentType: 'Full Time',
  workModel: 'Hybrid',
  location: 'San Francisco, CA',
  salaryMin: 120000,
  salaryMax: 160000,
  currency: 'USD',
  skills: ['Figma', 'Design Systems', 'Prototyping', 'UX Research', 'UI Design'],
  description:
    'Lead the design of our core product suite. Work closely with PMs and engineers to ship high-quality experiences.',
  isActive: true,
  requiresAssessment: true,
  blindAudition: false,
  candidateCount: 14,
  postedAt: '2026-06-01T10:00:00Z',
};

const makeCandidate = (
  id: string,
  name: string,
  title: string,
  skills: string[],
  score: number,
  stage: PipelineCandidate['stage'],
  extra: Partial<PipelineCandidate> = {},
): PipelineCandidate => ({
  id,
  jobId: 'job_1',
  candidateId: `c_${id}`,
  candidateName: name,
  candidateTitle: title,
  skills,
  matchScore: score,
  stage,
  hasAssessment: false,
  hasVideoPitch: false,
  appliedAt: '2026-06-10T09:00:00Z',
  isVerified: false,
  ...extra,
});

export const MOCK_PIPELINE: PipelineCandidate[] = [
  // New Matches
  makeCandidate('p1', 'Jordan Smith', 'UI/UX Designer', ['Figma', 'Design Sys'], 91, 'new_matches', { isVerified: true }),
  makeCandidate('p2', 'Alex Rivera', 'Product Designer', ['Prototyping', 'User Rsch'], 88, 'new_matches'),
  makeCandidate('p3', 'Maya Patel', 'UX Designer', ['Figma', 'Wireframing'], 85, 'new_matches'),
  makeCandidate('p4', 'Chris Lee', 'Product Designer', ['UI Design', 'Figma'], 82, 'new_matches'),
  makeCandidate('p5', 'Sam Wilson', 'UX Researcher', ['Research', 'Testing'], 79, 'new_matches'),
  makeCandidate('p6', 'Jin Park', 'Visual Designer', ['Figma', 'Branding'], 77, 'new_matches'),
  // Testing
  makeCandidate('p7', 'Priya Sharma', 'Senior Designer', ['Figma', 'Prototyping'], 94, 'testing', { hasAssessment: true, assessmentScore: 91 }),
  makeCandidate('p8', 'Marcus Johnson', 'UI Designer', ['React', 'Figma'], 90, 'testing', { hasAssessment: true, assessmentScore: 87 }),
  makeCandidate('p9', 'Elena Volkov', 'Product Designer', ['Design Sys'], 87, 'testing', { hasAssessment: true, assessmentScore: 83 }),
  // Interview
  makeCandidate('p10', 'David Kim', 'Lead Designer', ['Figma', 'Research'], 96, 'interview', { hasVideoPitch: true, isVerified: true }),
  makeCandidate('p11', 'Sarah Chen', 'UX Lead', ['User Testing', 'Figma'], 93, 'interview', { hasVideoPitch: true }),
  makeCandidate('p12', 'Tom Bradley', 'Senior UX', ['Prototyping'], 89, 'interview'),
  // Hired
  makeCandidate('p13', 'Aisha Mohamed', 'Principal Designer', ['Figma', 'Systems'], 98, 'hired', { isVerified: true }),
  makeCandidate('p14', 'Lucas Ferreira', 'Design Lead', ['Figma', 'Leadership'], 95, 'hired'),
];

export const MOCK_MESSAGE_THREADS: MessageThread[] = [
  { id: 't1', candidateName: 'Jordan Smith', candidateTitle: 'UI/UX Designer', appliedFor: 'Senior Product Designer', lastMessage: 'Thanks for reaching out! I am available...', timestamp: '2m ago', unreadCount: 2, isVerified: true },
  { id: 't2', candidateName: 'David Kim', candidateTitle: 'Lead Designer', appliedFor: 'Senior Product Designer', lastMessage: 'Looking forward to the interview on Friday.', timestamp: '1h ago', unreadCount: 0, isVerified: true },
  { id: 't3', candidateName: 'Priya Sharma', candidateTitle: 'Senior Designer', appliedFor: 'Senior Product Designer', lastMessage: 'I have completed the assessment!', timestamp: '3h ago', unreadCount: 1, isVerified: false },
];
