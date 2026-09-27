import type { CourseDirection, DiagnosisResult } from '../types'
import type { StoredResult } from '../services/applicant'
import ResultSummary from '../pages/result/ResultSummary'
import JobTrackView from '../pages/result/JobTrackView'
import CourseDirectionView from '../pages/result/CourseDirectionView'
import CourseComparisonView from '../pages/result/CourseComparisonView'
import RoadmapView from '../pages/result/RoadmapView'
import NightCareerView from '../pages/result/NightCareerView'
import AiProfileView from '../pages/result/AiProfileView'

interface Props {
  result: StoredResult
}

// 저장된 컬럼들을 기존 결과 화면 컴포넌트가 기대하는 DiagnosisResult 형태로 재구성한다.
// jobTrack.scores / nightCareer.scores 등 세부 점수 배열은 저장되지 않으므로 빈 배열로
// 채운다 — 어떤 결과 화면 컴포넌트도 .scores를 직접 렌더링하지 않으므로 지장 없다.
function toDiagnosisResult(stored: StoredResult): DiagnosisResult {
  return {
    lifeStage: stored.lifeStage,
    resultType: '',
    resultTitle: stored.resultTitle,
    resultSummary: stored.resultSummary,
    courseDirection: stored.courseDirection as CourseDirection,
    jobTrack: {
      primary: stored.primaryTrack,
      secondary: stored.secondaryTrack ?? undefined,
      scores: [],
    },
    aiProfile: stored.aiProfile,
    nightCareer: stored.nightCareerTrack
      ? { primary: stored.nightCareerTrack, secondary: undefined, showBoth: false, scores: [] }
      : undefined,
    courseComparison: stored.courseComparison,
    roadmap: stored.roadmap,
  }
}

export default function MyResultView({ result }: Props) {
  const diagnosisResult = toDiagnosisResult(result)

  return (
    <div className="screen-narrow" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
      <ResultSummary result={diagnosisResult} />
      <JobTrackView result={diagnosisResult} />
      <CourseDirectionView result={diagnosisResult} />
      {diagnosisResult.courseComparison.length > 0 && (
        <CourseComparisonView result={diagnosisResult} />
      )}
      <RoadmapView result={diagnosisResult} />
      {diagnosisResult.nightCareer && <NightCareerView result={diagnosisResult} />}
      <AiProfileView result={diagnosisResult} />
    </div>
  )
}
