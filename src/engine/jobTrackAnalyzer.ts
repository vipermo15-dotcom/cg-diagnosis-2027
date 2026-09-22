// jobTrackAnalyzer
// 02_scoring.yml 의 job_tracks (5대 직무트랙)을 점수화하고 primary/secondary 를 뽑는다.
// gap 기준은 02_scoring.yml 에 job_tracks 전용 selection 규칙이 없으므로,
// 04_night-career-routing.yml 의 selection.secondary_if_gap_lte(15)를 동일하게 재사용한다
// (문서화된 판단 — 일관된 gap 기준을 프로젝트 전체에 적용).

import type { JobTrackResult, ScoringConfig } from '../types'
import { pickPrimarySecondary, scoreBySignalList } from './trackScoring'

const SECONDARY_GAP_THRESHOLD = 15

export function analyzeJobTracks(signals: Set<string>, scoring: ScoringConfig): JobTrackResult {
  const scores = scoreBySignalList(signals, scoring.job_tracks)
  const { primary, secondary } = pickPrimarySecondary(scores, SECONDARY_GAP_THRESHOLD)

  return {
    primary: primary ?? fallbackTrack(scores),
    secondary,
    scores,
  }
}

// 아무 시그널도 매칭되지 않은 극히 드문 경우를 위한 안전한 기본값
function fallbackTrack(scores: { key: string; score: number }[]): string {
  return scores[0]?.key ?? 'bx_brand'
}
