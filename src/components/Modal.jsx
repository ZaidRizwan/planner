import { useEffect } from 'react'

export default function Modal({ title, onClose, onSave, saveLabel = 'Save', children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {onSave && <button className="btn btn-primary" onClick={onSave}>{saveLabel}</button>}
        </div>
      </div>
    </div>
  )
}
