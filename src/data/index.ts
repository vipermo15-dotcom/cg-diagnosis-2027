// YAML 로더 — src/data/*.yml 이 콘텐츠/라우팅의 단일 소스(source of truth)다.
// 질문 ID·텍스트·스코어링 규칙 등은 절대 컴포넌트/엔진 코드에 하드코딩하지 않고
// 이 모듈을 통해서만 읽는다.

import yaml from 'js-yaml'

import diagnosisRaw from './00_diagnosis.yml?raw'
import questionsRaw from './01_questions.yml?raw'
import scoringRaw from './02_scoring.yml?raw'
import courseRoutingRaw from './03_course-routing.yml?raw'
import nightCareerRoutingRaw from './04_night-career-routing.yml?raw'
import resultTypesRaw from './05_result-types.yml?raw'
import comparisonRaw from './06_comparison.yml?raw'
import roadmapRaw from './07_roadmap.yml?raw'

import type {
  DiagnosisConfig,
  QuestionsFile,
  ScoringConfig,
  CourseRoutingConfig,
  NightCareerRoutingConfig,
  ResultTypesConfig,
  ComparisonConfig,
  RoadmapConfig,
} from '../types'

export const diagnosisConfig = yaml.load(diagnosisRaw) as DiagnosisConfig
export const questionsFile = yaml.load(questionsRaw) as QuestionsFile
export const scoringConfig = yaml.load(scoringRaw) as ScoringConfig
export const courseRoutingConfig = yaml.load(courseRoutingRaw) as CourseRoutingConfig
export const nightCareerRoutingConfig = yaml.load(nightCareerRoutingRaw) as NightCareerRoutingConfig
export const resultTypesConfig = yaml.load(resultTypesRaw) as ResultTypesConfig
export const comparisonConfig = yaml.load(comparisonRaw) as ComparisonConfig
export const roadmapConfig = yaml.load(roadmapRaw) as RoadmapConfig

export const questions = questionsFile.questions
