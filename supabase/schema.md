# Supabase Schema

```sql
create extension if not exists pgcrypto;

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  name text, phone text, email text, age_group text,
  consent_privacy boolean not null default false,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references public.applicants(id) on delete set null,
  diagnosis_version text not null default '1.0.0', status text not null default 'started',
  source text, campaign text, started_at timestamptz not null default now(), completed_at timestamptz, created_at timestamptz not null default now()
);
create table public.diagnosis_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnosis_sessions(id) on delete cascade,
  question_id text not null, answer_value jsonb not null, answered_at timestamptz not null default now(),
  unique(session_id, question_id)
);
create table public.diagnosis_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnosis_sessions(id) on delete cascade,
  score_type text not null, score_key text not null, score numeric not null, rank integer, created_at timestamptz not null default now(),
  unique(session_id, score_type, score_key)
);
create table public.diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.diagnosis_sessions(id) on delete cascade,
  life_stage text, primary_goal text, secondary_goal text, course_direction text, primary_track text, secondary_track text, night_career_track text,
  result_title text, result_summary text, ai_profile jsonb, roadmap jsonb, next_actions jsonb, created_at timestamptz not null default now()
);
create table public.life_stage_profiles (id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.applicants(id) on delete cascade, life_stage text not null, current_status text, future_goal text, previous_experience text, desired_change text, created_at timestamptz not null default now());
create table public.career_profiles (id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.applicants(id) on delete cascade, previous_job text, previous_industry text, experience_years numeric, existing_skills jsonb, transferable_skills jsonb, desired_future_role text, created_at timestamptz not null default now());
create table public.job_tracks (id text primary key, name text not null, description text, keywords jsonb, active boolean not null default true, display_order integer default 0);
create table public.course_recommendations (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.diagnosis_sessions(id) on delete cascade, course_code text not null, course_name text not null, recommendation_type text, match_score numeric, reasons jsonb, related_areas jsonb, created_at timestamptz not null default now());
create table public.consultation_requests (id uuid primary key default gen_random_uuid(), applicant_id uuid references public.applicants(id) on delete set null, session_id uuid references public.diagnosis_sessions(id) on delete set null, preferred_course text, preferred_time text, consultation_type text, message text, status text not null default 'new', created_at timestamptz not null default now());
create table public.application_conversion (id uuid primary key default gen_random_uuid(), applicant_id uuid references public.applicants(id) on delete set null, diagnosis_session_id uuid references public.diagnosis_sessions(id) on delete set null, recommended_course text, applied_course text, conversion_status text not null default 'interested', applied_at timestamptz, enrolled_at timestamptz, created_at timestamptz not null default now());

create index idx_sessions_status on public.diagnosis_sessions(status);
create index idx_sessions_created on public.diagnosis_sessions(created_at);
create index idx_answers_session on public.diagnosis_answers(session_id);
create index idx_scores_session on public.diagnosis_scores(session_id);
create index idx_results_track on public.diagnosis_results(primary_track);
create index idx_consultation_status on public.consultation_requests(status);
create index idx_conversion_status on public.application_conversion(conversion_status);

alter table public.applicants enable row level security;
alter table public.diagnosis_sessions enable row level security;
alter table public.diagnosis_answers enable row level security;
alter table public.diagnosis_scores enable row level security;
alter table public.diagnosis_results enable row level security;
alter table public.life_stage_profiles enable row level security;
alter table public.career_profiles enable row level security;
alter table public.job_tracks enable row level security;
alter table public.course_recommendations enable row level security;
alter table public.consultation_requests enable row level security;
alter table public.application_conversion enable row level security;
```

RLS 정책과 Edge Function은 기관 개인정보 정책에 맞춰 별도 확정한다.
