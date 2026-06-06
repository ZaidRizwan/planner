export default function HeatMap({ dailyChecklists }) {
  const today = new Date()
  const cells = []

  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const list = dailyChecklists[key] || []
    const total = list.length
    const done  = list.filter(x => x.done).length

    let level = 0
    if (total > 0) {
      if (done === 0)      level = 1
      else if (done < total) level = 2
      else                  level = 4
    }

    cells.push({
      key,
      level,
      done,
      total,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })
  }

  const colors = [
    'var(--border)',
    'rgba(99,102,241,0.15)',
    'rgba(99,102,241,0.4)',
    'rgba(99,102,241,0.65)',
    'var(--accent)',
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: 3 }}>
        {cells.map(cell => (
          <div
            key={cell.key}
            title={`${cell.label}: ${cell.total === 0 ? 'No tasks' : `${cell.done}/${cell.total} done`}`}
            style={{
              aspectRatio: '1',
              borderRadius: 2,
              background: colors[cell.level],
              transition: 'transform 0.1s',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
        <span>Less</span>
        {colors.map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        ))}
        <span>More</span>
        <span style={{ marginLeft: 'auto' }}>Last 52 weeks</span>
      </div>
    </div>
  )
}
