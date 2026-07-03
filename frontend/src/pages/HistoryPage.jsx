import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ConfirmDialog from '../components/ConfirmDialog'
import { analyticsAPI, interviewAPI } from '../api'
import toast from 'react-hot-toast'
import { Eye, ChevronLeft, ChevronRight, Play, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const statusColor = { completed: '#10b981', in_progress: '#6366f1', abandoned: '#71717a' }
const statusLabel = { completed: 'Completed', in_progress: 'In Progress', abandoned: 'Abandoned' }
const diffColor   = { Easy: '#10b981', Medium: '#f97316', Hard: '#ef4444' }

function ScoreCell({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const color = score >= 7 ? '#10b981' : score >= 4 ? '#f97316' : '#ef4444'
  return <span style={{ fontWeight: 700, color }}>{score.toFixed(1)}</span>
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()

  const [data, setData]       = useState({ interviews: [], total: 0, page: 1, per_page: 10 })
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)   // interview object
  const [deleting, setDeleting]         = useState(false)

  const load = (p) => {
    setLoading(true)
    analyticsAPI.history(p, 10)
      .then(({ data: d }) => { setData(d); setPage(p) })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (authLoading) return
    load(1)
  }, [authLoading])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await interviewAPI.delete(deleteTarget.id)
      toast.success('Interview deleted')
      // Optimistic update — remove from list immediately
      setData((prev) => ({
        ...prev,
        total: prev.total - 1,
        interviews: prev.interviews.filter((iv) => iv.id !== deleteTarget.id),
      }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete interview')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const totalPages = Math.ceil(data.total / data.per_page)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Interview History</h1>
            <p className="page-subtitle">{data.total} total interview{data.total !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/interview/setup')}>+ New Interview</button>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
        ) : data.interviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ width: 72, height: 72 }}>📋</div>
            <h3>No interviews yet</h3>
            <p>Start your first mock interview to track your progress</p>
            <button className="btn btn-primary" onClick={() => navigate('/interview/setup')}>Start Interview</button>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Company</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.interviews.map((iv, i) => (
                    <tr key={iv.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {(page - 1) * 10 + i + 1}
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{iv.interview_type}</span></td>
                      <td>
                        <span style={{ color: diffColor[iv.difficulty] || 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {iv.difficulty}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{iv.company_mode}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{iv.total_questions}</td>
                      <td><ScoreCell score={iv.overall_score} /></td>
                      <td>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600,
                          color: statusColor[iv.status],
                          background: `${statusColor[iv.status]}18`,
                          border: `1px solid ${statusColor[iv.status]}30`,
                          padding: '3px 8px', borderRadius: 999,
                        }}>
                          {statusLabel[iv.status] || iv.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(iv.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {/* Resume — only for in-progress interviews */}
                          {iv.status === 'in_progress' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/interview/${iv.id}`)}
                              title="Resume interview"
                              style={{ gap: 4 }}
                            >
                              <Play size={13} /> Resume
                            </button>
                          )}

                          {/* View details — only for completed interviews */}
                          {iv.status === 'completed' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/history/${iv.id}`)}
                              title="View details"
                              style={{ padding: '4px 8px' }}
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {/* Delete — always available */}
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteTarget(iv)}
                            title="Delete interview"
                            style={{ padding: '4px 8px', color: 'var(--error-400)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Interview?"
        message={
          deleteTarget
            ? `This will permanently delete your "${deleteTarget.interview_type}" interview from ${new Date(deleteTarget.created_at).toLocaleDateString()} and all its questions and responses.`
            : ''
        }
        confirm={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
