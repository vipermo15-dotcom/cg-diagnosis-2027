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
import { submitConsultation, linkResultToEmail } from '../services/supabase'

interface Props {
  result: DiagnosisResult
  sessionId: string | null
  onRestart: () => void
}

// 화면 순서: 6 결과 -> 7 직무방향 -> 8 주간/야간 -> 9 과정비교 -> 10 로드맵
// -> 11 야간트랙(해당 시) -> 12 AI/캐릭터 프로필 -> 13 상담 -> 14 지원
export default function ResultFlow({ result, sessionId, onRestart }: Props) {
  const [index, setIndex] = useState(0)
  const [consultationSubmitted, setConsultationSubmitted] = useState(false)

  const steps = useMemo(() => {
    const base: { key: string; render: () => JSX.Element }[] = [
      {
        key: 'summary',
        render: () => (
          <ResultSummary
            result={result}
            onSaveEmail={(email) => linkResultToEmail(sessionId, email)}
          />
        ),
      },
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
    base.push({
      key: 'apply',
      render: () => (
        <ApplyCta
          onRestart={onRestart}
          onGoToConsultation={() => setIndex(base.findIndex((s) => s.key === 'consultation'))}
        />
      ),
    })
    return base
    // consultationSubmitted가 빠지면 상담 신청 성공 후에도 "접수됐어요" 화면이 뜨지 않는다
    // (steps가 기억해둔 예전 렌더 함수가 신청 전 상태를 계속 참조하게 됨).
  }, [result, sessionId, onRestart, consultationSubmitted])

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
