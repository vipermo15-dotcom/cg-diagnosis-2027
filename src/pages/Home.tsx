import { diagnosisConfig } from '../data'

interface Props {
  onStart: () => void
}

export default function Home({ onStart }: Props) {
  return (
    <div className="screen">
      <div className="center-col" style={{ paddingTop: 40 }}>
        <div className="eyebrow">2027 컴퓨터그래픽디자인과 자기진단</div>
        <h1>나에게 맞는 디자인 교육은 무엇일까요?</h1>
        <p>
          {diagnosisConfig.system.question_count}문항, 약 {diagnosisConfig.system.estimated_time}
          이면 충분합니다. 지금 나의 상황과 관심사를 바탕으로 주간·야간 과정을 포함한 교육
          방향을 함께 살펴봅니다.
        </p>

        <div className="card" style={{ width: '100%', marginTop: 24, textAlign: 'left' }}>
          <h3>이런 걸 알 수 있어요</h3>
          <p style={{ margin: 0 }}>
            · 지금 나의 상황과 연결되는 교육 방향
            <br />
            · 관심 있는 직무 영역 (BX·광고·편집·패키지·AI 비주얼)
            <br />
            · 주간/야간 과정 비교 및 관련 과정 안내
            <br />· 나에게 맞는 학습 로드맵
          </p>
        </div>

        <div className="notice-box" style={{ width: '100%' }}>
          이 진단은 적성 검사나 합격 여부 판정이 아닙니다. 응답과 연결되는 교육 방향을
          안내해 드립니다.
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          자기진단 시작하기
        </button>
      </div>
    </div>
  )
}
