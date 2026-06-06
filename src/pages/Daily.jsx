import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Trash2, Plus, ChevronDown, ChevronRight as ChevronRightIcon, X } from 'lucide-react'

function offsetDate(base, days) {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  if (dateKey === today)
    return 'Today — ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Daily({ store }) {
  const [dateKey, setDateKey] = useState(() => new Date().toISOString().slice(0, 10))
  const [mainInput, setMainInput] = useState('')

  // per-item subtask input text
  const [subInput, setSubInput] = useState({})         // itemId → string
  // which items have their subtask panel open
  const [expanded, setExpanded] = useState({})         // itemId → bool
  // inline edit state
  const [editItem, setEditItem] = useState(null)       // { id, text }
  const [editSub, setEditSub] = useState(null)         // { itemId, subId, text }

  const items = store.getChecklist(dateKey)

  // overall progress counts only parent items
  const doneMains = items.filter(i => i.done).length

  // ── helpers ────────────────────────────────────────────────────────────────
  function addMain() {
    const t = mainInput.trim()
    if (!t) return
    store.addChecklistItem(dateKey, t)
    setMainInput('')
  }

  function commitItemEdit() {
    if (!editItem) return
    if (editItem.text.trim()) store.updateChecklistItem(dateKey, editItem.id, editItem.text.trim())
    setEditItem(null)
  }

  function addSub(itemId) {
    const t = (subInput[itemId] || '').trim()
    if (!t) return
    store.addChecklistSubtask(dateKey, itemId, t)
    setSubInput(p => ({ ...p, [itemId]: '' }))
    setExpanded(p => ({ ...p, [itemId]: true }))
  }

  function commitSubEdit() {
    if (!editSub) return
    if (editSub.text.trim())
      store.updateChecklistSubtask(dateKey, editSub.itemId, editSub.subId, editSub.text.trim())
    setEditSub(null)
  }

  function subProgress(item) {
    const subs = item.subtasks || []
    if (!subs.length) return null
    const done = subs.filter(s => s.done).length
    return { done, total: subs.length, pct: Math.round((done / subs.length) * 100) }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Daily Checklist</div>
          <div className="page-subtitle">Tasks and subtasks, day by day</div>
        </div>
      </div>

      <div className="card">
        {/* ── date navigator ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="date-nav">
            <button className="btn-icon btn" onClick={() => setDateKey(offsetDate(dateKey, -1))}>
              <ChevronLeft size={16} />
            </button>
            <div className="date-label">{formatDate(dateKey)}</div>
            <button className="btn-icon btn" onClick={() => setDateKey(offsetDate(dateKey, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          {items.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {doneMains}/{items.length} done
            </div>
          )}
        </div>

        {/* ── overall progress bar ── */}
        {items.length > 0 && (
          <div className="progress-bar-wrap" style={{ marginBottom: 16 }}>
            <div className="progress-bar-fill" style={{ width: `${(doneMains / items.length) * 100}%` }} />
          </div>
        )}

        {/* ── item list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {items.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>No tasks for this day. Add one below!</div>
          )}

          {items.map(item => {
            const subs = item.subtasks || []
            const prog = subProgress(item)
            const isOpen = expanded[item.id]

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* ── parent row ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                  {/* checkbox */}
                  <div
                    onClick={() => store.toggleChecklistItem(dateKey, item.id)}
                    style={{
                      width: 18, height: 18, minWidth: 18,
                      border: `2px solid ${item.done ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: 4,
                      background: item.done ? 'var(--green)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    {item.done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>

                  {/* text / inline edit */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editItem?.id === item.id ? (
                      <input
                        className="inline-edit"
                        value={editItem.text}
                        autoFocus
                        onChange={e => setEditItem(ei => ({ ...ei, text: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitItemEdit()
                          if (e.key === 'Escape') setEditItem(null)
                        }}
                        onBlur={commitItemEdit}
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => setEditItem({ id: item.id, text: item.text })}
                        title="Double-click to edit"
                        style={{
                          fontSize: 13.5,
                          color: item.done ? 'var(--text3)' : 'var(--text)',
                          textDecoration: item.done ? 'line-through' : 'none',
                          cursor: 'default', display: 'block',
                        }}
                      >
                        {item.text}
                      </span>
                    )}

                    {/* subtask mini-progress */}
                    {prog && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className="progress-bar-fill" style={{ width: `${prog.pct}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {prog.done}/{prog.total}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* right controls */}
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                    {/* expand toggle — always shown */}
                    <button
                      className="btn-icon btn"
                      onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                      title={isOpen ? 'Hide subtasks' : `${subs.length ? subs.length + ' subtask(s) — ' : ''}Add subtasks`}
                      style={{ color: subs.length ? 'var(--accent)' : 'var(--text3)' }}
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                    </button>
                    <button
                      className="btn-icon btn"
                      onClick={() => store.deleteChecklistItem(dateKey, item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ── subtask panel ── */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg)',
                    padding: '10px 12px 12px 40px',
                  }}>
                    {/* subtask rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: subs.length ? 8 : 0 }}>
                      {subs.map(sub => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* sub checkbox */}
                          <div
                            onClick={() => store.toggleChecklistSubtask(dateKey, item.id, sub.id)}
                            style={{
                              width: 15, height: 15, minWidth: 15,
                              border: `2px solid ${sub.done ? 'var(--green)' : 'var(--border)'}`,
                              borderRadius: 3,
                              background: sub.done ? 'var(--green)' : 'transparent',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                          >
                            {sub.done && <Check size={9} color="#fff" strokeWidth={3} />}
                          </div>

                          {/* sub text / inline edit */}
                          {editSub?.subId === sub.id ? (
                            <input
                              className="inline-edit"
                              style={{ flex: 1, fontSize: 12.5 }}
                              value={editSub.text}
                              autoFocus
                              onChange={e => setEditSub(es => ({ ...es, text: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitSubEdit()
                                if (e.key === 'Escape') setEditSub(null)
                              }}
                              onBlur={commitSubEdit}
                            />
                          ) : (
                            <span
                              onDoubleClick={() => setEditSub({ itemId: item.id, subId: sub.id, text: sub.text })}
                              title="Double-click to edit"
                              style={{
                                flex: 1, fontSize: 12.5,
                                color: sub.done ? 'var(--text3)' : 'var(--text2)',
                                textDecoration: sub.done ? 'line-through' : 'none',
                                cursor: 'default',
                              }}
                            >
                              {sub.text}
                            </span>
                          )}

                          <button
                            className="btn-icon btn"
                            onClick={() => store.deleteChecklistSubtask(dateKey, item.id, sub.id)}
                            style={{ opacity: 0.5 }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* add subtask row */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        placeholder="Add a subtask… (Enter)"
                        value={subInput[item.id] || ''}
                        onChange={e => setSubInput(p => ({ ...p, [item.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addSub(item.id)}
                        style={{ flex: 1, fontSize: 12.5, padding: '5px 8px' }}
                      />
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => addSub(item.id)}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* collapsed hint when subtasks exist */}
                {!isOpen && subs.length > 0 && (
                  <div
                    onClick={() => setExpanded(p => ({ ...p, [item.id]: true }))}
                    style={{
                      borderTop: '1px solid var(--border)',
                      padding: '5px 12px 5px 40px',
                      fontSize: 11.5, color: 'var(--text3)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'var(--bg)',
                    }}
                  >
                    <ChevronRightIcon size={12} />
                    {subs.length} subtask{subs.length !== 1 ? 's' : ''}
                    {prog && <span style={{ marginLeft: 2 }}>({prog.done} done)</span>}
                    — click to expand
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── add main task ── */}
        <div className="checklist-add">
          <input
            placeholder="Add a task… (press Enter)"
            value={mainInput}
            onChange={e => setMainInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMain()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addMain}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>
    </div>
  )
}
