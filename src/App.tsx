import { useState } from 'react'
import type { AnswerMap, AnswerValue, DiagnosisResult } from './types'
import Home from './pages/Home'
import Intro from './pages/Intro'
import Consent from './pages/Consent'
import Wizard from './pages/Wizard'
import Analyzing from './pages/Analyzing'
import ResultFlow from './pages/ResultFlow'
import { runDiagnosis } from './engine/diagnosisEngine'
import { createSession, saveAnswer, saveResult } from './services/supabase'

type Screen = 'home' | 'intro' | 'consent' | 'wizard' | 'analyzing' | 'result'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosisResult | null>(null)

  const handleAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    void saveAnswer(sessionId, questionId, value)
  }

  const handleConsent = async (consented: boolean) => {
    if (!consented) return
    const { sessionId: newSessionId } = await createSession()
    setSessionId(newSessionId)
    setScreen('wizard')
  }

  const handleWizardComplete = () => {
    setScreen('analyzing')
  }

  const handleAnalysisDone = () => {
    const diagnosis = runDiagnosis(answers)
    setResult(diagnosis)
    void saveResult(sessionId, diagnosis)
    setScreen('result')
  }

  const handleRestart = () => {
    setAnswers({})
    setSessionId(null)
    setResult(null)
    setScreen('home')
  }

  return (
    <div className="app-shell">
      {screen === 'home' && <Home onStart={() => setScreen('intro')} />}

      {screen === 'intro' && (
        <Intro onNext={() => setScreen('consent')} onPrev={() => setScreen('home')} />
      )}

      {screen === 'consent' && (
        <Consent
          onNext={(consented) => void handleConsent(consented)}
          onPrev={() => setScreen('intro')}
        />
      )}

      {screen === 'wizard' && (
        <Wizard
          answers={answers}
          onAnswer={handleAnswer}
          onComplete={handleWizardComplete}
          onExit={() => setScreen('consent')}
        />
      )}

      {screen === 'analyzing' && <Analyzing onDone={handleAnalysisDone} />}

      {screen === 'result' && result && (
        <ResultFlow result={result} sessionId={sessionId} onRestart={handleRestart} />
      )}
    </div>
  )
}
