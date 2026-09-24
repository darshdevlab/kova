-- Kova core persistence schema. Apply this to a dedicated Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Draft' check (status in ('Draft', 'Building', 'Ready', 'Live')),
  source text not null default 'Prompt',
  workspace_mode text not null default 'Guided' check (workspace_mode in ('Guided', 'Developer')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Build conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model_id text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.project_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_updated_idx on public.projects (owner_id, updated_at desc);
create index if not exists conversations_project_idx on public.conversations (project_id, updated_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists project_events_project_idx on public.project_events (project_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.project_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "projects_select_own" on public.projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy "projects_insert_own" on public.projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "projects_update_own" on public.projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "projects_delete_own" on public.projects for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "conversations_select_own" on public.conversations for select to authenticated using ((select auth.uid()) = owner_id);
create policy "conversations_insert_own" on public.conversations for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "conversations_update_own" on public.conversations for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "conversations_delete_own" on public.conversations for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "messages_select_own" on public.messages for select to authenticated using ((select auth.uid()) = owner_id);
create policy "messages_insert_own" on public.messages for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "messages_update_own" on public.messages for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "messages_delete_own" on public.messages for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "events_select_own" on public.project_events for select to authenticated using ((select auth.uid()) = owner_id);
create policy "events_insert_own" on public.project_events for insert to authenticated with check ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert on public.project_events to authenticated;
grant usage, select on sequence public.project_events_id_seq to authenticated;
