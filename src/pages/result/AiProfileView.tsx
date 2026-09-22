import type { DiagnosisResult } from '../../types'
import { AI_PROFILE_LABELS } from '../../constants/labels'

interface Props {
  result: DiagnosisResult
}

export default function AiProfileView({ result }: Props) {
  const { interests } = result.aiProfile

  return (
    <div>
      <div className="eyebrow">AI · 캐릭터/IP 프로필</div>
      <h1>관심 있는 AI 활용 영역</h1>
      <p>점수가 아니라 관심이 확인된 영역을 보여드려요.</p>

      {interests.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>
            아직 뚜렷한 AI 관심 영역이 확인되지 않았어요. 교육 과정에서 다양한 AI 도구를
            접해보며 찾아갈 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="chip-row">
            {interests.map((key) => (
              <span key={key} className="tag">
                {AI_PROFILE_LABELS[key] ?? key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
