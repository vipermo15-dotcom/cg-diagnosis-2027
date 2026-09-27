-- 2027 컴그 자기진단 — 예비 지원자 "내 결과 다시 보기" RLS + RPC
-- schema.md → rls_and_rpc.sql → admin_rls.sql 적용 이후, 이 파일을 실행한다.
--
-- 설계:
--   1) applicants 테이블(기존에 존재하지만 미사용)에 user_id를 추가해 로그인 계정과 연결한다.
--   2) 진단 완료 화면에서 이메일을 남기면(선택) link_result_to_email 로 세션과 이메일을 연결한다.
--      이 시점엔 아직 로그인하지 않았으므로 anon 실행 가능하다.
--   3) 나중에 그 이메일로 매직링크 로그인하면 claim_applicant_account 가 계정을 연결한다.
--   4) get_my_results 는 로그인한 사람 소유의 최신 진단 결과 1건만 반환한다.
--   5) 관리자와 마찬가지로 applicants/diagnosis_results 를 anon/authenticated 가 직접
--      SELECT 하는 정책은 하나도 만들지 않는다 — 전부 이 3개 RPC로만 접근한다.

-- 1) applicants 연결 컬럼 + email unique 제약 (원래 없었음 — upsert 기준으로 필요)
alter table public.applicants
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

do $$
begin
  alter table public.applicants add constraint applicants_email_key unique (email);
exception
  when duplicate_object then null;
end $$;

-- 2) 다시보기용 저장 컬럼 (지금까지는 저장되지 않던 필드)
alter table public.diagnosis_results
  add column if not exists course_comparison jsonb;

-- 3) RLS 활성화, 정책 없음 = anon/authenticated 직접 접근 전부 차단
alter table public.applicants enable row level security;

-- 4) RPC 3개

create or replace function public.link_result_to_email(
  p_session_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant_id uuid;
begin
  if not exists (select 1 from public.diagnosis_sessions where id = p_session_id) then
    raise exception 'invalid session';
  end if;

  -- consent_privacy는 이 기능과 무관한 별도 동의 항목이므로 여기서 건드리지 않는다.
  -- Supabase Auth는 JWT의 email을 소문자로 정규화하므로, 나중에 claim_applicant_account가
  -- 대소문자 차이로 매칭에 실패하지 않도록 저장 시점에 미리 소문자로 정규화한다.
  insert into public.applicants (email)
  values (lower(trim(p_email)))
  on conflict (email) do update set email = excluded.email
  returning id into v_applicant_id;

  update public.diagnosis_sessions set applicant_id = v_applicant_id where id = p_session_id;
end;
$$;

create or replace function public.claim_applicant_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applicants
  set user_id = auth.uid()
  where lower(email) = lower(auth.jwt() ->> 'email')
    and user_id is null;
end;
$$;

create or replace function public.get_my_results()
returns table (
  session_id uuid,
  life_stage text,
  course_direction text,
  primary_track text,
  secondary_track text,
  night_career_track text,
  result_title text,
  result_summary text,
  ai_profile jsonb,
  roadmap jsonb,
  course_comparison jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select r.session_id, r.life_stage, r.course_direction, r.primary_track, r.secondary_track,
         r.night_career_track, r.result_title, r.result_summary,
         r.ai_profile, r.roadmap, r.course_comparison, r.created_at
  from public.diagnosis_results r
  join public.diagnosis_sessions s on s.id = r.session_id
  join public.applicants a on a.id = s.applicant_id
  where a.user_id = auth.uid()
  order by r.created_at desc
  limit 1;
end;
$$;

-- 5) 권한 부여
grant execute on function public.link_result_to_email(uuid, text) to anon;
grant execute on function public.claim_applicant_account() to authenticated;
grant execute on function public.get_my_results() to authenticated;
