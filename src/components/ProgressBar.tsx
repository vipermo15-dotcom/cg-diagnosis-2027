interface Props {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100)
  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-label">{label ?? `${current} / ${total}`}</div>
    </div>
  )
}
