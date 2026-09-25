-- Apply after workspace-platform.sql. No browser role may read even ciphertext.
create table if not exists public.kova_provider_connections (
 id uuid primary key,
 space_id uuid not null references public.kova_spaces(id) on delete cascade,
 provider text not null check (provider in ('openai','anthropic','openrouter','ollama','custom')),
 label text not null check (length(label) between 1 and 80),
 base_url text not null check (length(base_url) <= 2048 and base_url like 'https://%'),
 encrypted_credential text not null check (encrypted_credential like 'v1.%'),
 has_credential boolean not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists kova_provider_space_idx on public.kova_provider_connections(space_id);
alter table public.kova_provider_connections enable row level security;
alter table public.kova_provider_connections force row level security;
revoke all on public.kova_provider_connections from public, anon, authenticated;
grant select, insert, update, delete on public.kova_provider_connections to service_role;
-- Intentionally no client RLS policies. Server API verifies auth.getUser and
-- kova_members for every operation before using the server-only service role.
