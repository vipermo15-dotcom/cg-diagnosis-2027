-- 2027 컴그 자기진단 — 관리자(상담 신청 조회) RLS + RPC
-- supabase/schema.md → supabase/rls_and_rpc.sql 적용 이후에 실행한다.
--
-- 설계:
--   1) admin_users 테이블에 등록된 auth.users.id 만 관리자로 인정한다.
--      이 테이블에 직접 SELECT/INSERT 권한을 아무에게도 주지 않는다 —
--      등록은 기관 담당자가 Supabase 대시보드 SQL Editor(service_role)로 1회만 한다.
--   2) 로그인은 Supabase Auth 매직링크(이메일)를 사용한다. 비밀번호 저장 없음.
--   3) 상담 신청 목록 조회/상태 변경도 anon/authenticated 테이블 직접 권한이 아니라
--      RPC(SECURITY DEFINER, 함수 내부에서 is_admin() 체크) 로만 허용한다.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- 정책을 하나도 만들지 않는다 = anon/authenticated 는 이 테이블에 아예 접근 불가.
-- 등록/조회는 항상 service_role(대시보드 SQL Editor)로만 한다.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create or replace function public.admin_list_consultations()
returns table (
  id uuid,
  session_id uuid,
  preferred_course text,
  preferred_time text,
  message text,
  status text,
  requested_at timestamptz,
  course_direction text,
  result_title text,
  primary_track text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    c.id, c.session_id, c.preferred_course, c.preferred_time, c.message, c.status, c.created_at,
    r.course_direction, r.result_title, r.primary_track
  from public.consultation_requests c
  left join public.diagnosis_results r on r.session_id = c.session_id
  order by c.created_at desc;
end;
$$;

create or replace function public.admin_update_consultation_status(
  p_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_status not in ('new', 'contacted', 'done') then
    raise exception 'invalid status';
  end if;

  update public.consultation_requests set status = p_status where id = p_id;
end;
$$;

-- authenticated(로그인한 사용자) 에게만 실행 권한 부여. anon 은 여전히 접근 불가.
-- 함수 내부의 is_admin() 체크가 실제 권한 검사이므로, 로그인만 했다고 admin_users에
-- 등록되지 않은 사람이 호출하면 "not authorized" 예외로 거부된다.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_consultations() to authenticated;
grant execute on function public.admin_update_consultation_status(uuid, text) to authenticated;

-- 관리자 등록 방법 (기관 담당자, service_role 로 1회):
--   1) 관리자가 앱의 /#admin 화면에서 매직링크로 최초 로그인 시도 (auth.users 에 계정 생성됨)
--   2) Supabase 대시보드 → SQL Editor 에서:
--      insert into public.admin_users (user_id, email)
--      select id, email from auth.users where email = '관리자이메일@example.com';
