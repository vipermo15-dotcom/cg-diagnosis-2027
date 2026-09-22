import { useState } from 'react'
import type { ConsultationRequest } from '../../types'
import { diagnosisConfig } from '../../data'

interface Props {
  onSubmit: (request: ConsultationRequest) => Promise<void>
  submitted: boolean
}

export default function ConsultationForm({ onSubmit, submitted }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredCourse, setPreferredCourse] = useState(diagnosisConfig.courses.daytime.code)
  const [preferredTime, setPreferredTime] = useState('오후')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({ name, phone, preferredCourse, preferredTime, message })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="eyebrow">상담 신청</div>
        <h1>신청이 접수됐어요</h1>
        <p>담당 선생님이 확인 후 안내드릴게요. 편하게 다음 화면으로 이동해 주세요.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="eyebrow">상담 신청</div>
      <h1>1:1 상담을 신청해보세요</h1>
      <p>진단 결과를 바탕으로 더 구체적인 안내를 받을 수 있어요.</p>

      <div className="field">
        <label htmlFor="name">이름</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
      </div>
      <div className="field">
        <label htmlFor="phone">연락처</label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
        />
      </div>
      <div className="field">
        <label htmlFor="course">희망 과정</label>
        <select id="course" value={preferredCourse} onChange={(e) => setPreferredCourse(e.target.value)}>
          <option value={diagnosisConfig.courses.daytime.code}>{diagnosisConfig.courses.daytime.name}</option>
          <option value={diagnosisConfig.courses.evening.code}>{diagnosisConfig.courses.evening.name}</option>
          {diagnosisConfig.courses.related.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="time">상담 희망 시간대</label>
        <select id="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
          <option value="오전">오전</option>
          <option value="오후">오후</option>
          <option value="저녁">저녁</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">궁금한 점 (선택)</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="궁금한 점을 편하게 남겨주세요"
        />
      </div>

      <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
        {loading ? '접수 중...' : '상담 신청하기'}
      </button>
    </div>
  )
}
