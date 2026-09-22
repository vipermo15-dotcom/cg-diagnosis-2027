// courseRouter
// 03_course-routing.yml 의 routing 규칙을 적용한다.
// 각 규칙의 "when" 목록은 OR 매칭이며, 두 종류의 항목이 섞여 있다:
//   - "Q23.detail_page" 같은 문항 시그널 → answerNormalizer 결과에서 확인
//   - "bx_brand" 같은 직무트랙 key (예: brand_content, ai_visual 규칙) →
//     jobTrackAnalyzer 결과의 primary/secondary 트랙에 포함되는지로 확인
// 두 종류를 하나의 Set 으로 합쳐서 단순 매칭한다.
//
// 여러 규칙이 동시에 매칭될 수 있으므로 모두 수집해 비교 과정 코드(course code)를
// 중복 제거하여 모은다. 항상 순위 없이(show_rank: false) 제공한다.

import type { CourseComparisonEntry, CourseRoutingConfig, ComparisonConfig } from '../types'

export function routeCourses(
  signals: Set<string>,
  jobTrackPrimary: string | undefined,
  jobTrackSecondary: string | undefined,
  routing: CourseRoutingConfig,
  comparison: ComparisonConfig,
): CourseComparisonEntry[] {
  const matchSet = new Set(signals)
  if (jobTrackPrimary) matchSet.add(jobTrackPrimary)
  if (jobTrackSecondary) matchSet.add(jobTrackSecondary)

  const matchedCourseRules = new Map<string, string[]>() // courseCode -> matched rule names

  for (const [ruleName, rule] of Object.entries(routing.routing)) {
    const matched = rule.when.some((sig) => matchSet.has(sig))
    if (!matched) continue
    for (const code of rule.compare) {
      const existing = matchedCourseRules.get(code) ?? []
      existing.push(ruleName)
      matchedCourseRules.set(code, existing)
    }
  }

  // 아무 규칙도 매칭되지 않으면 기본적으로 주/야간 본 과정만 비교 대상으로 제시
  if (matchedCourseRules.size === 0) {
    matchedCourseRules.set('cg_day', ['default'])
    matchedCourseRules.set('cg_night', ['default'])
  }

  const entries: CourseComparisonEntry[] = []
  for (const [code, matchedRules] of matchedCourseRules) {
    const info = routing.courses[code]
    const keywordInfo =
      comparison.courses[code] ?? comparison.courses[toComparisonKey(code)] ?? undefined
    entries.push({
      code,
      name: info?.name ?? keywordInfo?.name ?? code,
      keywords: keywordInfo?.keywords ?? info?.focus ?? [],
      matchedRules,
    })
  }

  return entries
}

// 06_comparison.yml 은 cg_day/cg_night 를 "computer_graphic" 하나로 묶어서 키워드를 정의한다.
function toComparisonKey(code: string): string {
  if (code === 'cg_day' || code === 'cg_night') return 'computer_graphic'
  return code
}
