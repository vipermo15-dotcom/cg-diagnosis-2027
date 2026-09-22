import { useEffect } from 'react'

interface Props {
  onDone: () => void
}

export default function Analyzing({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="screen">
      <div className="center-col">
        <div className="spinner" />
        <h2>응답을 분석하고 있어요</h2>
        <p>지금까지 답변을 바탕으로 연결되는 교육 방향을 정리하는 중입니다.</p>
      </div>
    </div>
  )
}
