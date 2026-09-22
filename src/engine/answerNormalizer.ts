// answerNormalizer
// ──────────────────────────────────────────────────────────────────────────
// 원시 응답(AnswerMap)을 02_scoring.yml / 03_course-routing.yml / 04_night-career-routing.yml
// 이 참조하는 "signal" 형태로 변환한다. 시그널은 두 가지 형태를 갖는다:
//   - "Q23"           : 질문 자체가 (의미 있게) 응답되었음을 나타내는 signal
//   - "Q23.detail_page": 특정 옵션(value)이 선택되었음을 나타내는 signal
//
// 규칙 (문서화):
//   1) single: 값이 "none"/"undecided"/"exploring" 등 "해당 없음" 류가 아니면
//      바로 "Q{n}" 과 "Q{n}.{value}" 두 시그널을 모두 추가한다.
//      단, value 자체가 "none" 이면 "Q{n}.none" 만 추가하고 bare "Q{n}" 은 추가하지 않는다
//      (해당 없음 선택은 실질적 관심 신호가 아니므로).
//   2) multi: 선택된 각 옵션에 대해 "Q{n}.{value}" 를 추가한다. value 가 "none" 이 아닌
//      옵션이 하나라도 있으면 bare "Q{n}" 도 추가한다.
//   3) scale: 응답값이 임계치(threshold, 기본 4) 이상이면 "Q{n}" 시그널을 추가한다.
//      (5점 척도에서 4~5 = "관심/중요도가 높다"는 의미로 해석 — 문서화된 단순 규칙)
//      scale 문항은 "Q{n}.{value}" 형태의 dotted 시그널은 만들지 않는다.
//
// 나이(생애단계)는 이 정규화 단계에서 별도의 독립 추천 근거로 다루지 않는다 —
// life stage 판단은 resultGenerator 에서 문맥으로만 참고한다.

import type { AnswerMap, Question } from '../types'

export const SCALE_HIGH_THRESHOLD = 4

const NON_SIGNAL_VALUES = new Set(['none'])

export function normalizeAnswers(answers: AnswerMap, questions: Question[]): Set<string> {
  const signals = new Set<string>()

  for (const q of questions) {
    const raw = answers[q.id]
    if (raw === undefined || raw === null) continue

    if (q.type === 'single') {
      const value = raw as string
      if (!value) continue
      signals.add(`${q.id}.${value}`)
      if (!NON_SIGNAL_VALUES.has(value)) {
        signals.add(q.id)
      }
    } else if (q.type === 'multi') {
      const values = (raw as string[]) ?? []
      let hasMeaningful = false
      for (const value of values) {
        signals.add(`${q.id}.${value}`)
        if (!NON_SIGNAL_VALUES.has(value)) hasMeaningful = true
      }
      if (hasMeaningful) signals.add(q.id)
    } else if (q.type === 'scale') {
      const value = raw as number
      if (typeof value === 'number' && value >= SCALE_HIGH_THRESHOLD) {
        signals.add(q.id)
      }
    }
  }

  return signals
}
