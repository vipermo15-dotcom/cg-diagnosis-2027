// resultGenerator
// life_stage + course_direction + job track + AI/창업 신호를 조합해 05_result-types.yml
// 의 9개 type 중 하나를 고른다. 매핑 규칙은 명세에 명시되어 있지 않으므로 아래 우선순위
// 목록으로 판단한다 (문서화된 판단):
//
//   1) second_career      — Q01 이 pre_retirement/post_retirement (강한 생애단계 사실)
//   2) career_reentry     — Q01 이 career_break/reentry
//   3) entrepreneurship   — 창업 동기가 뚜렷함 (course_direction의 entrepreneurship goal present)
//                            AND Q08(창업 관심도) >= 4
//   4) ai_reskilling      — new_technology/ai_reskilling goal present AND
//                            AI 프로필 관심 영역이 1개 이상 있고 job_change/employed 맥락일 때
//   5) career_change      — Q01 이 job_change
//   6) freelancer         — Q01 이 freelance
//   7) employed_enhancement — Q01 이 employed
//   8) youth_employment   — Q01 이 job_seeking
//   9) career_exploration — 그 외 전부(기본값, Q01 undecided 포함)
//
// 절대 "적성 점수/합격 불합격/1위 과정"으로 표현하지 않고, 05_result-types.yml 의
// title/description 문구를 그대로 사용한다.

import type { AiProfileResult, ResultTypesConfig } from '../types'
import type { LifeStage } from './lifeStageAnalyzer'
import type { CourseDirectionScoreResult } from './scoreCalculator'
import type { AnswerMap } from '../types'

export interface ResultTypeSelection {
  resultType: string
  resultTitle: string
  resultSummary: string
}

export function generateResultType(
  lifeStage: LifeStage,
  courseDirectionResult: CourseDirectionScoreResult,
  aiProfile: AiProfileResult,
  answers: AnswerMap,
  resultTypes: ResultTypesConfig,
): ResultTypeSelection {
  const presentGoals = new Set(courseDirectionResult.presentGoals)
  const entrepreneurshipScale = (answers['Q08'] as number | undefined) ?? 0

  let key: string

  if (lifeStage === 'pre_retirement' || lifeStage === 'post_retirement') {
    key = 'second_career'
  } else if (lifeStage === 'career_break' || lifeStage === 'reentry') {
    key = 'career_reentry'
  } else if (presentGoals.has('entrepreneurship') && entrepreneurshipScale >= 4) {
    key = 'entrepreneurship'
  } else if (
    presentGoals.has('ai_reskilling') &&
    aiProfile.interests.length > 0 &&
    (lifeStage === 'employed' || lifeStage === 'job_change')
  ) {
    key = 'ai_reskilling'
  } else if (lifeStage === 'job_change') {
    key = 'career_change'
  } else if (lifeStage === 'freelance') {
    key = 'freelancer'
  } else if (lifeStage === 'employed') {
    key = 'employed_enhancement'
  } else if (lifeStage === 'job_seeking') {
    key = 'youth_employment'
  } else {
    key = 'career_exploration'
  }

  const typeInfo = resultTypes.types[key] ?? resultTypes.types['career_exploration']

  return {
    resultType: key,
    resultTitle: typeInfo.title,
    resultSummary: typeInfo.description,
  }
}
