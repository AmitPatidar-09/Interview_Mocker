import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { interviewAPI } from '../api'
import toast from 'react-hot-toast'
import { Brain, Zap, ArrowRight, Building2 } from 'lucide-react'

const TYPES = [
  { value: 'DSA',                label: 'DSA',     emoji: '🧮', desc: 'Data Structures & Algorithms' },
  { value: 'DBMS',               label: 'DBMS',    emoji: '🗄️', desc: 'Database Management Systems' },
  { value: 'Operating Systems',  label: 'OS',      emoji: '💻', desc: 'Operating Systems' },
  { value: 'Computer Networks',  label: 'Networks',emoji: '🌐', desc: 'Computer Networks' },
  { value: 'OOPs',               label: 'OOPs',    emoji: '🔷', desc: 'Object-Oriented Programming' },
]

const DIFFICULTIES = [
  { value: 'Easy',   color: '#10b981', desc: '5-6 questions, fundamentals' },
  { value: 'Medium', color: '#f97316', desc: '8-10 questions, intermediate' },
  { value: 'Hard',   color: '#ef4444', desc: '10 questions, advanced concepts' },
]

const COMPANIES = [
  { value: 'Generic',    label: 'Generic',    emoji: '🎯' },
  { value: 'Amazon',     label: 'Amazon',     emoji: '📦' },
  { value: 'Microsoft',  label: 'Microsoft',  emoji: '🪟' },
  { value: 'Atlassian',  label: 'Atlassian',  emoji: '🔵' },
  { value: 'Adobe',      label: 'Adobe',      emoji: '🎨' },
]

export default function InterviewSetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    interview_type: 'DSA',
    difficulty: 'Medium',
    company_mode: 'Generic',
  })
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const { data } = await interviewAPI.start(form)
      toast.success('Interview started!')
      navigate(`/interview/${data.interview.id}`, { state: { firstQuestion: data.first_question, interview: data.interview } })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Setup Interview</h1>
          <p className="page-subtitle">Choose your topic, difficulty, and company mode</p>
        </div>

        <div style={{ maxWidth: 720 }}>

          {/* Topic */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} color="var(--brand-400)" /> Select Topic
            </h4>
            <div className="type-grid">
              {TYPES.map((t) => (
                <div
                  key={t.value}
                  className={`type-card ${form.interview_type === t.value ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, interview_type: t.value })}
                >
                  <div className="type-card-icon">{t.emoji}</div>
                  <div className="type-card-label">{t.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--warn-400)" /> Difficulty
            </h4>
            <div style={{ display: 'flex', gap: 12 }}>
              {DIFFICULTIES.map((d) => (
                <div
                  key={d.value}
                  onClick={() => setForm({ ...form, difficulty: d.value })}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px solid ${form.difficulty === d.value ? d.color : 'var(--border)'}`,
                    background: form.difficulty === d.value ? `${d.color}12` : 'var(--bg-muted)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 150ms',
                  }}
                >
                  <div style={{ fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="card" style={{ marginBottom: 28 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} color="var(--text-secondary)" /> Company Mode
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COMPANIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, company_mode: c.value })}
                  className={`btn ${form.company_mode === c.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: 6 }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary + Start */}
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {TYPES.find(t => t.value === form.interview_type)?.emoji} {form.interview_type} • {form.difficulty}
                {form.company_mode !== 'Generic' && ` • ${form.company_mode}`}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                AI will generate contextual questions and evaluate your answers in real-time
              </div>
            </div>
            <button
              className="btn btn-gradient btn-lg"
              onClick={handleStart}
              disabled={loading}
              style={{ flexShrink: 0 }}
            >
              <span>
                {loading ? 'Starting…' : 'Start Interview'}
                {!loading && <ArrowRight size={18} />}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
