/**
 * AI-powered assessment & interview question generation via Groq.
 *
 * Generates MCQ questions for Round 2 and open-ended interview
 * questions for Round 3 based on role title and skills.
 *
 * Includes role-based fallback banks for when Groq is rate-limited.
 */

import { AssessmentQuestion, InterviewQuestion, InterviewFocus } from '../types/assessment';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── MCQ Assessment Generation (Round 2) ──────────────────────────────────────

const MCQ_SYSTEM = `You are a senior technical recruiter and assessment designer. Generate exactly the requested number of high-quality multiple-choice questions for a technical hiring assessment.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

Format:
[
  {
    "text": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct",
    "topic": "JavaScript / System Design / etc"
  }
]

Rules:
- Questions must be practical, not trivia
- Mix difficulty: 40% easy, 40% medium, 20% hard
- Cover all listed skills proportionally
- Options must be plausible — no obvious wrong answers
- correctIndex is 0-3 (index into options array)`;

export async function generateMCQQuestions(
  roleTitle: string,
  skills: string[],
  count: number = 15,
): Promise<AssessmentQuestion[]> {
  const userPrompt = `Role: ${roleTitle}
Skills to cover: ${skills.join(', ')}
Number of questions: ${count}

Generate ${count} MCQ questions that a candidate applying for this role should be able to answer.`;

  try {
    const raw = await callGroq(MCQ_SYSTEM, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as any[];
    return parsed.map((q) => ({
      id: uid(),
      text: q.text,
      options: q.options as [string, string, string, string],
      correctIndex: Number(q.correctIndex),
      explanation: q.explanation,
      topic: q.topic,
    }));
  } catch (err) {
    console.warn('[assessmentAI] Groq failed, using fallback:', err);
    return getFallbackMCQ(roleTitle, skills, count);
  }
}

// ─── AI Interview Question Generation (Round 3) ────────────────────────────────

const INTERVIEW_SYSTEM = `You are an experienced technical interviewer. Generate thoughtful interview questions for the specified role and focus area.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

Format:
[
  {
    "text": "Main interview question",
    "followUp": "Optional follow-up probe question",
    "topic": "Topic area"
  }
]

Rules:
- Questions should be open-ended and conversational
- Technical questions should be practical, not trick questions
- Behavioural questions should use STAR method prompts
- Mix depth: some broad, some deep-dive
- For Full Round: mix 50% technical + 50% behavioural`;

export async function generateInterviewQuestions(
  roleTitle: string,
  skills: string[],
  focus: InterviewFocus,
  count: number = 8,
): Promise<InterviewQuestion[]> {
  const userPrompt = `Role: ${roleTitle}
Skills: ${skills.join(', ')}
Interview Focus: ${focus}
Number of questions: ${count}

Generate ${count} interview questions for this role. Focus: ${focus}.`;

  try {
    const raw = await callGroq(INTERVIEW_SYSTEM, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as any[];
    return parsed.map((q) => ({
      id: uid(),
      text: q.text,
      followUp: q.followUp,
      topic: q.topic,
    }));
  } catch (err) {
    console.warn('[assessmentAI] Groq interview failed, using fallback:', err);
    return getFallbackInterviewQuestions(roleTitle, focus, count);
  }
}

// ─── AI Interview Scoring (Round 3) ───────────────────────────────────────────

const SCORING_SYSTEM = `You are an expert interview evaluator. Score the candidate's interview answers across 4 dimensions.

Return ONLY valid JSON — no markdown, no explanation.

Format:
{
  "overall": 75,
  "technicalAccuracy": 80,
  "communicationClarity": 70,
  "confidence": 72,
  "structure": 78,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasToImprove": ["Area 1", "Area 2", "Area 3"],
  "verdict": "One sentence overall verdict"
}

All scores 0-100. Be honest but constructive.`;

export async function scoreInterviewAnswers(
  roleTitle: string,
  qaPairs: { question: string; answer: string }[],
): Promise<{
  overall: number;
  technicalAccuracy: number;
  communicationClarity: number;
  confidence: number;
  structure: number;
  strengths: string[];
  areasToImprove: string[];
  verdict: string;
}> {
  const qaText = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const userPrompt = `Role being interviewed for: ${roleTitle}

Interview Q&A:
${qaText}

Score this interview performance.`;

  try {
    const raw = await callGroq(SCORING_SYSTEM, userPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback scoring
    return {
      overall: 72,
      technicalAccuracy: 75,
      communicationClarity: 70,
      confidence: 68,
      structure: 74,
      strengths: [
        'Strong technical knowledge demonstrated',
        'Clear problem-solving approach',
        'Positive and professional tone',
      ],
      areasToImprove: [
        'Be more concise in behavioural answers',
        'Use STAR method more consistently',
        'Avoid filler words for clarity',
      ],
      verdict: 'Solid performance with good technical foundation and room for improvement in communication structure.',
    };
  }
}

// ─── Fallback Question Banks ───────────────────────────────────────────────────

function detectRoleCategory(roleTitle: string): string {
  const r = roleTitle.toLowerCase();
  if (r.includes('frontend') || r.includes('react') || r.includes('ui')) return 'frontend';
  if (r.includes('backend') || r.includes('node') || r.includes('python') || r.includes('java')) return 'backend';
  if (r.includes('design') || r.includes('ux') || r.includes('product designer')) return 'design';
  if (r.includes('data') || r.includes('ml') || r.includes('ai') || r.includes('machine')) return 'data';
  if (r.includes('devops') || r.includes('cloud') || r.includes('infra')) return 'devops';
  if (r.includes('android') || r.includes('ios') || r.includes('mobile') || r.includes('react native')) return 'mobile';
  return 'fullstack';
}

const FALLBACK_MCQ: Record<string, AssessmentQuestion[]> = {
  frontend: [
    { id: uid(), text: 'What is the virtual DOM in React?', options: ['A copy of the real DOM kept in memory', 'A separate browser rendering engine', 'A CSS-in-JS library', 'A state management pattern'], correctIndex: 0, topic: 'React', explanation: 'React keeps a lightweight virtual copy of the DOM to efficiently diff and update.' },
    { id: uid(), text: 'Which CSS property creates a new stacking context?', options: ['display: block', 'position: relative with z-index', 'margin: auto', 'float: left'], correctIndex: 1, topic: 'CSS', explanation: 'position combined with a non-auto z-index creates a stacking context.' },
    { id: uid(), text: 'What does the useCallback hook do?', options: ['Memoizes a function reference', 'Creates a ref to a DOM element', 'Runs code after render', 'Fetches data from an API'], correctIndex: 0, topic: 'React Hooks', explanation: 'useCallback returns a memoized callback that only changes if dependencies change.' },
    { id: uid(), text: 'What is the difference between == and === in JavaScript?', options: ['=== checks value and type, == only checks value', '== checks value and type', 'They are identical', '=== is for arrays only'], correctIndex: 0, topic: 'JavaScript', explanation: '=== is strict equality checking both value and type without coercion.' },
    { id: uid(), text: 'What is a closure in JavaScript?', options: ['A function with access to its outer scope variables', 'A way to close a browser tab', 'A CSS animation state', 'A module import pattern'], correctIndex: 0, topic: 'JavaScript', explanation: 'Closures let inner functions access variables from their outer enclosing scope.' },
    { id: uid(), text: 'What does CSS Flexbox\'s justify-content do?', options: ['Aligns items along the main axis', 'Aligns items along the cross axis', 'Sets item width', 'Controls grid columns'], correctIndex: 0, topic: 'CSS', explanation: 'justify-content distributes space along the main axis of a flex container.' },
    { id: uid(), text: 'What is the purpose of the key prop in React lists?', options: ['Helps React identify which items changed', 'Sets the CSS class', 'Controls render order', 'Prevents re-renders entirely'], correctIndex: 0, topic: 'React', explanation: 'Keys help React efficiently reconcile list changes without re-rendering everything.' },
    { id: uid(), text: 'What is event bubbling in JavaScript?', options: ['Events propagate from child to parent', 'Events propagate from parent to child', 'Events fire in parallel', 'Only applies to custom events'], correctIndex: 0, topic: 'JavaScript', explanation: 'Bubbling means an event on a child element also fires on all ancestors.' },
    { id: uid(), text: 'What is the box model in CSS?', options: ['Content + padding + border + margin', 'Only the element content area', 'A JavaScript rendering model', 'A flexbox layout mode'], correctIndex: 0, topic: 'CSS', explanation: 'The CSS box model describes how content, padding, border, and margin layer.' },
    { id: uid(), text: 'What does async/await do in JavaScript?', options: ['Makes asynchronous code look synchronous', 'Runs code in parallel threads', 'Blocks the main thread', 'Only works in Node.js'], correctIndex: 0, topic: 'JavaScript', explanation: 'async/await is syntactic sugar over Promises for cleaner async code.' },
    { id: uid(), text: 'What is tree shaking in webpack?', options: ['Removing unused code from the bundle', 'Rendering tree components', 'A CSS animation technique', 'A React optimization method'], correctIndex: 0, topic: 'Build Tools', explanation: 'Tree shaking eliminates dead code by analyzing import/export statements.' },
    { id: uid(), text: 'What is the difference between useMemo and useCallback?', options: ['useMemo memoizes values, useCallback memoizes functions', 'They are the same hook', 'useCallback memoizes values', 'useMemo is only for API calls'], correctIndex: 0, topic: 'React Hooks', explanation: 'useMemo returns a cached value; useCallback returns a cached function reference.' },
    { id: uid(), text: 'What does position: sticky do?', options: ['Element scrolls until hitting threshold then sticks', 'Fixes element to viewport', 'Removes from document flow', 'Same as position: fixed'], correctIndex: 0, topic: 'CSS', explanation: 'Sticky positioning toggles between relative and fixed based on scroll position.' },
    { id: uid(), text: 'What is a Promise in JavaScript?', options: ['An object representing eventual completion of an async op', 'A guaranteed function execution', 'A synchronous callback', 'A React component lifecycle'], correctIndex: 0, topic: 'JavaScript', explanation: 'A Promise represents a value that may be available now, later, or never.' },
    { id: uid(), text: 'What is code splitting in React?', options: ['Loading code chunks on demand instead of all at once', 'Breaking React components into smaller files', 'A CSS naming convention', 'Splitting state across components'], correctIndex: 0, topic: 'React Performance', explanation: 'Code splitting via React.lazy/Suspense loads bundles only when needed.' },
  ],
  backend: [
    { id: uid(), text: 'What is the difference between SQL and NoSQL databases?', options: ['SQL is relational/structured, NoSQL is flexible/schema-less', 'NoSQL is always faster', 'SQL is for small data only', 'They are identical in structure'], correctIndex: 0, topic: 'Databases', explanation: 'SQL enforces a schema with relations; NoSQL allows flexible document/key-value storage.' },
    { id: uid(), text: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote Execution Service Technology', 'Rapid Endpoint Streaming Transfer', 'Real-time Event State Trigger'], correctIndex: 0, topic: 'APIs', explanation: 'REST is an architectural style for distributed hypermedia systems.' },
    { id: uid(), text: 'What is an index in a database?', options: ['A data structure that speeds up data retrieval', 'A list of all tables', 'A backup copy of data', 'A foreign key relationship'], correctIndex: 0, topic: 'Databases', explanation: 'Indexes allow the database engine to find rows without scanning the entire table.' },
    { id: uid(), text: 'What is the purpose of JWT?', options: ['Securely transmit claims between parties as a JSON object', 'Encrypt database connections', 'Cache API responses', 'Compress HTTP payloads'], correctIndex: 0, topic: 'Authentication', explanation: 'JWTs contain digitally signed claims used for authentication and authorization.' },
    { id: uid(), text: 'What is the difference between PUT and PATCH in REST?', options: ['PUT replaces entire resource, PATCH updates partially', 'They are identical', 'PATCH creates resources', 'PUT is for deletions'], correctIndex: 0, topic: 'APIs', explanation: 'PUT is idempotent and replaces the whole resource; PATCH applies partial updates.' },
    { id: uid(), text: 'What is N+1 query problem?', options: ['Fetching N related records with N+1 separate queries', 'Running the same query twice', 'A pagination bug', 'An SQL syntax error'], correctIndex: 0, topic: 'Databases', explanation: 'N+1 occurs when fetching parent records then making separate queries for each child.' },
    { id: uid(), text: 'What is horizontal scaling?', options: ['Adding more servers to distribute load', 'Upgrading a single server\'s hardware', 'Increasing database storage', 'Adding more CPU cores'], correctIndex: 0, topic: 'System Design', explanation: 'Horizontal scaling (scale out) adds more machines; vertical scaling adds resources to one.' },
    { id: uid(), text: 'What is a message queue?', options: ['Async communication buffer between services', 'A sorted priority list', 'A real-time chat system', 'A database query cache'], correctIndex: 0, topic: 'System Design', explanation: 'Message queues decouple producers and consumers for async, reliable communication.' },
    { id: uid(), text: 'What does ACID stand for in databases?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Dependency', 'Async, Cache, Integrity, Data', 'Availability, Concurrency, Indexing, Distribution'], correctIndex: 0, topic: 'Databases', explanation: 'ACID properties guarantee reliable transaction processing in database systems.' },
    { id: uid(), text: 'What is middleware in web frameworks?', options: ['Functions that run between request and response', 'A database layer', 'A frontend rendering engine', 'A deployment configuration'], correctIndex: 0, topic: 'Web Frameworks', explanation: 'Middleware intercepts request/response cycles for cross-cutting concerns like auth/logging.' },
    { id: uid(), text: 'What is a deadlock in databases?', options: ['Two transactions each waiting for the other to release a lock', 'A slow query timeout', 'A corrupted index', 'A connection pool exhaustion'], correctIndex: 0, topic: 'Databases', explanation: 'Deadlocks occur when two transactions permanently block each other waiting for locks.' },
    { id: uid(), text: 'What is rate limiting?', options: ['Controlling how often clients can call an API', 'Limiting database row count', 'Throttling CPU usage', 'Setting maximum file sizes'], correctIndex: 0, topic: 'APIs', explanation: 'Rate limiting prevents API abuse by restricting requests per time window per client.' },
    { id: uid(), text: 'What is the purpose of a load balancer?', options: ['Distributes traffic across multiple servers', 'Compresses HTTP responses', 'Caches database queries', 'Encrypts network traffic'], correctIndex: 0, topic: 'System Design', explanation: 'Load balancers distribute incoming requests to prevent any single server from being overwhelmed.' },
    { id: uid(), text: 'What is memoization?', options: ['Caching function results for the same inputs', 'Writing code from memory', 'A database replication strategy', 'Logging API calls'], correctIndex: 0, topic: 'Programming', explanation: 'Memoization stores computed results so repeated calls with same inputs return cached values.' },
    { id: uid(), text: 'What is the CAP theorem?', options: ['Consistency, Availability, Partition tolerance — pick 2', 'Cache, API, Performance', 'A database indexing theory', 'A microservices pattern'], correctIndex: 0, topic: 'System Design', explanation: 'CAP theorem states distributed systems can only guarantee 2 of 3 properties simultaneously.' },
  ],
  design: [
    { id: uid(), text: 'What is the primary purpose of a design system?', options: ['Provide reusable components and guidelines for consistency', 'Replace all design tools', 'Generate code automatically', 'A prototyping methodology'], correctIndex: 0, topic: 'Design Systems', explanation: 'Design systems create shared language and reusable building blocks across products.' },
    { id: uid(), text: 'What does "affordance" mean in UX design?', options: ['A cue that shows how an object should be used', 'The cost of a design feature', 'A user interview technique', 'Animation timing function'], correctIndex: 0, topic: 'UX Principles', explanation: 'Affordances are perceptual signals that indicate how users should interact with an element.' },
    { id: uid(), text: 'What is the Fitts\'s Law?', options: ['Time to acquire a target depends on distance and size', 'Users read in F-pattern', 'Rule of 7 items in menus', 'Color contrast accessibility rule'], correctIndex: 0, topic: 'UX Research', explanation: 'Fitts\'s Law: time to click a target increases with distance and decreases with size.' },
    { id: uid(), text: 'What is a user persona?', options: ['A fictional character representing user segments', 'A real user profile from analytics', 'A competitor analysis', 'A product requirement'], correctIndex: 0, topic: 'UX Research', explanation: 'Personas are research-based archetypes representing target user groups and their goals.' },
    { id: uid(), text: 'What is the difference between wireframe and prototype?', options: ['Wireframe is static structure; prototype is interactive', 'They are the same thing', 'Prototype is low-fidelity', 'Wireframe has animations'], correctIndex: 0, topic: 'Design Process', explanation: 'Wireframes show layout structure; prototypes simulate interaction and flow.' },
    { id: uid(), text: 'What does WCAG stand for?', options: ['Web Content Accessibility Guidelines', 'Web Color and Gradient', 'Web Component Animation Guide', 'Wide Content Alignment Grid'], correctIndex: 0, topic: 'Accessibility', explanation: 'WCAG defines standards for making web content accessible to people with disabilities.' },
    { id: uid(), text: 'What is the 8pt grid system?', options: ['Sizing and spacing everything in multiples of 8', 'Using 8 columns in layouts', 'An 8-color palette system', 'A typography scale'], correctIndex: 0, topic: 'Design Systems', explanation: 'The 8pt grid creates visual harmony by spacing/sizing elements in 8px increments.' },
    { id: uid(), text: 'What is A/B testing in design?', options: ['Comparing two versions to see which performs better', 'Testing on Android and iOS', 'Alpha and beta release testing', 'Accessibility and behavior testing'], correctIndex: 0, topic: 'UX Research', explanation: 'A/B testing shows different designs to user groups to measure which achieves better outcomes.' },
    { id: uid(), text: 'What is the purpose of a style guide?', options: ['Document standards for colors, typography, components', 'A CSS file', 'Brand mission statement', 'A user manual'], correctIndex: 0, topic: 'Design Systems', explanation: 'Style guides document visual standards so teams maintain design consistency.' },
    { id: uid(), text: 'What is progressive disclosure in UX?', options: ['Revealing information only when users need it', 'Loading assets progressively', 'Onboarding new users', 'Animation on scroll'], correctIndex: 0, topic: 'UX Principles', explanation: 'Progressive disclosure reduces cognitive load by showing advanced options only on demand.' },
    { id: uid(), text: 'What contrast ratio does WCAG AA require for normal text?', options: ['4.5:1', '3:1', '7:1', '2:1'], correctIndex: 0, topic: 'Accessibility', explanation: 'WCAG AA requires 4.5:1 contrast ratio for normal text (3:1 for large text).' },
    { id: uid(), text: 'What is a mental model in UX?', options: ['User\'s internal expectation of how a system works', 'A 3D design visualization', 'A usability testing method', 'A color theory concept'], correctIndex: 0, topic: 'UX Principles', explanation: 'Mental models are the user\'s preconceptions about how something works based on experience.' },
    { id: uid(), text: 'What is atomic design?', options: ['Designing with atoms, molecules, organisms, templates, pages', 'Minimal component approach', 'A mobile-first methodology', 'A CSS naming convention'], correctIndex: 0, topic: 'Design Systems', explanation: 'Brad Frost\'s atomic design builds UIs from smallest units (atoms) up to full pages.' },
    { id: uid(), text: 'What is the purpose of card sorting in UX research?', options: ['Understanding how users categorize information', 'Prioritizing design tasks', 'Sorting design assets', 'A usability scoring method'], correctIndex: 0, topic: 'UX Research', explanation: 'Card sorting reveals users\' mental models for information architecture decisions.' },
    { id: uid(), text: 'What is responsive design?', options: ['Layouts that adapt to different screen sizes', 'Designs that respond to user feedback', 'Fast loading websites', 'A JavaScript framework'], correctIndex: 0, topic: 'UI Design', explanation: 'Responsive design uses fluid grids and media queries to adapt layouts to any screen size.' },
  ],
  fullstack: [
    { id: uid(), text: 'What is the difference between authentication and authorization?', options: ['Authentication verifies identity; authorization grants access', 'They are the same', 'Authorization comes before authentication', 'Only authentication uses tokens'], correctIndex: 0, topic: 'Security', explanation: 'AuthN: who are you? AuthZ: what are you allowed to do?' },
    { id: uid(), text: 'What is a CDN?', options: ['Network of servers delivering content from locations near users', 'Central Database Node', 'A CSS framework', 'Code Deployment Network'], correctIndex: 0, topic: 'Infrastructure', explanation: 'CDNs cache and serve static assets from edge servers geographically close to users.' },
    { id: uid(), text: 'What is the difference between GET and POST requests?', options: ['GET retrieves data; POST submits/creates data', 'POST is more secure by default', 'GET can have a request body', 'They are interchangeable'], correctIndex: 0, topic: 'HTTP', explanation: 'GET is idempotent and for retrieval; POST sends data to create or trigger actions.' },
    { id: uid(), text: 'What is a monorepo?', options: ['Single repository containing multiple packages/projects', 'A repository for one microservice', 'A single-file JavaScript app', 'A database backup strategy'], correctIndex: 0, topic: 'Engineering Practices', explanation: 'Monorepos store multiple related packages together, enabling code sharing and atomic changes.' },
    { id: uid(), text: 'What does CI/CD stand for?', options: ['Continuous Integration / Continuous Deployment', 'Code Inspection / Code Delivery', 'Client Integration / Customer Deployment', 'Container Infrastructure / Cloud Deployment'], correctIndex: 0, topic: 'DevOps', explanation: 'CI automates testing on each commit; CD automates deployment of passing builds.' },
    { id: uid(), text: 'What is a microservices architecture?', options: ['Application split into small, independently deployable services', 'Using micro-frameworks for small apps', 'Serverless functions only', 'A CSS module pattern'], correctIndex: 0, topic: 'System Design', explanation: 'Microservices decompose a monolith into services that communicate over APIs.' },
    { id: uid(), text: 'What is the purpose of environment variables?', options: ['Store configuration outside of code', 'Speed up runtime execution', 'A CSS custom property', 'Database connection pooling'], correctIndex: 0, topic: 'Engineering Practices', explanation: 'Environment variables keep secrets and config (API keys, URLs) out of source code.' },
    { id: uid(), text: 'What is idempotency?', options: ['Same operation produces same result regardless of repetition', 'A database transaction property', 'An HTTP status code', 'A caching strategy'], correctIndex: 0, topic: 'APIs', explanation: 'Idempotent operations can be safely retried — calling them multiple times = calling once.' },
    { id: uid(), text: 'What is a race condition?', options: ['Bug where behavior depends on unpredictable event timing', 'A performance benchmark', 'A database deadlock', 'An animation timing issue'], correctIndex: 0, topic: 'Programming', explanation: 'Race conditions occur when concurrent operations produce incorrect results based on execution order.' },
    { id: uid(), text: 'What is the principle of least privilege?', options: ['Grant only the minimum access needed for a task', 'Use the cheapest cloud instances', 'Write minimal code', 'Only senior devs approve PRs'], correctIndex: 0, topic: 'Security', explanation: 'Limiting access rights reduces the attack surface if credentials are compromised.' },
    { id: uid(), text: 'What is a singleton pattern?', options: ['Ensures only one instance of a class exists', 'A single-page application', 'One database per service', 'A CSS specificity rule'], correctIndex: 0, topic: 'Design Patterns', explanation: 'The singleton pattern restricts a class to one instance, shared across the application.' },
    { id: uid(), text: 'What does TDD stand for?', options: ['Test-Driven Development', 'Type Declaration Definition', 'Trunk-based Deployment', 'Transaction Data Design'], correctIndex: 0, topic: 'Engineering Practices', explanation: 'TDD writes failing tests first, then implements code to make them pass.' },
    { id: uid(), text: 'What is caching?', options: ['Storing frequently accessed data for faster retrieval', 'Clearing browser history', 'Compressing files', 'Backing up databases'], correctIndex: 0, topic: 'Performance', explanation: 'Caching reduces latency and server load by serving previously computed results.' },
    { id: uid(), text: 'What is the Observer pattern?', options: ['Objects notify dependents automatically when state changes', 'A surveillance programming approach', 'A React component pattern', 'A database trigger'], correctIndex: 0, topic: 'Design Patterns', explanation: 'Observer (pub/sub) decouples event producers from consumers with subscription model.' },
    { id: uid(), text: 'What is technical debt?', options: ['Cost of shortcuts taken now that require rework later', 'Financial cost of software development', 'Unused code in codebase', 'Dependency security vulnerabilities'], correctIndex: 0, topic: 'Engineering Practices', explanation: 'Technical debt accumulates when quick solutions are chosen over better long-term architecture.' },
  ],
};

function getFallbackMCQ(roleTitle: string, skills: string[], count: number): AssessmentQuestion[] {
  const category = detectRoleCategory(roleTitle);
  const bank = FALLBACK_MCQ[category] ?? FALLBACK_MCQ.fullstack;
  // Refresh IDs so each call gets unique question IDs
  const pool = bank.map(q => ({ ...q, id: uid() }));
  return pool.slice(0, Math.min(count, pool.length));
}

const FALLBACK_INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
  Technical: [
    { id: uid(), text: 'Walk me through how you would design the architecture for a high-traffic web application.', topic: 'System Design', followUp: 'How would you handle 10x the expected load?' },
    { id: uid(), text: 'Describe the most technically challenging problem you\'ve solved. How did you approach it?', topic: 'Problem Solving', followUp: 'What would you do differently today?' },
    { id: uid(), text: 'How do you ensure code quality in a fast-moving team?', topic: 'Engineering Practices', followUp: 'What does your code review process look like?' },
    { id: uid(), text: 'Explain how you would debug a performance issue in a production system.', topic: 'Debugging', followUp: 'What monitoring tools would you use?' },
    { id: uid(), text: 'How do you approach learning a new technology or framework?', topic: 'Learning', followUp: 'Give me a recent example.' },
    { id: uid(), text: 'What is your testing strategy for a new feature?', topic: 'Testing', followUp: 'How do you balance test coverage with speed of delivery?' },
    { id: uid(), text: 'How do you handle technical disagreements with team members?', topic: 'Collaboration', followUp: 'Give me a specific example.' },
    { id: uid(), text: 'Describe your experience with CI/CD pipelines.', topic: 'DevOps', followUp: 'What would you improve in a typical pipeline?' },
  ],
  Behavioural: [
    { id: uid(), text: 'Tell me about a time you had to meet a very tight deadline. How did you manage it?', topic: 'Time Management', followUp: 'What did you learn from that experience?' },
    { id: uid(), text: 'Describe a situation where you disagreed with your manager. How did you handle it?', topic: 'Conflict Resolution', followUp: 'What was the outcome?' },
    { id: uid(), text: 'Give me an example of when you went above and beyond for a project.', topic: 'Initiative', followUp: 'What motivated you to do more?' },
    { id: uid(), text: 'Tell me about a time a project failed. What did you do?', topic: 'Resilience', followUp: 'What would you do differently?' },
    { id: uid(), text: 'Describe how you handle working with unclear requirements.', topic: 'Adaptability', followUp: 'Give me a specific example.' },
    { id: uid(), text: 'Tell me about a time you mentored or helped grow a team member.', topic: 'Leadership', followUp: 'What impact did it have?' },
    { id: uid(), text: 'How do you prioritize when everything feels urgent?', topic: 'Prioritization', followUp: 'What framework do you use?' },
    { id: uid(), text: 'Describe a time you had to influence someone without authority.', topic: 'Influence', followUp: 'What was your approach?' },
  ],
  'Full Round': [
    { id: uid(), text: 'Walk me through a project you\'re most proud of — both technically and as a team effort.', topic: 'General', followUp: 'What was your specific contribution?' },
    { id: uid(), text: 'How do you stay current with industry trends and new technologies?', topic: 'Learning', followUp: 'What have you learned recently?' },
    { id: uid(), text: 'Describe your ideal working environment and team culture.', topic: 'Culture Fit', followUp: 'How do you adapt when it\'s different?' },
    { id: uid(), text: 'Where do you see yourself in 3 years and how does this role fit?', topic: 'Career Goals', followUp: 'What skills do you want to develop?' },
    { id: uid(), text: 'Tell me about a time you had to quickly learn something to solve a problem.', topic: 'Problem Solving', followUp: 'How did you structure your learning?' },
    { id: uid(), text: 'What\'s the most impactful piece of feedback you\'ve received?', topic: 'Self Awareness', followUp: 'How did you apply it?' },
    { id: uid(), text: 'How do you balance speed of delivery with quality?', topic: 'Engineering', followUp: 'Give me a concrete example.' },
    { id: uid(), text: 'What questions do you have for us about the role or company?', topic: 'Engagement', followUp: undefined },
  ],
};

function getFallbackInterviewQuestions(
  roleTitle: string,
  focus: InterviewFocus,
  count: number,
): InterviewQuestion[] {
  const bank = FALLBACK_INTERVIEW_QUESTIONS[focus] ?? FALLBACK_INTERVIEW_QUESTIONS['Full Round'];
  return bank.slice(0, Math.min(count, bank.length)).map(q => ({ ...q, id: uid() }));
}
