import { X, CheckCircle2 } from 'lucide-react'

function getPriorityScore(task) {
  const ageMs = Date.now() - new Date(task.lastTouched || task.createdAt).getTime()
  const ageDays = ageMs / 86400000
  const ageScore = Math.min(ageDays / 7, 1) * 0.3
  const prioMap = { high: 1, medium: 0.5, low: 0.1 }
  const statusScore = task.status === 'progress' ? 0.4 : 0
  return (prioMap[task.priority] || 0.5) + ageScore + statusScore
}

export default function FocusMode({ store, onClose }) {
  const tasks = (store.data.tasks || []).filter(t => t.status !== 'done')
  const todayKey = new Date().toISOString().slice(0, 10)
  const dailyItems = store.getChecklist(todayKey).filter(i => !i.done)

  const allItems = [
    ...dailyItems.map(i => ({ id: i.id, title: i.text, source: 'daily', priority: 'medium', score: 0.6 })),
    ...tasks.map(t => ({ ...t, source: 'task', score: getPriorityScore(t) })),
  ].sort((a, b) => b.score - a.score)

  const current = allItems[0]
  const queue = allItems.slice(1, 4)

  function markDone() {
    if (!current) return
    if (current.source === 'daily') {
      store.toggleChecklistItem(todayKey, current.id)
    } else {
      store.updateTask(current.id, { status: 'done' })
    }
  }

  return (
    <div className="focus-overlay">
      <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, marginBottom: 4 }}>
        FOCUS MODE — YOUR NEXT MOVE
      </div>

      {!current ? (
        <div className="focus-card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div className="focus-task-title">Everything's done!</div>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8 }}>
            You have nothing open right now. Take a well-earned break.
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
        </div>
      ) : (
        <>
          <div className="focus-card">
            <div className="focus-label">
              {current.source === 'daily' ? '📋 Daily Task' : current.status === 'progress' ? '⚡ In Progress' : '📌 Next Up'}
            </div>
            <div className="focus-task-title">{current.title}</div>
            {current.description && (
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
                {current.description}
              </div>
            )}
            {current.source === 'task' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge badge-${current.priority}`}>{current.priority} priority</span>
                {current.dueDate && (
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Due {current.dueDate}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14 }} onClick={markDone}>
                <CheckCircle2 size={16} /> Mark Done
              </button>
              <button className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: 14 }} onClick={onClose}>
                Skip for now
              </button>
            </div>
          </div>

          {queue.length > 0 && (
            <div className="focus-queue">
              <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', letterSpacing: 1, marginBottom: 6 }}>
                UP NEXT
              </div>
              {queue.map((item, i) => (
                <div key={item.id} className="focus-queue-item">
                  <span style={{ color: 'var(--text3)', fontSize: 13, minWidth: 18 }}>{i + 2}</span>
                  <span style={{ flex: 1 }}>{item.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {item.source === 'daily' ? 'daily' : item.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '50%', width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text2)',
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
