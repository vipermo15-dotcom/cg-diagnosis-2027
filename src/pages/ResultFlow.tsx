import { useMemo, useState } from 'react'
import type { ConsultationRequest, DiagnosisResult } from '../types'
import ResultSummary from './result/ResultSummary'
import JobTrackView from './result/JobTrackView'
import CourseDirectionView from './result/CourseDirectionView'
import CourseComparisonView from './result/CourseComparisonView'
import RoadmapView from './result/RoadmapView'
import NightCareerView from './result/NightCareerView'
import AiProfileView from './result/AiProfileView'
import ConsultationForm from './result/ConsultationForm'
import ApplyCta from './result/ApplyCta'
import { submitConsultation } from '../services/supabase'

interface Props {
  result: DiagnosisResult
  sessionId: string | null
  onRestart: () => void
}

// 화면 순서: 6 결과 -> 7 직무방향 -> 8 주간/야간 -> 9 과정비교 -> 10 로드맵
// -> 11 야간트랙(해당 시) -> 12 AI/캐릭터 프로필 -> 13 상담 -> 14 지원
export default function ResultFlow({ result, sessionId, onRestart }: Props) {
  const steps = useMemo(() => {
    const base: { key: string; render: () => JSX.Element }[] = [
      { key: 'summary', render: () => <ResultSummary result={result} /> },
      { key: 'job', render: () => <JobTrackView result={result} /> },
      { key: 'direction', render: () => <CourseDirectionView result={result} /> },
      { key: 'comparison', render: () => <CourseComparisonView result={result} /> },
      { key: 'roadmap', render: () => <RoadmapView result={result} /> },
    ]
    if (result.nightCareer) {
      base.push({ key: 'night', render: () => <NightCareerView result={result} /> })
    }
    base.push({ key: 'ai', render: () => <AiProfileView result={result} /> })
    base.push({
      key: 'consultation',
      render: () => (
        <ConsultationForm
          submitted={consultationSubmitted}
          onSubmit={async (req: ConsultationRequest) => {
            await submitConsultation(sessionId, req)
            setConsultationSubmitted(true)
          }}
        />
      ),
    })
    base.push({ key: 'apply', render: () => <ApplyCta onRestart={onRestart} /> })
    return base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const [index, setIndex] = useState(0)
  const [consultationSubmitted, setConsultationSubmitted] = useState(false)

  const isLast = index === steps.length - 1
  const isFirst = index === 0

  return (
    <div className="screen">
      <div className="step-dots">
        {steps.map((s, i) => (
          <div key={s.key} className={`step-dot${i === index ? ' active' : ''}`} />
        ))}
      </div>

      {steps[index].render()}

      <div className="bottom-nav" style={{ position: 'sticky' }}>
        {!isFirst && (
          <button type="button" className="btn btn-secondary" onClick={() => setIndex((i) => i - 1)}>
            이전
          </button>
        )}
        {!isLast && (
          <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
            다음
          </button>
        )}
      </div>
    </div>
  )
}
