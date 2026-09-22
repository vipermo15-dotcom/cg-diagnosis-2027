import type { DiagnosisResult } from '../../types'
import { nightCareerRoutingConfig } from '../../data'

interface Props {
  result: DiagnosisResult
}

export default function NightCareerView({ result }: Props) {
  const nightCareer = result.nightCareer
  if (!nightCareer) return null

  const tracks = nightCareerRoutingConfig.tracks

  return (
    <div>
      <div className="eyebrow">야간 진로트랙</div>
      <h1>야간 과정과 연결되는 진로트랙</h1>
      <p>{nightCareerRoutingConfig.selection.note}</p>

      <div className="card card-highlight">
        <div className="tag">가장 가깝게 연결돼요</div>
        <h3 style={{ marginTop: 10 }}>{tracks[nightCareer.primary]?.title}</h3>
      </div>

      {nightCareer.secondary && (
        <div className="card">
          <div className="tag tag-muted">함께 살펴봐도 좋아요</div>
          <h3 style={{ marginTop: 10 }}>{tracks[nightCareer.secondary]?.title}</h3>
        </div>
      )}
    </div>
  )
}
