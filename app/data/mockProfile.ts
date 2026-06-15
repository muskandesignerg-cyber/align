import { CandidateProfile } from '../types/candidateProfile';

export const MOCK_CANDIDATE_PROFILE: CandidateProfile = {
  id: 'profile_1',
  userId: 'user_mock',
  fullName: 'Alex Johnson',
  professionalTitle: 'Senior Product Designer',
  tagline: 'UI/UX Specialist',
  location: 'San Francisco, CA',
  isOpenToWork: true,
  avgMatchScore: 94,
  verifiedSkills: [
    { id: 'sk_1', name: 'UI Design', isVerified: true, verificationMethod: 'challenge', score: 85 },
    { id: 'sk_2', name: 'Figma', isVerified: true, verificationMethod: 'challenge', score: 90 },
    { id: 'sk_3', name: 'Prototyping', isVerified: true, verificationMethod: 'github', score: 80 },
    { id: 'sk_4', name: 'UX Research', isVerified: false, score: 70 },
    { id: 'sk_5', name: 'HTML/CSS', isVerified: false, score: 65 },
    { id: 'sk_6', name: 'Design Systems', isVerified: false, score: 75 },
    { id: 'sk_7', name: 'Motion Design', isVerified: false, score: 60 },
  ],
  radarChartData: [
    { axis: 'UI Design', value: 85 },
    { axis: 'UX Research', value: 70 },
    { axis: 'Prototyping', value: 80 },
    { axis: 'Figma', value: 90 },
    { axis: 'HTML/CSS', value: 65 },
    { axis: 'Design Systems', value: 75 },
  ],
  experience: [
    {
      id: 'exp_1',
      roleTitle: 'Senior Product Designer',
      company: 'TechFlow Inc.',
      startDate: '2021',
      endDate: 'Present',
      description:
        'Led the redesign of the core SaaS platform, increasing user retention by 24%. Managed a team of 3 junior designers and established the company\'s first comprehensive design system.',
      isCurrentRole: true,
    },
    {
      id: 'exp_2',
      roleTitle: 'UI/UX Designer',
      company: 'Creative Studio Agency',
      startDate: '2018',
      endDate: '2021',
      description:
        'Delivered end-to-end design solutions for 15+ clients across fintech and healthcare sectors. Conducted extensive user research and usability testing.',
      isCurrentRole: false,
    },
  ],
  linkedWork: [
    {
      id: 'lw_1',
      platform: 'github',
      label: 'GitHub',
      url: 'github.com/alexjdesign',
    },
    {
      id: 'lw_2',
      platform: 'portfolio',
      label: 'Portfolio',
      url: 'alexjohnson.design',
    },
  ],
  stats: {
    verifiedSkillCount: 3,
    avgMatchScore: 94,
    totalApplications: 12,
    totalInterviews: 3,
  },
};

export const SUGGESTED_SKILLS = [
  'React',
  'Motion Design',
  'User Testing',
  'TypeScript',
  'Design Systems',
  'Accessibility',
  'Wireframing',
  'Brand Identity',
  'After Effects',
  'Webflow',
];
