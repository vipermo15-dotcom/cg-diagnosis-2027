// diagnosisEngine — 단일 진입점
// normalize -> scores -> life stage -> primary/secondary job track -> course_direction
// -> night_track (필요 시) -> course comparison -> result -> roadmap
//
// 순수 함수, React 의존성 없음. 테스트 가능.

import {
  diagnosisConfig,
  questions,
  scoringConfig,
  courseRoutingConfig,
  nightCareerRoutingConfig,
  resultTypesConfig,
  comparisonConfig,
  roadmapConfig,
} from '../data'
import type { AnswerMap, DiagnosisResult } from '../types'
import { normalizeAnswers } from './answerNormalizer'
import { calculateCourseDirection } from './scoreCalculator'
import { analyzeJobTracks } from './jobTrackAnalyzer'
import { analyzeAiProfile } from './aiProfileAnalyzer'
import { analyzeNightCareerTrack } from './nightCareerTrackAnalyzer'
import { routeCourses } from './courseRouter'
import { generateResultType } from './resultGenerator'
import { generateRoadmap } from './roadmapGenerator'
import { analyzeLifeStage } from './lifeStageAnalyzer'

export function runDiagnosis(answers: AnswerMap): DiagnosisResult {
  const signals = normalizeAnswers(answers, questions)

  const lifeStage = analyzeLifeStage(answers)

  const jobTrack = analyzeJobTracks(signals, scoringConfig)
  const aiProfile = analyzeAiProfile(signals, scoringConfig)

  const courseDirectionResult = calculateCourseDirection(signals, scoringConfig)

  // 야간 진로트랙은 course_direction 이 야간 요소를 포함할 때만 의미가 있다
  const showNightCareer =
    courseDirectionResult.direction === 'nighttime' || courseDirectionResult.direction === 'both'
  const nightCareer = showNightCareer
    ? analyzeNightCareerTrack(signals, nightCareerRoutingConfig)
    : undefined

  const courseComparison = routeCourses(
    signals,
    jobTrack.primary,
    jobTrack.secondary,
    courseRoutingConfig,
    comparisonConfig,
  )

  const { resultType, resultTitle, resultSummary } = generateResultType(
    lifeStage,
    courseDirectionResult,
    aiProfile,
    answers,
    resultTypesConfig,
  )

  const roadmap = generateRoadmap(jobTrack.primary, nightCareer?.primary, roadmapConfig)

  // 항상 result_policy 를 준수: 적성점수/합격불합격/1위 표시 금지
  void diagnosisConfig.result_policy

  return {
    lifeStage,
    resultType,
    resultTitle,
    resultSummary,
    courseDirection: courseDirectionResult.direction,
    jobTrack,
    aiProfile,
    nightCareer,
    courseComparison,
    roadmap,
  }
}
