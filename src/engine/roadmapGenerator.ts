// roadmapGenerator
// 07_roadmap.yml 의 기본 8단계에, primary job track 의 overlay 를 얹는다.
// night_track 이 character_designer 이면 character_designer overlay 도 추가로 얹는다.
// overlay 는 "직무 프로젝트(05)"와 "기업 프로젝트(06)" 단계에 부가 설명으로 덧붙인다
// (07_roadmap.yml 자체는 overlay를 어느 step에 붙일지 명시하지 않으므로, 프로젝트 산출물
// 성격상 가장 자연스러운 05/06단계에 배치하는 문서화된 판단).

import type { RoadmapConfig, RoadmapStepWithOverlay } from '../types'

const OVERLAY_STEP_IDS = ['05', '06']

export function generateRoadmap(
  primaryJobTrack: string,
  nightCareerTrack: string | undefined,
  roadmap: RoadmapConfig,
): RoadmapStepWithOverlay[] {
  const overlayKeys = [primaryJobTrack]
  if (nightCareerTrack === 'character_designer') overlayKeys.push('character_designer')

  const overlayNotesAll = overlayKeys.flatMap((key) => roadmap.overlays[key] ?? [])

  return roadmap.steps.map((step) => ({
    ...step,
    overlayNotes: OVERLAY_STEP_IDS.includes(step.id) ? overlayNotesAll : [],
  }))
}
