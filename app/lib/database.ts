import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'candidate' | 'employer';

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidatePreferences {
  job_types: string[];
  work_model: 'Remote' | 'Hybrid' | 'On-site' | null;
  salary_min: number;
  salary_max: number;
  industries: string[];
}

/** Row shape from public.job_postings */
export interface JobPostingRow {
  id: string;
  employer_id: string;
  role_title: string;
  company_name: string;
  employment_type: string;
  work_model: string;
  location: string;
  department: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  skills: string[];
  nice_to_have: string[];
  description: string;
  years_experience: number;
  /** Added in schema v2 — company bio shown in Job Detail screen */
  company_description: string;
  /** Added in schema v2 — e.g. '50–200', '201–500' */
  company_size: string;
  is_active: boolean;
  requires_assessment: boolean;
  blind_audition: boolean;
  posted_at: string;
  updated_at: string;
}

/** Row shape from public.applications */
export interface ApplicationRow {
  id: string;
  job_id: string;
  candidate_id: string;
  employer_id: string;
  status: string;
  pipeline_stage: string;
  applied_at: string;
  updated_at: string;
  // Joined fields (when we select with job_postings)
  job_postings?: JobPostingRow;
  profiles?: Profile;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's profile.
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }
  return data as Profile;
};

/**
 * Create or update the user's profile (upsert).
 */
export const upsertProfile = async (
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
};

/**
 * Save resume URL to profile after upload.
 */
export const saveResumeUrl = async (
  userId: string,
  resumeUrl: string
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ resume_url: resumeUrl })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Mark onboarding as complete.
 */
export const completeOnboarding = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', userId);

  if (error) throw error;
};

// ─── Skills ──────────────────────────────────────────────────────────────────

/**
 * Replace all confirmed skills for a user (delete + insert).
 */
export const saveSkills = async (
  userId: string,
  skills: string[]
): Promise<void> => {
  // Delete existing skills
  const { error: deleteError } = await supabase
    .from('candidate_skills')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  if (skills.length === 0) return;

  // Insert new skills
  const rows = skills.map((skill) => ({
    user_id: userId,
    skill,
    is_confirmed: true,
  }));

  const { error: insertError } = await supabase
    .from('candidate_skills')
    .insert(rows);

  if (insertError) throw insertError;
};

/**
 * Fetch all confirmed skills for a user.
 */
export const getSkills = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('candidate_skills')
    .select('skill')
    .eq('user_id', userId)
    .eq('is_confirmed', true);

  if (error) throw error;
  return (data ?? []).map((row: { skill: string }) => row.skill);
};

// ─── Preferences ─────────────────────────────────────────────────────────────

/**
 * Save (upsert) candidate preferences.
 */
export const savePreferences = async (
  userId: string,
  prefs: CandidatePreferences
): Promise<void> => {
  const { error } = await supabase
    .from('candidate_preferences')
    .upsert(
      {
        user_id: userId,
        job_types: prefs.job_types,
        work_model: prefs.work_model,
        salary_min: prefs.salary_min,
        salary_max: prefs.salary_max,
        industries: prefs.industries,
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
};

/**
 * Fetch candidate preferences.
 */
export const getPreferences = async (
  userId: string
): Promise<CandidatePreferences | null> => {
  const { data, error } = await supabase
    .from('candidate_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CandidatePreferences;
};

// ─── Candidate Profile Data (full JSON) ──────────────────────────────────────

/**
 * Save the full profile data JSON (from onboarding ProfileBuilder).
 */
export const upsertCandidateProfileData = async (
  userId: string,
  profileJson: any
): Promise<void> => {
  const { error } = await supabase
    .from('candidate_profile_data')
    .upsert(
      { user_id: userId, profile_json: profileJson },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
};

/**
 * Fetch the full profile data JSON.
 */
export const getCandidateProfileData = async (
  userId: string
): Promise<any | null> => {
  const { data, error } = await supabase
    .from('candidate_profile_data')
    .select('profile_json')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data?.profile_json ?? null;
};

// ─── Job Postings ────────────────────────────────────────────────────────────

/**
 * Create a new job posting.
 */
export const createJobPosting = async (
  posting: Omit<JobPostingRow, 'id' | 'posted_at' | 'updated_at'>
): Promise<JobPostingRow> => {
  const { data, error } = await supabase
    .from('job_postings')
    .insert(posting)
    .select()
    .single();

  if (error) throw error;
  return data as JobPostingRow;
};

/**
 * Fetch all active job postings (for candidate discover feed).
 */
export const getActiveJobPostings = async (): Promise<JobPostingRow[]> => {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('is_active', true)
    .order('posted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as JobPostingRow[];
};

/**
 * Fetch job postings created by a specific employer.
 */
export const getJobPostingsByEmployer = async (
  employerId: string
): Promise<JobPostingRow[]> => {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .eq('employer_id', employerId)
    .order('posted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as JobPostingRow[];
};

// ─── Applications ────────────────────────────────────────────────────────────

/**
 * Create a new application (candidate applies to a job).
 */
export const createApplication = async (
  jobId: string,
  candidateId: string,
  employerId: string
): Promise<ApplicationRow> => {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      employer_id: employerId,
      status: 'Applied',
      pipeline_stage: 'new_matches',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ApplicationRow;
};

/**
 * Fetch all applications for a candidate (with job details joined).
 */
export const getApplicationsForCandidate = async (
  candidateId: string
): Promise<ApplicationRow[]> => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, job_postings(*)')
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApplicationRow[];
};

/**
 * Fetch all job IDs the candidate has already applied to.
 * Used to filter out applied jobs from the discover feed on load.
 */
export const getAppliedJobIds = async (
  candidateId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('applications')
    .select('job_id')
    .eq('candidate_id', candidateId);

  if (error) return [];
  return (data ?? []).map((r: { job_id: string }) => r.job_id);
};

/**
 * Record a "passed" (swiped left) job so it doesn't reappear after refresh.
 * Uses a simple upsert on a candidate_passed_jobs table.
 * Gracefully ignores errors if the table doesn't exist yet.
 */
export const recordPassedJob = async (
  candidateId: string,
  jobId: string,
): Promise<void> => {
  try {
    await supabase
      .from('candidate_passed_jobs')
      .upsert({ candidate_id: candidateId, job_id: jobId }, { onConflict: 'candidate_id,job_id' });
  } catch {
    // Table may not exist yet — silently ignore
  }
};

/**
 * Fetch all job IDs the candidate has already passed on.
 * Gracefully returns [] if the table doesn't exist yet.
 */
export const getPassedJobIds = async (
  candidateId: string,
): Promise<string[]> => {
  try {
    const { data } = await supabase
      .from('candidate_passed_jobs')
      .select('job_id')
      .eq('candidate_id', candidateId);
    return (data ?? []).map((r: { job_id: string }) => r.job_id);
  } catch {
    return [];
  }
};


/**
 * Fetch all applications for a specific job (employer views pipeline).
 */
export const getApplicationsForJob = async (
  jobId: string
): Promise<ApplicationRow[]> => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles!applications_candidate_id_fkey(*)')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApplicationRow[];
};

/**
 * Fetch all applications across all jobs for an employer.
 */
export const getApplicationsForEmployer = async (
  employerId: string
): Promise<ApplicationRow[]> => {
  const { data, error } = await supabase
    .from('applications')
    .select('*, job_postings(*), profiles!applications_candidate_id_fkey(*)')
    .eq('employer_id', employerId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApplicationRow[];
};

/**
 * Update application status (candidate side — e.g. "Interviewing").
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: string
): Promise<void> => {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);

  if (error) throw error;
};

/**
 * Update application pipeline stage (employer side — e.g. "interview").
 */
export const updateApplicationPipelineStage = async (
  applicationId: string,
  pipelineStage: string,
  status: string
): Promise<void> => {
  const { error } = await supabase
    .from('applications')
    .update({ pipeline_stage: pipelineStage, status })
    .eq('id', applicationId);

  if (error) throw error;
};

/**
 * Withdraw an application (delete it).
 * Filters by both id AND candidate_id so the RLS policy is never ambiguous.
 */
export const withdrawApplication = async (
  applicationId: string
): Promise<void> => {
  console.log('[DB] Withdrawing application:', applicationId);
  const { error, count } = await supabase
    .from('applications')
    .delete({ count: 'exact' })
    .eq('id', applicationId);

  if (error) {
    console.error('[DB] withdrawApplication error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to withdraw application');
  }
  console.log('[DB] Withdraw success, rows deleted:', count);
};

/**
 * Fetch skills for ANY candidate (used by employer matching engine).
 * Returns skill names from candidate_skills table.
 */
export const getCandidateSkills = async (
  candidateId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('candidate_skills')
    .select('skill')
    .eq('user_id', candidateId)
    .eq('is_confirmed', true);

  if (error) return [];
  return (data ?? []).map((row: { skill: string }) => row.skill);
};

/**
 * Fetch full profile JSON for ANY candidate (used by employer matching engine).
 */
export const getCandidateProfileJson = async (
  candidateId: string
): Promise<any | null> => {
  const { data, error } = await supabase
    .from('candidate_profile_data')
    .select('profile_json')
    .eq('user_id', candidateId)
    .single();

  if (error) return null;
  return data?.profile_json ?? null;
};

// ─── Messaging ────────────────────────────────────────────────────────────────

export interface ConversationRow {
  id: string;
  employer_id: string;
  candidate_id: string;
  job_id: string | null;
  last_message: string;
  last_message_at: string;
  created_at: string;
  employer?: { full_name: string; avatar_url: string | null };
  candidate?: { full_name: string; avatar_url: string | null };
  job?: { role_title: string } | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Fetch all conversations for a user (as employer OR candidate).
 * Joins the other party's profile + job title.
 */
export const getConversations = async (
  userId: string
): Promise<ConversationRow[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      employer:profiles!conversations_employer_id_fkey(full_name, avatar_url),
      candidate:profiles!conversations_candidate_id_fkey(full_name, avatar_url),
      job:job_postings(role_title)
    `)
    .or(`employer_id.eq.${userId},candidate_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.warn('[DB] getConversations error:', error.message);
    return [];
  }
  return (data ?? []) as ConversationRow[];
};

/**
 * Get or create a conversation between employer and candidate.
 * Returns the existing row if one already exists.
 */
export const getOrCreateConversation = async (
  employerId: string,
  candidateId: string,
  jobId?: string
): Promise<ConversationRow> => {
  // Try to find existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (existing) return existing as ConversationRow;

  // Create new
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      employer_id: employerId,
      candidate_id: candidateId,
      job_id: jobId ?? null,
      last_message: '',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ConversationRow;
};

/**
 * Fetch all messages in a conversation, oldest first.
 */
export const getMessages = async (
  conversationId: string
): Promise<MessageRow[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[DB] getMessages error:', error.message);
    return [];
  }
  return (data ?? []) as MessageRow[];
};

/**
 * Send a message. Also updates the conversation's last_message + last_message_at.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageRow> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  if (error) throw error;

  // Update conversation's last_message preview
  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data as MessageRow;
};

/**
 * Mark all messages in a conversation as read (for a specific recipient).
 */
export const markMessagesAsRead = async (
  conversationId: string,
  recipientId: string
): Promise<void> => {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', recipientId);
};

