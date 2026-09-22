import { useEffect, useState } from 'react'
import {
  listConsultations,
  updateConsultationStatus,
  signOut,
  type ConsultationRow,
} from '../services/supabaseAdmin'

const STATUS_LABEL: Record<string, string> = {
  new: '신규',
  contacted: '연락함',
  done: '완료',
}

export default function AdminDashboard() {
  const [rows, setRows] = useState<ConsultationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { rows: r, error: err } = await listConsultations()
    setRows(r)
    setError(err ?? '')
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleStatusChange = async (id: string, status: 'new' | 'contacted' | 'done') => {
    const { ok } = await updateConsultationStatus(id, status)
    if (ok) void load()
  }

  return (
    <div className="screen-narrow" style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">관리자</div>
          <h1 style={{ fontSize: 20 }}>상담 신청 목록</h1>
        </div>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => void signOut()}>
          로그아웃
        </button>
      </div>

      {error && (
        <div className="notice-box" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p>아직 접수된 상담 신청이 없습니다.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '8px 6px' }}>신청일시</th>
                <th style={{ padding: '8px 6px' }}>희망과정</th>
                <th style={{ padding: '8px 6px' }}>희망시간</th>
                <th style={{ padding: '8px 6px' }}>메시지</th>
                <th style={{ padding: '8px 6px' }}>진단결과</th>
                <th style={{ padding: '8px 6px' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }}>
                    {new Date(row.requestedAt).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '8px 6px' }}>{row.preferredCourse ?? '-'}</td>
                  <td style={{ padding: '8px 6px' }}>{row.preferredTime ?? '-'}</td>
                  <td style={{ padding: '8px 6px', maxWidth: 220 }}>{row.message ?? '-'}</td>
                  <td style={{ padding: '8px 6px' }}>
                    {row.resultTitle ?? '-'}
                    {row.primaryTrack && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {row.primaryTrack}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 6px' }}>
                    <select
                      value={row.status}
                      onChange={(e) =>
                        void handleStatusChange(
                          row.id,
                          e.target.value as 'new' | 'contacted' | 'done',
                        )
                      }
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
