import type { DiagnosisResult } from '../../types'
import { comparisonConfig } from '../../data'

interface Props {
  result: DiagnosisResult
}

export default function CourseComparisonView({ result }: Props) {
  return (
    <div>
      <div className="eyebrow">관련 과정 비교</div>
      <h1>{comparisonConfig.language.title}</h1>
      <p>{comparisonConfig.language.rule}</p>

      {result.courseComparison.map((c) => (
        <div key={c.code} className="card">
          <h3>{c.name}</h3>
          <div className="chip-row">
            {c.keywords.map((k) => (
              <span key={k} className="tag tag-muted">
                {k}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="notice-box">과정 간 우열이나 순위를 매기지 않습니다. 관심 영역과 교육 내용의 연결 관계만 보여드려요.</div>
    </div>
  )
}
