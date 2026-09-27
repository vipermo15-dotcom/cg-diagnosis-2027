import { useState } from 'react'
import type { DiagnosisResult } from '../../types'
import { JOB_TRACK_LABELS } from '../../constants/labels'

interface Props {
  result: DiagnosisResult
  onSaveEmail?: (email: string) => Promise<{ ok: boolean; error?: string }>
}

export default function ResultSummary({ result, onSaveEmail }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSave = async () => {
    if (!onSaveEmail || !isValidEmail) return
    setStatus('saving')
    const { ok, error } = await onSaveEmail(email.trim())
    if (ok) {
      setStatus('saved')
    } else {
      setStatus('error')
      setErrorMsg(error ?? '알 수 없는 오류')
    }
  }

  return (
    <div>
      <div className="eyebrow">나의 진단 결과</div>
      <h1>{result.resultTitle}</h1>
      <p>{result.resultSummary}</p>

      <div className="card card-highlight">
        <h3>현재 상태</h3>
        <p style={{ margin: 0 }}>지금 응답을 바탕으로 정리한 나의 교육 방향입니다.</p>
      </div>

      <div className="card">
        <h3>관심 직무</h3>
        <div className="chip-row">
          <span className="tag">{JOB_TRACK_LABELS[result.jobTrack.primary]}</span>
          {result.jobTrack.secondary && (
            <span className="tag tag-muted">{JOB_TRACK_LABELS[result.jobTrack.secondary]}</span>
          )}
        </div>
      </div>

      {onSaveEmail && (
        <div className="card">
          <h3>이메일로 저장해두고 나중에 다시 보기</h3>
          {status === 'saved' ? (
            <p style={{ margin: 0 }}>
              <strong>{email}</strong>로 저장했어요. 나중에 이 이메일로 로그인하면 다시
              확인하실 수 있어요.
            </p>
          ) : (
            <>
              <p style={{ margin: '0 0 8px' }}>
                입력하지 않아도 결과 확인에는 지장이 없어요. (선택 사항)
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                입력하신 이메일은 로그인 확인 및 결과 재확인 용도로만 사용되며, 별도 요청 시
                삭제할 수 있습니다.
              </p>
              <div className="field">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!isValidEmail || status === 'saving'}
                onClick={() => void handleSave()}
              >
                {status === 'saving' ? '저장 중...' : '이 이메일로 저장하기'}
              </button>
              {status === 'error' && (
                <p style={{ color: '#c0392b', marginTop: 8 }}>저장 실패: {errorMsg}</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="notice-box">
        이 결과는 적성 판정이나 합격 여부가 아니라, 지금 응답과 연결되는 교육 방향
        제안입니다.
      </div>
    </div>
  )
}
