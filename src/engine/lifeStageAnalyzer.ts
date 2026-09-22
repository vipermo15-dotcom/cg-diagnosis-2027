// lifeStageAnalyzer
// Q01(현재상황)에서 생애단계(life stage) 컨텍스트를 뽑아낸다.
// 이 값은 결과의 "맥락 설명"으로만 쓰이며, 단독 추천 근거로 사용하지 않는다
// (docs-source/04_STEP03_생애단계_확장.md 원칙 — 나이/생애단계는 컨텍스트일 뿐).

import type { AnswerMap } from '../types'

export type LifeStage =
  | 'job_seeking'
  | 'employed'
  | 'job_change'
  | 'career_break'
  | 'reentry'
  | 'pre_retirement'
  | 'post_retirement'
  | 'freelance'
  | 'undecided'

export function analyzeLifeStage(answers: AnswerMap): LifeStage {
  const q01 = answers['Q01'] as string | undefined
  const known: LifeStage[] = [
    'job_seeking',
    'employed',
    'job_change',
    'career_break',
    'reentry',
    'pre_retirement',
    'post_retirement',
    'freelance',
    'undecided',
  ]
  if (q01 && (known as string[]).includes(q01)) return q01 as LifeStage
  return 'undecided'
}
