import type { Question, AnswerValue } from '../types'

interface Props {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
}

export default function QuestionCard({ question, value, onChange }: Props) {
  if (question.type === 'single') {
    const current = value as string | undefined
    return (
      <div className="option-list">
        {question.options?.map((opt) => {
          const selected = current === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`option-btn${selected ? ' selected' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="option-marker">{selected ? '●' : ''}</span>
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === 'multi') {
    const current = (value as string[] | undefined) ?? []
    const toggle = (v: string) => {
      const has = current.includes(v)
      const next = has ? current.filter((x) => x !== v) : [...current, v]
      onChange(next)
    }
    return (
      <div className="option-list">
        {question.options?.map((opt) => {
          const selected = current.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              className={`option-btn${selected ? ' selected' : ''}`}
              onClick={() => toggle(opt.value)}
            >
              <span className="option-marker square">{selected ? '✓' : ''}</span>
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  // scale
  const scale = question.scale!
  const current = value as number | undefined
  const values: number[] = []
  for (let i = scale.min; i <= scale.max; i++) values.push(i)

  return (
    <div>
      <div className="scale-row">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            className={`scale-btn${current === v ? ' selected' : ''}`}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="scale-labels">
        <span>{scale.min_label}</span>
        <span>{scale.max_label}</span>
      </div>
    </div>
  )
}
