import type { DiagnosisResult } from '../../types'
import { JOB_TRACK_LABELS } from '../../constants/labels'

interface Props {
  result: DiagnosisResult
}

export default function ResultSummary({ result }: Props) {
  return (
    <div>
      <div className="eyebrow">나의 진단 결과</div>
      <h1>{result.resultTitle}</h1>
      <p>{result.resultSummary}</p>

      <div className="card card-highlight">
        <h3>현재 상태</h3>
        <p style={{ margin: 0 }}>지금 응답을 바탕으로 정리한 나의 교육 방향입니다.</p>
      </div>

      <div className="card">
        <h3>관심 직무</h3>
        <div className="chip-row">
          <span className="tag">{JOB_TRACK_LABELS[result.jobTrack.primary]}</span>
          {result.jobTrack.secondary && (
            <span className="tag tag-muted">{JOB_TRACK_LABELS[result.jobTrack.secondary]}</span>
          )}
        </div>
      </div>

      <div className="notice-box">
        이 결과는 적성 판정이나 합격 여부가 아니라, 지금 응답과 연결되는 교육 방향
        제안입니다.
      </div>
    </div>
  )
}
