// ── 타입 정의 ──────────────────────────────────────────────────────────────
// 모든 타입은 src/data/*.yml 의 실제 구조를 그대로 반영한다.
// 질문 ID·문구는 절대 여기에 하드코딩하지 않는다 (src/data/index.ts 로더가 YAML에서 읽어온다).

export type QuestionType = 'single' | 'multi' | 'scale'

export interface QuestionOption {
  value: string
  label: string
}

export interface QuestionScale {
  min: number
  max: number
  min_label: string
  max_label: string
}

export interface Question {
  id: string // e.g. "Q01"
  section: string
  type: QuestionType
  key: string
  text: string
  options?: QuestionOption[]
  scale?: QuestionScale
}

export interface QuestionsFile {
  version: string
  questions: Question[]
}

// 응답: single -> string, multi -> string[], scale -> number
export type AnswerValue = string | string[] | number
export type AnswerMap = Record<string, AnswerValue>

export interface DiagnosisSession {
  answers: AnswerMap
  startedAt: string
  completedAt?: string
}

// ── 00_diagnosis.yml ─────────────────────────────────────────────────────
export interface DiagnosisConfig {
  system: {
    id: string
    version: string
    title: string
    estimated_time: string
    question_count: number
    mode: string
  }
  courses: {
    daytime: { code: string; name: string; goals: string[] }
    evening: { code: string; name: string; goals: string[] }
    related: { code: string; name: string }[]
  }
  tracks: string[]
  result_policy: {
    show_primary_secondary: boolean
    show_course_comparison: boolean
    show_roadmap: boolean
    show_score_as_aptitude: boolean
    show_ranked_winner: boolean
  }
}

// ── 02_scoring.yml ───────────────────────────────────────────────────────
export interface ScoringConfig {
  version: string
  mode: string
  course_direction: {
    daytime: Record<string, number>
    nighttime: Record<string, number>
  }
  routing: {
    close_range_points: number
    clear_direction_min_score: number
    clear_direction_min_difference: number
    outputs: string[]
  }
  job_tracks: Record<string, string[]>
  ai_profile: Record<string, string[]>
  night_tracks: Record<string, string[]>
}

// ── 03_course-routing.yml ────────────────────────────────────────────────
export interface CourseRoutingRule {
  when: string[]
  compare: string[]
}

export interface CourseRoutingConfig {
  version: string
  courses: Record<string, { name: string; focus: string[] }>
  routing: Record<string, CourseRoutingRule>
  user_display: {
    show_relation: boolean
    show_rank: boolean
    show_best_course: boolean
  }
}

// ── 04_night-career-routing.yml ──────────────────────────────────────────
export interface NightCareerRoutingConfig {
  version: string
  tracks: Record<string, { title: string; signals: string[] }>
  selection: {
    primary: string
    secondary_if_gap_lte: number
    tie: string
    note: string
  }
}

// ── 05_result-types.yml ──────────────────────────────────────────────────
export interface ResultTypesConfig {
  version: string
  types: Record<string, { title: string; description: string }>
  display: { avoid: string[] }
}

// ── 06_comparison.yml ────────────────────────────────────────────────────
export interface ComparisonConfig {
  version: string
  courses: Record<string, { name: string; keywords: string[] }>
  dimensions: string[]
  language: { title: string; rule: string }
}

// ── 07_roadmap.yml ───────────────────────────────────────────────────────
export interface RoadmapStep {
  id: string
  title: string
  output: string
}

export interface RoadmapConfig {
  version: string
  steps: RoadmapStep[]
  overlays: Record<string, string[]>
}

// ── 엔진 출력 타입 ────────────────────────────────────────────────────────

export type CourseDirection = 'daytime' | 'nighttime' | 'both' | 'exploration'

export interface TrackScore {
  key: string
  score: number // 0~100 정규화 점수 (내부용, UI에 원점수로 노출하지 않음)
}

export interface JobTrackResult {
  primary: string
  secondary?: string
  scores: TrackScore[]
}

export interface AiProfileResult {
  dimensions: TrackScore[]
  interests: string[] // score > 0 인 관심 영역 key 목록 (표시용)
}

export interface NightCareerResult {
  primary: string
  secondary?: string
  showBoth: boolean
  scores: TrackScore[]
}

export interface CourseComparisonEntry {
  code: string
  name: string
  keywords: string[]
  matchedRules: string[]
}

export interface RoadmapStepWithOverlay extends RoadmapStep {
  overlayNotes: string[]
}

export interface DiagnosisResult {
  lifeStage: string
  resultType: string
  resultTitle: string
  resultSummary: string
  courseDirection: CourseDirection
  jobTrack: JobTrackResult
  aiProfile: AiProfileResult
  nightCareer?: NightCareerResult
  courseComparison: CourseComparisonEntry[]
  roadmap: RoadmapStepWithOverlay[]
}

// ── 상담/지원 ────────────────────────────────────────────────────────────
export interface ConsultationRequest {
  name: string
  phone: string
  preferredCourse: string
  preferredTime: string
  message?: string
}
