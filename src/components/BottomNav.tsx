interface Props {
  onPrev?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showPrev?: boolean
}

export default function BottomNav({
  onPrev,
  onNext,
  nextLabel = '다음',
  nextDisabled = false,
  showPrev = true,
}: Props) {
  return (
    <div className="bottom-nav">
      {showPrev && onPrev && (
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          이전
        </button>
      )}
      <button type="button" className="btn btn-primary" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </button>
    </div>
  )
}
