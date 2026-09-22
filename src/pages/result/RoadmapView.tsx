import type { DiagnosisResult } from '../../types'

interface Props {
  result: DiagnosisResult
}

export default function RoadmapView({ result }: Props) {
  return (
    <div>
      <div className="eyebrow">학습 로드맵</div>
      <h1>나에게 연결되는 학습 단계</h1>
      <p>8단계 기본 흐름에, 관심 직무에 맞는 프로젝트를 더했습니다.</p>

      <div className="card">
        {result.roadmap.map((step) => (
          <div key={step.id} className="roadmap-step">
            <div className="roadmap-num">{step.id}</div>
            <div>
              <h3>{step.title}</h3>
              <p style={{ margin: 0 }}>{step.output}</p>
              {step.overlayNotes.length > 0 && (
                <div className="chip-row">
                  {step.overlayNotes.map((n) => (
                    <span key={n} className="tag">
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
