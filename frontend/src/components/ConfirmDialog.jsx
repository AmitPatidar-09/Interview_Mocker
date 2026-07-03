import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Reusable confirmation dialog.
 * Props:
 *   isOpen   — boolean
 *   title    — string
 *   message  — string
 *   confirm  — string (button label, default "Delete")
 *   onConfirm — fn
 *   onCancel  — fn
 *   danger   — boolean (default true) — red confirm button
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirm = 'Delete',
  onConfirm,
  onCancel,
  danger = true,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when dialog opens
      setTimeout(() => confirmRef.current?.focus(), 50)
      // Close on Escape
      const handleKey = (e) => { if (e.key === 'Escape') onCancel?.() }
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal" style={{ maxWidth: 420, padding: 28 }}>
        {/* Icon + header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color={danger ? 'var(--error-400)' : 'var(--brand-400)'} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 id="confirm-dialog-title" style={{ marginBottom: 4 }}>{title}</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{message}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ padding: '4px 6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
