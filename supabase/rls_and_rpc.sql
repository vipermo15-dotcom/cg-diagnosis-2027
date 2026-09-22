-- 2027 컴그 자기진단 — RLS + RPC (schema.md 적용 후 실행)
--
-- 설계 원칙:
--   1) 익명 방문자(anon key)는 어떤 테이블도 직접 SELECT/INSERT/UPDATE 할 수 없다.
--      (RLS를 켜고 anon용 정책을 하나도 만들지 않으면 기본적으로 전부 거부된다)
--   2) 대신 SECURITY DEFINER 함수(RPC) 4개만 anon에게 실행 권한을 준다.
--      각 함수는 꼭 필요한 필드만 받고, 꼭 필요한 만큼만 쓴다. 목록 조회는 없다.
--   3) 강사/관리자 조회는 service_role 키(서버 전용, Supabase 대시보드 SQL Editor 또는
--      추후 관리자 화면의 서버사이드 전용)로만 한다. anon 키로는 절대 목록을 볼 수 없다.
--
-- 이 파일은 supabase/schema.md 의 테이블 생성 SQL을 먼저 실행한 뒤에 적용한다.

-- 1) RLS 활성화는 schema.md 에 이미 포함되어 있음 (alter table ... enable row level security).
--    여기서는 anon/authenticated 기본 권한을 명시적으로 걷어내고 RPC 전용으로 만든다.

revoke all on public.applicants from anon, authenticated;
revoke all on public.diagnosis_sessions from anon, authenticated;
revoke all on public.diagnosis_answers from anon, authenticated;
revoke all on public.diagnosis_scores from anon, authenticated;
revoke all on public.diagnosis_results from anon, authenticated;
revoke all on public.life_stage_profiles from anon, authenticated;
revoke all on public.career_profiles from anon, authenticated;
revoke all on public.job_tracks from anon, authenticated;
revoke all on public.course_recommendations from anon, authenticated;
revoke all on public.consultation_requests from anon, authenticated;
revoke all on public.application_conversion from anon, authenticated;

-- 2) RPC 함수 4개 — 프론트(src/services/supabase.ts)가 실제로 호출하는 것만 최소로 만든다.

create or replace function public.create_diagnosis_session()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.diagnosis_sessions (status, diagnosis_version)
  values ('started', '1.0.0')
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.save_diagnosis_answer(
  p_session_id uuid,
  p_question_id text,
  p_answer_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.diagnosis_sessions where id = p_session_id) then
    raise exception 'invalid session';
  end if;

  insert into public.diagnosis_answers (session_id, question_id, answer_value)
  values (p_session_id, p_question_id, p_answer_value)
  on conflict (session_id, question_id)
  do update set answer_value = excluded.answer_value, answered_at = now();
end;
$$;

create or replace function public.save_diagnosis_result(
  p_session_id uuid,
  p_life_stage text,
  p_course_direction text,
  p_primary_track text,
  p_secondary_track text,
  p_night_career_track text,
  p_result_title text,
  p_result_summary text,
  p_ai_profile jsonb,
  p_roadmap jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.diagnosis_sessions where id = p_session_id) then
    raise exception 'invalid session';
  end if;

  insert into public.diagnosis_results (
    session_id, life_stage, course_direction, primary_track, secondary_track,
    night_career_track, result_title, result_summary, ai_profile, roadmap
  )
  values (
    p_session_id, p_life_stage, p_course_direction, p_primary_track, p_secondary_track,
    p_night_career_track, p_result_title, p_result_summary, p_ai_profile, p_roadmap
  )
  on conflict (session_id) do update set
    life_stage = excluded.life_stage,
    course_direction = excluded.course_direction,
    primary_track = excluded.primary_track,
    secondary_track = excluded.secondary_track,
    night_career_track = excluded.night_career_track,
    result_title = excluded.result_title,
    result_summary = excluded.result_summary,
    ai_profile = excluded.ai_profile,
    roadmap = excluded.roadmap;

  update public.diagnosis_sessions set status = 'completed', completed_at = now()
  where id = p_session_id;
end;
$$;

create or replace function public.submit_consultation(
  p_session_id uuid,
  p_preferred_course text,
  p_preferred_time text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.consultation_requests (session_id, preferred_course, preferred_time, message, status)
  values (p_session_id, p_preferred_course, p_preferred_time, p_message, 'new');
end;
$$;

-- 3) anon 에게 함수 실행 권한만 부여 (테이블 직접 권한은 위에서 revoke 했으므로 안전)
grant execute on function public.create_diagnosis_session() to anon;
grant execute on function public.save_diagnosis_answer(uuid, text, jsonb) to anon;
grant execute on function public.save_diagnosis_result(uuid, text, text, text, text, text, text, text, jsonb, jsonb) to anon;
grant execute on function public.submit_consultation(uuid, text, text, text) to anon;

-- 4) 강사/관리자 조회용 — service_role 키로만 접근 가능 (RLS는 service_role을 우회하므로 별도 정책 불필요).
--    나중에 관리자 화면을 만들 경우, anon/authenticated 로 SELECT 정책을 추가하지 말고
--    반드시 서버사이드(Edge Function 또는 자체 백엔드)에서 service_role 키로 조회할 것.
