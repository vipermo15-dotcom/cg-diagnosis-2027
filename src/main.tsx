import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import MyApp from './my/MyApp'
import './index.css'

// 라우팅 판정 (해시 + 쿼리스트링만 사용, GitHub Pages 정적 호스팅 대응):
//   - ?portal=my 가 있으면 예비지원자 매직링크 콜백 복귀 → MyApp
//   - #my 로 시작하면 예비지원자 로그인 화면 → MyApp
//   - #admin 으로 시작하거나(관리자 진입), portal 마커 없이 #access_token=... 이 붙어
//     돌아온 경우(관리자 매직링크 콜백, 기존 동작 유지) → AdminApp
//   - 그 외에는 일반 진단 위저드 → App
const hash = window.location.hash
const search = window.location.search
const isMyPortal = search.includes('portal=my') || hash.startsWith('#my')
const isAdmin =
  !isMyPortal &&
  (hash.startsWith('#admin') || hash.includes('access_token=') || hash.includes('refresh_token='))

function Root() {
  if (isMyPortal) return <MyApp />
  if (isAdmin) return <AdminApp />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
