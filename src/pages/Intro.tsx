import { diagnosisConfig } from '../data'

interface Props {
  onNext: () => void
  onPrev: () => void
}

export default function Intro({ onNext, onPrev }: Props) {
  return (
    <div className="screen">
      <div className="eyebrow">시작하기 전에</div>
      <h1>이렇게 진행됩니다</h1>
      <p>총 {diagnosisConfig.system.question_count}개의 질문에 하나씩 답해주세요.</p>

      <div className="card">
        <h3>1. 현재 상황 · 목표</h3>
        <p style={{ margin: 0 }}>지금 상황, 교육 목표, 학습 가능 시간대를 확인합니다.</p>
      </div>
      <div className="card">
        <h3>2. 경력 · 관심 직무</h3>
        <p style={{ margin: 0 }}>이전 경험과 관심 있는 디자인 직무 영역을 확인합니다.</p>
      </div>
      <div className="card">
        <h3>3. AI · 캐릭터 · 포트폴리오</h3>
        <p style={{ margin: 0 }}>AI 활용도, 캐릭터/IP 관심, 자격증·포트폴리오 방향을 확인합니다.</p>
      </div>

      <div className="notice-box">
        정답이 있는 시험이 아니에요. 지금 떠오르는 대로 편하게 선택해 주세요.
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 24 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: '0 0 88px' }} onClick={onPrev}>
          이전
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          다음
        </button>
      </div>
    </div>
  )
}
