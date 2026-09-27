import { useState } from 'react'
import { sendMyMagicLink } from '../services/applicant'

export default function MyLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    const { ok, error } = await sendMyMagicLink(email)
    if (ok) {
      setStatus('sent')
    } else {
      setStatus('error')
      setErrorMsg(error ?? '알 수 없는 오류')
    }
  }

  return (
    <div className="screen">
      <div className="center-col" style={{ paddingTop: 80 }}>
        <div className="eyebrow">내 결과</div>
        <h1>내 진단 결과 다시 보기</h1>
        <p>
          진단 완료 화면에서 저장하신 이메일을 입력해주세요. 저장한 적이 없다면 로그인은
          되지만 결과는 보이지 않아요. 비밀번호는 없습니다.
        </p>

        {status === 'sent' ? (
          <div className="card" style={{ width: '100%', marginTop: 24 }}>
            <p>
              <strong>{email}</strong>로 로그인 링크를 보냈습니다. 메일함을 확인해 링크를
              클릭해주세요.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} style={{ width: '100%', marginTop: 24 }}>
            <div className="field">
              <input
                type="email"
                required
                placeholder="진단 완료 화면에서 저장한 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? '전송 중...' : '매직링크 보내기'}
            </button>
            {status === 'error' && (
              <p style={{ color: '#c0392b', marginTop: 12 }}>로그인 실패: {errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
