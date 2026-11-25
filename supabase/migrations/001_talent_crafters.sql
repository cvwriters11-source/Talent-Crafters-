-- Hosted Postgres schema for Talent Crafters.
-- The running application uses the server-side SQLite database in /data.
-- Apply this migration when the project is connected to Supabase.
-- Authorization lives in app_metadata-equivalent column profiles.role, never in user-editable metadata.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin', 'recruiter', 'employer', 'candidate')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  country text not null,
  location text not null,
  career_field text not null,
  years_experience integer not null check (years_experience between 0 and 60),
  qualification text not null,
  cv_path text,
  whatsapp_opt_in boolean not null default false,
  email_opt_in boolean not null default true
);

create table public.companies (
  id bigint generated always as identity primary key,
  owner_user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  normalized_name text not null,
  industry text,
  country text,
  city text,
  website text,
  careers_page text,
  hr_email text,
  recruitment_email text,
  general_email text,
  phone text,
  linkedin_url text,
  description text,
  source text not null default 'registered',
  contact_status text not null default 'unavailable',
  email_status text not null default 'unavailable',
  discovered_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index companies_owner_idx on public.companies (owner_user_id);
create index companies_norm_idx on public.companies (normalized_name);

create table public.jobs (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.companies (id) on delete cascade,
  posted_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text not null,
  requirements text,
  qualifications text,
  experience text,
  location text,
  city text,
  country text,
  salary_min integer,
  salary_max integer,
  employment_type text,
  experience_level text,
  industry text,
  category text,
  deadline date,
  source_url text,
  reference_code text,
  origin text not null check (origin in ('discovery', 'recruiter')),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, ''))
  ) stored
);
create index jobs_company_idx on public.jobs (company_id);
create index jobs_posted_by_idx on public.jobs (posted_by);
create index jobs_status_idx on public.jobs (status, created_at desc);
create index jobs_search_idx on public.jobs using gin (search_vector);
create unique index jobs_source_url_idx on public.jobs (source_url) where source_url is not null;

create table public.applications (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.jobs (id) on delete cascade,
  candidate_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_user_id)
);
create index applications_job_idx on public.applications (job_id);
create index applications_candidate_idx on public.applications (candidate_user_id);

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

create schema if not exists private;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $
  select role from public.profiles where id = (select auth.uid());
$;

revoke all on function private.current_role() from public;
grant execute on function private.current_role() to authenticated;

create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'));

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'))
  with check (id = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'));

create policy candidates_own on public.candidate_profiles
  for all to authenticated
  using (user_id = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'))
  with check (user_id = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'));

create policy jobs_public_read on public.jobs
  for select to anon
  using (status = 'published');

create policy jobs_member_read on public.jobs
  for select to authenticated
  using (status = 'published' or posted_by = (select auth.uid()) or (select private.current_role()) in ('admin', 'super_admin'));

create policy applications_parties on public.applications
  for select to authenticated
  using (
    candidate_user_id = (select auth.uid())
    or (select private.current_role()) in ('admin', 'super_admin')
    or exists (
      select 1 from public.jobs j
      join public.companies c on c.id = j.company_id
      where j.id = job_id and c.owner_user_id = (select auth.uid())
    )
  );
