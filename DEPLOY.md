# Supabase 연동 배포 런북

이 프로젝트는 Supabase 없이도 완전히 동작합니다(로컬 스텁 모드). 실제 응답을 저장하려면 아래 순서대로 진행하세요. 계정 로그인이 필요한 단계는 본인이 직접 해야 합니다.

## 1. Supabase 프로젝트 생성
1. https://supabase.com 대시보드에서 새 프로젝트 생성 (리전은 Singapore 또는 Tokyo 권장 — 기존 취업시스템 프로젝트와 동일 리전 추천)
2. 프로젝트 생성 완료까지 1~2분 대기

## 2. 스키마 적용
1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.md` 안의 SQL 코드 블록 전체를 복사해서 실행 (11개 테이블 + 인덱스 + RLS 활성화)
3. 이어서 `supabase/rls_and_rpc.sql` 전체를 복사해서 실행 (RLS 잠금 + RPC 함수 4개 + anon 권한 부여)

## 3. 환경변수 설정
1. Supabase 대시보드 → Project Settings → API 에서 `Project URL`과 `anon public` 키 확인
2. 로컬에서:
   ```bash
   cd cg-diagnosis-2027
   cp .env.example .env
   # .env 파일을 열어 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 채우기
   ```
3. GitHub Pages(정적 배포)로 서비스할 경우, 이 값들은 **빌드 시점에 번들에 포함**됩니다. anon 키는 원래 공개되는 것이 정상이지만(RLS로 보호), Service Role Key는 절대 `.env`나 프론트 코드에 넣지 마세요.

## 4. 동작 확인
```bash
npm run dev
```
1번 문항부터 40번까지 응답 후 결과 화면 진입 → Supabase 대시보드 → Table Editor에서 `diagnosis_sessions`, `diagnosis_answers`, `diagnosis_results` 에 데이터가 쌓이는지 확인. anon 키로는 Table Editor 접근이 아니라 **대시보드 로그인 세션**으로 보는 것이므로 정상적으로 보입니다(대시보드는 service_role 권한으로 동작).

## 5. 재배포 (GitHub Pages)
환경변수가 채워진 상태로 다시 빌드해서 배포합니다.
```bash
npm run build -- --mode gh-pages
npx gh-pages -d dist -b gh-pages -r https://github.com/vipermo15-dotcom/cg-diagnosis-2027.git
```

## 상담 신청 데이터는 어떻게 확인하나요?
`consultation_requests` 테이블을 Supabase 대시보드 Table Editor에서 직접 조회하거나, `status = 'new'` 조건으로 필터링하세요. 별도의 관리자 화면은 이번 MVP 범위에 없습니다 — 필요하면 후속 작업으로 요청해주세요.

## RLS 설계 요약
- anon(익명 방문자) 키는 테이블을 **직접 SELECT/INSERT할 수 없습니다.**
- 대신 `create_diagnosis_session`, `save_diagnosis_answer`, `save_diagnosis_result`, `submit_consultation` 4개 RPC 함수만 실행할 수 있습니다(SECURITY DEFINER로 최소한의 작업만 수행).
- 즉, 누군가 브라우저 개발자도구로 anon 키를 알아내도 진단 데이터를 통째로 조회하거나 다른 사람 응답을 조작할 수 없습니다.
- 관리자용 목록 조회 화면을 나중에 만들 경우, **anon/authenticated 에 SELECT 정책을 추가하지 말고** 반드시 서버사이드(Edge Function 등)에서 service_role 키로 조회하세요.
