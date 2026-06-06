import { useState } from 'react'
import { X, Zap } from 'lucide-react'

const CATEGORIES = ['task', 'goal', 'note', 'someday', 'daily']

function guessCategory(line) {
  const l = line.toLowerCase()
  if (l.startsWith('someday') || l.includes('maybe') || l.includes('one day')) return 'someday'
  if (l.startsWith('goal:') || l.includes('want to') || l.includes('achieve')) return 'goal'
  if (l.startsWith('note:') || l.startsWith('idea:') || l.startsWith('remember')) return 'note'
  if (l.startsWith('today') || l.includes('today')) return 'daily'
  return 'task'
}

export default function BrainDump({ store, onClose }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState(null)

  function parse() {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    setParsed(lines.map(text => ({ text, category: guessCategory(text) })))
  }

  function setCategory(i, cat) {
    setParsed(prev => prev.map((p, idx) => idx === i ? { ...p, category: cat } : p))
  }

  function commit() {
    const todayKey = new Date().toISOString().slice(0, 10)
    parsed.forEach(({ text, category }) => {
      if (category === 'task')    store.addTask({ title: text })
      if (category === 'goal')    store.addGoal({ title: text, type: 'weekly', priority: 'medium', status: 'todo' })
      if (category === 'note')    store.addNote({ title: text, body: '' })
      if (category === 'someday') store.addSomeday({ text })
      if (category === 'daily')   store.addChecklistItem(todayKey, text)
    })
    onClose()
  }

  const catColors = { task: 'var(--accent)', goal: 'var(--accent2)', note: 'var(--blue)', someday: 'var(--text3)', daily: 'var(--green)' }

  return (
    <div className="brain-dump-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="brain-dump-modal">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              <Zap size={18} color="var(--yellow)" /> Brain Dump
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              Type everything on your mind — one item per line. Press Ctrl+Space to open anytime.
            </div>
          </div>
          <button className="btn-icon btn" onClick={onClose}><X size={16} /></button>
        </div>

        {!parsed ? (
          <>
            <textarea
              className="brain-dump-textarea"
              placeholder={`Finish the quarterly report\nCall the dentist someday\nGoal: run 5km this week\nBuy groceries today\nNote: remember to check server logs\nIdea: build a habit tracker`}
              value={raw}
              onChange={e => setRaw(e.target.value)}
              autoFocus
            />
            <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 8, marginBottom: 4 }}>
              💡 Tip: Start with "Goal:", "Note:", "Someday", "Today" — or just type freely and we'll guess.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={parse} disabled={!raw.trim()}>
                <Zap size={14} /> Parse & Categorize
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 10 }}>
              Review categories — adjust any, then save all at once:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
              {parsed.map((item, i) => (
                <div key={i} className="parsed-item">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[item.category], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.text}</span>
                  <select value={item.category} onChange={e => setCategory(i, e.target.value)}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setParsed(null)}>← Edit text</button>
              <button className="btn btn-primary" onClick={commit}>
                Save {parsed.length} item{parsed.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
