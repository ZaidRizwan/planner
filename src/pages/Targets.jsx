import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import Modal from '../components/Modal'

function empty() { return { title: '', description: '', progress: 0, unit: '', target: '' } }

export default function Targets({ store }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())

  const targets = store.data.targets

  function openAdd() { setForm(empty()); setModal('add') }
  function openEdit(t) { setForm({ ...t }); setModal(t) }

  function save() {
    if (!form.title.trim()) return
    const cleaned = { ...form, progress: Math.min(100, Math.max(0, Number(form.progress) || 0)) }
    if (modal === 'add') store.addTarget(cleaned)
    else store.updateTarget(modal.id, cleaned)
    setModal(null)
  }

  function setProgress(id, val) {
    store.updateTarget(id, { progress: Math.min(100, Math.max(0, Number(val))) })
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Targets</div>
          <div className="page-subtitle">Track progress toward specific outcomes</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Target</button>
      </div>

      {targets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Plus size={32} />
            <div style={{ marginTop: 8 }}>No targets yet. Add one to track your progress!</div>
          </div>
        </div>
      ) : (
        <div className="item-list">
          {targets.map(t => (
            <div key={t.id} className="item-card" style={{ flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                <div className="item-card-body">
                  <div className="item-card-title">
                    {t.title}
                    {t.progress >= 100 && <span className="badge badge-done">Complete</span>}
                  </div>
                  {t.description && <div className="item-card-desc">{t.description}</div>}
                  {t.target && (
                    <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 4 }}>
                      Target: {t.target} {t.unit}
                    </div>
                  )}
                </div>
                <div className="item-card-actions">
                  <button className="btn-icon btn" onClick={() => openEdit(t)}><Edit2 size={13} /></button>
                  <button className="btn-icon btn" onClick={() => store.deleteTarget(t.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 600, color: t.progress >= 100 ? 'var(--green)' : 'var(--text)' }}>{t.progress}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={t.progress}
                  onChange={e => setProgress(t.id, e.target.value)}
                  style={{ width: '100%', marginTop: 2 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Target' : 'Edit Target'} onClose={() => setModal(null)} onSave={save}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input placeholder="e.g. Run 100km this month" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea placeholder="More details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target value</label>
              <input placeholder="e.g. 100" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input placeholder="e.g. km, pages, hours" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Initial progress ({form.progress}%)</label>
            <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
          </div>
        </Modal>
      )}
    </div>
  )
}
