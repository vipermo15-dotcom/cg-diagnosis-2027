// scoreCalculator
// ──────────────────────────────────────────────────────────────────────────
// 02_scoring.yml 의 course_direction 가중치를 이용해 주간/야간 방향을 계산한다.
//
// course_direction.daytime / .nighttime 의 키(employment, entrepreneurship, ...)는
// Q01~Q40 개별 문항 ID가 아니라 "동기(goal)" 개념이다. 이 goal 이 이번 세션에서
// "present" 한지 여부는 여러 문항 신호를 OR로 묶어 판단한다 (아래 GOAL_SIGNAL_RULES,
// 판단 근거는 각 goal 명 및 00_diagnosis.yml 의 courses.*.goals 목록과의 대응을 참고해
// 작성자가 정리한 규칙 — 문서화된 판단).
//
// 이후 present 한 goal들의 daytime/nighttime 가중치를 합산해 두 개의 내부 점수를 만들고,
// 02_scoring.yml 의 routing 임계값을 적용해 course_direction 을 결정한다.
// 이 점수는 UI에 "적성 점수"로 노출하지 않는다 (00_diagnosis.yml result_policy 준수).

import type { AnswerMap, CourseDirection, ScoringConfig } from '../types'

type GoalKey = keyof ScoringConfig['course_direction']['daytime']

// goal -> 이를 present 하게 만드는 시그널 목록 (OR 매칭)
const GOAL_SIGNAL_RULES: Record<string, string[]> = {
  employment: ['Q02.employment', 'Q03.employment', 'Q07'],
  entrepreneurship: ['Q02.entrepreneurship', 'Q03.startup', 'Q03.freelance', 'Q08'],
  new_technology: ['Q02.new_tech', 'Q09'],
  portfolio: ['Q02.portfolio', 'Q03.portfolio', 'Q04.portfolio', 'Q10.portfolio'],
  career_change: ['Q01.job_change', 'Q02.job_change', 'Q03.job_change'],
  job_enhancement: ['Q02.skill_up', 'Q03.skill_up'],
  career_reentry: ['Q01.reentry', 'Q01.career_break'],
  second_career: ['Q01.pre_retirement', 'Q01.post_retirement'],
  ai_reskilling: ['Q09', 'Q28.daily', 'Q28.regularly', 'Q31', 'Q32'],
}

export interface CourseDirectionScoreResult {
  direction: CourseDirection
  daytimeScore: number
  nighttimeScore: number
  presentGoals: string[]
}

export function calculateCourseDirection(
  signals: Set<string>,
  scoring: ScoringConfig,
): CourseDirectionScoreResult {
  const dayWeights = scoring.course_direction.daytime
  const nightWeights = scoring.course_direction.nighttime

  const allGoalKeys = new Set<string>([...Object.keys(dayWeights), ...Object.keys(nightWeights)])
  const presentGoals: string[] = []
  let daytimeScore = 0
  let nighttimeScore = 0

  for (const goal of allGoalKeys) {
    const rule = GOAL_SIGNAL_RULES[goal] ?? []
    const present = rule.some((sig) => signals.has(sig))
    if (!present) continue
    presentGoals.push(goal)
    daytimeScore += dayWeights[goal as GoalKey] ?? 0
    nighttimeScore += nightWeights[goal as GoalKey] ?? 0
  }

  const { close_range_points, clear_direction_min_score, clear_direction_min_difference } =
    scoring.routing

  const diff = Math.abs(daytimeScore - nighttimeScore)
  const maxScore = Math.max(daytimeScore, nighttimeScore)

  let direction: CourseDirection

  if (maxScore >= clear_direction_min_score && diff >= clear_direction_min_difference) {
    direction = daytimeScore > nighttimeScore ? 'daytime' : 'nighttime'
  } else if (diff <= close_range_points && maxScore > 0) {
    direction = 'both'
  } else if (maxScore === 0) {
    direction = 'exploration'
  } else {
    // 뚜렷하지도, 근접하지도 않은 경우 — 더 높은 쪽으로 완만하게 기운 것으로 간주
    direction = daytimeScore > nighttimeScore ? 'daytime' : 'nighttime'
  }

  return { direction, daytimeScore, nighttimeScore, presentGoals }
}

// 미사용 방지를 위한 no-op 참조 (AnswerMap 은 상위 오케스트레이터에서 이미 정규화되어 넘어오므로
// 이 모듈은 signals 기반으로만 동작한다. 타입만 재노출)
export type { AnswerMap }
