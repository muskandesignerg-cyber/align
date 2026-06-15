-- ================================================================
--  TALENT.LOGIC — SUPABASE SCHEMA v6
--
--  ✅ Safe to run on a COMPLETELY EMPTY Supabase project
--  ✅ Safe to re-run (fully idempotent — no errors, no duplicates)
--  ✅ NO demo / seed / mock data — clean production schema
--  ✅ All RLS gaps fixed (employer cross-reads for pipeline)
--  ✅ Withdraw application (candidate DELETE policy verified)
--  ✅ Passed-jobs persistence (feed never resets on refresh)
--
--  HOW TO USE:
--    1. Supabase Dashboard → SQL Editor → New Query
--    2. Paste ALL of this → Click RUN
--    3. Sign up in the app — jobs you post as employer appear
--       in the candidate feed immediately.
--
--  TABLES (7):
--    profiles               — shared: candidates + employers
--    candidate_skills       — CV skills (Groq-extracted or manual)
--    candidate_preferences  — job search settings
--    candidate_profile_data — full CV JSON (Groq AI parsed)
--    job_postings           — employer job listings (discover feed)
--    applications           — apply / withdraw pipeline
--    candidate_passed_jobs  — swiped-left history (no re-appear)
-- ================================================================


-- ================================================================
-- PART 1: TABLES  (in dependency order)
-- ================================================================

-- ── 1.1  PROFILES ─────────────────────────────────────────────────
-- One row per user. Both candidates AND employers share this table.
-- The "role" column determines which app experience they see.

create table if not exists public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  email               text,
  role                text        check (role in ('candidate', 'employer')),
  full_name           text,
  avatar_url          text,
  resume_url          text,
  onboarding_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Safe add-if-missing for columns that older schema versions may lack
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists resume_url text;

alter table public.profiles enable row level security;


-- ── 1.2  CANDIDATE SKILLS ─────────────────────────────────────────
-- Skills extracted from CV by Groq AI, or added manually by candidate.

create table if not exists public.candidate_skills (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  skill        text        not null,
  is_confirmed boolean     not null default true,
  created_at   timestamptz not null default now()
);

alter table public.candidate_skills enable row level security;


-- ── 1.3  CANDIDATE PREFERENCES ────────────────────────────────────
-- Job-search preferences: remote/hybrid/on-site, salary range, industries.

create table if not exists public.candidate_preferences (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        unique not null references public.profiles(id) on delete cascade,
  job_types    text[]      not null default '{}',
  work_model   text        check (work_model in ('Remote', 'Hybrid', 'On-site')),
  salary_min   integer     not null default 40,
  salary_max   integer     not null default 200,
  industries   text[]      not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.candidate_preferences enable row level security;


-- ── 1.4  CANDIDATE PROFILE DATA ───────────────────────────────────
-- Full structured JSON from CV: work experience, projects, education,
-- certifications — parsed by Groq AI during onboarding.

create table if not exists public.candidate_profile_data (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        unique not null references public.profiles(id) on delete cascade,
  profile_json jsonb       not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.candidate_profile_data enable row level security;


-- ── 1.5  JOB POSTINGS ─────────────────────────────────────────────
-- Created by employers via the "Post a Role" form.
-- Shown to candidates in the discover / swipe feed.

create table if not exists public.job_postings (
  id                  uuid        primary key default gen_random_uuid(),
  employer_id         uuid        not null references public.profiles(id) on delete cascade,
  role_title          text        not null,
  company_name        text        not null default '',
  employment_type     text        not null default 'Full Time',
  work_model          text        not null default 'Remote',
  location            text        not null default '',
  department          text        not null default '',
  salary_min          integer     not null default 0,
  salary_max          integer     not null default 0,
  currency            text        not null default 'INR',
  skills              text[]      not null default '{}',
  nice_to_have        text[]      not null default '{}',
  description         text        not null default '',
  years_experience    integer     not null default 0,
  company_description text        not null default '',
  company_size        text        not null default '',
  is_active           boolean     not null default true,
  requires_assessment boolean     not null default false,
  blind_audition      boolean     not null default false,
  posted_at           timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Safe add-if-missing for columns added after v1
alter table public.job_postings add column if not exists company_description text not null default '';
alter table public.job_postings add column if not exists company_size        text not null default '';

alter table public.job_postings enable row level security;

-- Unique constraint on (role_title, company_name).
-- Safe even if it already exists from earlier schema versions —
-- the DO block catches and ignores the duplicate error.
do $$
begin
  alter table public.job_postings
    add constraint job_postings_role_company_unique unique (role_title, company_name);
exception
  when duplicate_table then null;
  when others         then null;
end;
$$;


-- ── 1.6  APPLICATIONS ─────────────────────────────────────────────
-- Created when a candidate swipes right / taps Apply.
-- Employers move candidates through pipeline stages.
-- Candidates can DELETE their own row to withdraw.

create table if not exists public.applications (
  id             uuid        primary key default gen_random_uuid(),
  job_id         uuid        not null references public.job_postings(id) on delete cascade,
  candidate_id   uuid        not null references public.profiles(id)    on delete cascade,
  employer_id    uuid        not null references public.profiles(id)    on delete cascade,
  status         text        not null default 'Applied'
                             check (status in (
                               'Applied', 'In Review', 'Assessment Sent',
                               'Interviewing', 'Offer', 'Rejected'
                             )),
  pipeline_stage text        not null default 'new_matches'
                             check (pipeline_stage in (
                               'new_matches', 'testing', 'interview',
                               'hired', 'rejected'
                             )),
  applied_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(job_id, candidate_id)
);

alter table public.applications enable row level security;


-- ── 1.7  CANDIDATE PASSED JOBS ────────────────────────────────────
-- Tracks jobs a candidate has "passed" on (swiped left / dismissed).
-- Ensures dismissed cards never reappear in the discover feed after
-- the app is closed and reopened.

create table if not exists public.candidate_passed_jobs (
  id            uuid        primary key default gen_random_uuid(),
  candidate_id  uuid        not null references auth.users(id)          on delete cascade,
  job_id        uuid        not null references public.job_postings(id) on delete cascade,
  passed_at     timestamptz not null default now(),
  unique(candidate_id, job_id)
);

alter table public.candidate_passed_jobs enable row level security;

-- Fast lookup index — "what did THIS candidate already pass on?"
create index if not exists idx_candidate_passed_jobs_candidate
  on public.candidate_passed_jobs(candidate_id);


-- ================================================================
-- PART 2: ROW LEVEL SECURITY POLICIES
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 2.1  PROFILES
--
-- NOTE: Any authenticated user can READ any profile row.
-- This is intentional — employers need to read candidate names/
-- avatars in the pipeline (JOIN via applications table).
-- ────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own"        on public.profiles;
drop policy if exists "profiles_select_any_authed" on public.profiles;
drop policy if exists "profiles_insert_own"        on public.profiles;
drop policy if exists "profiles_update_own"        on public.profiles;

-- Any logged-in user can read any profile (required for employer pipeline)
create policy "profiles_select_any_authed"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only create their own profile row
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can only edit their own profile row
create policy "profiles_update_own"
  on public.profiles for update
  using     (auth.uid() = id)
  with check (auth.uid() = id);


-- ────────────────────────────────────────────────────────────────
-- 2.2  CANDIDATE SKILLS
--
-- NOTE: Any authenticated user can READ skills rows.
-- Employers use this for AI match scoring (getCandidateSkills).
-- ────────────────────────────────────────────────────────────────

drop policy if exists "skills_all_own"         on public.candidate_skills;
drop policy if exists "skills_read_any_authed" on public.candidate_skills;
drop policy if exists "skills_write_own"       on public.candidate_skills;

-- Any authenticated user can read skills (employer AI scoring)
create policy "skills_read_any_authed"
  on public.candidate_skills for select
  using (auth.role() = 'authenticated');

-- Only the candidate can insert / update / delete their own skills
create policy "skills_write_own"
  on public.candidate_skills for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- 2.3  CANDIDATE PREFERENCES  (private — only the owner)
-- ────────────────────────────────────────────────────────────────

drop policy if exists "prefs_all_own" on public.candidate_preferences;

create policy "prefs_all_own"
  on public.candidate_preferences for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- 2.4  CANDIDATE PROFILE DATA
--
-- NOTE: Any authenticated user can READ profile JSON.
-- Employers use this for AI match scoring (getCandidateProfileJson).
-- ────────────────────────────────────────────────────────────────

drop policy if exists "profile_data_all_own"         on public.candidate_profile_data;
drop policy if exists "profile_data_read_any_authed" on public.candidate_profile_data;
drop policy if exists "profile_data_write_own"       on public.candidate_profile_data;

-- Any authenticated user can read profile data (employer AI scoring)
create policy "profile_data_read_any_authed"
  on public.candidate_profile_data for select
  using (auth.role() = 'authenticated');

-- Only the candidate can write their own profile data
create policy "profile_data_write_own"
  on public.candidate_profile_data for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- 2.5  JOB POSTINGS
-- ────────────────────────────────────────────────────────────────

drop policy if exists "jobs_employer_all" on public.job_postings;
drop policy if exists "jobs_read_active"  on public.job_postings;

-- Employers: full CRUD on their own postings
create policy "jobs_employer_all"
  on public.job_postings for all
  using     (auth.uid() = employer_id)
  with check (auth.uid() = employer_id);

-- Everyone (candidates + employers): read all active job listings
create policy "jobs_read_active"
  on public.job_postings for select
  using (is_active = true);


-- ────────────────────────────────────────────────────────────────
-- 2.6  APPLICATIONS
-- ────────────────────────────────────────────────────────────────

drop policy if exists "apps_candidate_select" on public.applications;
drop policy if exists "apps_candidate_insert" on public.applications;
drop policy if exists "apps_candidate_delete" on public.applications;
drop policy if exists "apps_employer_select"  on public.applications;
drop policy if exists "apps_employer_update"  on public.applications;

-- Candidates: view their own applications (dashboard)
create policy "apps_candidate_select"
  on public.applications for select
  using (auth.uid() = candidate_id);

-- Candidates: submit a new application
create policy "apps_candidate_insert"
  on public.applications for insert
  with check (auth.uid() = candidate_id);

-- Candidates: WITHDRAW (delete) their own application ✅
create policy "apps_candidate_delete"
  on public.applications for delete
  using (auth.uid() = candidate_id);

-- Employers: view all applications for their jobs (pipeline)
create policy "apps_employer_select"
  on public.applications for select
  using (auth.uid() = employer_id);

-- Employers: move candidates through pipeline stages
create policy "apps_employer_update"
  on public.applications for update
  using     (auth.uid() = employer_id)
  with check (auth.uid() = employer_id);


-- ────────────────────────────────────────────────────────────────
-- 2.7  CANDIDATE PASSED JOBS
-- ────────────────────────────────────────────────────────────────

drop policy if exists "passed_jobs_select" on public.candidate_passed_jobs;
drop policy if exists "passed_jobs_insert" on public.candidate_passed_jobs;
drop policy if exists "passed_jobs_delete" on public.candidate_passed_jobs;

create policy "passed_jobs_select"
  on public.candidate_passed_jobs for select
  using (auth.uid() = candidate_id);

create policy "passed_jobs_insert"
  on public.candidate_passed_jobs for insert
  with check (auth.uid() = candidate_id);

create policy "passed_jobs_delete"
  on public.candidate_passed_jobs for delete
  using (auth.uid() = candidate_id);


-- ================================================================
-- PART 3: FUNCTIONS & TRIGGERS
-- ================================================================

-- ── 3.1  Auto-create profile row on new user signup ──────────────
-- Reads name/avatar from OAuth (Google, LinkedIn, email) metadata.
-- EXCEPTION block ensures a bug here NEVER blocks a signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email     = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 3.2  Auto-update updated_at on every row change ──────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated     on public.profiles;
drop trigger if exists trg_prefs_updated        on public.candidate_preferences;
drop trigger if exists trg_profile_data_updated on public.candidate_profile_data;
drop trigger if exists trg_jobs_updated         on public.job_postings;
drop trigger if exists trg_apps_updated         on public.applications;

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_prefs_updated
  before update on public.candidate_preferences
  for each row execute procedure public.set_updated_at();

create trigger trg_profile_data_updated
  before update on public.candidate_profile_data
  for each row execute procedure public.set_updated_at();

create trigger trg_jobs_updated
  before update on public.job_postings
  for each row execute procedure public.set_updated_at();

create trigger trg_apps_updated
  before update on public.applications
  for each row execute procedure public.set_updated_at();


-- ================================================================
-- PART 4: STORAGE — Resume PDFs
-- ================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Each user can only touch files inside resumes/{their_user_id}/
drop policy if exists "resume_upload" on storage.objects;
drop policy if exists "resume_read"   on storage.objects;
drop policy if exists "resume_delete" on storage.objects;

create policy "resume_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resume_read"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resume_delete"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ================================================================
-- PART 5: VERIFY — sanity check (runs automatically after RUN)
-- ================================================================

select
  tbl                          as "Table",
  total_rows                   as "Total Rows",
  active_rows                  as "Active"
from (
  select 'job_postings'        as tbl, count(*) as total_rows, count(*) filter (where is_active) as active_rows from public.job_postings
  union all
  select 'profiles',           count(*), null from public.profiles
  union all
  select 'applications',       count(*), null from public.applications
  union all
  select 'candidate_passed_jobs', count(*), null from public.candidate_passed_jobs
  union all
  select 'candidate_skills',   count(*), null from public.candidate_skills
  union all
  select 'candidate_profile_data', count(*), null from public.candidate_profile_data
  union all
  select 'candidate_preferences', count(*), null from public.candidate_preferences
) t
order by tbl;


-- ================================================================
-- ✅  TALENT.LOGIC SCHEMA v6 — COMPLETE
--
--  TABLES (7 total):
--    ✓ profiles                — shared: candidates + employers
--    ✓ candidate_skills        — CV skills (Groq-extracted or manual)
--    ✓ candidate_preferences   — job search settings
--    ✓ candidate_profile_data  — full CV JSON (Groq AI parsed)
--    ✓ job_postings            — employer job listings (discover feed)
--    ✓ applications            — apply / withdraw pipeline
--    ✓ candidate_passed_jobs   — swiped-left history (no re-appear)
--
--  RLS POLICIES (per table):
--    profiles              → any authed user can READ (pipeline join needs this)
--                            only owner can INSERT / UPDATE
--    candidate_skills      → any authed user can READ (employer AI scoring)
--                            only owner can write
--    candidate_preferences → owner only (private)
--    candidate_profile_data→ any authed user can READ (employer AI scoring)
--                            only owner can write
--    job_postings          → employer: full CRUD on own jobs
--                            everyone: read active listings
--    applications          → candidate: SELECT + INSERT + DELETE (withdraw) ✅
--                            employer:  SELECT + UPDATE (pipeline moves)
--    candidate_passed_jobs → candidate only (SELECT + INSERT + DELETE)
--
--  AUTOMATION:
--    ✓ handle_new_user  — profile row auto-created on every signup
--    ✓ set_updated_at   — updated_at auto-refreshed on all tables
--
--  STORAGE:
--    ✓ "resumes" bucket — private, PDF only, 10 MB max per file
--
--  SEED DATA:
--    ✗ None — clean production schema, no demo jobs
-- ================================================================
