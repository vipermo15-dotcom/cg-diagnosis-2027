# Supabase 연동 배포 런북

이 프로젝트는 Supabase 없이도 완전히 동작합니다(로컬 스텁 모드). 실제 응답을 저장하려면 아래 순서대로 진행하세요. 계정 로그인이 필요한 단계는 본인이 직접 해야 합니다.

## 1. Supabase 프로젝트 생성
1. https://supabase.com 대시보드에서 새 프로젝트 생성 (리전은 Singapore 또는 Tokyo 권장 — 기존 취업시스템 프로젝트와 동일 리전 추천)
2. 프로젝트 생성 완료까지 1~2분 대기

## 2. 스키마 적용
1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.md` 안의 SQL 코드 블록 전체를 복사해서 실행 (11개 테이블 + 인덱스 + RLS 활성화)
3. 이어서 `supabase/rls_and_rpc.sql` 전체를 복사해서 실행 (RLS 잠금 + RPC 함수 4개 + anon 권한 부여)
4. 관리자 화면을 쓸 계획이면 `supabase/admin_rls.sql` 도 이어서 실행 (admin_users 테이블 + 관리자 전용 RPC 3개)

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

## 6. 관리자 화면(상담 신청 목록) 설정
앱에 `/#admin` 경로로 관리자 화면이 내장되어 있습니다 (예: `https://vipermo15-dotcom.github.io/cg-diagnosis-2027/#admin`). 로그인은 비밀번호 없이 이메일 매직링크로 합니다.

1. Supabase 대시보드 → Authentication → Providers 에서 **Email(매직링크)** 이 켜져 있는지 확인 (기본값이 켜져 있음)
2. Authentication → URL Configuration 에서 `Site URL`과 `Redirect URLs`에 배포 주소를 등록:
   - Site URL: `https://vipermo15-dotcom.github.io/cg-diagnosis-2027/`
   - Redirect URLs: `https://vipermo15-dotcom.github.io/cg-diagnosis-2027/**`
   (이 설정이 없으면 매직링크 클릭 시 로그인이 완료되지 않습니다)
3. 관리자가 `/#admin` 화면에서 본인 이메일로 매직링크 로그인을 1회 시도 (아직 admin_users에 없어도 로그인 자체는 되고, `auth.users`에 계정이 생성됩니다)
4. Supabase 대시보드 SQL Editor에서 그 사람을 관리자로 등록:
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = '관리자이메일@example.com';
   ```
5. 등록 후 관리자가 다시 로그인하면 상담 신청 목록(희망과정/희망시간/메시지/연결된 진단결과/처리상태)이 보이고, 상태를 신규/연락함/완료로 바꿀 수 있습니다.

admin_users에 없는 사람은 로그인은 되지만 목록 조회 시 "not authorized" 오류만 뜨고 아무 데이터도 보이지 않습니다 — RPC 내부에서 매번 권한을 재확인하기 때문입니다.

## RLS 설계 요약
- anon(익명 방문자) 키는 테이블을 **직접 SELECT/INSERT할 수 없습니다.**
- 익명 사용자는 `create_diagnosis_session`, `save_diagnosis_answer`, `save_diagnosis_result`, `submit_consultation` 4개 RPC 함수만 실행할 수 있습니다(SECURITY DEFINER로 최소한의 작업만 수행).
- 로그인한 관리자(authenticated)는 `admin_list_consultations`, `admin_update_consultation_status` 2개 RPC만 실행할 수 있고, 함수 내부에서 매번 `is_admin()`을 확인합니다. admin_users 테이블 자체는 아무도 직접 SELECT할 수 없습니다(service_role 전용).
- 즉, 누군가 브라우저 개발자도구로 anon 키를 알아내도 진단 데이터를 통째로 조회하거나 다른 사람 응답을 조작할 수 없고, 로그인만으로는 관리자 데이터를 볼 수 없습니다(admin_users 등록이 별도로 필요).
