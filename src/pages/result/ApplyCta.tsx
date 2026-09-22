interface Props {
  onRestart: () => void
}

export default function ApplyCta({ onRestart }: Props) {
  return (
    <div>
      <div className="eyebrow">지원하기</div>
      <h1>2027 컴퓨터그래픽디자인과, 함께 시작해요</h1>
      <p>
        실제 지원은 서울시기술교육원의 공식 지원 절차를 통해 진행됩니다. 아래 문의처로
        연락하시면 지원 방법을 자세히 안내받을 수 있어요.
      </p>

      <div className="card card-highlight">
        <h3>지원 문의</h3>
        <p style={{ margin: 0 }}>
          서울시기술교육원 중부캠퍼스 컴퓨터그래픽디자인과
          <br />
          (실제 대표번호·이메일은 기관 공식 채널로 안내됩니다)
        </p>
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: 12 }}>
        지원 문의하기
      </button>
      <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onRestart}>
        처음부터 다시 진단하기
      </button>
    </div>
  )
}
