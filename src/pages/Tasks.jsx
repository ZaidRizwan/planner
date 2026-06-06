import { useState } from 'react'
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  Check, X, Circle, Clock, CheckCircle2
} from 'lucide-react'
import Modal from '../components/Modal'

const STATUSES = ['todo', 'progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']

const STATUS_META = {
  todo:     { label: 'To Do',       icon: Circle,       color: 'var(--text3)',   badge: 'badge-todo' },
  progress: { label: 'In Progress', icon: Clock,        color: 'var(--yellow)',  badge: 'badge-progress' },
  done:     { label: 'Done',        icon: CheckCircle2, color: 'var(--green)',   badge: 'badge-done' },
}

function emptyTask() {
  return { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' }
}

export default function Tasks({ store }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [expanded, setExpanded] = useState({})       // taskId → bool
  const [modal, setModal] = useState(null)           // null | 'add' | task obj
  const [form, setForm] = useState(emptyTask())
  const [subtaskInput, setSubtaskInput] = useState({}) // taskId → string
  const [editSubtask, setEditSubtask] = useState(null) // { taskId, subtaskId, text }

  const tasks = store.data.tasks || []

  // ── filtering ─────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  // sort: todo → progress → done, then by createdAt desc within each
  const sorted = [...filtered].sort((a, b) => {
    const si = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
    if (si !== 0) return si
    return b.createdAt.localeCompare(a.createdAt)
  })

  // ── task CRUD ──────────────────────────────────────────────────────────────
  function openAdd() { setForm(emptyTask()); setModal('add') }
  function openEdit(t) { setForm({ ...t }); setModal(t) }

  function save() {
    if (!form.title.trim()) return
    if (modal === 'add') store.addTask(form)
    else store.updateTask(modal.id, form)
    setModal(null)
  }

  function cycleStatus(t, e) {
    e.stopPropagation()
    const next = STATUSES[(STATUSES.indexOf(t.status) + 1) % STATUSES.length]
    store.updateTask(t.id, { status: next })
  }

  // ── subtask helpers ────────────────────────────────────────────────────────
  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function addSubtask(taskId) {
    const text = (subtaskInput[taskId] || '').trim()
    if (!text) return
    store.addSubtask(taskId, text)
    setSubtaskInput(prev => ({ ...prev, [taskId]: '' }))
    setExpanded(prev => ({ ...prev, [taskId]: true }))
  }

  function commitSubtaskEdit() {
    if (!editSubtask) return
    const { taskId, subtaskId, text } = editSubtask
    if (text.trim()) store.updateSubtask(taskId, subtaskId, { text: text.trim() })
    setEditSubtask(null)
  }

  // ── subtask progress ───────────────────────────────────────────────────────
  function subProgress(task) {
    const subs = task.subtasks || []
    if (!subs.length) return null
    const done = subs.filter(s => s.done).length
    return { done, total: subs.length, pct: Math.round((done / subs.length) * 100) }
  }

  // ── summary counts ─────────────────────────────────────────────────────────
  const counts = { todo: 0, progress: 0, done: 0 }
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ })

  return (
    <div>
      {/* ── header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">Manage tasks and their subtasks</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> New Task</button>
      </div>

      {/* ── status summary pills ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {STATUSES.map(s => {
          const meta = STATUS_META[s]
          const Icon = meta.icon
          return (
            <div
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: filterStatus === s ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${filterStatus === s ? meta.color : 'var(--border)'}`,
                color: filterStatus === s ? meta.color : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={13} color={meta.color} />
              {meta.label}
              <span style={{ background: 'var(--border)', borderRadius: 10, padding: '1px 7px', color: 'var(--text)' }}>
                {counts[s]}
              </span>
            </div>
          )
        })}
        {/* priority filter */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          style={{ marginLeft: 'auto', width: 'auto', padding: '6px 10px', fontSize: 12 }}
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* ── task list ── */}
      {sorted.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Plus size={32} />
            <div style={{ marginTop: 8 }}>No tasks found. Add one!</div>
          </div>
        </div>
      ) : (
        <div className="item-list">
          {sorted.map(task => {
            const prog = subProgress(task)
            const isExpanded = expanded[task.id]
            const subs = task.subtasks || []
            const StatusIcon = STATUS_META[task.status].icon

            return (
              <div
                key={task.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${task.status === 'done' ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* ── task row ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
                  {/* status toggle button */}
                  <button
                    onClick={e => cycleStatus(task, e)}
                    title={`Status: ${STATUS_META[task.status].label} — click to advance`}
                    style={{
                      background: 'transparent', border: 'none', padding: 0,
                      marginTop: 2, cursor: 'pointer', flexShrink: 0,
                      color: STATUS_META[task.status].color,
                    }}
                  >
                    <StatusIcon size={18} />
                  </button>

                  {/* body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 600,
                        color: task.status === 'done' ? 'var(--text3)' : 'var(--text)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Due {task.dueDate}</span>
                      )}
                    </div>

                    {task.description && (
                      <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
                        {task.description}
                      </div>
                    )}

                    {/* subtask progress bar */}
                    {prog && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className="progress-bar-fill" style={{ width: `${prog.pct}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {prog.done}/{prog.total} subtasks
                        </span>
                      </div>
                    )}
                  </div>

                  {/* actions */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {subs.length > 0 && (
                      <button
                        className="btn-icon btn"
                        onClick={() => toggleExpand(task.id)}
                        title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                      >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    )}
                    <button className="btn-icon btn" onClick={() => openEdit(task)}><Edit2 size={13} /></button>
                    <button className="btn-icon btn" onClick={() => store.deleteTask(task.id)}><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* ── subtasks panel ── */}
                {(isExpanded || subs.length === 0) && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface2)',
                    padding: '10px 16px 12px 46px',
                  }}>
                    {subs.length === 0 && !isExpanded
                      ? null
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {subs.map(sub => (
                            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* checkbox */}
                              <div
                                onClick={() => store.toggleSubtask(task.id, sub.id)}
                                style={{
                                  width: 16, height: 16, minWidth: 16,
                                  border: `2px solid ${sub.done ? 'var(--green)' : 'var(--border)'}`,
                                  borderRadius: 3,
                                  background: sub.done ? 'var(--green)' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {sub.done && <Check size={10} color="#fff" strokeWidth={3} />}
                              </div>

                              {/* text / inline edit */}
                              {editSubtask?.subtaskId === sub.id ? (
                                <input
                                  className="inline-edit"
                                  style={{ flex: 1 }}
                                  value={editSubtask.text}
                                  autoFocus
                                  onChange={e => setEditSubtask(es => ({ ...es, text: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitSubtaskEdit()
                                    if (e.key === 'Escape') setEditSubtask(null)
                                  }}
                                  onBlur={commitSubtaskEdit}
                                />
                              ) : (
                                <span
                                  onDoubleClick={() => setEditSubtask({ taskId: task.id, subtaskId: sub.id, text: sub.text })}
                                  title="Double-click to edit"
                                  style={{
                                    flex: 1, fontSize: 13,
                                    color: sub.done ? 'var(--text3)' : 'var(--text)',
                                    textDecoration: sub.done ? 'line-through' : 'none',
                                    cursor: 'default',
                                  }}
                                >
                                  {sub.text}
                                </span>
                              )}

                              <button
                                className="btn-icon btn"
                                onClick={() => store.deleteSubtask(task.id, sub.id)}
                                style={{ opacity: 0.5 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    {/* add subtask input */}
                    <div style={{ display: 'flex', gap: 6, marginTop: subs.length ? 10 : 0 }}>
                      <input
                        placeholder="Add a subtask… (Enter)"
                        value={subtaskInput[task.id] || ''}
                        onChange={e => setSubtaskInput(prev => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addSubtask(task.id)
                        }}
                        style={{ flex: 1, fontSize: 12.5, padding: '6px 8px' }}
                      />
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => addSubtask(task.id)}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                )}

                {/* collapse handle when expanded and has subs */}
                {!isExpanded && subs.length > 0 && (
                  <div
                    onClick={() => toggleExpand(task.id)}
                    style={{
                      borderTop: '1px solid var(--border)',
                      padding: '6px 16px 6px 46px',
                      fontSize: 12, color: 'var(--text3)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'var(--surface2)',
                    }}
                  >
                    <ChevronRight size={13} />
                    {subs.length} subtask{subs.length !== 1 ? 's' : ''}
                    {prog && <span style={{ color: 'var(--text3)', marginLeft: 4 }}>({prog.done} done)</span>}
                    — click to expand
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── add / edit modal ── */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'New Task' : 'Edit Task'}
          onClose={() => setModal(null)}
          onSave={save}
        >
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              placeholder="Task title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Additional details or context…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  )
}
