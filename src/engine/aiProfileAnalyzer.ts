// aiProfileAnalyzer
// 02_scoring.yml 의 ai_profile 7개 차원을 점수화한다. 결과는 "관심 영역" 목록으로만
// 제시하며(예: "AI 이미지 생성에 관심이 있어요"), 숫자 점수는 UI에 노출하지 않는다.

import type { AiProfileResult, ScoringConfig } from '../types'
import { scoreBySignalList } from './trackScoring'

export function analyzeAiProfile(signals: Set<string>, scoring: ScoringConfig): AiProfileResult {
  const dimensions = scoreBySignalList(signals, scoring.ai_profile)
  const interests = dimensions
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((d) => d.key)

  return { dimensions, interests }
}
