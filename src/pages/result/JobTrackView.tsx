import type { DiagnosisResult } from '../../types'
import { JOB_TRACK_DESCRIPTIONS, JOB_TRACK_LABELS } from '../../constants/labels'

interface Props {
  result: DiagnosisResult
}

export default function JobTrackView({ result }: Props) {
  const { primary, secondary } = result.jobTrack

  return (
    <div>
      <div className="eyebrow">직무 방향</div>
      <h1>관심이 연결되는 직무 영역</h1>
      <p>응답 내용과 가장 많이 연결되는 직무 영역을 순위가 아닌 방향성으로 보여드려요.</p>

      <div className="card card-highlight">
        <div className="tag">가장 가깝게 연결돼요</div>
        <h3 style={{ marginTop: 10 }}>{JOB_TRACK_LABELS[primary]}</h3>
        <p style={{ margin: 0 }}>{JOB_TRACK_DESCRIPTIONS[primary]}</p>
      </div>

      {secondary && (
        <div className="card">
          <div className="tag tag-muted">함께 살펴봐도 좋아요</div>
          <h3 style={{ marginTop: 10 }}>{JOB_TRACK_LABELS[secondary]}</h3>
          <p style={{ margin: 0 }}>{JOB_TRACK_DESCRIPTIONS[secondary]}</p>
        </div>
      )}
    </div>
  )
}
