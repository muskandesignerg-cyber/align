/**
 * groqMatcher.ts — Groq-powered AI Match Scoring
 *
 * Uses Llama 3.3 70B via Groq API to intelligently score
 * how well a candidate matches a job posting.
 *
 * Returns:
 *  - score: 0–100
 *  - reasons: why they match
 *  - gaps: what they're missing
 *
 * Results are cached in-memory to avoid re-calling the API.
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── In-memory cache ──────────────────────────────────────────────────────────
const scoreCache = new Map<string, GroqMatchResult>();

export interface GroqMatchResult {
  score: number;
  reasons: string[];
  gaps: string[];
  label: string;
}

export interface GroqCandidateProfile {
  professionalTitle: string;
  skills: string[];
  experienceTitles: string[];
  yearsOfExperience?: number;
  summary?: string;
}

export interface GroqJobProfile {
  roleTitle: string;
  skills: string[];
  description: string;
  workModel: string;
  employmentType: string;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Score a candidate against a job using Groq Llama 3.3 70B.
 * Returns a cached result if the same pair was already scored.
 */
export async function groqScoreMatch(
  candidate: GroqCandidateProfile,
  job: GroqJobProfile,
  cacheKey: string,
): Promise<GroqMatchResult> {
  // Return cached result if available
  if (scoreCache.has(cacheKey)) {
    return scoreCache.get(cacheKey)!;
  }

  // Build a compact prompt
  const prompt = buildScoringPrompt(candidate, job);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const result: GroqMatchResult = {
      score: clamp(Math.round(parsed.score ?? 50), 10, 99),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 3) : [],
      label: getLabel(parsed.score ?? 50),
    };

    scoreCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[groqMatcher] API call failed, using fallback:', err);
    // Fallback: use heuristic scoring when API fails
    return fallbackScore(candidate, job, cacheKey);
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior technical recruiter AI. Your job is to score how well a candidate matches a job posting.

Be STRICT and HONEST:
- A UI/UX Designer applying to a Software Engineer role should score 20-35%
- A Software Engineer applying to a Data Scientist role should score 30-50%
- A perfect match (same domain, all required skills) should score 85-95%
- A strong match (same domain, most skills) should score 70-84%
- A moderate match (related domain, some skills) should score 50-69%
- A weak match (different domain) should score 15-40%

Return ONLY a JSON object with this exact structure:
{
  "score": <integer 0-100>,
  "reasons": ["<reason 1>", "<reason 2>"],
  "gaps": ["<gap 1>", "<gap 2>"]
}`;

function buildScoringPrompt(
  candidate: GroqCandidateProfile,
  job: GroqJobProfile,
): string {
  const skillsStr = candidate.skills.length > 0
    ? candidate.skills.slice(0, 12).join(', ')
    : 'Not specified';

  const expStr = candidate.experienceTitles.length > 0
    ? candidate.experienceTitles.slice(0, 3).join(', ')
    : 'No experience listed';

  const jobSkillsStr = job.skills.length > 0
    ? job.skills.join(', ')
    : 'Not specified';

  return `CANDIDATE:
- Current Title: ${candidate.professionalTitle || 'Not specified'}
- Skills: ${skillsStr}
- Past Roles: ${expStr}

JOB:
- Role: ${job.roleTitle}
- Required Skills: ${jobSkillsStr}
- Work Model: ${job.workModel}
- Type: ${job.employmentType}
- Description: ${job.description.slice(0, 300)}

Score this candidate for this job. Be strict — different domains should score low.`;
}

// ─── Fallback heuristic (when API is unavailable) ─────────────────────────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  design: ['ui', 'ux', 'designer', 'figma', 'sketch', 'product design', 'visual', 'wireframe', 'prototype', 'adobe', 'interaction', 'motion'],
  engineering: ['engineer', 'developer', 'software', 'backend', 'frontend', 'fullstack', 'react', 'node', 'python', 'java', 'typescript', 'api', 'devops', 'mobile'],
  data: ['data', 'analyst', 'scientist', 'ml', 'machine learning', 'sql', 'tableau', 'analytics', 'bi', 'ai', 'nlp'],
  product: ['product manager', 'pm', 'roadmap', 'agile', 'scrum', 'product owner', 'growth'],
  marketing: ['marketing', 'seo', 'content', 'social media', 'brand', 'campaign', 'growth'],
  sales: ['sales', 'account executive', 'business development', 'crm', 'revenue', 'closing'],
  finance: ['finance', 'accounting', 'financial', 'audit', 'tax', 'excel', 'modelling'],
  hr: ['hr', 'human resources', 'recruiter', 'talent', 'people operations', 'payroll'],
};

function getDomain(text: string): string | null {
  const n = text.toLowerCase();
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    if (kws.some((k) => n.includes(k))) return domain;
  }
  return null;
}

function fallbackScore(
  candidate: GroqCandidateProfile,
  job: GroqJobProfile,
  cacheKey: string,
): GroqMatchResult {
  const candidateDomain = getDomain(candidate.professionalTitle) ||
    getDomain(candidate.skills.join(' ')) ||
    getDomain(candidate.experienceTitles.join(' '));

  const jobDomain = getDomain(job.roleTitle) ||
    getDomain(job.skills.join(' '));

  // Domain mismatch → hard cap at 45
  const domainMatch = !candidateDomain || !jobDomain || candidateDomain === jobDomain;

  // Skill overlap
  const candidateNorm = candidate.skills.map((s) => s.toLowerCase());
  const jobNorm = job.skills.map((s) => s.toLowerCase());
  const matched = jobNorm.filter((js) =>
    candidateNorm.some((cs) => cs.includes(js) || js.includes(cs))
  ).length;
  const skillRatio = jobNorm.length > 0 ? matched / jobNorm.length : 0;

  let score: number;
  if (!domainMatch) {
    // Different domain: very low match
    score = Math.round(15 + skillRatio * 20);
  } else {
    score = Math.round(45 + skillRatio * 50);
  }

  const result: GroqMatchResult = {
    score: clamp(score, 10, 99),
    reasons: domainMatch
      ? [`${matched} of ${jobNorm.length} required skills matched`]
      : ['Different role domain'],
    gaps: jobNorm.filter((js) =>
      !candidateNorm.some((cs) => cs.includes(js) || js.includes(cs))
    ).slice(0, 3),
    label: getLabel(score),
  };

  scoreCache.set(cacheKey, result);
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function getLabel(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Good Match';
  if (score >= 40) return 'Partial Match';
  return 'Low Match';
}

/** Clear cache (useful for re-scoring after profile update) */
export function clearMatchCache(): void {
  scoreCache.clear();
}
