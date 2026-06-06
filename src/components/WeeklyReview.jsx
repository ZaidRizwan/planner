import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    emoji: '✅',
    title: 'What did you complete this week?',
    hint: 'List tasks finished, goals hit, wins big and small.',
    placeholder: '- Finished the project proposal\n- Went to the gym 3 times\n- Had the difficult conversation with my manager',
  },
  {
    emoji: '🔄',
    title: 'What carried over — and why?',
    hint: 'Be honest about what slipped and what blocked you.',
    placeholder: '- Client report pushed to next week (waiting on data)\n- Gym on Thursday — unexpected meeting',
  },
  {
    emoji: '🏆',
    title: 'What were your biggest wins?',
    hint: 'Celebrate! What are you most proud of this week?',
    placeholder: '- Finally shipped the feature I\'ve been stuck on\n- Ran my longest distance yet',
  },
  {
    emoji: '🎯',
    title: 'Top 3 priorities for next week',
    hint: 'Keep it to exactly 3 — focus beats a long list every time.',
    placeholder: '1. Submit the client report by Wednesday\n2. Start the new design system\n3. Book dentist appointment',
  },
  {
    emoji: '🔍',
    title: 'Are your goals still relevant?',
    hint: 'Should any goal be changed, dropped, added, or celebrated?',
    placeholder: '- Monthly goal "read 2 books" — on track\n- Drop the "learn Spanish" goal, not the right time\n- Add: "set up morning routine"',
  },
]

export default function WeeklyReview({ store, onClose }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(Array(STEPS.length).fill(''))

  function setAnswer(val) {
    setAnswers(prev => prev.map((a, i) => i === step ? val : a))
  }

  function getWeekStart() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    return monday.toISOString().slice(0, 10)
  }

  function finish() {
    store.saveWeeklyReview({
      weekStart: getWeekStart(),
      answers: STEPS.map((s, i) => ({ question: s.title, answer: answers[i] })),
    })
    onClose()
  }

  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Weekly Review
          </div>
          <button className="btn-icon btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* progress bar */}
        <div className="wizard-progress" style={{ marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`wizard-step-dot${i < step ? ' done' : i === step ? ' active' : ''}`}
              style={{ cursor: i < step ? 'pointer' : 'default' }}
              onClick={() => i < step && setStep(i)}
              title={STEPS[i].title}
            />
          ))}
        </div>

        <div className="review-step">
          <div className="review-step-number">Step {step + 1} of {STEPS.length}</div>
          <div className="review-step-title">{s.emoji} {s.title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 12 }}>{s.hint}</div>
          <textarea
            style={{ minHeight: 130 }}
            placeholder={s.placeholder}
            value={answers[step]}
            onChange={e => setAnswer(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => isFirst ? onClose() : setStep(s => s - 1)}>
            <ChevronLeft size={14} /> {isFirst ? 'Cancel' : 'Back'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {answers.filter(Boolean).length}/{STEPS.length} answered
          </div>
          {isLast ? (
            <button className="btn btn-primary" onClick={finish}>
              <CheckCircle2 size={14} /> Complete Review
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
