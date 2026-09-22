import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import './index.css'

// 해시 라우팅(#admin)만 사용 — GitHub Pages 정적 호스팅에서 서버 설정 없이 동작한다.
const isAdmin = window.location.hash.startsWith('#admin')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdmin ? <AdminApp /> : <App />}</React.StrictMode>,
)
