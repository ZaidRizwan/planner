import { useState } from 'react'
import { Plus, Trash2, Edit2, Check } from 'lucide-react'
import Modal from '../components/Modal'

const STATUS = ['todo', 'progress', 'done']
const TYPES = ['daily', 'weekly', 'monthly']
const PRIORITIES = ['low', 'medium', 'high']

function empty() { return { title: '', description: '', type: 'weekly', priority: 'medium', status: 'todo', dueDate: '' } }

export default function Goals({ store }) {
  const [tab, setTab] = useState('all')
  const [modal, setModal] = useState(null) // null | 'add' | goal object
  const [form, setForm] = useState(empty())

  const goals = store.data.goals
  const filtered = tab === 'all' ? goals : goals.filter(g => g.type === tab)

  function openAdd() { setForm(empty()); setModal('add') }
  function openEdit(g) { setForm({ ...g }); setModal(g) }

  function save() {
    if (!form.title.trim()) return
    if (modal === 'add') store.addGoal(form)
    else store.updateGoal(modal.id, form)
    setModal(null)
  }

  function cycleStatus(g) {
    const idx = STATUS.indexOf(g.status)
    store.updateGoal(g.id, { status: STATUS[(idx + 1) % STATUS.length] })
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Goals</div>
          <div className="page-subtitle">Daily, weekly and monthly goals</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Goal</button>
      </div>

      <div className="card">
        <div className="tabs">
          {['all', ...TYPES].map(t => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'all' && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text3)' }}>({goals.filter(g => g.type === t).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Plus size={32} />
            <div style={{ marginTop: 8 }}>No goals yet. Add one!</div>
          </div>
        ) : (
          <div className="item-list">
            {filtered.map(g => (
              <div key={g.id} className="item-card">
                <div className={`priority-dot priority-${g.priority}`} />
                <div className="item-card-body">
                  <div className="item-card-title">
                    {g.title}
                    <span className={`badge badge-${g.type}`}>{g.type}</span>
                  </div>
                  {g.description && <div className="item-card-desc">{g.description}</div>}
                  <div className="item-card-meta">
                    <button className={`badge badge-${g.status}`} onClick={() => cycleStatus(g)} title="Click to cycle status" style={{ cursor: 'pointer' }}>
                      {g.status === 'done' ? '✓ Done' : g.status === 'progress' ? '⟳ In Progress' : '○ To Do'}
                    </button>
                    <span className={`badge badge-${g.priority}`}>{g.priority}</span>
                    {g.dueDate && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Due {g.dueDate}</span>}
                  </div>
                </div>
                <div className="item-card-actions">
                  <button className="btn-icon btn" onClick={() => openEdit(g)}><Edit2 size={13} /></button>
                  <button className="btn-icon btn" onClick={() => store.deleteGoal(g.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Goal' : 'Edit Goal'} onClose={() => setModal(null)} onSave={save}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input placeholder="Goal title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea placeholder="Details, context..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
