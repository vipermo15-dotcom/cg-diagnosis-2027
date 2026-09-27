# 예비 지원자 "내 결과 다시 보기" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예비 지원자가 진단 완료 후 선택적으로 이메일을 남기면, `/#my`에서 매직링크로 로그인해 자신의 최신 진단 결과를 다시 볼 수 있게 한다.

**Architecture:** 기존 관리자(`/#admin`)와 동일한 Supabase Auth 매직링크 메커니즘을 재사용하되, 별도의 `applicants.user_id` 연결과 전용 SECURITY DEFINER RPC로 권한을 완전히 분리한다. 결과 화면 컴포넌트(`ResultSummary` 등)를 그대로 재사용해 새 `/#my` 페이지에서 저장된 결과를 스크롤형으로 렌더링한다.

**Tech Stack:** React 18 + TypeScript + Vite, `@supabase/supabase-js` v2, Supabase Postgres (RLS + RPC), GitHub Pages 정적 배포. 이 프로젝트에는 자동화 테스트 러너가 없다 — 검증은 `tsc --noEmit`(타입) + 개발 서버를 브라우저로 열어 콘솔에서 직접 호출/클릭하는 방식(이 프로젝트의 기존 관행)으로 한다.

**Spec:** [docs/superpowers/specs/2026-09-27-applicant-dashboard-design.md](../specs/2026-09-27-applicant-dashboard-design.md)

## Global Constraints

- anon 키는 어떤 테이블도 직접 SELECT/INSERT 불가 — 모든 접근은 SECURITY DEFINER RPC를 통해서만 (기존 프로젝트 전체 원칙, `supabase/rls_and_rpc.sql` 참고).
- 이메일 입력은 선택 사항 — 비워도 진단 완료/이동에 지장 없음.
- 다시보기(`/#my`)는 상담신청/지원 CTA 없이 결과 열람 전용, 스크롤형 한 페이지.
- 야간 진로트랙은 다시보기에서 1순위만 표시 (2순위/동점 생략).
- 계정당 최신 진단 결과 1건만 제공 (이력 목록 없음).
- 관리자와 예비지원자 매직링크 콜백이 섞이지 않도록 `emailRedirectTo`에 `?portal=my` 마커 사용.

**실행 순서:** Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (번호 순서 그대로, 되돌아가는 태스크 없음).

---

## Task 1: DB 마이그레이션 — applicant 연결 컬럼 + course_comparison 저장 + RPC 3개

**Files:**
- Create: `supabase/applicant_rls.sql`
- Modify: `supabase/rls_and_rpc.sql` (기존 `save_diagnosis_result` 함수를 `create or replace`로 시그니처 확장)

**Interfaces:**
- Produces (Task 2가 호출):
  - `public.link_result_to_email(p_session_id uuid, p_email text) returns void` — anon 실행 가능
  - `public.claim_applicant_account() returns void` — authenticated 실행 가능
  - `public.get_my_results() returns table(session_id uuid, life_stage text, course_direction text, primary_track text, secondary_track text, night_career_track text, result_title text, result_summary text, ai_profile jsonb, roadmap jsonb, course_comparison jsonb, created_at timestamptz)` — authenticated 실행 가능
  - `public.save_diagnosis_result(...)` 기존 9개 파라미터 뒤에 `p_course_comparison jsonb` 추가 (총 10개)

- [ ] **Step 1: `supabase/rls_and_rpc.sql`의 `save_diagnosis_result` 함수를 수정**

`supabase/rls_and_rpc.sql`에서 `create or replace function public.save_diagnosis_result(` 로 시작하는 블록 전체(파라미터 목록 + 본문 + insert 문)를 아래로 교체한다:

```sql
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
  p_roadmap jsonb,
  p_course_comparison jsonb
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
    night_career_track, result_title, result_summary, ai_profile, roadmap, course_comparison
  )
  values (
    p_session_id, p_life_stage, p_course_direction, p_primary_track, p_secondary_track,
    p_night_career_track, p_result_title, p_result_summary, p_ai_profile, p_roadmap, p_course_comparison
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
    roadmap = excluded.roadmap,
    course_comparison = excluded.course_comparison;

  update public.diagnosis_sessions set status = 'completed', completed_at = now()
  where id = p_session_id;
end;
$$;
```

그 아래 `grant execute on function public.save_diagnosis_result(...)` 줄도 새 파라미터 타입 목록(끝에 `jsonb` 하나 추가)에 맞춰 수정한다:

```sql
grant execute on function public.save_diagnosis_result(uuid, text, text, text, text, text, text, text, jsonb, jsonb, jsonb) to anon;
```

- [ ] **Step 2: `supabase/applicant_rls.sql` 신규 파일 작성**

```sql
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

alter table public.applicants
  add constraint applicants_email_key unique (email);

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
  insert into public.applicants (email)
  values (p_email)
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
  where email = auth.jwt() ->> 'email'
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
```

- [ ] **Step 3: (사용자가 직접) Supabase SQL Editor에서 실행**

이 프로젝트는 Supabase MCP 연결이 없으므로, 사용자가 Supabase 대시보드 → SQL Editor에서
직접 실행해야 한다. 순서:
1. `supabase/rls_and_rpc.sql` 전체를 다시 실행 (Step 1에서 수정된 `save_diagnosis_result` 반영)
2. `supabase/applicant_rls.sql` 전체를 실행

Expected: 둘 다 "Success. No rows returned".

- [ ] **Step 4: 검증 (SQL Editor)**

```sql
select routine_name from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('link_result_to_email','claim_applicant_account','get_my_results');
```

Expected: 3행 모두 나와야 한다.

- [ ] **Step 5: Commit**

```bash
git add supabase/applicant_rls.sql supabase/rls_and_rpc.sql
git commit -m "feat(db): 예비 지원자 결과 다시보기용 RPC 3개 + course_comparison 저장 컬럼 추가"
```

---

## Task 2: 서비스 레이어 — `saveResult`에 course_comparison 추가 + `applicant.ts` 신규

**Files:**
- Modify: `src/services/supabase.ts`
- Create: `src/services/applicant.ts`

**Interfaces:**
- Consumes: `supabase`, `isSupabaseConfigured` from `./supabase` (이미 존재)
- Produces (Task 3, 4, 5, 6이 사용):
  - `linkResultToEmail(sessionId: string | null, email: string): Promise<{ ok: boolean; error?: string }>` (from `./supabase`)
  - `export interface StoredResult { sessionId: string; lifeStage: string; courseDirection: string; primaryTrack: string; secondaryTrack: string | null; nightCareerTrack: string | null; resultTitle: string; resultSummary: string; aiProfile: AiProfileResult; roadmap: RoadmapStepWithOverlay[]; courseComparison: CourseComparisonEntry[]; createdAt: string }` (from `./applicant`)
  - `isMyPortalConfigured` (re-export of `isSupabaseConfigured`)
  - `sendMyMagicLink(email: string): Promise<{ ok: boolean; error?: string }>`
  - `getMySession(): Promise<Session | null>`
  - `onMyAuthStateChange(callback: (session: Session | null) => void): () => void`
  - `signOutMy(): Promise<void>`
  - `claimAccount(): Promise<{ ok: boolean; error?: string }>`
  - `getMyResult(): Promise<{ result: StoredResult | null; error?: string }>`

- [ ] **Step 1: `src/services/supabase.ts`의 `saveResult` 함수 수정**

`saveResult` 함수 내부 `supabase.rpc('save_diagnosis_result', {...})` 호출 객체에 아래 한 줄을 추가한다 (`p_roadmap: result.roadmap,` 바로 다음 줄):

```typescript
    p_roadmap: result.roadmap,
    p_course_comparison: result.courseComparison,
```

- [ ] **Step 2: `linkResultToEmail` 함수를 `src/services/supabase.ts`에 추가**

파일 맨 아래 `export type { AnswerMap }` 바로 위에 추가:

```typescript
export async function linkResultToEmail(
  sessionId: string | null,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase || !sessionId) {
    stubLog('linkResultToEmail', { sessionId, email })
    return { ok: true }
  }
  const { error } = await supabase.rpc('link_result_to_email', {
    p_session_id: sessionId,
    p_email: email,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (기존 `saveResult` 호출부는 시그니처 변경이 없으므로 영향 없음).

- [ ] **Step 4: `src/services/applicant.ts` 신규 작성**

```typescript
// 예비 지원자 "내 결과 다시 보기" 전용 서비스
// admin과 동일한 Supabase Auth 매직링크를 쓰지만, 권한은 완전히 분리된다
// (admin_users가 아니라 applicants.user_id로 연결, RPC도 별도).

import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import type { AiProfileResult, CourseComparisonEntry, RoadmapStepWithOverlay } from '../types'

export { isSupabaseConfigured as isMyPortalConfigured }

export interface StoredResult {
  sessionId: string
  lifeStage: string
  courseDirection: string
  primaryTrack: string
  secondaryTrack: string | null
  nightCareerTrack: string | null
  resultTitle: string
  resultSummary: string
  aiProfile: AiProfileResult
  roadmap: RoadmapStepWithOverlay[]
  courseComparison: CourseComparisonEntry[]
  createdAt: string
}

// 관리자(/#admin) 매직링크와 콜백이 섞이지 않도록 portal=my 마커를 붙인다.
function myRedirectTo(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?portal=my`
}

export async function sendMyMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: myRedirectTo() },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getMySession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export function onMyAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function signOutMy(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.auth.signOut()
}

export async function claimAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { error } = await supabase.rpc('claim_applicant_account')
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getMyResult(): Promise<{ result: StoredResult | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { result: null, error: 'Supabase가 설정되지 않았습니다 (.env 확인).' }
  }
  const { data, error } = await supabase.rpc('get_my_results')
  if (error) return { result: null, error: error.message }
  const rows = (data ?? []) as Record<string, unknown>[]
  if (rows.length === 0) return { result: null }
  const r = rows[0]
  return {
    result: {
      sessionId: r.session_id as string,
      lifeStage: r.life_stage as string,
      courseDirection: r.course_direction as string,
      primaryTrack: r.primary_track as string,
      secondaryTrack: (r.secondary_track as string) ?? null,
      nightCareerTrack: (r.night_career_track as string) ?? null,
      resultTitle: r.result_title as string,
      resultSummary: r.result_summary as string,
      aiProfile: (r.ai_profile as AiProfileResult) ?? { dimensions: [], interests: [] },
      roadmap: (r.roadmap as RoadmapStepWithOverlay[]) ?? [],
      courseComparison: (r.course_comparison as CourseComparisonEntry[]) ?? [],
      createdAt: r.created_at as string,
    },
  }
}
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 브라우저 콘솔로 RPC 3개 직접 호출 검증**

`npm run dev`로 개발 서버를 띄우고(`.env`에 실제 Supabase 값이 있어야 함), 브라우저 콘솔에서:

```javascript
const mod = await import('/src/services/supabase.ts');
const app = await import('/src/services/applicant.ts');
const { sessionId } = await mod.createSession();
await mod.saveResult(sessionId, {
  lifeStage: 'job_seeking', resultType: 'x', resultTitle: 'T', resultSummary: 'S',
  courseDirection: 'both', jobTrack: { primary: 'bx_brand' }, aiProfile: { dimensions: [], interests: ['agent'] },
  nightCareer: { primary: 'ai_designer', showBoth: false, scores: [] },
  courseComparison: [{ code: 'cg_day', name: '컴퓨터그래픽디자인 주간', keywords: ['테스트'], matchedRules: ['default'] }],
  roadmap: [{ id: '01', title: '전공기초', output: '디자인 기본기', overlayNotes: [] }],
});
const linkRes = await mod.linkResultToEmail(sessionId, 'qa-test@example.com');
console.log('link:', linkRes); // { ok: true } 기대
```

Expected: `link: { ok: true }`, 콘솔에 에러 없음. (로그인 전이라 `getMyResult()`는 이 시점엔 호출 대상 아님 — Task 7에서 로그인 후 검증)

- [ ] **Step 7: Commit**

```bash
git add src/services/supabase.ts src/services/applicant.ts
git commit -m "feat: course_comparison 저장 + 예비 지원자 서비스 레이어(applicant.ts) 추가"
```

---

## Task 3: 결과 요약 화면에 이메일 저장 UI 추가

**Files:**
- Modify: `src/pages/result/ResultSummary.tsx`
- Modify: `src/pages/ResultFlow.tsx`

**Interfaces:**
- Consumes: `linkResultToEmail` from `../services/supabase` (Task 2)
- Produces: `ResultSummary`의 새 선택적 prop `onSaveEmail?: (email: string) => Promise<{ ok: boolean; error?: string }>` — Task 5(`MyResultView`)는 이 prop을 생략하고 사용한다.

- [ ] **Step 1: `ResultSummary.tsx`에 이메일 입력 카드 추가**

`src/pages/result/ResultSummary.tsx` 전체를 아래로 교체:

```tsx
import { useState } from 'react'
import type { DiagnosisResult } from '../../types'
import { JOB_TRACK_LABELS } from '../../constants/labels'

interface Props {
  result: DiagnosisResult
  onSaveEmail?: (email: string) => Promise<{ ok: boolean; error?: string }>
}

export default function ResultSummary({ result, onSaveEmail }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async () => {
    if (!onSaveEmail || !email.trim()) return
    setStatus('saving')
    const { ok, error } = await onSaveEmail(email.trim())
    if (ok) {
      setStatus('saved')
    } else {
      setStatus('error')
      setErrorMsg(error ?? '알 수 없는 오류')
    }
  }

  return (
    <div>
      <div className="eyebrow">나의 진단 결과</div>
      <h1>{result.resultTitle}</h1>
      <p>{result.resultSummary}</p>

      <div className="card card-highlight">
        <h3>현재 상태</h3>
        <p style={{ margin: 0 }}>지금 응답을 바탕으로 정리한 나의 교육 방향입니다.</p>
      </div>

      <div className="card">
        <h3>관심 직무</h3>
        <div className="chip-row">
          <span className="tag">{JOB_TRACK_LABELS[result.jobTrack.primary]}</span>
          {result.jobTrack.secondary && (
            <span className="tag tag-muted">{JOB_TRACK_LABELS[result.jobTrack.secondary]}</span>
          )}
        </div>
      </div>

      {onSaveEmail && (
        <div className="card">
          <h3>이메일로 저장해두고 나중에 다시 보기</h3>
          {status === 'saved' ? (
            <p style={{ margin: 0 }}>
              <strong>{email}</strong>로 저장했어요. 나중에 이 이메일로 로그인하면 다시
              확인하실 수 있어요.
            </p>
          ) : (
            <>
              <p style={{ margin: '0 0 8px' }}>
                입력하지 않아도 결과 확인에는 지장이 없어요. (선택 사항)
              </p>
              <div className="field">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!email.trim() || status === 'saving'}
                onClick={() => void handleSave()}
              >
                {status === 'saving' ? '저장 중...' : '이 이메일로 저장하기'}
              </button>
              {status === 'error' && (
                <p style={{ color: '#c0392b', marginTop: 8 }}>저장 실패: {errorMsg}</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="notice-box">
        이 결과는 적성 판정이나 합격 여부가 아니라, 지금 응답과 연결되는 교육 방향
        제안입니다.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `ResultFlow.tsx`에서 `onSaveEmail` 연결**

`src/pages/ResultFlow.tsx`에서 `import { submitConsultation } from '../services/supabase'` 줄을
아래로 교체:

```typescript
import { submitConsultation, linkResultToEmail } from '../services/supabase'
```

그리고 `steps` 배열의 `{ key: 'summary', render: () => <ResultSummary result={result} /> }` 줄을
아래로 교체:

```typescript
      {
        key: 'summary',
        render: () => (
          <ResultSummary
            result={result}
            onSaveEmail={(email) => linkResultToEmail(sessionId, email)}
          />
        ),
      },
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 개발 서버로 화면 확인**

`npm run dev` → 홈에서 진단 시작 → 40문항 아무거나 선택 후 완주 → 첫 결과 화면에서
"이메일로 저장해두고 나중에 다시 보기" 카드가 보이는지, 이메일 입력 후 저장 버튼을
누르면 "저장했어요" 문구로 바뀌는지 확인. 빈 채로 "다음"을 눌러도 다음 화면으로
넘어가는지도 확인.

Expected: 두 경우 모두 정상 동작, 콘솔 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add src/pages/result/ResultSummary.tsx src/pages/ResultFlow.tsx
git commit -m "feat: 결과 요약 화면에 선택적 이메일 저장 UI 추가"
```

---

## Task 4: `MyLogin` 컴포넌트

**Files:**
- Create: `src/my/MyLogin.tsx`

**Interfaces:**
- Consumes: `sendMyMagicLink` from `../services/applicant` (Task 2)
- Produces: `MyLogin` default export, props 없음. Task 6(`MyApp`)이 로그인 안 된 상태일 때 렌더링.

- [ ] **Step 1: `src/my/MyLogin.tsx` 작성**

```tsx
import { useState } from 'react'
import { sendMyMagicLink } from '../services/applicant'

export default function MyLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    const { ok, error } = await sendMyMagicLink(email)
    if (ok) {
      setStatus('sent')
    } else {
      setStatus('error')
      setErrorMsg(error ?? '알 수 없는 오류')
    }
  }

  return (
    <div className="screen">
      <div className="center-col" style={{ paddingTop: 80 }}>
        <div className="eyebrow">내 결과</div>
        <h1>내 진단 결과 다시 보기</h1>
        <p>
          진단 완료 화면에서 이메일을 저장하신 분만 로그인할 수 있어요. 비밀번호는
          없습니다.
        </p>

        {status === 'sent' ? (
          <div className="card" style={{ width: '100%', marginTop: 24 }}>
            <p>
              <strong>{email}</strong>로 로그인 링크를 보냈습니다. 메일함을 확인해 링크를
              클릭해주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} style={{ width: '100%', marginTop: 24 }}>
            <div className="field">
              <input
                type="email"
                required
                placeholder="진단 완료 화면에서 저장한 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? '전송 중...' : '매직링크 보내기'}
            </button>
            {status === 'error' && (
              <p style={{ color: '#c0392b', marginTop: 12 }}>로그인 실패: {errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/my/MyLogin.tsx
git commit -m "feat: 예비지원자 매직링크 로그인 화면 추가"
```

---

## Task 5: `MyResultView` 컴포넌트 — 저장된 결과를 기존 컴포넌트로 렌더링

**Files:**
- Create: `src/my/MyResultView.tsx`

**Interfaces:**
- Consumes: `StoredResult` type from `../services/applicant` (Task 2); `ResultSummary, JobTrackView, CourseDirectionView, CourseComparisonView, RoadmapView, NightCareerView, AiProfileView` from `../pages/result/*` (기존)
- Produces: `MyResultView` default export, props `{ result: StoredResult }`. Task 6이 사용.

- [ ] **Step 1: `src/my/MyResultView.tsx` 작성**

```tsx
import type { CourseDirection, DiagnosisResult } from '../types'
import type { StoredResult } from '../services/applicant'
import ResultSummary from '../pages/result/ResultSummary'
import JobTrackView from '../pages/result/JobTrackView'
import CourseDirectionView from '../pages/result/CourseDirectionView'
import CourseComparisonView from '../pages/result/CourseComparisonView'
import RoadmapView from '../pages/result/RoadmapView'
import NightCareerView from '../pages/result/NightCareerView'
import AiProfileView from '../pages/result/AiProfileView'

interface Props {
  result: StoredResult
}

// 저장된 컬럼들을 기존 결과 화면 컴포넌트가 기대하는 DiagnosisResult 형태로 재구성한다.
// jobTrack.scores / nightCareer.scores 등 세부 점수 배열은 저장되지 않으므로 빈 배열로
// 채운다 — 어떤 결과 화면 컴포넌트도 .scores를 직접 렌더링하지 않으므로 지장 없다.
function toDiagnosisResult(stored: StoredResult): DiagnosisResult {
  return {
    lifeStage: stored.lifeStage,
    resultType: '',
    resultTitle: stored.resultTitle,
    resultSummary: stored.resultSummary,
    courseDirection: stored.courseDirection as CourseDirection,
    jobTrack: {
      primary: stored.primaryTrack,
      secondary: stored.secondaryTrack ?? undefined,
      scores: [],
    },
    aiProfile: stored.aiProfile,
    nightCareer: stored.nightCareerTrack
      ? { primary: stored.nightCareerTrack, secondary: undefined, showBoth: false, scores: [] }
      : undefined,
    courseComparison: stored.courseComparison,
    roadmap: stored.roadmap,
  }
}

export default function MyResultView({ result }: Props) {
  const diagnosisResult = toDiagnosisResult(result)

  return (
    <div className="screen-narrow" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
      <ResultSummary result={diagnosisResult} />
      <JobTrackView result={diagnosisResult} />
      <CourseDirectionView result={diagnosisResult} />
      {diagnosisResult.courseComparison.length > 0 && (
        <CourseComparisonView result={diagnosisResult} />
      )}
      <RoadmapView result={diagnosisResult} />
      {diagnosisResult.nightCareer && <NightCareerView result={diagnosisResult} />}
      <AiProfileView result={diagnosisResult} />
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/my/MyResultView.tsx
git commit -m "feat: 저장된 진단 결과를 기존 결과 화면 컴포넌트로 렌더링하는 MyResultView 추가"
```

---

## Task 6: `MyApp` 오케스트레이터 + `main.tsx` 3-way 라우팅

**Files:**
- Create: `src/my/MyApp.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `getMySession, onMyAuthStateChange, claimAccount, getMyResult, signOutMy, isMyPortalConfigured, type StoredResult` from `../services/applicant` (Task 2); `MyLogin` (Task 4); `MyResultView` (Task 5)
- Produces: `MyApp` default export, props 없음 — `src/main.tsx`가 사용.

- [ ] **Step 1: `src/my/MyApp.tsx` 작성**

로그인 후 결과 화면 상단에 작은 로그아웃 링크를 둔다 (관리자 화면과 일관성 유지, `signOutMy` 사용).

```tsx
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getMySession,
  onMyAuthStateChange,
  claimAccount,
  getMyResult,
  signOutMy,
  isMyPortalConfigured,
  type StoredResult,
} from '../services/applicant'
import MyLogin from './MyLogin'
import MyResultView from './MyResultView'

type Phase = 'loading' | 'loggedOut' | 'noResult' | 'hasResult'

export default function MyApp() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [result, setResult] = useState<StoredResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async (session: Session | null) => {
      if (!session) {
        setPhase('loggedOut')
        return
      }
      await claimAccount()
      const { result: r, error: err } = await getMyResult()
      if (err) setError(err)
      setResult(r)
      setPhase(r ? 'hasResult' : 'noResult')
    }

    getMySession().then(load)
    const unsubscribe = onMyAuthStateChange((session) => void load(session))
    return unsubscribe
  }, [])

  if (!isMyPortalConfigured) {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <h1>내 결과</h1>
            <p>Supabase가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <p>불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loggedOut') {
    return (
      <div className="app-shell">
        <MyLogin />
      </div>
    )
  }

  if (phase === 'noResult') {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <h1>저장된 결과가 없어요</h1>
            <p>
              진단 완료 화면에서 이 이메일로 저장한 기록이 없습니다. 먼저 자기진단을
              완료하고 결과 화면에서 이메일을 저장해주세요.
            </p>
            {error && <p style={{ color: '#c0392b' }}>{error}</p>}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 16 }}
              onClick={() => void signOutMy().then(() => setPhase('loggedOut'))}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 640, margin: '0 auto' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '6px 12px' }}
            onClick={() => void signOutMy().then(() => setPhase('loggedOut'))}
          >
            로그아웃
          </button>
        </div>
        {result && <MyResultView result={result} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/main.tsx` 전체 교체**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import MyApp from './my/MyApp'
import './index.css'

// 라우팅 판정 (해시 + 쿼리스트링만 사용, GitHub Pages 정적 호스팅 대응):
//   - ?portal=my 가 있으면 예비지원자 매직링크 콜백 복귀 → MyApp
//   - #my 로 시작하면 예비지원자 로그인 화면 → MyApp
//   - #admin 으로 시작하거나(관리자 진입), portal 마커 없이 #access_token=... 이 붙어
//     돌아온 경우(관리자 매직링크 콜백, 기존 동작 유지) → AdminApp
//   - 그 외에는 일반 진단 위저드 → App
const hash = window.location.hash
const search = window.location.search
const isMyPortal = search.includes('portal=my') || hash.startsWith('#my')
const isAdmin =
  !isMyPortal &&
  (hash.startsWith('#admin') || hash.includes('access_token=') || hash.includes('refresh_token='))

function Root() {
  if (isMyPortal) return <MyApp />
  if (isAdmin) return <AdminApp />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 개발 서버로 라우팅 확인**

`npm run dev` 후 `http://localhost:5173/#my` 접속 → "내 진단 결과 다시 보기" 로그인 화면이
뜨는지 확인. `http://localhost:5173/#admin` 접속 → 기존 관리자 로그인 화면이 그대로 뜨는지도
회귀 확인.

Expected: 두 경로 모두 올바른 화면이 뜬다.

- [ ] **Step 5: Commit**

```bash
git add src/my/MyApp.tsx src/main.tsx
git commit -m "feat: 예비지원자 /#my 진입점(MyApp) 연결 + 3-way 라우팅"
```

---

## Task 7: 전체 흐름 수동 검증 (E2E)

**Files:** 없음 (검증 전용 태스크)

**Interfaces:** 없음

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev` (`.env`에 실제 Supabase URL/anon key가 있어야 함 — Task 1의 SQL이
Supabase 프로젝트에 이미 적용되어 있어야 한다)

- [ ] **Step 2: 이메일 저장 포함 정상 흐름**

브라우저로 홈 → 자기진단 시작 → 40문항 아무거나 선택하며 완주 → 결과 요약 화면에서
실제 수신 가능한 이메일 주소를 입력해 저장 → "저장했어요" 문구 확인 → 남은 결과
화면(직무방향/주야간비교/과정비교/로드맵/야간트랙(해당 시)/AI프로필/상담신청/지원)까지
끝까지 넘겨서 콘솔에 에러가 없는지 확인.

Expected: 에러 없음, "저장했어요" 문구 정상 표시.

- [ ] **Step 3: `/#my` 로그인 전 상태 확인**

같은 브라우저에서 `http://localhost:5173/#my`로 이동(또는 새로고침 후 해시 변경).

Expected: "내 진단 결과 다시 보기" 로그인 화면이 뜬다 (진단 위저드나 관리자 화면이
아니어야 함).

- [ ] **Step 4: 매직링크 로그인 후 결과 확인**

Step 2에서 입력한 이메일 주소로 매직링크를 요청 → 실제 메일함에서 링크 클릭 →
`http://localhost:5173/?portal=my#access_token=...` 형태로 돌아오는지 확인 → MyApp이
자동으로 렌더링되며 Step 2에서 완주했던 결과와 동일한 내용(직무 방향, 과정 비교, 로드맵,
AI 프로필, 있다면 야간 진로트랙)이 보이는지 확인. 상담신청/지원 버튼은 없어야 한다.
우측 상단 "로그아웃" 버튼을 눌러 로그아웃 화면으로 돌아가는지도 확인.

Expected: 로그인 후 결과가 정확히 재현된다. 콘솔 에러 없음. 로그아웃 정상 동작.

- [ ] **Step 5: 이메일 저장을 건너뛴 경우**

새 시크릿 창(또는 로그아웃 상태)에서 처음부터 다시 진단 → 이메일 입력 없이 완주 →
`/#my`에서 (Step 2와 다른, 이번엔 저장 안 한) 임의 이메일로 로그인 시도.

Expected: "저장된 결과가 없어요" 안내 문구가 뜬다. 에러로 죽지 않는다.

- [ ] **Step 6: RLS 부정 테스트**

브라우저 콘솔에서 (로그인 여부와 무관하게 anon 키 기준):

```javascript
const mod = await import('/src/services/supabase.ts');
const { data, error } = await mod.supabase.from('applicants').select('*').limit(1);
console.log(error?.message); // "permission denied for table applicants" 기대
```

Expected: `permission denied` 에러, `data`는 null.

- [ ] **Step 7: 모바일 뷰포트 확인**

브라우저 뷰포트를 375x812로 바꾸고 `/#my` 로그인 화면과 결과 다시보기 화면을 스크린샷으로
확인 — 레이아웃 깨짐이나 가로 스크롤이 없어야 한다.

- [ ] **Step 8: Auth Redirect URL 재확인**

Supabase 대시보드 → Authentication → URL Configuration의 Redirect URLs가
`https://vipermo15-dotcom.github.io/cg-diagnosis-2027/**`로 되어 있는지 확인 — `**`가
`?portal=my`가 붙은 URL도 포함하는지는 실제 배포 후 Task 8에서 재검증한다. 로컬
`http://localhost:5173/**`도 등록돼 있어야 이 Step들이 동작한다 (이미 등록되어 있음).

---

## Task 8: 빌드 & 배포

**Files:** 없음 (빌드 산출물만)

**Interfaces:** 없음

- [ ] **Step 1: 타입 체크 + 프로덕션 빌드**

```bash
npx tsc --noEmit
npm run build -- --mode gh-pages
```

Expected: 에러 없이 `dist/` 생성.

- [ ] **Step 2: 남은 변경사항 커밋 (있다면)**

```bash
git status --short
git add -A
git commit -m "chore: 예비지원자 기능 마무리"
```

(Task 1~6에서 이미 다 커밋했다면 이 Step은 건너뛴다.)

- [ ] **Step 3: main 브랜치 푸시**

```bash
git push origin main
```

- [ ] **Step 4: GitHub Pages 배포**

```bash
npx gh-pages -d dist -b gh-pages -r https://github.com/vipermo15-dotcom/cg-diagnosis-2027.git
```

Expected: `Published`.

- [ ] **Step 5: 라이브 사이트에서 새 빌드 반영 확인**

캐시버스팅 쿼리스트링(`?cachebust=N`)으로 `https://vipermo15-dotcom.github.io/cg-diagnosis-2027/`에
접속해 새 JS 파일명이 서빙되는지 확인. 이어서 `/#my` 접속 시 로그인 화면이 뜨는지,
Task 7 Step 4~5의 시나리오를 실제 배포 도메인에서도 한 번 더 재현해 최종 확인한다.

Expected: 라이브 사이트에서 정상 동작.
