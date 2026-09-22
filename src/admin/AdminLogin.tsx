import { useState } from 'react'
import { sendMagicLink } from '../services/supabaseAdmin'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    const { ok, error } = await sendMagicLink(email)
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
        <div className="eyebrow">관리자</div>
        <h1>상담 신청 관리자 로그인</h1>
        <p>등록된 관리자 이메일로 매직링크를 보내드립니다. 비밀번호는 없습니다.</p>

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
                placeholder="admin@example.com"
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

        <p style={{ marginTop: 24, fontSize: 13, color: '#888' }}>
          이 이메일이 admin_users 테이블에 등록되어 있어야 로그인 후 데이터가 보입니다. 등록은
          기관 담당자가 Supabase 대시보드에서 처리합니다.
        </p>
      </div>
    </div>
  )
}
