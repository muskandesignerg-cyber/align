/**
 * Groq AI — Resume parsing with Llama 3.3 70B.
 *
 * Extracts full ProfileData from resume text using Groq's API.
 * Also supports vision-based extraction from PDF page images
 * using Llama 4 Scout for image-based/designed PDFs.
 * Includes retry logic and backward-compatible exports.
 */

import {
  type ProfileData,
  type WorkExperience,
  type Skill,
  type Project,
  type Education,
  type Certification,
  type Language,
  EMPTY_PROFILE_DATA,
  generateId,
} from '../types/profile';

const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL structured information from the resume text provided.

Return ONLY a valid JSON object with no extra text, no markdown, no code fences. The JSON must match this exact structure:

{
  "basicInfo": {
    "fullName": "Full name of the person",
    "professionalTitle": "Current or most recent job title",
    "professionalSummary": "A concise 2-3 sentence professional summary",
    "email": "Email address or empty string",
    "phone": "Phone number or empty string",
    "location": "City, State/Country or empty string",
    "linkedIn": "LinkedIn URL or empty string",
    "portfolio": "Portfolio URL or empty string",
    "github": "GitHub URL or empty string"
  },
  "workExperience": [
    {
      "company": "Company name",
      "role": "Job title",
      "startDate": "Start date (e.g. Jan 2022)",
      "endDate": "End date or Present",
      "isCurrentRole": false,
      "description": "Brief description of the role",
      "achievements": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "skills": [
    {
      "name": "Skill name",
      "category": "technical | soft | tool | language",
      "yearsOfExperience": 0
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "techStack": ["tech1", "tech2"],
      "url": "Project URL or empty string",
      "githubUrl": "GitHub URL or empty string"
    }
  ],
  "education": [
    {
      "institution": "University or college name",
      "degree": "Degree name (e.g. B.Tech, MBA)",
      "fieldOfStudy": "Field of study",
      "startYear": "Start year",
      "endYear": "End year or Present",
      "grade": "GPA or grade or empty string"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuingOrganization": "Issuing organization",
      "issueDate": "Issue date or empty string",
      "expiryDate": "Expiry date or empty string",
      "credentialUrl": "Credential URL or empty string"
    }
  ],
  "languages": [
    {
      "name": "Language name",
      "proficiency": "native | fluent | professional | basic"
    }
  ],
  "extraContext": "Any additional relevant information not captured above"
}

Rules:
- Extract ALL skills mentioned anywhere (technical, soft, tools, frameworks, languages)
- For skill category, classify as "technical" for programming/frameworks, "soft" for interpersonal skills, "tool" for software tools, "language" for spoken/written languages
- For yearsOfExperience, estimate from context or use 0 if unknown
- If a field is not found, use empty string for strings and empty arrays for arrays
- Keep skill names concise (e.g. "React" not "React.js framework")
- For achievements, extract bullet points or key accomplishments per role
- Set isCurrentRole to true if the end date says "Present" or "Current"
- For professionalSummary, synthesize a professional overview even if the resume doesn't have one`;

const RETRY_SYSTEM_PROMPT = `Extract name, title, skills, experience, and education from this resume. Return valid JSON only.

Use this structure:
{
  "basicInfo": { "fullName": "", "professionalTitle": "", "professionalSummary": "", "email": "", "phone": "", "location": "", "linkedIn": "", "portfolio": "", "github": "" },
  "workExperience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "isCurrentRole": false, "description": "", "achievements": [] }],
  "skills": [{ "name": "", "category": "technical", "yearsOfExperience": 0 }],
  "projects": [{ "name": "", "description": "", "techStack": [], "url": "", "githubUrl": "" }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": "", "endYear": "", "grade": "" }],
  "certifications": [{ "name": "", "issuingOrganization": "", "issueDate": "", "expiryDate": "", "credentialUrl": "" }],
  "languages": [{ "name": "", "proficiency": "professional" }],
  "extraContext": ""
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Call Groq chat completions API with given system prompt and user content. */
async function callGroq(systemPrompt: string, userContent: string): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);
    throw new Error(`AI parsing failed (${response.status}). Please try again.`);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  return data.choices[0].message.content;
}

/** Ensure value is a string, falling back to defaultVal. */
function ensureString(value: unknown, defaultVal = ''): string {
  return typeof value === 'string' ? value : defaultVal;
}

/** Ensure value is an array, falling back to empty array. */
function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

/** Validate and normalize the raw parsed JSON into a proper ProfileData. */
function validateProfileData(raw: Record<string, unknown>): ProfileData {
  const basicInfoRaw = (raw.basicInfo as Record<string, unknown>) || {};
  const basicInfo = {
    fullName: ensureString(basicInfoRaw.fullName, 'Unknown'),
    professionalTitle: ensureString(basicInfoRaw.professionalTitle),
    professionalSummary: ensureString(basicInfoRaw.professionalSummary),
    email: ensureString(basicInfoRaw.email),
    phone: ensureString(basicInfoRaw.phone),
    location: ensureString(basicInfoRaw.location),
    linkedIn: ensureString(basicInfoRaw.linkedIn),
    portfolio: ensureString(basicInfoRaw.portfolio),
    github: ensureString(basicInfoRaw.github),
  };

  const workExperience: WorkExperience[] = ensureArray<Record<string, unknown>>(
    raw.workExperience,
  ).map((exp) => ({
    id: generateId(),
    company: ensureString(exp.company),
    role: ensureString(exp.role),
    startDate: ensureString(exp.startDate),
    endDate: ensureString(exp.endDate),
    isCurrentRole: exp.isCurrentRole === true,
    description: ensureString(exp.description),
    achievements: ensureArray<string>(exp.achievements).map((a) =>
      typeof a === 'string' ? a : String(a),
    ),
  }));

  const skills: Skill[] = ensureArray<Record<string, unknown>>(raw.skills).map(
    (s) => ({
      id: generateId(),
      name: ensureString(s.name),
      category: (['technical', 'soft', 'tool', 'language'].includes(
        s.category as string,
      )
        ? s.category
        : 'technical') as Skill['category'],
      yearsOfExperience:
        typeof s.yearsOfExperience === 'number' ? s.yearsOfExperience : 0,
    }),
  );

  const projects: Project[] = ensureArray<Record<string, unknown>>(
    raw.projects,
  ).map((p) => ({
    id: generateId(),
    name: ensureString(p.name),
    description: ensureString(p.description),
    techStack: ensureArray<string>(p.techStack).map((t) =>
      typeof t === 'string' ? t : String(t),
    ),
    url: ensureString(p.url),
    githubUrl: ensureString(p.githubUrl),
  }));

  const education: Education[] = ensureArray<Record<string, unknown>>(
    raw.education,
  ).map((e) => ({
    id: generateId(),
    institution: ensureString(e.institution),
    degree: ensureString(e.degree),
    fieldOfStudy: ensureString(e.fieldOfStudy),
    startYear: ensureString(e.startYear),
    endYear: ensureString(e.endYear),
    grade: ensureString(e.grade),
  }));

  const certifications: Certification[] = ensureArray<Record<string, unknown>>(
    raw.certifications,
  ).map((c) => ({
    id: generateId(),
    name: ensureString(c.name),
    issuingOrganization: ensureString(c.issuingOrganization),
    issueDate: ensureString(c.issueDate),
    expiryDate: ensureString(c.expiryDate),
    credentialUrl: ensureString(c.credentialUrl),
  }));

  const languages: Language[] = ensureArray<Record<string, unknown>>(
    raw.languages,
  ).map((l) => ({
    name: ensureString(l.name),
    proficiency: (['native', 'fluent', 'professional', 'basic'].includes(
      l.proficiency as string,
    )
      ? l.proficiency
      : 'professional') as Language['proficiency'],
  }));

  return {
    basicInfo,
    workExperience,
    skills,
    projects,
    education,
    certifications,
    languages,
    extraContext: ensureString(raw.extraContext),
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Extract structured ProfileData from resume text using Groq AI.
 * Retries once with a simplified prompt if initial JSON parsing fails.
 */
export async function extractResumeData(pdfText: string): Promise<ProfileData> {
  if (!pdfText.trim()) {
    throw new Error(
      'Resume text is empty — could not read any content from the PDF.',
    );
  }

  // Truncate to ~12000 chars to stay within Groq token limits
  const truncatedText =
    pdfText.length > 12000 ? pdfText.substring(0, 12000) : pdfText;

  const userMessage = `Parse this resume and extract all information:\n\n${truncatedText}`;

  // First attempt
  const content = await callGroq(SYSTEM_PROMPT, userMessage);

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return validateProfileData(parsed);
  } catch {
    console.warn('First JSON parse failed, retrying with simplified prompt…');
  }

  // Retry with simplified prompt
  const retryContent = await callGroq(RETRY_SYSTEM_PROMPT, userMessage);

  try {
    const parsed = JSON.parse(retryContent) as Record<string, unknown>;
    return validateProfileData(parsed);
  } catch {
    console.error('Retry JSON parse also failed:', retryContent);
    throw new Error('AI returned invalid data. Please try again.');
  }
}

// ─── Vision-Based Extraction ──────────────────────────────────────────────────

const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/** Combined prompt for vision extraction (system + user in one block). */
const VISION_EXTRACTION_PROMPT = `You are an expert resume parser. You are looking at images of a resume PDF.
Extract ALL structured information visible in the resume images.

Return ONLY a valid JSON object with no extra text, no markdown, no code fences. The JSON must match this exact structure:

{
  "basicInfo": {
    "fullName": "Full name of the person",
    "professionalTitle": "Current or most recent job title",
    "professionalSummary": "A concise 2-3 sentence professional summary",
    "email": "Email address or empty string",
    "phone": "Phone number or empty string",
    "location": "City, State/Country or empty string",
    "linkedIn": "LinkedIn URL or empty string",
    "portfolio": "Portfolio URL or empty string",
    "github": "GitHub URL or empty string"
  },
  "workExperience": [
    {
      "company": "Company name",
      "role": "Job title",
      "startDate": "Start date (e.g. Jan 2022)",
      "endDate": "End date or Present",
      "isCurrentRole": false,
      "description": "Brief description of the role",
      "achievements": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "skills": [
    {
      "name": "Skill name",
      "category": "technical | soft | tool | language",
      "yearsOfExperience": 0
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "techStack": ["tech1", "tech2"],
      "url": "Project URL or empty string",
      "githubUrl": "GitHub URL or empty string"
    }
  ],
  "education": [
    {
      "institution": "University or college name",
      "degree": "Degree name (e.g. B.Tech, MBA)",
      "fieldOfStudy": "Field of study",
      "startYear": "Start year",
      "endYear": "End year or Present",
      "grade": "GPA or grade or empty string"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuingOrganization": "Issuing organization",
      "issueDate": "Issue date or empty string",
      "expiryDate": "Expiry date or empty string",
      "credentialUrl": "Credential URL or empty string"
    }
  ],
  "languages": [
    {
      "name": "Language name",
      "proficiency": "native | fluent | professional | basic"
    }
  ],
  "extraContext": "Any additional relevant information not captured above"
}

Rules:
- Extract ALL skills mentioned anywhere (technical, soft, tools, frameworks, languages)
- For skill category, classify as "technical" for programming/frameworks, "soft" for interpersonal skills, "tool" for software tools, "language" for spoken/written languages
- If a field is not found, use empty string for strings and empty arrays for arrays
- Set isCurrentRole to true if the end date says "Present" or "Current"
- For professionalSummary, synthesize a professional overview even if the resume doesn't have one

Now extract all information from the resume image(s) below:`;

const VISION_RETRY_PROMPT = `Look at the resume image(s) and extract the person's information as JSON.

Return ONLY valid JSON with this structure:
{
  "basicInfo": { "fullName": "", "professionalTitle": "", "professionalSummary": "", "email": "", "phone": "", "location": "", "linkedIn": "", "portfolio": "", "github": "" },
  "workExperience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "isCurrentRole": false, "description": "", "achievements": [] }],
  "skills": [{ "name": "", "category": "technical", "yearsOfExperience": 0 }],
  "projects": [{ "name": "", "description": "", "techStack": [], "url": "", "githubUrl": "" }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": "", "endYear": "", "grade": "" }],
  "certifications": [{ "name": "", "issuingOrganization": "", "issueDate": "", "expiryDate": "", "credentialUrl": "" }],
  "languages": [{ "name": "", "proficiency": "professional" }],
  "extraContext": ""
}

Extract all visible information from the resume:`;

/**
 * Strip markdown code fences from LLM response.
 * Vision models may wrap JSON in ```json ... ``` blocks.
 */
function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  return cleaned.trim();
}

/**
 * Build the multimodal content array for vision extraction.
 */
function buildVisionContent(
  prompt: string,
  base64Images: string[]
): Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: prompt },
  ];

  for (const img of base64Images) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${img}` },
    });
  }

  return content;
}

/**
 * Extract resume data from PDF page images using Groq's vision model.
 * Used when text extraction fails (image-based/designed PDFs).
 */
export async function extractResumeFromImages(
  base64Images: string[]
): Promise<ProfileData> {
  if (!base64Images.length) {
    throw new Error('No PDF page images provided for vision extraction.');
  }

  console.log(`[Groq Vision] Extracting resume from ${base64Images.length} page image(s)`);

  // First attempt
  const firstResponse = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: buildVisionContent(VISION_EXTRACTION_PROMPT, base64Images),
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!firstResponse.ok) {
    const errorBody = await firstResponse.text();
    console.error('[Groq Vision] API error:', firstResponse.status, errorBody);
    throw new Error(`Vision AI parsing failed (${firstResponse.status}). Please try again.`);
  }

  const firstData = await firstResponse.json();
  const firstContent = firstData.choices?.[0]?.message?.content;

  if (!firstContent) {
    throw new Error('Vision AI returned an empty response. Please try again.');
  }

  // Try parsing first attempt
  try {
    const cleaned = stripMarkdownFences(firstContent);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    console.log('[Groq Vision] First attempt parsed successfully');
    return validateProfileData(parsed);
  } catch (e) {
    console.warn('[Groq Vision] First JSON parse failed, retrying with simplified prompt…', e);
  }

  // Retry with simplified prompt
  const retryResponse = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: buildVisionContent(VISION_RETRY_PROMPT, base64Images),
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!retryResponse.ok) {
    const errorBody = await retryResponse.text();
    console.error('[Groq Vision] Retry API error:', retryResponse.status, errorBody);
    throw new Error(`Vision AI retry failed (${retryResponse.status}). Please try again.`);
  }

  const retryData = await retryResponse.json();
  const retryContent = retryData.choices?.[0]?.message?.content;

  if (!retryContent) {
    throw new Error('Vision AI retry returned an empty response. Please try again.');
  }

  try {
    const cleaned = stripMarkdownFences(retryContent);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    console.log('[Groq Vision] Retry parsed successfully');
    return validateProfileData(parsed);
  } catch {
    console.error('[Groq Vision] Retry JSON parse also failed:', retryContent);
    throw new Error('Vision AI returned invalid data. Please try again.');
  }
}

// ─── Backward-Compatible Exports ──────────────────────────────────────────────

/** @deprecated Use extractResumeData instead. */
export const parseResumeWithGroq = extractResumeData;

export type { ProfileData as ParsedResume } from '../types/profile';

// ─── Employer: Skill Suggestions ──────────────────────────────────────────────

/**
 * Given a job title, return the top 8 most important skill strings.
 * Returns a string[] from Groq / falls back to a default list on error.
 */
export async function generateSkillSuggestions(jobTitle: string): Promise<string[]> {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 200,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `List the top 8 most important technical skills for a "${jobTitle}" role. Return a JSON object with a single key "skills" whose value is an array of skill name strings. No explanation. Example: {"skills":["React","TypeScript","Node.js"]}`,
          },
        ],
      }),
    });
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.skills)) return parsed.skills as string[];
    return [];
  } catch {
    return ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Git'];
  }
}

// ─── Employer: Job Description Generation ─────────────────────────────────────

export async function generateJobDescription(
  jobTitle: string,
  requiredSkills: string[],
  niceToHaveSkills: string[],
  yearsOfExperience: number,
  department: string,
  workModel: string,
  salaryMin: number,
  salaryMax: number,
): Promise<string> {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional job description writer. Write clear, engaging, bias-free job descriptions. Return ONLY the description text. No markdown. No headers. 200-300 words. Professional but human tone.',
          },
          {
            role: 'user',
            content: `Write a job description for:
Role: ${jobTitle}
Department: ${department}
Required Skills: ${requiredSkills.join(', ')}
Nice to Have: ${niceToHaveSkills.join(', ')}
Experience: ${yearsOfExperience}+ years
Work Model: ${workModel}
Salary: ₹${salaryMin}L - ₹${salaryMax}L per year`,
          },
        ],
      }),
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? '';
  } catch {
    return `We are looking for a talented ${jobTitle} to join our ${department} team. You will work ${workModel}, bringing ${yearsOfExperience}+ years of experience with ${requiredSkills.slice(0, 3).join(', ')} and more. You will collaborate with cross-functional teams to deliver high-impact work that drives real business results.`;
  }
}

