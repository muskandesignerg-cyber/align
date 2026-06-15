/**
 * matchEngine.ts — TALENT.LOGIC AI Match Scoring Engine
 *
 * Computes a real match percentage between a candidate profile
 * and a job posting based on multiple weighted signals.
 *
 * Scoring Breakdown (total = 100 points):
 *   ① Skills match          → 50 pts  (most important — hard requirements)
 *   ② Role title alignment  → 25 pts  (title/domain similarity)
 *   ③ Work model match      → 10 pts  (remote / hybrid / on-site)
 *   ④ Employment type match → 10 pts  (full-time / part-time / contract)
 *   ⑤ Experience depth      → 5 pts   (has relevant experience or not)
 *
 * Output is clamped to [30, 99] so no job shows 100% or 0%.
 */

// ─── Domain/Role keyword buckets ─────────────────────────────────────────────

const ROLE_DOMAINS: Record<string, string[]> = {
  design: [
    'ui', 'ux', 'ui/ux', 'designer', 'design', 'figma', 'sketch', 'product design',
    'visual design', 'graphic', 'interaction', 'user experience', 'user interface',
    'branding', 'motion', 'illustrator', 'adobe xd', 'prototyping', 'wireframe',
  ],
  engineering: [
    'engineer', 'developer', 'software', 'backend', 'frontend', 'full stack', 'fullstack',
    'web developer', 'mobile developer', 'ios', 'android', 'react', 'node', 'python',
    'java', 'golang', 'typescript', 'javascript', 'devops', 'cloud', 'api', 'swe',
    'machine learning', 'data engineer', 'infrastructure',
  ],
  data: [
    'data', 'analyst', 'analytics', 'data scientist', 'data analyst', 'business intelligence',
    'bi', 'sql', 'tableau', 'power bi', 'statistics', 'ml', 'machine learning', 'ai',
    'deep learning', 'nlp', 'computer vision', 'data pipeline',
  ],
  product: [
    'product manager', 'pm', 'product', 'roadmap', 'agile', 'scrum', 'product owner',
    'growth', 'strategy', 'okr', 'stakeholder',
  ],
  marketing: [
    'marketing', 'growth', 'seo', 'content', 'social media', 'campaign', 'brand',
    'performance marketing', 'digital marketing', 'email marketing', 'copywriter',
    'communications', 'pr', 'influencer',
  ],
  sales: [
    'sales', 'account executive', 'business development', 'bd', 'crm', 'revenue',
    'enterprise sales', 'saas sales', 'customer success', 'sdr', 'bdr', 'pipeline',
    'closing', 'negotiation',
  ],
  finance: [
    'finance', 'accounting', 'financial', 'cfo', 'controller', 'audit', 'tax',
    'bookkeeping', 'excel', 'financial modelling', 'investment', 'banking',
  ],
  hr: [
    'hr', 'human resources', 'recruiter', 'talent acquisition', 'people operations',
    'hrbp', 'payroll', 'culture', 'l&d', 'learning and development',
  ],
  operations: [
    'operations', 'ops', 'project manager', 'program manager', 'process', 'logistics',
    'supply chain', 'procurement', 'vendor', 'coordination',
  ],
  customer: [
    'customer support', 'customer service', 'cx', 'support engineer', 'help desk',
    'customer experience', 'success', 'onboarding',
  ],
};

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Normalize: lowercase + trim + collapse spaces */
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Get all domain buckets that a text string hits */
function getDomains(text: string): Set<string> {
  const n = norm(text);
  const domains = new Set<string>();
  for (const [domain, keywords] of Object.entries(ROLE_DOMAINS)) {
    for (const kw of keywords) {
      if (n.includes(kw)) {
        domains.add(domain);
        break;
      }
    }
  }
  return domains;
}

/**
 * Token-level skill match.
 * Returns a 0-1 score of how many job skills the candidate covers.
 */
function skillMatchRatio(
  candidateSkills: string[],
  jobSkills: string[],
): number {
  if (jobSkills.length === 0) return 0.6; // no requirements = neutral
  if (candidateSkills.length === 0) return 0;

  const normCandidate = candidateSkills.map(norm);
  let matched = 0;

  for (const jobSkill of jobSkills) {
    const nJob = norm(jobSkill);
    const hit = normCandidate.some((cs) => {
      // Exact match
      if (cs === nJob) return true;
      // One contains the other (e.g. "React Native" ⊆ "React")
      if (cs.includes(nJob) || nJob.includes(cs)) return true;
      // First-word match (e.g. "JavaScript" ~ "JS")
      const jsMap: Record<string, string> = {
        'js': 'javascript', 'ts': 'typescript', 'py': 'python',
        'react': 'reactjs', 'vue': 'vuejs', 'node': 'nodejs',
        'k8s': 'kubernetes', 'css3': 'css', 'html5': 'html',
      };
      const mapped = jsMap[nJob] ?? jsMap[cs];
      if (mapped && (cs.includes(mapped) || nJob.includes(mapped))) return true;
      return false;
    });
    if (hit) matched++;
  }

  return matched / jobSkills.length;
}

/**
 * Role-title domain alignment score (0-1).
 * Checks if candidate's professional title and experience
 * belong to the same domain as the job title.
 */
function roleDomainScore(
  candidateTitle: string,
  jobTitle: string,
  experienceTitles: string[],
): number {
  const jobDomains = getDomains(jobTitle);
  if (jobDomains.size === 0) return 0.5; // unknown domain = neutral

  // Check candidate's current title
  const titleDomains = getDomains(candidateTitle);
  if ([...jobDomains].some((d) => titleDomains.has(d))) return 1.0;

  // Check past experience titles
  for (const expTitle of experienceTitles) {
    const expDomains = getDomains(expTitle);
    if ([...jobDomains].some((d) => expDomains.has(d))) return 0.7;
  }

  // Check if candidate title contains words from job title
  const jobWords = norm(jobTitle).split(' ').filter((w) => w.length > 3);
  const titleWords = norm(candidateTitle).split(' ');
  const wordHits = jobWords.filter((w) => titleWords.includes(w)).length;
  if (wordHits > 0) return 0.5;

  return 0; // domain mismatch
}

// ─── Main exported function ───────────────────────────────────────────────────

export interface CandidateMatchInput {
  /** Candidate's current professional title */
  professionalTitle: string;
  /** All verified skills (names) */
  verifiedSkills: string[];
  /** Past job titles from experience entries */
  experienceTitles?: string[];
  /** Candidate's preferred work model (optional) */
  preferredWorkModel?: string;
}

export interface JobMatchInput {
  roleTitle: string;
  skills: string[];
  workModel: string;
  employmentType: string;
  description?: string;
}

/**
 * Compute a match score (30-99) between a candidate and a job.
 * Higher = better fit.
 */
export function computeMatchScore(
  candidate: CandidateMatchInput,
  job: JobMatchInput,
): number {
  // ── ① Skills match (50 pts) ───────────────────────────────────────────────
  // Combine job required skills + any skills mentioned in the description
  const descSkills = extractSkillsFromText(job.description ?? '');
  const allJobSkills = [...new Set([...job.skills, ...descSkills])];

  const skillRatio = skillMatchRatio(candidate.verifiedSkills, allJobSkills);
  const skillScore = skillRatio * 50;

  // ── ② Role title alignment (25 pts) ──────────────────────────────────────
  const domainRatio = roleDomainScore(
    candidate.professionalTitle,
    job.roleTitle,
    candidate.experienceTitles ?? [],
  );
  const roleScore = domainRatio * 25;

  // ── ③ Work model match (10 pts) ──────────────────────────────────────────
  let workScore = 5; // neutral by default
  if (candidate.preferredWorkModel) {
    const cm = norm(candidate.preferredWorkModel);
    const jm = norm(job.workModel);
    if (cm === jm) workScore = 10;
    else if (cm.includes('hybrid') || jm.includes('hybrid')) workScore = 7; // hybrid is flexible
    else workScore = 2;
  }

  // ── ④ Employment type match (10 pts) ─────────────────────────────────────
  // We don't have candidate preferred type explicitly, so give partial credit
  const empScore = 7; // neutral-positive

  // ── ⑤ Experience depth (5 pts) ───────────────────────────────────────────
  const expCount = candidate.experienceTitles?.length ?? 0;
  const expScore = expCount > 0 ? 5 : 2;

  // ── Total ─────────────────────────────────────────────────────────────────
  const raw = skillScore + roleScore + workScore + empScore + expScore;

  // Clamp to [30, 99]
  return Math.min(99, Math.max(30, Math.round(raw)));
}

/**
 * Extract skill-like words from a free-text job description.
 * Returns short technical terms that look like skills.
 */
function extractSkillsFromText(description: string): string[] {
  const TECH_PATTERN = /\b(figma|sketch|react|angular|vue|node\.?js|python|java|golang|swift|kotlin|flutter|typescript|javascript|css|html|sql|postgresql|mongodb|redis|docker|kubernetes|aws|gcp|azure|git|jira|notion|linear|slack|tableau|powerbi|salesforce|hubspot|shopify|wordpress|photoshop|illustrator|after effects|premiere|blender|unity|unreal)\b/gi;
  const matches = description.match(TECH_PATTERN) ?? [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

/**
 * Compute match score for an employer looking at a candidate.
 * Uses the job's required skills and the candidate's listed skills.
 */
export function computeEmployerMatchScore(
  candidateSkills: string[],
  candidateTitle: string,
  job: JobMatchInput,
): number {
  return computeMatchScore(
    {
      professionalTitle: candidateTitle,
      verifiedSkills: candidateSkills,
      experienceTitles: [],
    },
    job,
  );
}

/**
 * Returns a human-readable label for the match score.
 */
export function getMatchLabel(score: number): string {
  if (score >= 90) return 'Excellent Match';
  if (score >= 75) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 45) return 'Partial Match';
  return 'Low Match';
}

/**
 * Returns the color for a match badge.
 */
export function getMatchColor(score: number): string {
  if (score >= 85) return '#22C55E'; // green
  if (score >= 70) return '#4C59D7'; // brand blue
  if (score >= 55) return '#F57C00'; // amber
  return '#EF4444'; // red
}
