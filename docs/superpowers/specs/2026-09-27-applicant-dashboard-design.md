# 예비 지원자 "내 결과 다시 보기" 설계

- 작성일: 2026-09-27
- 관련 요청: "대시보드 사용자 추가: 학과장, 예비 지원자"
- 범위: 이 문서는 **예비 지원자** 기능만 다룬다. **학과장**은 코드 변경이 필요 없다 —
  기존 관리자(`/#admin`)와 완전히 동일한 권한으로, 매직링크 로그인 1회 후
  `admin_users`에 이메일을 등록하기만 하면 된다 (운영 작업, 설계 불필요).

## 목적

지금은 진단이 완전히 익명이라 완료 후 브라우저를 닫으면 결과를 다시 볼 방법이 없다.
예비 지원자가 원할 경우 이메일을 (선택적으로) 남기고, 나중에 매직링크로 로그인해서
자신의 최신 진단 결과를 다시 확인할 수 있게 한다.

## 핵심 결정 사항 (사용자 승인됨)

1. 이메일 입력은 **선택 사항** — 결과 요약 화면(첫 화면)에 입력란 + 저장 버튼을 두되,
   건너뛰어도 진행에 지장 없음.
2. 인증 방식은 관리자와 동일한 **Supabase Auth 매직링크**를 재사용하되, 권한은
   완전히 분리한다 (관리자 RPC와 예비지원자 RPC는 서로 접근 불가).
3. 다시보기 화면은 **한 페이지 스크롤형 요약**(상담신청/지원 CTA 없이 결과만) —
   원래의 9단계 위저드를 그대로 재현하지 않는다.
4. 야간 진로트랙은 다시보기에서 **1순위만** 표시한다 (2순위/동점 표시는 생략).
5. `diagnosis_results`에 `course_comparison jsonb` 컬럼을 신규 추가해서, 다시보기 때
   "관련 과정 비교" 카드도 원래 결과와 동일하게 보여준다 (현재는 저장되지 않음).

## 아키텍처

```
[진단 완료 화면]
   └─ (선택) 이메일 입력 → link_result_to_email(session_id, email) RPC
                              └─ applicants 테이블에 upsert, diagnosis_sessions.applicant_id 연결

[/#my 진입]
   └─ 매직링크 로그인 (Supabase Auth, redirectTo에 ?portal=my 마커 포함)
   └─ 로그인 콜백 수신 시 claim_applicant_account() RPC
                              └─ applicants.user_id = auth.uid()  (email 일치 + user_id 미설정 조건)
   └─ get_my_results() RPC
                              └─ 로그인한 user_id 소유의 최신 diagnosis_results 1건 반환
   └─ 저장된 컬럼(jsonb 포함)으로 DiagnosisResult 형태를 재구성해
      기존 결과 화면 컴포넌트(ResultSummary, JobTrackView, CourseDirectionView,
      CourseComparisonView, RoadmapView, NightCareerView, AiProfileView)를
      스크롤형 한 페이지에 순서대로 렌더링
```

**관리자(`/#admin`)와 예비지원자(`/#my`) 매직링크 혼동 방지**: 직전에 관리자 매직링크가
`#access_token=...`으로 돌아오면서 라우팅이 꼬였던 버그를 겪었으므로, 이번엔 처음부터
`redirectTo`에 쿼리스트링 마커를 심는다.
- 관리자: `emailRedirectTo = origin + base` (기존과 동일)
- 예비지원자: `emailRedirectTo = origin + base + '?portal=my'`

`main.tsx`의 라우팅 판정을 다음과 같이 확장한다:
```
search.includes('portal=my') → MyApp
hash startsWith '#my' → MyApp
hash startsWith '#admin' → AdminApp
hash includes 'access_token=' (portal 마커 없음, 기존 관리자 흐름) → AdminApp
그 외 → App (일반 진단 위저드)
```

## 데이터 모델 변경 (`supabase/applicant_rls.sql` 신규 파일)

```sql
-- 1) applicants 테이블은 이미 존재하지만 지금은 전혀 쓰이지 않는다.
--    로그인 계정과 연결하기 위한 컬럼을 추가한다.
alter table public.applicants
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- email에는 원래 unique 제약이 없었다 (schema.md 확인 완료) — upsert 기준으로 쓰려면 필요.
alter table public.applicants
  add constraint applicants_email_key unique (email);

-- 2) diagnosis_results 에 course_comparison 저장 컬럼 추가 (현재 미저장 필드).
alter table public.diagnosis_results
  add column if not exists course_comparison jsonb;

alter table public.applicants enable row level security;
-- admin_users와 동일하게 정책을 하나도 만들지 않는다 = anon/authenticated 직접 접근 불가.
-- 전부 아래 SECURITY DEFINER RPC로만 접근한다.

create or replace function public.link_result_to_email(
  p_session_id uuid,
  p_email text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_applicant_id uuid;
begin
  if not exists (select 1 from public.diagnosis_sessions where id = p_session_id) then
    raise exception 'invalid session';
  end if;

  -- consent_privacy는 이 기능과 무관한 별도 동의 항목이므로 여기서 건드리지 않는다
  -- (기본값 false 유지 — 필요해지면 별도 동의 체크박스와 함께 다룬다).
  insert into public.applicants (email)
  values (p_email)
  on conflict (email) do update set email = excluded.email
  returning id into v_applicant_id;

  update public.diagnosis_sessions set applicant_id = v_applicant_id where id = p_session_id;
end;
$$;

create or replace function public.claim_applicant_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.applicants
  set user_id = auth.uid()
  where email = auth.jwt() ->> 'email'
    and user_id is null;
end;
$$;

create or replace function public.get_my_results()
returns table (
  session_id uuid,
  life_stage text, course_direction text, primary_track text, secondary_track text,
  night_career_track text, result_title text, result_summary text,
  ai_profile jsonb, roadmap jsonb, course_comparison jsonb, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
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

grant execute on function public.link_result_to_email(uuid, text) to anon;
grant execute on function public.claim_applicant_account() to authenticated;
grant execute on function public.get_my_results() to authenticated;
```

`save_diagnosis_result` RPC ([supabase/rls_and_rpc.sql](../../../supabase/rls_and_rpc.sql))에
`p_course_comparison jsonb` 파라미터를 추가하고 insert/update 목록에 `course_comparison`을
포함하도록 수정한다 (기존 함수를 `create or replace`).

## 프론트엔드 변경

1. **`src/services/supabase.ts`**
   - `saveResult()`가 `p_course_comparison: result.courseComparison`도 함께 전달하도록 수정.
   - 신규: `linkResultToEmail(sessionId, email)` → `link_result_to_email` RPC 호출.

2. **`src/pages/result/ResultSummary.tsx`**
   - 이메일 입력 + "이메일로 저장하기" 버튼을 카드 형태로 추가 (선택 사항, 비워두고
     다음으로 넘어가도 무방). 저장 성공 시 "이 이메일로 나중에 다시 확인하실 수
     있어요" 인라인 확인 문구.

3. **`src/services/applicant.ts`** (신규, `supabaseAdmin.ts`와 병렬 구조)
   - `sendMyMagicLink(email)` — `emailRedirectTo`에 `?portal=my` 포함.
   - `getMySession()`, `onMyAuthStateChange()`, `signOutMy()`, `claimAccount()`,
     `getMyResults()`.

4. **`src/my/MyApp.tsx`, `src/my/MyLogin.tsx`, `src/my/MyResultView.tsx`** (신규 디렉터리)
   - `MyApp`: 세션 있으면 `claimAccount()` → `getMyResults()` → `MyResultView`,
     없으면 `MyLogin`.
   - `MyResultView`: 저장된 컬럼으로 `DiagnosisResult` 형태 재구성 후, 기존
     `ResultSummary/JobTrackView/CourseDirectionView/CourseComparisonView/
     RoadmapView/AiProfileView`를 순서대로 스크롤 렌더링. `nightCareerTrack`이
     있으면 `NightCareerView`에 `{ primary: night_career_track, secondary: undefined,
     showBoth: false, scores: [] }` 형태로 최소 구성해 전달.
   - 결과가 없으면 ("아직 저장된 결과가 없어요, 진단을 먼저 완료해주세요") 안내.

5. **`src/main.tsx`**: 위 "관리자/예비지원자 라우팅 판정" 로직 반영 (3-way).

## 에러 처리

- `link_result_to_email`에 세션이 없으면 예외 → 프론트는 저장 실패 토스트만 보여주고
  결과 화면 진행은 막지 않는다 (선택 기능이므로 실패해도 치명적이지 않음).
- `get_my_results`가 빈 결과를 주면(계정은 있지만 연결된 진단이 없는 경우)
  MyResultView는 안내 문구만 표시.
- 매직링크 클릭 후 `claim_applicant_account`가 매칭되는 `applicants.email`이 없으면
  (진단 완료 시 이메일 저장을 한 적 없는 사람이 `/#my`로 로그인 시도한 경우)
  자동으로는 아무 것도 연결되지 않고 `get_my_results`는 빈 결과를 반환한다 — 정상 동작.

## 테스트 계획

1. **엔진/RPC 시나리오 테스트** (지난 QA와 동일한 방식): 브라우저 콘솔에서
   `link_result_to_email` → `claim_applicant_account`(로그인 시뮬레이션 어려우므로
   SQL Editor로 수동 검증) → `get_my_results` 흐름을 직접 RPC 호출해 데이터 무결성 확인.
   또한 anon 키로 `applicants`/`diagnosis_results` 직접 SELECT가 막히는지(RLS) 재확인.
2. **전체 화면 클릭 테스트**: 40문항 완주 → 결과 요약 화면에서 이메일 저장 →
   `/#my`에서 매직링크 로그인 → 저장된 결과가 원본과 동일하게 보이는지(직무방향,
   과정비교, 로드맵, AI프로필, 야간트랙 유무) 비교 확인. 이메일을 저장하지 않고
   완주한 경우 `/#my` 로그인 시 "저장된 결과 없음" 문구가 뜨는지도 확인.
3. 모바일 뷰포트에서 `/#my` 화면 레이아웃 확인.

## 알려진 제약 (설계상 의도적 단순화)

- 계정당(이메일당) **가장 최근 진단 결과 1건만** 보여준다. 같은 이메일로 여러 번
  진단해도 이전 기록 목록은 제공하지 않는다.
- 야간 진로트랙 2순위/동점 표시는 다시보기에서 생략한다.
- 다시보기 화면에는 상담 신청/지원 CTA가 없다 (결과 열람 전용).
