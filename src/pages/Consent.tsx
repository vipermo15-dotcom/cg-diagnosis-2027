import { useState } from 'react'

interface Props {
  onNext: (consented: boolean) => void
  onPrev: () => void
}

export default function Consent({ onNext, onPrev }: Props) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="screen">
      <div className="eyebrow">개인정보 수집·이용 동의</div>
      <h1>진단을 시작하기 전에 동의가 필요합니다</h1>
      <p>
        자기진단 응답은 교육 방향 안내 목적으로만 사용됩니다. 상담을 신청하지 않는 한
        연락처를 수집하지 않습니다.
      </p>

      <label className="checkbox-row" htmlFor="consent-checkbox">
        <input
          id="consent-checkbox"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          (필수) 자기진단 응답 데이터 수집·이용에 동의합니다. 수집된 응답은 결과 제공 및
          서비스 개선 목적 외에는 사용되지 않습니다.
        </span>
      </label>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 24 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: '0 0 88px' }} onClick={onPrev}>
          이전
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!agreed}
          onClick={() => onNext(agreed)}
        >
          동의하고 시작하기
        </button>
      </div>
    </div>
  )
}
