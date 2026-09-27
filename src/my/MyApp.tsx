import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  getMySession,
  onMyAuthStateChange,
  claimAccount,
  getMyResult,
  signOutMy,
  isMyPortalConfigured,
  type StoredResult,
} from '../services/applicant'
import MyLogin from './MyLogin'
import MyResultView from './MyResultView'

type Phase = 'loading' | 'loggedOut' | 'noResult' | 'hasResult'

export default function MyApp() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [result, setResult] = useState<StoredResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async (session: Session | null) => {
      if (!session) {
        setPhase('loggedOut')
        return
      }
      await claimAccount()
      const { result: r, error: err } = await getMyResult()
      if (err) setError(err)
      setResult(r)
      setPhase(r ? 'hasResult' : 'noResult')
    }

    getMySession().then(load)
    const unsubscribe = onMyAuthStateChange((session) => void load(session))
    return unsubscribe
  }, [])

  if (!isMyPortalConfigured) {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <h1>내 결과</h1>
            <p>Supabase가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <p>불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loggedOut') {
    return (
      <div className="app-shell">
        <MyLogin />
      </div>
    )
  }

  if (phase === 'noResult') {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <h1>저장된 결과가 없어요</h1>
            <p>
              진단 완료 화면에서 이 이메일로 저장한 기록이 없습니다. 먼저 자기진단을
              완료하고 결과 화면에서 이메일을 저장해주세요.
            </p>
            {error && <p style={{ color: '#c0392b' }}>{error}</p>}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 16 }}
              onClick={() => void signOutMy().then(() => setPhase('loggedOut'))}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 640, margin: '0 auto' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '6px 12px' }}
            onClick={() => void signOutMy().then(() => setPhase('loggedOut'))}
          >
            로그아웃
          </button>
        </div>
        {result && <MyResultView result={result} />}
      </div>
    </div>
  )
}
