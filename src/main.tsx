import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import './index.css'

// 해시 라우팅(#admin)만 사용 — GitHub Pages 정적 호스팅에서 서버 설정 없이 동작한다.
// 매직링크 로그인 후 Supabase가 #access_token=...&refresh_token=... 을 붙여서 돌려보내는데,
// 이때도 관리자 화면으로 가야 하므로 access_token/refresh_token 포함 여부도 함께 확인한다.
const hash = window.location.hash
const isAdmin =
  hash.startsWith('#admin') || hash.includes('access_token=') || hash.includes('refresh_token=')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdmin ? <AdminApp /> : <App />}</React.StrictMode>,
)
