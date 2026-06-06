import {
  CheckSquare, Target, Flag, StickyNote, ListTodo,
  Check, ChevronRight, Circle, Clock, CheckCircle2,
  ArrowRight, Zap, BookOpen,
} from 'lucide-react'
import HeatMap from '../components/HeatMap'

const STATUS_ICON = {
  todo:     { Icon: Circle,       color: 'var(--text3)' },
  progress: { Icon: Clock,        color: 'var(--yellow)' },
  done:     { Icon: CheckCircle2, color: 'var(--green)' },
}
const PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' }

function ageStyle(iso) {
  if (!iso) return {}
  const days = (Date.now() - new Date(iso).getTime()) / 86400000
  if (days < 3) return { borderLeft: '2px solid var(--green)' }
  if (days < 7) return { borderLeft: '2px solid var(--yellow)' }
  return { borderLeft: '2px solid var(--red)' }
}

export default function Dashboard({ data, onNavigate, onBrainDump, onFocus, onWeeklyReview }) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })()

  const todayList  = data.dailyChecklists[today] || []
  const tasks      = data.tasks || []
  const goals      = data.goals || []
  const targets    = data.targets || []
  const notes      = data.notes || []
  const someday    = data.someday || []
  const streak     = data.streak || { current: 0, longest: 0 }
  const lastActive = data.lastActive

  const dailyDone  = todayList.filter(i => i.done).length
  const dailyTotal = todayList.length
  const dailySubs  = todayList.reduce((a, i) => a + (i.subtasks?.length || 0), 0)

  const taskTodo = tasks.filter(t => t.status === 'todo').length
  const taskProg = tasks.filter(t => t.status === 'progress').length
  const taskDone = tasks.filter(t => t.status === 'done').length

  const goalWeekly  = goals.filter(g => g.type === 'weekly')
  const goalMonthly = goals.filter(g => g.type === 'monthly')
  const targetActive = targets.filter(t => t.progress < 100)

  const yesterdayUnfinished = (data.dailyChecklists[yesterday] || []).filter(i => !i.done)
  const alreadyCarried = todayList.some(i => i.carriedFrom === yesterday)
  const showCarry = yesterdayUnfinished.length > 0 && !alreadyCarried

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Good {getGreeting()}, let's get things done.</div>
          <div className="page-subtitle">{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {streak.current > 0 && (
            <div className="streak-badge">
              🔥 {streak.current} day{streak.current !== 1 ? 's' : ''} streak
            </div>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onWeeklyReview}>
            <BookOpen size={14} /> Weekly Review
          </button>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={onFocus}>
            ⚡ Focus Mode
          </button>
        </div>
      </div>

      {/* ── context recovery ── */}
      {lastActive && (() => {
        const mins = Math.round((Date.now() - new Date(lastActive.timestamp).getTime()) / 60000)
        if (mins > 240) return null
        return (
          <div
            className="context-card"
            onClick={() => onNavigate(lastActive.page)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ fontSize: 24 }}>🧭</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                You were working on:{' '}
                <span style={{ color: 'var(--green)' }}>{lastActive.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {mins < 2 ? 'Just now' : `${mins} minute${mins !== 1 ? 's' : ''} ago`} · click to jump back
              </div>
            </div>
            <ChevronRight size={16} color="var(--text3)" />
          </div>
        )
      })()}

      {/* ── carry forward banner ── */}
      {showCarry && (
        <div className="carry-banner">
          <div>
            <div className="carry-banner-text">
              📋 You left <strong>{yesterdayUnfinished.length} task{yesterdayUnfinished.length !== 1 ? 's' : ''}</strong> unfinished yesterday
            </div>
            <div className="carry-banner-sub">
              {yesterdayUnfinished.slice(0, 2).map(i => i.text).join(' · ')}
              {yesterdayUnfinished.length > 2 ? ` · +${yesterdayUnfinished.length - 2} more` : ''}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12, flexShrink: 0 }}
            onClick={() => onNavigate('daily')}
          >
            Move to Today →
          </button>
        </div>
      )}

      {/* ── quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { emoji: '⚡', label: 'Focus Mode', sub: 'What to do now', action: onFocus, color: 'var(--accent)' },
          { emoji: '🌩️', label: 'Brain Dump', sub: 'Ctrl+Space', action: onBrainDump, color: 'var(--yellow)' },
          { emoji: '💭', label: `Someday (${someday.length})`, sub: 'Parking lot', action: () => onNavigate('someday'), color: 'var(--text3)' },
        ].map(q => (
          <button
            key={q.label}
            onClick={q.action}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'border-color 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = q.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: 22 }}>{q.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{q.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── stat strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard color="var(--green)"   icon={<CheckSquare size={18}/>} value={`${dailyDone}/${dailyTotal}`} label="Daily tasks"    onClick={() => onNavigate('daily')} />
        <StatCard color="var(--accent2)" icon={<ListTodo    size={18}/>} value={tasks.length}                 label="Total tasks"    onClick={() => onNavigate('tasks')} />
        <StatCard color="var(--accent)"  icon={<Flag        size={18}/>} value={goals.length}                 label="Goals"          onClick={() => onNavigate('goals')} />
        <StatCard color="var(--yellow)"  icon={<Target      size={18}/>} value={targetActive.length}          label="Active targets" onClick={() => onNavigate('targets')} />
        <StatCard color="var(--blue)"    icon={<StickyNote  size={18}/>} value={notes.length}                 label="Notes"          onClick={() => onNavigate('notes')} />
      </div>

      {/* ── daily + tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PreviewCard title="Today's Checklist" onViewAll={() => onNavigate('daily')}>
          {dailyTotal > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text3)', marginBottom: 4 }}>
                <span>{dailyDone} of {dailyTotal} done{dailySubs > 0 ? ` · ${dailySubs} subtask${dailySubs !== 1 ? 's' : ''}` : ''}</span>
                <span>{dailyTotal ? Math.round((dailyDone / dailyTotal) * 100) : 0}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${dailyTotal ? (dailyDone / dailyTotal) * 100 : 0}%` }} />
              </div>
            </div>
          )}
          {todayList.length === 0 ? <Empty label="No tasks for today yet" /> : (
            todayList.slice(0, 6).map(item => {
              const subs = item.subtasks || []
              const subsDone = subs.filter(s => s.done).length
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckDot done={item.done} size={14} />
                    <span style={{
                      fontSize: 13, flex: 1,
                      color: item.done ? 'var(--text3)' : 'var(--text)',
                      textDecoration: item.done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.text}</span>
                    {item.carriedFrom && (
                      <span title="Carried from yesterday" style={{ fontSize: 10, color: 'var(--accent)' }}>↩</span>
                    )}
                    {subs.length > 0 && (
                      <span style={{ fontSize: 10.5, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{subsDone}/{subs.length}</span>
                    )}
                  </div>
                  {subs.length > 0 && (
                    <div style={{ paddingLeft: 22 }}>
                      <div className="progress-bar-wrap" style={{ height: 3 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.round((subsDone / subs.length) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
          {todayList.length > 6 && <More count={todayList.length - 6} onClick={() => onNavigate('daily')} />}
        </PreviewCard>

        <PreviewCard title="Tasks" onViewAll={() => onNavigate('tasks')}>
          {tasks.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[
                { label: 'To Do',       value: taskTodo, color: 'var(--text3)' },
                { label: 'In Progress', value: taskProg, color: 'var(--yellow)' },
                { label: 'Done',        value: taskDone, color: 'var(--green)' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 4px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {tasks.length === 0 ? <Empty label="No tasks yet" /> : (
            tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => {
              const { Icon, color } = STATUS_ICON[t.status] || STATUS_ICON.todo
              const subs = t.subtasks || []
              const subsDone = subs.filter(s => s.done).length
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, paddingLeft: 4, ...ageStyle(t.lastTouched || t.createdAt) }}>
                  <Icon size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[t.priority], flexShrink: 0 }} />
                    </div>
                    {subs.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1, height: 3 }}>
                          <div className="progress-bar-fill" style={{ width: `${Math.round((subsDone / subs.length) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 10.5, color: 'var(--text3)' }}>{subsDone}/{subs.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {tasks.filter(t => t.status !== 'done').length > 5 && (
            <More count={tasks.filter(t => t.status !== 'done').length - 5} onClick={() => onNavigate('tasks')} />
          )}
        </PreviewCard>
      </div>

      {/* ── goals + targets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PreviewCard title="Goals" onViewAll={() => onNavigate('goals')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: goals.length ? 12 : 0 }}>
            <GoalBar label="Weekly"  goals={goalWeekly}  color="var(--blue)" />
            <GoalBar label="Monthly" goals={goalMonthly} color="var(--accent2)" />
            {goals.length > 0 && <GoalBar label="All goals" goals={goals} color="var(--green)" />}
          </div>
          {goals.length === 0 ? <Empty label="No goals yet" /> : (
            goals.filter(g => g.status !== 'done').slice(0, 4).map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[g.priority], flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
                <span className={`badge badge-${g.type}`} style={{ fontSize: 10 }}>{g.type}</span>
              </div>
            ))
          )}
          {goals.filter(g => g.status !== 'done').length > 4 && (
            <More count={goals.filter(g => g.status !== 'done').length - 4} onClick={() => onNavigate('goals')} />
          )}
        </PreviewCard>

        <PreviewCard title="Targets" onViewAll={() => onNavigate('targets')}>
          {targets.length === 0 ? <Empty label="No targets yet" /> : (
            targetActive.slice(0, 4).map(t => (
              <div key={t.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                  <span style={{ color: 'var(--text2)', marginLeft: 8, flexShrink: 0 }}>{t.progress}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                </div>
                {t.target && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Target: {t.target} {t.unit}</div>}
              </div>
            ))
          )}
          {targetActive.length > 4 && <More count={targetActive.length - 4} onClick={() => onNavigate('targets')} />}
          {targets.filter(t => t.progress >= 100).length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 6 }}>
              ✓ {targets.filter(t => t.progress >= 100).length} target{targets.filter(t => t.progress >= 100).length !== 1 ? 's' : ''} completed
            </div>
          )}
        </PreviewCard>
      </div>

      {/* ── streak heatmap ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            🔥 Activity Streak
          </span>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
            <span>Current: <strong style={{ color: 'var(--yellow)' }}>{streak.current} days</strong></span>
            <span>Longest: <strong style={{ color: 'var(--green)' }}>{streak.longest} days</strong></span>
          </div>
        </div>
        <HeatMap dailyChecklists={data.dailyChecklists || {}} />
      </div>

      {/* ── notes ── */}
      <PreviewCard title="Recent Notes" onViewAll={() => onNavigate('notes')}>
        {notes.length === 0 ? <Empty label="No notes yet" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[...notes]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 6)
              .map(n => (
                <div
                  key={n.id}
                  onClick={() => onNavigate('notes')}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  {n.body && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>
                  )}
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </PreviewCard>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function StatCard({ color, icon, value, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: 8 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ color }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{label}</div>
    </div>
  )
}

function PreviewCard({ title, onViewAll, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }} onClick={onViewAll}>
          View all <ArrowRight size={12} />
        </button>
      </div>
      {children}
    </div>
  )
}

function CheckDot({ done, size = 14 }) {
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: 3, border: `2px solid ${done ? 'var(--green)' : 'var(--border)'}`, background: done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {done && <Check size={size * 0.65} color="#fff" strokeWidth={3} />}
    </div>
  )
}

function GoalBar({ label, goals, color }) {
  const done  = goals.filter(g => g.status === 'done').length
  const total = goals.length
  const pct   = total ? Math.round((done / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text3)', marginBottom: 3 }}>
        <span>{label}</span><span>{done}/{total}</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Empty({ label }) {
  return <div style={{ fontSize: 12.5, color: 'var(--text3)', padding: '10px 0', textAlign: 'center' }}>{label}</div>
}

function More({ count, onClick }) {
  return (
    <div onClick={onClick} style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <ChevronRight size={13} /> +{count} more
    </div>
  )
}
