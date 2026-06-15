-- ================================================================
--  TALENT.LOGIC — MESSAGING SCHEMA (run in Supabase SQL Editor)
--
--  Adds two new tables:
--    conversations  — one thread per employer-candidate pair
--    messages       — individual chat messages
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → New Query → Paste → RUN
-- ================================================================

-- ── conversations ─────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id              uuid        primary key default gen_random_uuid(),
  employer_id     uuid        not null references public.profiles(id) on delete cascade,
  candidate_id    uuid        not null references public.profiles(id) on delete cascade,
  job_id          uuid        references public.job_postings(id) on delete set null,
  last_message    text        default '',
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique(employer_id, candidate_id)
);

alter table public.conversations enable row level security;

drop policy if exists "conv_participant_select" on public.conversations;
drop policy if exists "conv_participant_insert" on public.conversations;
drop policy if exists "conv_participant_update" on public.conversations;

create policy "conv_participant_select"
  on public.conversations for select
  using (auth.uid() = employer_id or auth.uid() = candidate_id);

create policy "conv_participant_insert"
  on public.conversations for insert
  with check (auth.uid() = employer_id or auth.uid() = candidate_id);

create policy "conv_participant_update"
  on public.conversations for update
  using (auth.uid() = employer_id or auth.uid() = candidate_id);


-- ── messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references public.profiles(id)      on delete cascade,
  content         text        not null,
  is_read         boolean     not null default false,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "msg_participant_select" on public.messages;
drop policy if exists "msg_participant_insert" on public.messages;
drop policy if exists "msg_mark_read"          on public.messages;

create policy "msg_participant_select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

create policy "msg_participant_insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

create policy "msg_mark_read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

-- Enable real-time
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

select 'conversations' as tbl, count(*) as rows from public.conversations
union all
select 'messages', count(*) from public.messages;
