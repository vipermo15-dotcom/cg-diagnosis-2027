// trackScoring
// ──────────────────────────────────────────────────────────────────────────
// job_tracks / ai_profile / night_tracks 는 모두 "signals: string[]" 목록을 가진
// 동일한 형태이므로 공통 유틸로 점수화한다.
// 점수 = (신호 목록 중 실제로 present 한 시그널 수) / (신호 목록 길이) * 100
// → 0~100 사이 내부 정규화 점수. UI에는 "적성 점수"로 직접 노출하지 않고
//   순위(primary/secondary) 판단과 "관심 영역이 있음/없음" 표시에만 사용한다.

import type { TrackScore } from '../types'

export function scoreBySignalList(
  signals: Set<string>,
  definitions: Record<string, string[]>,
): TrackScore[] {
  return Object.entries(definitions).map(([key, sigList]) => {
    const matched = sigList.filter((s) => signals.has(s)).length
    const score = sigList.length > 0 ? (matched / sigList.length) * 100 : 0
    return { key, score: Math.round(score * 10) / 10 }
  })
}

export function pickPrimarySecondary(
  scores: TrackScore[],
  gapThreshold: number,
): { primary?: string; secondary?: string; tie: boolean } {
  const sorted = [...scores].filter((s) => s.score > 0).sort((a, b) => b.score - a.score)
  if (sorted.length === 0) return { tie: false }

  const primary = sorted[0]
  const second = sorted[1]

  if (!second) return { primary: primary.key, tie: false }

  const gap = primary.score - second.score
  const tie = gap === 0
  if (tie || gap <= gapThreshold) {
    return { primary: primary.key, secondary: second.key, tie }
  }
  return { primary: primary.key, tie: false }
}
