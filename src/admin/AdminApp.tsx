import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, isSupabaseConfigured } from '../services/supabaseAdmin'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })
    const unsubscribe = onAuthStateChange(setSession)
    return unsubscribe
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="center-col" style={{ paddingTop: 80 }}>
            <h1>관리자 화면</h1>
            <p>
              Supabase가 설정되지 않았습니다. <code>.env</code>에 VITE_SUPABASE_URL /
              VITE_SUPABASE_ANON_KEY를 채운 뒤 다시 빌드해주세요. (DEPLOY.md 참고)
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
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

  return (
    <div className="app-shell">
      {session ? <AdminDashboard /> : <AdminLogin />}
    </div>
  )
}
