import { useState } from 'react'
import { Plus, Trash2, ArrowUpCircle, Edit2 } from 'lucide-react'

export default function Someday({ store }) {
  const [input, setInput] = useState('')
  const [note, setNote] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [showInput, setShowInput] = useState(false)

  const items = (store.data.someday || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function add() {
    if (!input.trim()) return
    store.addSomeday({ text: input.trim(), note: note.trim() })
    setInput('')
    setNote('')
    setShowInput(false)
  }

  function saveEdit(id) {
    if (editText.trim()) store.updateSomeday(id, { text: editText.trim() })
    setEditId(null)
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Someday</div>
          <div className="page-subtitle">Ideas and intentions — no pressure, no due date</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInput(s => !s)}>
          <Plus size={15} /> Add Idea
        </button>
      </div>

      {showInput && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Something you want to do someday..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              autoFocus
            />
            <textarea
              placeholder="Any notes or context (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ minHeight: 60 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowInput(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={add} disabled={!input.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 10 }}>💭</div>
            <div>Your someday list is empty.</div>
            <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text3)' }}>
              Park ideas here without pressure — revisit them in your Weekly Review.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} className="someday-item">
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>💭</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === item.id ? (
                  <input
                    className="inline-edit"
                    value={editText}
                    autoFocus
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  saveEdit(item.id)
                      if (e.key === 'Escape') setEditId(null)
                    }}
                    onBlur={() => saveEdit(item.id)}
                  />
                ) : (
                  <div
                    style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', cursor: 'text' }}
                    onDoubleClick={() => { setEditId(item.id); setEditText(item.text) }}
                    title="Double-click to edit"
                  >
                    {item.text}
                  </div>
                )}
                {item.note && (
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
                    {item.note}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Added {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 11.5, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => store.promoteToTask(item.id)}
                  title="Move to Tasks"
                >
                  <ArrowUpCircle size={13} /> Promote
                </button>
                <button className="btn-icon btn" onClick={() => { setEditId(item.id); setEditText(item.text) }}>
                  <Edit2 size={13} />
                </button>
                <button className="btn-icon btn" onClick={() => store.deleteSomeday(item.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
