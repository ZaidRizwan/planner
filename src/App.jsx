import { useState, useEffect } from 'react'
import {
  LayoutDashboard, CheckSquare, Flag, Target,
  StickyNote, ListTodo, Cloud, Zap, BookOpen,
} from 'lucide-react'
import { useStore } from './store'
import Dashboard   from './pages/Dashboard'
import Daily       from './pages/Daily'
import Goals       from './pages/Goals'
import Targets     from './pages/Targets'
import Notes       from './pages/Notes'
import Tasks       from './pages/Tasks'
import Someday     from './pages/Someday'
import FocusMode   from './components/FocusMode'
import BrainDump   from './components/BrainDump'
import WeeklyReview from './components/WeeklyReview'

export default function App() {
  const [page,       setPage]       = useState('dashboard')
  const [showFocus,  setShowFocus]  = useState(false)
  const [showDump,   setShowDump]   = useState(false)
  const [showReview, setShowReview] = useState(false)
  const store = useStore()

  // ── global hotkeys ─────────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      // Ctrl/Cmd + Space → Brain Dump
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault()
        setShowDump(d => !d)
      }
      // Ctrl/Cmd + F → Focus Mode  (only when no input focused)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setShowFocus(f => !f)
      }
      // Escape → close any overlay
      if (e.key === 'Escape') {
        setShowFocus(false)
        setShowDump(false)
        setShowReview(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // track last-active page for context recovery on dashboard
  function navigate(p, title) {
    if (p !== 'dashboard' && title) {
      store.setLastActive({ page: p, title })
    }
    setPage(p)
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            data={store.data}
            onNavigate={p => navigate(p)}
            onBrainDump={() => setShowDump(true)}
            onFocus={() => setShowFocus(true)}
            onWeeklyReview={() => setShowReview(true)}
          />
        )
      case 'daily':   return <Daily   store={store} />
      case 'tasks':   return <Tasks   store={store} />
      case 'goals':   return <Goals   store={store} />
      case 'targets': return <Targets store={store} />
      case 'notes':   return <Notes   store={store} />
      case 'someday': return <Someday store={store} />
      default: return null
    }
  }

  const somedayCount = store.data.someday?.length || 0
  const streak       = store.data.streak || { current: 0 }

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* logo */}
        <div className="sidebar-logo">◈ <span>Planner</span></div>

        {/* workspace */}
        <div className="sidebar-section-label">Workspace</div>
        {[
          { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
          { id: 'daily',     label: 'Daily Tasks',  icon: CheckSquare },
          { id: 'tasks',     label: 'Tasks',         icon: ListTodo },
        ].map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => navigate(id, label)}
          >
            <Icon size={16} />
            {label}
          </div>
        ))}

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">Planning</div>
        {[
          { id: 'goals',   label: 'Goals',   icon: Flag },
          { id: 'targets', label: 'Targets', icon: Target },
          { id: 'someday', label: 'Someday', icon: Cloud, badge: somedayCount || null },
        ].map(({ id, label, icon: Icon, badge }) => (
          <div
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => navigate(id, label)}
          >
            <Icon size={16} />
            {label}
            {badge > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 10,
                background: 'var(--border)', borderRadius: 10,
                padding: '1px 6px', color: 'var(--text3)',
              }}>
                {badge}
              </span>
            )}
          </div>
        ))}

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">More</div>
        {[
          { id: 'notes', label: 'Notes', icon: StickyNote },
        ].map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => navigate(id, label)}
          >
            <Icon size={16} />
            {label}
          </div>
        ))}

        {/* bottom actions */}
        <div style={{ marginTop: 'auto', padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {streak.current > 0 && (
            <div className="streak-badge" style={{ justifyContent: 'center', marginBottom: 4 }}>
              🔥 {streak.current} day streak
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', fontSize: 12, padding: '8px', gap: 6 }}
            onClick={() => setShowReview(true)}
          >
            <BookOpen size={13} /> Weekly Review
          </button>
          <button
            className="btn btn-ghost"
            style={{ justifyContent: 'center', fontSize: 12, padding: '8px', gap: 6 }}
            onClick={() => setShowDump(true)}
          >
            <Zap size={13} color="var(--yellow)" /> Brain Dump
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Ctrl+Space</span>
          </button>
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', fontSize: 12, padding: '9px', gap: 6 }}
            onClick={() => setShowFocus(true)}
          >
            ⚡ Focus Mode
            <span style={{ fontSize: 10, opacity: 0.7 }}>Ctrl+F</span>
          </button>
        </div>
      </aside>

      <main className="main">
        {renderPage()}
      </main>

      {/* ── global overlays ── */}
      {showFocus  && <FocusMode    store={store} onClose={() => setShowFocus(false)} />}
      {showDump   && <BrainDump    store={store} onClose={() => setShowDump(false)} />}
      {showReview && <WeeklyReview store={store} onClose={() => setShowReview(false)} />}
    </div>
  )
}
