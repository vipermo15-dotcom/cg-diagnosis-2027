# 2027 컴퓨터그래픽디자인과 지원자 자기진단 웹서비스 (MVP)

서울시기술교육원 컴퓨터그래픽디자인과 지원 희망자를 위한 40문항 자기진단 웹앱입니다.
응답을 바탕으로 "현재 응답과 연결되는 교육 방향"을 제안합니다 — 적성 점수, 합격/불합격,
과정 순위(1위 과정)는 어디에도 표시하지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
npm run preview
```

## 기술 스택

React 18 + TypeScript + Vite. 라우팅 없이 내부 단계(step) 상태로 14개 화면 흐름을 구성했습니다.

## YAML = 콘텐츠/라우팅의 단일 소스

`src/data/*.yml` 8개 파일이 문항, 스코어링 규칙, 과정 라우팅, 결과 유형, 로드맵의
**완결된 최종 콘텐츠**입니다. 컴포넌트/엔진 코드는 질문 ID나 문구를 하드코딩하지 않고,
`src/data/index.ts` 가 `?raw` + `js-yaml` 로 이 YAML들을 읽어 타입이 지정된 객체로
제공합니다. 콘텐츠를 바꾸려면 YAML만 수정하면 됩니다(코드 수정 불필요, 단 필드
구조를 바꾸는 경우는 예외).

## "적성 점수 없음 / 합격·불합격 없음 / 과정 순위 없음" 원칙

`src/data/00_diagnosis.yml` 의 `result_policy.show_score_as_aptitude: false`,
`show_ranked_winner: false` 와 `05_result-types.yml` 의 `display.avoid` 를 하드 제약으로
간주해 UI 전역에 적용했습니다:

- 내부적으로 계산되는 점수(course_direction, job_track, ai_profile, night_track 점수)는
  모두 0~100 정규화 값이며 **primary/secondary 판단과 정렬 용도로만** 쓰이고, 화면에는
  숫자·퍼센트로 노출되지 않습니다.
- 결과 화면은 항상 "~와 연결됩니다", "~영역과 가깝습니다" 같은 관계형 문구를 사용합니다.
- 과정 비교 화면은 `06_comparison.yml` 의 `language.rule`("우열/순위가 아니라 관심영역과
  교육내용의 연결관계를 보여준다")을 그대로 반영해 카드 나열만 하고 순위를 매기지 않습니다.

## 진단 엔진 (src/engine/)

React 의존성 없는 순수 함수 모듈들입니다. 단일 진입점은
`src/engine/diagnosisEngine.ts` 의 `runDiagnosis(answers): DiagnosisResult`.

파이프라인: `answerNormalizer` → `scoreCalculator`(주/야간) → `lifeStageAnalyzer` →
`jobTrackAnalyzer` / `aiProfileAnalyzer` → `nightCareerTrackAnalyzer`(야간 방향일 때만) →
`courseRouter` → `resultGenerator` → `roadmapGenerator`.

각 모듈 상단에 "문서화된 판단"이 필요했던 지점(예: scale 문항의 "관심 높음" 임계값 4,
course_direction의 goal-신호 매핑, 결과 유형 우선순위 등)을 주석으로 설명해 두었습니다 —
YAML 명세에 명시되지 않은 부분에 대한 합리적 판단이며, 실제 운영 전 재검토를 권장합니다.

연령(생애단계, Q01)은 결과의 맥락 설명으로만 쓰이고, 단독 추천 근거로 사용하지 않습니다.

## Supabase 연동

기본값은 **완전 로컬 동작**입니다. `.env` 를 만들지 않으면 `src/services/supabase.ts` 의
`isSupabaseConfigured` 가 `false` 가 되고, 모든 저장 함수(`createSession`, `saveAnswer`,
`saveResult`, `submitConsultation`)는 콘솔에 `[stub] Supabase not configured...` 로그만
남기고 아무 것도 하지 않습니다. 즉 백엔드 없이도 앱이 처음부터 끝까지 정상 동작합니다.

실제로 연동하려면:

1. Supabase 프로젝트를 생성한다.
2. `supabase/schema.md` 안의 SQL 코드 블록을 프로젝트의 SQL Editor에서 실행한다 (11개 테이블).
3. `.env.example` 을 참고해 `.env` 파일을 만들고 `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` 를 채운다.
4. **RLS 정책은 `supabase/schema.md` 에 정의되어 있지 않습니다** (각 테이블에 RLS는
   활성화만 되어 있고 정책은 없음). 이는 기관의 개인정보 처리 방침이 확정된 뒤 별도로
   설계해야 하는 후속 작업입니다 — 이 프로젝트에서 임의로 RLS 정책을 만들지 않았습니다.

## 디렉터리 구조

```
src/
  types/        타입 정의 (YAML 구조 기반)
  data/         YAML 로더 (index.ts) + 원본 YAML 8개
  engine/       진단 엔진 (순수 함수)
  services/     Supabase 서비스 스텁
  components/   공용 UI 컴포넌트 (ProgressBar, QuestionCard, BottomNav)
  pages/        14개 화면 흐름 (Home ~ ApplyCta)
    result/     결과 관련 9개 서브 화면
  constants/    화면 표시용 라벨 맵 (YAML에 없는 UI 전용 한글 라벨)
supabase/schema.md   Postgres 스키마 (Supabase SQL Editor에서 실행)
docs-source/         기획 원본 문서 (STEP01~21, PRD, master prompt)
```

## 남은 사람의 판단이 필요한 부분

- **Supabase 프로젝트 실제 생성 및 배포** — 이 저장소는 로컬 전용이며 실제 프로젝트를
  만들지 않았습니다.
- **RLS 정책 설계** — 기관 개인정보 처리 방침 확정 후 진행.
- **실제 지원(신청) 플로우 연동** — `ApplyCta` 화면은 안내/CTA만 제공하며, 실제 지원서
  접수는 교육원의 공식 지원 시스템과 연동이 필요합니다. 대표번호/이메일도 자리표시자입니다.
- **GitHub 저장소/배포 대상** — git 저장소 초기화, 원격 저장소, 실제 배포(Vercel 등)는
  진행하지 않았습니다(요청 범위 밖).
- **엔진의 "문서화된 판단" 재검토** — 특히 `scoreCalculator.ts` 의 GOAL_SIGNAL_RULES,
  `resultGenerator.ts` 의 결과 유형 우선순위는 YAML에 명시되지 않아 합리적으로 설계한
  부분이므로, 실제 데이터로 검증 후 조정을 권장합니다.
