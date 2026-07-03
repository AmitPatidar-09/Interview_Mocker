import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ConfirmDialog from '../components/ConfirmDialog'
import { interviewAPI } from '../api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, CheckCircle, XCircle, Lightbulb,
  ChevronDown, ChevronUp, Trophy, Target, Clock, Trash2
} from 'lucide-react'

const diffColor = { Easy: '#10b981', Medium: '#f97316', Hard: '#ef4444' }

function QuestionBlock({ q, index }) {
  const [open, setOpen] = useState(index === 0)
  const score = q.response?.score

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', userSelect: 'none',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, color: 'var(--text-muted)',
        }}>
          Q{index + 1}
        </div>
        <div style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem' }}>{q.content}</div>
        {q.category && <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{q.category}</span>}
        {score != null && (
          <div className={`score-ring ${score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low'}`}
            style={{ width: 38, height: 38, fontSize: '0.82rem', flexShrink: 0 }}>
            {score.toFixed(1)}
          </div>
        )}
        {!q.response && <span className="badge badge-muted">Unanswered</span>}
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {/* Body */}
      {open && q.response && (
        <div style={{ padding: '20px' }}>
          {/* Answer */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>YOUR ANSWER</div>
            <div style={{
              background: 'var(--bg-muted)', borderRadius: 10, padding: '12px 14px',
              fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7,
            }}>
              {q.response.answer_text}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {q.response.strengths?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6 }}>
                  <CheckCircle size={12} color="var(--accent-400)" /> STRENGTHS
                </div>
                <div className="tag-list">
                  {q.response.strengths.map((s, i) => <span key={i} className="tag tag-success">{s}</span>)}
                </div>
              </div>
            )}
            {q.response.weaknesses?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6 }}>
                  <XCircle size={12} color="var(--error-400)" /> AREAS TO IMPROVE
                </div>
                <div className="tag-list">
                  {q.response.weaknesses.map((w, i) => <span key={i} className="tag tag-error">{w}</span>)}
                </div>
              </div>
            )}
          </div>

          {q.response.ideal_answer && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6 }}>
                <Lightbulb size={12} color="var(--brand-400)" /> IDEAL ANSWER
              </div>
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 10, padding: '12px 14px',
                fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7,
              }}>
                {q.response.ideal_answer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function InterviewDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    interviewAPI.detail(id)
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load interview'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await interviewAPI.delete(id)
      toast.success('Interview deleted')
      navigate('/history')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
      </main>
    </div>
  )

  if (!data) return null

  const answered = data.questions.filter((q) => q.response).length
  const avgScore = answered > 0
    ? (data.questions.reduce((acc, q) => acc + (q.response?.score || 0), 0) / answered).toFixed(1)
    : null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              {data.interview_type} Interview
            </h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <span style={{ color: diffColor[data.difficulty], fontWeight: 600, fontSize: '0.88rem' }}>{data.difficulty}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{data.company_mode}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          {/* Delete button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDelete(true)}
            title="Delete this interview"
            style={{ color: 'var(--error-400)', flexShrink: 0 }}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Overall Score', value: data.overall_score != null ? `${data.overall_score.toFixed(1)}/10` : '—', icon: <Trophy size={18} />, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
            { label: 'Questions Answered', value: `${answered}/${data.total_questions}`, icon: <Target size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
            { label: 'Avg. Score/Q', value: avgScore ? `${avgScore}/10` : '—', icon: <Trophy size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
            {
              label: 'Status',
              value: data.status.replace('_', ' '),
              icon: <Clock size={18} />,
              color: data.status === 'completed' ? '#10b981' : '#6366f1',
              bg: data.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
            },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
              flex: '1 1 180px', minWidth: 160,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Questions */}
        <h3 style={{ marginBottom: 16 }}>Question Breakdown</h3>
        {data.questions.length === 0 ? (
          <div className="empty-state"><span>No questions generated</span></div>
        ) : (
          data.questions.map((q, i) => <QuestionBlock key={q.id} q={q} index={i} />)
        )}
      </main>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        title="Delete this interview?"
        message={`All questions, answers, and evaluations for this ${data.interview_type} session will be permanently removed.`}
        confirm={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
