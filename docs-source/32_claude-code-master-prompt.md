# Claude Code MASTER PROMPT

프로젝트: 2027 서울시기술교육원 컴퓨터그래픽디자인과 지원자 자기진단 웹서비스.

목표: 40문항 응답 → 진단엔진 → 과정 비교 → 로드맵 → 상담/지원.

기술: React + TypeScript + Vite + YAML + Supabase.

핵심 기능: Q01~Q40, 진행률, single/multi/scale, 조건부 문항, Life Stage, 5대 Job Track, AI Profile, 야간 4대 Career Track, 주간/야간 routing, 과정 비교, 결과, 로드맵, 상담, 지원, 관리자 데이터.

UX 원칙: 적성검사 표현 금지, 합격/불합격 금지, 과정 순위 금지, “현재 응답과 연결되는 교육 방향”으로 표현.

개발원칙: YAML을 콘텐츠/routing 기준으로 사용하고 질문 ID를 코드에 하드코딩하지 않는다. Service Role Key는 서버에서만 사용한다. 개인정보는 Edge Function 검증을 권장한다.

순서: 프로젝트 초기화 → 타입 → YAML → 질문UI → 상태 → 엔진 → 결과 → Supabase → 상담 → 지원 → 반응형 → 테스트 → 배포.
