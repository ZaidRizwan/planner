import { useState } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Notes({ store }) {
  const [open, setOpen] = useState(null) // null | 'new' | note obj
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const notes = store.data.notes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function openNew() { setTitle(''); setBody(''); setOpen('new') }
  function openNote(n) { setTitle(n.title); setBody(n.body); setOpen(n) }

  function saveNote() {
    if (!title.trim() && !body.trim()) return
    if (open === 'new') {
      store.addNote({ title: title.trim() || 'Untitled', body: body.trim() })
    } else {
      store.updateNote(open.id, { title: title.trim() || 'Untitled', body: body.trim() })
    }
    setOpen(null)
  }

  if (open) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-ghost" onClick={() => { saveNote(); setOpen(null) }}><ArrowLeft size={15} /> Back & Save</button>
          {open !== 'new' && (
            <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }} onClick={() => { store.deleteNote(open.id); setOpen(null) }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>Changes saved when you go back</div>
        </div>
        <div className="card" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
          <input
            style={{ fontSize: 20, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', borderRadius: 0, padding: '4px 0', color: 'var(--text)' }}
            placeholder="Note title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            style={{ minHeight: 400, fontSize: 14, lineHeight: 1.7, background: 'transparent', border: 'none', borderRadius: 0, padding: 0, resize: 'vertical' }}
            placeholder="Write your note here..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Notes</div>
          <div className="page-subtitle">Capture thoughts, context and information</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> New Note</button>
      </div>

      {notes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Plus size={32} />
            <div style={{ marginTop: 8 }}>No notes yet. Start capturing your thoughts!</div>
          </div>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(n => (
            <div key={n.id} className="note-card" onClick={() => openNote(n)}>
              <div className="note-card-title">{n.title}</div>
              {n.body && <div className="note-card-body">{n.body}</div>}
              <div className="note-card-date">{fmt(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
