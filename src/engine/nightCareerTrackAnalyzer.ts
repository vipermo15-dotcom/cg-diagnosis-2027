// nightCareerTrackAnalyzer
// 04_night-career-routing.yml 의 night_tracks(4대 야간 진로트랙)을 selection 규칙에 따라 점수화한다.
//   primary = highest_normalized_score
//   secondary = gap <= secondary_if_gap_lte(15) 인 경우에만
//   tie = 동점이면 둘 다 보여줌 (note: 탐색 결과이며 확정 진로 판정이 아님)

import type { NightCareerRoutingConfig, NightCareerResult } from '../types'
import { pickPrimarySecondary, scoreBySignalList } from './trackScoring'

export function analyzeNightCareerTrack(
  signals: Set<string>,
  config: NightCareerRoutingConfig,
): NightCareerResult | undefined {
  const definitions: Record<string, string[]> = {}
  for (const [key, track] of Object.entries(config.tracks)) {
    definitions[key] = track.signals
  }

  const scores = scoreBySignalList(signals, definitions)
  const { primary, secondary, tie } = pickPrimarySecondary(
    scores,
    config.selection.secondary_if_gap_lte,
  )

  if (!primary) return undefined

  return {
    primary,
    secondary,
    showBoth: tie,
    scores,
  }
}
