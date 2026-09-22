import { useState } from 'react'
import { questions } from '../data'
import type { AnswerMap, AnswerValue } from '../types'
import ProgressBar from '../components/ProgressBar'
import QuestionCard from '../components/QuestionCard'
import BottomNav from '../components/BottomNav'

interface Props {
  answers: AnswerMap
  onAnswer: (questionId: string, value: AnswerValue) => void
  onComplete: () => void
  onExit: () => void
}

// multi 문항은 0개 선택도 허용한다(문서화: "관심 없음"을 표현할 방법이 없으므로 스킵을 허용).
// single/scale 문항은 반드시 하나를 선택해야 다음으로 진행할 수 있다.
function isAnswered(questionType: string, value: AnswerValue | undefined): boolean {
  if (questionType === 'multi') return true
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.length > 0
  return true
}

export default function Wizard({ answers, onAnswer, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const question = questions[index]
  const total = questions.length
  const value = answers[question.id]
  const answered = isAnswered(question.type, value)

  const goNext = () => {
    if (index === total - 1) {
      onComplete()
    } else {
      setIndex((i) => i + 1)
    }
  }

  const goPrev = () => {
    if (index === 0) {
      onExit()
    } else {
      setIndex((i) => i - 1)
    }
  }

  return (
    <div className="screen">
      <ProgressBar current={index + 1} total={total} label={`${index + 1} / ${total}`} />
      <h2>{question.text}</h2>
      {question.type === 'multi' && (
        <p style={{ marginTop: -4 }}>복수 선택이 가능하며, 선택하지 않고 넘어가도 됩니다.</p>
      )}
      <QuestionCard
        question={question}
        value={value}
        onChange={(v) => onAnswer(question.id, v)}
      />

      <BottomNav
        onPrev={goPrev}
        onNext={goNext}
        nextDisabled={!answered}
        nextLabel={index === total - 1 ? '결과 보기' : '다음'}
      />
    </div>
  )
}
