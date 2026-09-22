import type { DiagnosisResult } from '../../types'
import { COURSE_DIRECTION_LABELS } from '../../constants/labels'
import { diagnosisConfig } from '../../data'

interface Props {
  result: DiagnosisResult
}

export default function CourseDirectionView({ result }: Props) {
  const info = COURSE_DIRECTION_LABELS[result.courseDirection]
  const { daytime, evening } = diagnosisConfig.courses

  return (
    <div>
      <div className="eyebrow">주간 / 야간 비교</div>
      <h1>{info.title}</h1>
      <p>{info.description}</p>

      <div className="card" style={{ opacity: result.courseDirection === 'nighttime' ? 0.6 : 1 }}>
        <h3>{daytime.name}</h3>
        <p style={{ margin: 0 }}>취업, 창업, 신기술 학습 등 낮 시간 집중 학습에 어울립니다.</p>
      </div>

      <div className="card" style={{ opacity: result.courseDirection === 'daytime' ? 0.6 : 1 }}>
        <h3>{evening.name}</h3>
        <p style={{ margin: 0 }}>
          재직, 직무전환, 경력재진입, 인생2모작 준비 등 저녁 시간을 활용하는 학습에 어울립니다.
        </p>
      </div>

      <div className="notice-box">주간·야간 중 더 나은 과정을 판정하지 않습니다. 나의 시간대와 상황에 맞게 선택하는 참고 정보입니다.</div>
    </div>
  )
}
